/**
 * Scraper routes
 */

import { Router } from 'express';
import { scraperController } from '../controllers/ScraperController';

const router = Router();

/**
 * @route POST /api/scraper/execute
 * @desc Execute a scraping configuration
 * @access Public
 */
router.post('/execute', (req, res) => scraperController.execute(req, res));

/**
 * @route POST /api/scraper/validate
 * @desc Validate a scraping configuration
 * @access Public
 */
router.post('/validate', (req, res) => scraperController.validate(req, res));

/**
 * @route GET /api/scraper/actions
 * @desc Get all available action types
 * @access Public
 */
router.get('/actions', (req, res) => scraperController.getActions(req, res));

/**
 * @route GET /api/scraper/actions/schemas/all
 * @desc Get all action schemas
 * @access Public
 */
router.get('/actions/schemas/all', (req, res) => scraperController.getAllActionSchemas(req, res));

/**
 * @route GET /api/scraper/actions/:type
 * @desc Get schema for a specific action type
 * @access Public
 */
router.get('/actions/:type', (req, res) => scraperController.getActionSchema(req, res));

export default router;
