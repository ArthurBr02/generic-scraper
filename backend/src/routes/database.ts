/**
 * Database routes
 */

import { Router } from 'express';
import { databaseController } from '../controllers/DatabaseController';

const router = Router();

/**
 * @route GET /api/database/stats
 * @desc Get database statistics
 * @access Public
 */
router.get('/stats', (req, res) => databaseController.getStats(req, res));

/**
 * @route GET /api/database/executions/recent
 * @desc Get recent executions
 * @access Public
 */
router.get('/executions/recent', (req, res) => databaseController.getRecentExecutions(req, res));

/**
 * @route GET /api/database/executions/:id
 * @desc Get execution by ID
 * @access Public
 */
router.get('/executions/:id', (req, res) => databaseController.getExecution(req, res));

/**
 * @route GET /api/database/executions/:id/logs
 * @desc Get execution logs
 * @access Public
 */
router.get('/executions/:id/logs', (req, res) => databaseController.getExecutionLogs(req, res));

/**
 * @route GET /api/database/executions/:id/data
 * @desc Get execution data
 * @access Public
 */
router.get('/executions/:id/data', (req, res) => databaseController.getExecutionData(req, res));

/**
 * @route GET /api/database/tasks
 * @desc Get all tasks metadata
 * @access Public
 */
router.get('/tasks', (req, res) => databaseController.getAllTasks(req, res));

/**
 * @route GET /api/database/tasks/:taskId
 * @desc Get task metadata
 * @access Public
 */
router.get('/tasks/:taskId', (req, res) => databaseController.getTaskMetadata(req, res));

/**
 * @route GET /api/database/settings
 * @desc Get all settings
 * @access Public
 */
router.get('/settings', (req, res) => databaseController.getSettings(req, res));

/**
 * @route PUT /api/database/settings/:key
 * @desc Update a setting
 * @access Public
 */
router.put('/settings/:key', (req, res) => databaseController.updateSetting(req, res));

export default router;
