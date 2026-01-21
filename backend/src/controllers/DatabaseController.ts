/**
 * Database controller - API endpoints for database operations
 */

import { Request, Response } from 'express';
import { databaseService } from '../services/DatabaseService';

export class DatabaseController {
  /**
   * Get database statistics
   * GET /api/database/stats
   */
  async getStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await databaseService.getStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get recent executions
   * GET /api/database/executions/recent
   */
  async getRecentExecutions(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const executions = await databaseService.getRecentExecutions(limit);

      res.json({
        success: true,
        data: executions
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get execution by ID
   * GET /api/database/executions/:id
   */
  async getExecution(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const execution = await databaseService.getExecution(id);

      if (!execution) {
        res.status(404).json({
          success: false,
          error: 'Execution not found'
        });
        return;
      }

      res.json({
        success: true,
        data: execution
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get execution logs
   * GET /api/database/executions/:id/logs
   */
  async getExecutionLogs(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const logs = await databaseService.getLogsByExecution(id);

      res.json({
        success: true,
        data: logs
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get execution data
   * GET /api/database/executions/:id/data
   */
  async getExecutionData(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const data = await databaseService.getExecutionData(id);

      res.json({
        success: true,
        data
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all tasks metadata
   * GET /api/database/tasks
   */
  async getAllTasks(req: Request, res: Response): Promise<void> {
    try {
      const tasks = await databaseService.getAllTasksMetadata();

      res.json({
        success: true,
        data: tasks
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get task metadata
   * GET /api/database/tasks/:taskId
   */
  async getTaskMetadata(req: Request, res: Response): Promise<void> {
    try {
      const { taskId } = req.params;

      const task = await databaseService.getTaskMetadata(taskId);

      if (!task) {
        res.status(404).json({
          success: false,
          error: 'Task not found'
        });
        return;
      }

      res.json({
        success: true,
        data: task
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get application settings
   * GET /api/database/settings
   */
  async getSettings(req: Request, res: Response): Promise<void> {
    try {
      const settings = await databaseService.getAllSettings();

      res.json({
        success: true,
        data: settings
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update a setting
   * PUT /api/database/settings/:key
   */
  async updateSetting(req: Request, res: Response): Promise<void> {
    try {
      const { key } = req.params;
      const { value, type } = req.body;

      if (value === undefined) {
        res.status(400).json({
          success: false,
          error: 'Value is required'
        });
        return;
      }

      await databaseService.setSetting(key, value, type || 'string');

      res.json({
        success: true,
        data: { key, value }
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export const databaseController = new DatabaseController();
