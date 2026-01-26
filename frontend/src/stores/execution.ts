import { defineStore } from 'pinia';
import webSocketService from '../services/WebSocketService';
import type {
    Execution,
    LogEntry,
    ExecutionStatus,
    TaskStatusEvent,
    TaskProgressEvent,
    TaskLogEvent,
    TaskStepEvent,
    TaskDataEvent,
    TaskCompleteEvent,
    TaskErrorEvent
} from '../types/websocket';

interface ExecutionState {
    executions: Map<string, Execution>;
    currentExecutionId: string | null;
    connected: boolean;
    error: string | null;
}

export const useExecutionStore = defineStore('execution', {
    state: (): ExecutionState => ({
        executions: new Map(),
        currentExecutionId: null,
        connected: false,
        error: null
    }),

    getters: {
        /**
         * Retourne l'exécution courante
         */
        currentExecution(): Execution | null {
            if (!this.currentExecutionId) return null;
            return this.executions.get(this.currentExecutionId) || null;
        },

        /**
         * Retourne toutes les exécutions sous forme de tableau
         */
        allExecutions(): Execution[] {
            return Array.from(this.executions.values());
        },

        /**
         * Retourne les exécutions en cours
         */
        runningExecutions(): Execution[] {
            return this.allExecutions.filter(e => e.status === 'running');
        },

        /**
         * Retourne les logs de l'exécution courante
         */
        currentLogs(): LogEntry[] {
            return this.currentExecution?.logs || [];
        },

        /**
         * Vérifie si une exécution est en cours
         */
        hasRunningExecution(): boolean {
            return this.runningExecutions.length > 0;
        }
    },

    actions: {
        /**
         * Initialise la connexion WebSocket
         */
        initWebSocket(): void {
            if (this.connected) {
                console.log('WebSocket already initialized');
                return;
            }

            // Connexion
            webSocketService.connect();

            // Événements de connexion
            webSocketService.on('connect', () => {
                console.log('✅ WebSocket connected from store');
                this.connected = true;
                this.error = null;
            });

            webSocketService.on('disconnect', (data: any) => {
                console.log('🔌 WebSocket disconnected from store', data);
                this.connected = false;
            });

            webSocketService.on('error', (data: any) => {
                console.error('❌ WebSocket error from store', data);
                this.error = data.error || 'Unknown error';
            });

            // Événements de tâche
            webSocketService.on<TaskStatusEvent>('task:status', (data) => {
                this.handleTaskStatus(data);
            });

            webSocketService.on<TaskProgressEvent>('task:progress', (data) => {
                this.handleTaskProgress(data);
            });

            webSocketService.on<TaskLogEvent>('task:log', (data) => {
                this.handleTaskLog(data);
            });

            webSocketService.on<TaskStepEvent>('task:step', (data) => {
                this.handleTaskStep(data);
            });

            webSocketService.on<TaskDataEvent>('task:data', (data) => {
                this.handleTaskData(data);
            });

            webSocketService.on<TaskCompleteEvent>('task:complete', (data) => {
                this.handleTaskComplete(data);
            });

            webSocketService.on<TaskErrorEvent>('task:error', (data) => {
                this.handleTaskError(data);
            });
        },

        /**
         * Ferme la connexion WebSocket
         */
        closeWebSocket(): void {
            webSocketService.disconnect();
            webSocketService.removeAllListeners();
            this.connected = false;
        },

        /**
         * Démarre une tâche
         */
        async startTask(taskId: string): Promise<void> {
            if (!this.connected) {
                throw new Error('WebSocket not connected');
            }

            try {
                const response = await webSocketService.startTask(taskId);
                
                if (!response.success) {
                    throw new Error(response.error || 'Failed to start task');
                }

                if (response.executionId) {
                    // Créer une nouvelle exécution
                    const execution: Execution = {
                        id: response.executionId,
                        taskId,
                        status: 'pending',
                        startedAt: new Date().toISOString(),
                        progress: 0,
                        logs: [],
                        data: {}
                    };

                    this.executions.set(response.executionId, execution);
                    this.currentExecutionId = response.executionId;
                }
            } catch (error: any) {
                console.error('Error starting task:', error);
                throw error;
            }
        },

        /**
         * Arrête une exécution
         */
        async stopTask(executionId: string): Promise<void> {
            if (!this.connected) {
                throw new Error('WebSocket not connected');
            }

            try {
                const response = await webSocketService.stopTask(executionId);
                
                if (!response.success) {
                    throw new Error(response.error || 'Failed to stop task');
                }

                // Mettre à jour le statut
                const execution = this.executions.get(executionId);
                if (execution) {
                    execution.status = 'cancelled';
                    execution.completedAt = new Date().toISOString();
                }
            } catch (error: any) {
                console.error('Error stopping task:', error);
                throw error;
            }
        },

        /**
         * Charge une exécution depuis la base de données
         */
        async loadExecution(executionId: string): Promise<void> {
            try {
                const response = await fetch(`http://localhost:4000/api/executions/${executionId}`);
                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.error || 'Failed to load execution');
                }

                const executionData = result.data;

                // Créer l'objet exécution
                const execution: Execution = {
                    id: executionData.id,
                    taskId: executionData.task_id,
                    status: executionData.status as ExecutionStatus,
                    startedAt: executionData.started_at,
                    completedAt: executionData.completed_at,
                    progress: executionData.status === 'completed' ? 100 : 0,
                    logs: executionData.logs?.map((log: any) => ({
                        timestamp: log.timestamp,
                        level: log.level,
                        message: log.message,
                        data: log.metadata ? JSON.parse(log.metadata) : undefined
                    })) || [],
                    data: executionData.extractedData?.length > 0 
                        ? JSON.parse(executionData.extractedData[0].data_value || '{}')
                        : {},
                    error: executionData.error_message
                };

                this.executions.set(executionId, execution);
                this.currentExecutionId = executionId;

                console.log('✅ Execution loaded from database', executionId);
            } catch (error: any) {
                console.error('Error loading execution:', error);
                throw error;
            }
        },

        /**
         * Gère l'événement task:status
         */
        handleTaskStatus(data: TaskStatusEvent): void {
            const execution = this.executions.get(data.executionId);
            if (execution) {
                execution.status = data.status;
                console.log(`Execution ${data.executionId} status: ${data.status}`);
            }
        },

        /**
         * Gère l'événement task:progress
         */
        handleTaskProgress(data: TaskProgressEvent): void {
            const execution = this.executions.get(data.executionId);
            if (execution) {
                execution.progress = data.progress;
                if (data.currentStep) {
                    execution.currentStep = data.currentStep;
                }
                console.log(`Execution ${data.executionId} progress: ${data.progress}%`);
            }
        },

        /**
         * Gère l'événement task:log
         */
        handleTaskLog(data: TaskLogEvent): void {
            const execution = this.executions.get(data.executionId);
            if (execution) {
                execution.logs.push(data.log);
                console.log(`[${data.log.level}] ${data.log.message}`);
            }
        },

        /**
         * Gère l'événement task:step
         */
        handleTaskStep(data: TaskStepEvent): void {
            const execution = this.executions.get(data.executionId);
            if (execution) {
                execution.currentStep = data.step;
                execution.progress = Math.round((data.stepIndex / data.totalSteps) * 100);
                console.log(`Execution ${data.executionId} step: ${data.step} (${data.stepIndex}/${data.totalSteps})`);
            }
        },

        /**
         * Gère l'événement task:data
         */
        handleTaskData(data: TaskDataEvent): void {
            const execution = this.executions.get(data.executionId);
            if (execution) {
                // Organiser les données par workflowId puis dataKey
                const workflowId = data.workflowId || 'main';
                const dataKey = data.dataKey || 'results';
                
                if (!execution.data[workflowId]) {
                    execution.data[workflowId] = {};
                }
                
                // Stocker les données sous la clé appropriée (évite la conversion tableau → objet)
                execution.data[workflowId][dataKey] = data.data;
                
                console.log(`Execution ${data.executionId} data updated: ${data.itemCount} items in ${workflowId}.${dataKey}`);
            }
        },

        /**
         * Gère l'événement task:complete
         */
        handleTaskComplete(data: TaskCompleteEvent): void {
            const execution = this.executions.get(data.executionId);
            if (execution) {
                execution.status = 'completed';
                execution.completedAt = new Date().toISOString();
                execution.progress = 100;
                
                // Ajouter un log de fin
                execution.logs.push({
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    message: `Exécution terminée: ${data.itemsExtracted} éléments extraits en ${data.duration}ms`
                });

                console.log(`✅ Execution ${data.executionId} completed: ${data.itemsExtracted} items in ${data.duration}ms`);
            }
        },

        /**
         * Gère l'événement task:error
         */
        handleTaskError(data: TaskErrorEvent): void {
            const execution = this.executions.get(data.executionId);
            if (execution) {
                execution.status = 'failed';
                execution.error = data.error;
                execution.completedAt = new Date().toISOString();
                
                // Ajouter un log d'erreur
                execution.logs.push({
                    timestamp: new Date().toISOString(),
                    level: 'error',
                    message: data.error,
                    data: { step: data.step }
                });

                console.error(`❌ Execution ${data.executionId} failed: ${data.error}`);
            }
        },

        /**
         * Supprime une exécution
         */
        removeExecution(executionId: string): void {
            this.executions.delete(executionId);
            if (this.currentExecutionId === executionId) {
                this.currentExecutionId = null;
            }
        },

        /**
         * Vide toutes les exécutions
         */
        clearExecutions(): void {
            this.executions.clear();
            this.currentExecutionId = null;
        },

        /**
         * Sélectionne une exécution comme courante
         */
        setCurrentExecution(executionId: string | null): void {
            this.currentExecutionId = executionId;
        }
    }
});
