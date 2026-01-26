/**
 * ExecutionService - Gère l'exécution des tâches avec émission d'événements WebSocket
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import { ScraperService } from './ScraperService.js';
import { databaseService } from './DatabaseService.js';
import { emitToAll } from './WebSocketService.js';
import { logger } from '../utils/logger.js';
import type {
    Execution,
    ExecutionStatus,
    LogEntry,
    LogLevel
} from '../types/websocket.types.js';
import type { ScraperConfig } from '../types/scraper.types.js';

interface QueueItem {
    executionId: string;
    taskId: string;
    config: ScraperConfig;
    priority: number;
}

/**
 * Service de gestion des exécutions de scraping
 */
export class ExecutionService extends EventEmitter {
    private executions: Map<string, Execution> = new Map();
    private queue: QueueItem[] = [];
    private maxConcurrent: number = 2;
    private runningCount: number = 0;
    private scraperService: ScraperService;

    constructor() {
        super();
        this.scraperService = new ScraperService();
    }

    /**
     * Démarre une tâche de scraping
     */
    async startTask(taskId: string, config?: ScraperConfig): Promise<string> {
        try {
            logger.info(`Starting task ${taskId}`);

            // Créer une nouvelle exécution immédiatement pour capturer les erreurs
            const executionId = uuidv4();
            const execution: Execution = {
                id: executionId,
                taskId,
                status: 'pending',
                startedAt: new Date().toISOString(),
                progress: 0,
                logs: [],
                data: {}
            };

            this.executions.set(executionId, execution);

            // Émettre l'événement de statut
            emitToAll('task:status', {
                executionId,
                taskId,
                status: 'pending'
            });

            try {
                // Si aucune config n'est fournie, charger depuis le fichier
                let taskConfig = config;
                if (!taskConfig) {
                    this.addLog(executionId, 'info', `Chargement de la configuration ${taskId}...`);
                    
                    // Resolve absolute path for the config file
                    const configPath = this.scraperService.resolveConfigPath(taskId);
                    this.addLog(executionId, 'debug', `Chemin de configuration: ${configPath}`);
                    
                    logger.info(`Loading config from ${configPath}`);
                    
                    // Load config using absolute path
                    taskConfig = this.scraperService.loadConfig(configPath);
                    
                    logger.info(`Config loaded successfully: ${taskConfig?.name || taskId}`);
                    this.addLog(executionId, 'info', `Configuration chargée: ${taskConfig.name || taskId}`);
                }

                logger.info(`Adding task ${taskId} to queue`);
                
                // Ajouter à la queue
                this.queue.push({
                    executionId,
                    taskId,
                    config: taskConfig,
                    priority: 1
                });

                // Trier la queue par priorité
                this.queue.sort((a, b) => b.priority - a.priority);

                // Log
                this.addLog(executionId, 'info', `Tâche "${taskConfig.name || taskId}" ajoutée à la file d'attente`);

                // Sauvegarder l'exécution dans la DB
                await this.saveExecution(execution);

                // Traiter la queue
                logger.info(`Processing queue, current queue size: ${this.queue.length}, running: ${this.runningCount}`);
                this.processQueue();

                return executionId;

            } catch (error: any) {
                // Erreur lors du chargement de la config
                execution.status = 'failed';
                execution.error = error.message;
                execution.completedAt = new Date().toISOString();

                this.addLog(executionId, 'error', `Erreur: ${error.message}`);

                emitToAll('task:error', {
                    executionId,
                    taskId,
                    error: error.message,
                    step: 'Configuration loading'
                });

                emitToAll('task:status', {
                    executionId,
                    taskId,
                    status: 'failed'
                });

                await this.saveExecution(execution);

                return executionId;
            }

        } catch (error: any) {
            logger.error('Error starting task', { error: error.message, taskId });
            throw error;
        }
    }

    /**
     * Arrête une exécution
     */
    async stopTask(executionId: string): Promise<void> {
        try {
            logger.info(`Stopping execution ${executionId}`);

            const execution = this.executions.get(executionId);
            if (!execution) {
                throw new Error(`Execution ${executionId} not found`);
            }

            // Si l'exécution est en attente, la retirer de la queue
            if (execution.status === 'pending') {
                this.queue = this.queue.filter(item => item.executionId !== executionId);
                execution.status = 'cancelled';
                execution.completedAt = new Date().toISOString();
                
                this.addLog(executionId, 'warn', 'Exécution annulée par l\'utilisateur');
                
                emitToAll('task:status', {
                    executionId,
                    taskId: execution.taskId,
                    status: 'cancelled'
                });

                await this.saveExecution(execution);
            }
            // Si l'exécution est en cours, on ne peut pas vraiment l'arrêter proprement
            // mais on peut marquer comme cancelled
            else if (execution.status === 'running') {
                execution.status = 'cancelled';
                execution.completedAt = new Date().toISOString();
                
                this.addLog(executionId, 'warn', 'Arrêt demandé (l\'exécution se terminera à la prochaine étape)');
                
                emitToAll('task:status', {
                    executionId,
                    taskId: execution.taskId,
                    status: 'cancelled'
                });

                await this.saveExecution(execution);
            }

        } catch (error: any) {
            logger.error('Error stopping task', { error: error.message, executionId });
            throw error;
        }
    }

    /**
     * Traite la queue d'exécution
     */
    private async processQueue(): Promise<void> {
        logger.debug(`processQueue called - running: ${this.runningCount}/${this.maxConcurrent}, queue size: ${this.queue.length}`);
        
        // Si on a atteint le nombre max d'exécutions concurrentes, on attend
        if (this.runningCount >= this.maxConcurrent) {
            logger.debug(`Max concurrent executions reached (${this.runningCount}/${this.maxConcurrent})`);
            return;
        }

        // Récupérer le prochain item de la queue
        const item = this.queue.shift();
        if (!item) {
            logger.debug('Queue is empty');
            return;
        }

        logger.info(`Processing queue item - executionId: ${item.executionId}, taskId: ${item.taskId}`);

        const execution = this.executions.get(item.executionId);
        if (!execution) {
            logger.error(`Execution ${item.executionId} not found in map`);
            return;
        }

        // Vérifier si l'exécution a été annulée
        if (execution.status === 'cancelled') {
            logger.info(`Execution ${item.executionId} was cancelled, skipping`);
            return;
        }

        // Incrémenter le compteur d'exécutions en cours
        this.runningCount++;
        
        logger.info(`Starting executeTask for ${item.executionId}, runningCount now: ${this.runningCount}`);

        // Exécuter la tâche
        this.executeTask(item)
            .catch(error => {
                logger.error('Error executing task', { error: error.message, executionId: item.executionId });
            })
            .finally(() => {
                this.runningCount--;
                // Traiter le prochain item de la queue
                this.processQueue();
            });

        // Si on peut encore exécuter d'autres tâches, continuer
        if (this.runningCount < this.maxConcurrent) {
            this.processQueue();
        }
    }

    /**
     * Exécute une tâche
     */
    private async executeTask(item: QueueItem): Promise<void> {
        const { executionId, taskId, config } = item;
        const execution = this.executions.get(executionId);
        
        logger.info(`executeTask called for ${executionId}`);
        
        if (!execution) {
            logger.error(`Execution ${executionId} not found`);
            return;
        }

        try {
            logger.info(`Setting execution ${executionId} to running status`);
            
            // Mettre à jour le statut
            execution.status = 'running';
            execution.currentStep = 'Initialisation';
            
            emitToAll('task:status', {
                executionId,
                taskId,
                status: 'running'
            });

            this.addLog(executionId, 'info', 'Démarrage de l\'exécution');

            await this.saveExecution(execution);

            logger.info(`About to execute scraper for ${executionId}`);
            
            // Configurer le scraper pour émettre des événements
            this.scraperService.on('execution:progress', (event: any) => {
                this.handleScraperProgress(executionId, taskId, event);
            });

            // Exécuter le scraper
            logger.info(`Calling scraperService.execute for ${executionId}`);
            const result = await this.scraperService.execute(config, {
                headless: true,
                logLevel: 'info',
                onProgress: (event: any) => {
                    this.handleScraperProgress(executionId, taskId, event);
                }
            });
            
            logger.info(`Scraper execution completed for ${executionId}`);

            // Vérifier si l'exécution a été annulée pendant l'exécution
            if (execution.status === 'cancelled') {
                this.addLog(executionId, 'warn', 'Exécution annulée');
                return;
            }

            // Exécution terminée avec succès
            execution.status = 'completed';
            execution.completedAt = new Date().toISOString();
            execution.progress = 100;
            execution.data = result.data || {};
            execution.outputFile = result.outputFile || undefined;

            const duration = new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime();
            const itemsExtracted = result.items?.length || 0;

            this.addLog(executionId, 'info', `Exécution terminée: ${itemsExtracted} éléments extraits`);
            if (execution.outputFile) {
                this.addLog(executionId, 'info', `Fichier exporté: ${execution.outputFile}`);
            }

            emitToAll('task:complete', {
                executionId,
                taskId,
                duration,
                itemsExtracted,
                outputFile: result.outputFile
            });

            await this.saveExecution(execution);

        } catch (error: any) {
            logger.error('Task execution failed', { error: error.message, executionId, taskId });

            execution.status = 'failed';
            execution.error = error.message;
            execution.completedAt = new Date().toISOString();

            this.addLog(executionId, 'error', `Erreur: ${error.message}`);

            emitToAll('task:error', {
                executionId,
                taskId,
                error: error.message,
                step: execution.currentStep
            });

            await this.saveExecution(execution);
        }
    }

    /**
     * Gère les événements de progression du scraper
     */
    private handleScraperProgress(executionId: string, taskId: string, event: any): void {
        const execution = this.executions.get(executionId);
        if (!execution) return;

        // Vérifier si l'exécution a été annulée
        if (execution.status === 'cancelled') {
            return;
        }

        const workflowId = event.workflowId || 'main';

        // Traiter différents types d'événements
        if (event.type === 'step') {
            execution.currentStep = event.step;
            
            emitToAll('task:step', {
                executionId,
                taskId,
                workflowId,
                step: event.step,
                stepIndex: event.stepIndex || 0,
                totalSteps: event.totalSteps || 1
            });

            this.addLog(executionId, 'info', event.message || `Étape: ${event.step}`, workflowId);
        }
        else if (event.type === 'progress') {
            execution.progress = event.progress || 0;
            
            emitToAll('task:progress', {
                executionId,
                taskId,
                workflowId,
                progress: execution.progress,
                currentStep: execution.currentStep
            });
        }
        else if (event.type === 'data') {
            const dataKey = event.dataKey || 'results';
            
            // Organiser les données par workflow
            if (!execution.data[workflowId]) {
                execution.data[workflowId] = {};
            }
            execution.data[workflowId][dataKey] = event.data || {};
            
            emitToAll('task:data', {
                executionId,
                taskId,
                workflowId,
                dataKey,
                data: event.data || {},
                itemCount: event.itemCount || 0
            });

            this.addLog(executionId, 'info', `Données extraites (${dataKey}): ${event.itemCount || 0} éléments`, workflowId);
        }
        else if (event.type === 'log') {
            this.addLog(executionId, event.level || 'info', event.message, workflowId);
        }
    }

    /**
     * Ajoute un log à une exécution
     */
    private addLog(executionId: string, level: LogLevel, message: string, workflowId?: string, data?: any): void {
        const execution = this.executions.get(executionId);
        if (!execution) return;

        const log: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            workflowId,
            data
        };

        execution.logs.push(log);

        emitToAll('task:log', {
            executionId,
            taskId: execution.taskId,
            log
        });
    }

    /**
     * Sauvegarde une exécution dans la base de données
     */
    private async saveExecution(execution: Execution): Promise<void> {
        try {
            logger.debug(`Saving execution ${execution.id} to database`, { 
                status: execution.status,
                taskId: execution.taskId 
            });
            
            const duration = execution.completedAt 
                ? new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()
                : null;

            // Insérer ou mettre à jour l'exécution
            await databaseService.run(
                `INSERT OR REPLACE INTO executions 
                (id, task_id, task_name, status, started_at, completed_at, duration_ms, items_extracted, error_message, output_file)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    execution.id,
                    execution.taskId,
                    '', // task_name sera mis à jour plus tard
                    execution.status,
                    execution.startedAt,
                    execution.completedAt || null,
                    duration,
                    Object.keys(execution.data).length,
                    execution.error || null,
                    execution.outputFile || null
                ]
            );

            // Sauvegarder les logs (seulement les nouveaux)
            // Récupérer le nombre de logs déjà sauvegardés
            const existingLogsCount = await databaseService.get(
                'SELECT COUNT(*) as count FROM execution_logs WHERE execution_id = ?',
                [execution.id]
            );
            const savedCount = existingLogsCount?.count || 0;
            
            // Insérer seulement les nouveaux logs
            for (let i = savedCount; i < execution.logs.length; i++) {
                const log = execution.logs[i];
                await databaseService.run(
                    `INSERT INTO execution_logs (execution_id, timestamp, level, message, metadata, workflow_id)
                    VALUES (?, ?, ?, ?, ?, ?)`,
                    [
                        execution.id,
                        log.timestamp,
                        log.level,
                        log.message,
                        log.data ? JSON.stringify(log.data) : null,
                        log.workflowId || 'main'
                    ]
                );
            }

            // Sauvegarder les données extraites par workflow
            for (const [workflowId, workflowData] of Object.entries(execution.data)) {
                if (workflowData && typeof workflowData === 'object' && Object.keys(workflowData).length > 0) {
                    for (const [dataKey, dataValue] of Object.entries(workflowData as Record<string, any>)) {
                        // Ignorer les clés numériques (indices d'array) pour éviter les doublons
                        if (!isNaN(Number(dataKey))) {
                            logger.debug(`Skipping numeric data key "${dataKey}" to avoid duplicates`);
                            continue;
                        }
                        
                        await databaseService.run(
                            `INSERT OR REPLACE INTO execution_data (execution_id, workflow_id, data_key, data_value, item_count)
                            VALUES (?, ?, ?, ?, ?)`,
                            [
                                execution.id,
                                workflowId,
                                dataKey,
                                JSON.stringify(dataValue),
                                Array.isArray(dataValue) ? dataValue.length : 1
                            ]
                        );
                    }
                }
            }

            // Mettre à jour les métadonnées de la tâche
            const durationMs = execution.completedAt && execution.startedAt
                ? new Date(execution.completedAt).getTime() - new Date(execution.startedAt).getTime()
                : undefined;
            
            await databaseService.updateTaskStats({
                taskId: execution.taskId,
                success: execution.status === 'completed',
                durationMs
            });
            
            logger.info(`Execution ${execution.id} saved successfully to database`);

        } catch (error: any) {
            logger.error('Error saving execution', { error: error.message, executionId: execution.id });
        }
    }

    /**
     * Récupère une exécution
     */
    getExecution(executionId: string): Execution | null {
        return this.executions.get(executionId) || null;
    }

    /**
     * Récupère toutes les exécutions
     */
    getAllExecutions(): Execution[] {
        return Array.from(this.executions.values());
    }

    /**
     * Récupère les exécutions en cours
     */
    getRunningExecutions(): Execution[] {
        return this.getAllExecutions().filter(e => e.status === 'running');
    }

    /**
     * Configure le nombre max d'exécutions concurrentes
     */
    setMaxConcurrent(max: number): void {
        this.maxConcurrent = Math.max(1, max);
        logger.info(`Max concurrent executions set to ${this.maxConcurrent}`);
    }
}

// Instance singleton
export const executionService = new ExecutionService();
