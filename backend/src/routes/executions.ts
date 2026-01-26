import { Router, Request, Response, NextFunction } from 'express';
import { executionService } from '../services/ExecutionService.js';
import { databaseService } from '../services/DatabaseService.js';
import { logger } from '../utils/logger.js';

const router = Router();

/**
 * GET /api/executions
 * Liste toutes les exécutions
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { taskId, status, limit = '50', offset = '0' } = req.query;

        let query = 'SELECT * FROM executions';
        const params: any[] = [];
        const conditions: string[] = [];

        if (taskId) {
            conditions.push('task_id = ?');
            params.push(taskId);
        }

        if (status) {
            conditions.push('status = ?');
            params.push(status);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }

        query += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit as string), parseInt(offset as string));

        logger.debug('Fetching executions', { query, params });
        const executions = await databaseService.executeAll(query, params);
        logger.info(`Found ${executions.length} executions in database`);
        
        // Les exécutions sont déjà au bon format (snake_case) depuis la BDD

        res.json({
            success: true,
            data: executions,
            total: executions.length
        });
    } catch (error: any) {
        logger.error('Error fetching executions', { error: error.message });
        next(error);
    }
});

/**
 * GET /api/executions/:id
 * Récupère les détails d'une exécution
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        // Récupérer l'exécution
        const execution = await databaseService.executeGet(
            'SELECT * FROM executions WHERE id = ?',
            [id]
        );

        if (!execution) {
            return res.status(404).json({
                success: false,
                error: 'Execution not found'
            });
        }

        // Récupérer les logs et reformater
        const logsRows = await databaseService.executeAll(
            'SELECT * FROM execution_logs WHERE execution_id = ? ORDER BY timestamp ASC',
            [id]
        );
        const logs = logsRows.map((log: any) => ({
            timestamp: log.timestamp,
            level: log.level,
            message: log.message,
            workflowId: log.workflow_id,
            data: log.metadata ? JSON.parse(log.metadata) : undefined
        }));

        // Récupérer les données et reformater par workflow
        const dataRows = await databaseService.executeAll(
            'SELECT * FROM execution_data WHERE execution_id = ?',
            [id]
        );
        
        // Reconstruire la structure data[workflowId][dataKey] = value
        const data: Record<string, Record<string, any>> = {};
        for (const row of dataRows) {
            if (!data[row.workflow_id]) {
                data[row.workflow_id] = {};
            }
            data[row.workflow_id][row.data_key] = JSON.parse(row.data_value);
        }

        res.json({
            success: true,
            data: {
                id: execution.id,
                task_id: execution.task_id,
                status: execution.status,
                started_at: execution.started_at,
                completed_at: execution.completed_at,
                error_message: execution.error_message,
                progress: execution.status === 'completed' ? 100 : 0,
                logs,
                data
            }
        });
    } catch (error: any) {
        logger.error('Error fetching execution details', { error: error.message, executionId: req.params.id });
        next(error);
    }
});

/**
 * GET /api/executions/task/:taskId/stats
 * Récupère les statistiques d'une tâche
 */
router.get('/task/:taskId/stats', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { taskId } = req.params;

        const stats = await databaseService.executeGet(
            `SELECT 
                COUNT(*) as total_runs,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as success_count,
                SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failure_count,
                AVG(duration_ms) as avg_duration_ms,
                MAX(started_at) as last_run_at,
                SUM(items_extracted) as total_items_extracted
            FROM executions 
            WHERE task_id = ?`,
            [taskId]
        );

        res.json({
            success: true,
            data: stats
        });
    } catch (error: any) {
        logger.error('Error fetching task stats', { error: error.message, taskId: req.params.taskId });
        next(error);
    }
});

/**
 * GET /api/executions/running
 * Liste les exécutions en cours
 */
router.get('/running', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const runningExecutions = executionService.getRunningExecutions();

        res.json({
            success: true,
            data: runningExecutions
        });
    } catch (error: any) {
        logger.error('Error fetching running executions', { error: error.message });
        next(error);
    }
});

/**
 * DELETE /api/executions/:id
 * Supprime une exécution de l'historique
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        await databaseService.executeRun('DELETE FROM executions WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Execution deleted successfully'
        });
    } catch (error: any) {
        logger.error('Error deleting execution', { error: error.message, executionId: req.params.id });
        next(error);
    }
});

/**
 * GET /api/executions/:id/download
 * Télécharge le fichier d'export d'une exécution
 */
router.get('/:id/download', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        
        // Récupérer l'exécution pour obtenir le chemin du fichier
        const execution = await databaseService.executeGet('SELECT output_file FROM executions WHERE id = ?', [id]);
        
        if (!execution || !execution.output_file) {
            return res.status(404).json({
                success: false,
                error: 'Fichier non trouvé ou exécution sans fichier exporté'
            });
        }

        const fs = await import('fs/promises');
        const path = await import('path');
        
        // Vérifier que le fichier existe
        const filePath = execution.output_file;
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({
                success: false,
                error: 'Fichier introuvable sur le serveur'
            });
        }

        // Déterminer le type MIME
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = ext === '.csv' ? 'text/csv' : 'application/json';
        
        // Envoyer le fichier
        const fileName = path.basename(filePath);
        res.setHeader('Content-Type', mimeType);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        const fileContent = await fs.readFile(filePath);
        res.send(fileContent);
        
        logger.info(`File downloaded`, { executionId: id, filePath });
    } catch (error: any) {
        logger.error('Error downloading file', { error: error.message, executionId: req.params.id });
        next(error);
    }
});

export default router;
