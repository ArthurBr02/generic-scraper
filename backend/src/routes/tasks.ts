import { Router, Request, Response } from 'express';
import ConfigService from '../services/ConfigService';

const router = Router();
const configService = new ConfigService();

// GET /api/tasks - List all tasks
router.get('/', async (req: Request, res: Response) => {
    try {
        const tasks = configService.getAllTasks();
        res.json(tasks);
    } catch (error: any) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({
            error: 'Failed to fetch tasks',
            message: error.message
        });
    }
});

// GET /api/tasks/:id - Get a specific task
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const task = configService.getTask(id);

        if (!task) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        res.json(task);
    } catch (error: any) {
        console.error('Error fetching task:', error);
        res.status(500).json({
            error: 'Failed to fetch task',
            message: error.message
        });
    }
});

// POST /api/tasks - Create a new task
router.post('/', async (req: Request, res: Response) => {
    try {
        const { name, description, config } = req.body;

        if (!name) {
            return res.status(400).json({
                error: 'Name is required'
            });
        }

        if (!config) {
            return res.status(400).json({
                error: 'Config is required'
            });
        }

        // Validate config
        const validation = configService.validateConfig(config);
        if (!validation.valid) {
            return res.status(400).json({
                error: 'Invalid config',
                errors: validation.errors
            });
        }

        const task = configService.createTask(name, description, config);
        res.status(201).json(task);
    } catch (error: any) {
        console.error('Error creating task:', error);
        res.status(500).json({
            error: 'Failed to create task',
            message: error.message
        });
    }
});

// PUT /api/tasks/:id - Update a task
router.put('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, config } = req.body;

        // Validate config if provided
        if (config) {
            const validation = configService.validateConfig(config);
            if (!validation.valid) {
                return res.status(400).json({
                    error: 'Invalid config',
                    errors: validation.errors
                });
            }
        }

        const task = configService.updateTask(id, name, description, config);

        if (!task) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        res.json(task);
    } catch (error: any) {
        console.error('Error updating task:', error);
        res.status(500).json({
            error: 'Failed to update task',
            message: error.message
        });
    }
});

// DELETE /api/tasks/:id - Delete a task
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const success = configService.deleteTask(id);

        if (!success) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        res.status(204).send();
    } catch (error: any) {
        console.error('Error deleting task:', error);
        res.status(500).json({
            error: 'Failed to delete task',
            message: error.message
        });
    }
});

// POST /api/tasks/:id/run - Run a task
router.post('/:id/run', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const task = configService.getTask(id);

        if (!task) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        // Update status to running
        configService.updateTaskRunStats(id, 'running');

        // TODO: Implement actual execution using the scraper
        // For now, just return a success response
        res.json({
            message: 'Task execution started',
            taskId: id,
            executionId: `exec-${Date.now()}`
        });

        // TODO: Execute the task asynchronously and update stats when done
    } catch (error: any) {
        console.error('Error running task:', error);
        res.status(500).json({
            error: 'Failed to run task',
            message: error.message
        });
    }
});

// POST /api/tasks/:id/duplicate - Duplicate a task
router.post('/:id/duplicate', async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const task = configService.duplicateTask(id);

        if (!task) {
            return res.status(404).json({
                error: 'Task not found'
            });
        }

        res.status(201).json(task);
    } catch (error: any) {
        console.error('Error duplicating task:', error);
        res.status(500).json({
            error: 'Failed to duplicate task',
            message: error.message
        });
    }
});

export default router;
