/**
 * ScraperController - API endpoints for scraper operations
 */

import { Request, Response } from 'express';
import { scraperService } from '../services/ScraperService';

export class ScraperController {
  /**
   * Execute a scraping task
   * POST /api/scraper/execute
   * 
   * Body:
   * - config: ScraperConfig object or config file name
   * - options: ExecutionOptions (optional)
   */
  async execute(req: Request, res: Response): Promise<void> {
    try {
      const { config, options } = req.body;

      if (!config) {
        res.status(400).json({
          success: false,
          error: 'Config is required'
        });
        return;
      }

      const result = await scraperService.execute(config, options);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Validate a configuration
   * POST /api/scraper/validate
   * 
   * Body:
   * - config: ScraperConfig object
   */
  async validate(req: Request, res: Response): Promise<void> {
    try {
      const { config } = req.body;

      if (!config) {
        res.status(400).json({
          success: false,
          error: 'Config is required'
        });
        return;
      }

      const result = scraperService.validateConfig(config);

      res.json({
        success: result.valid,
        data: result
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all available actions
   * GET /api/scraper/actions
   */
  async getActions(req: Request, res: Response): Promise<void> {
    try {
      const actions = scraperService.getAvailableActions();

      res.json({
        success: true,
        data: actions
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get schema for a specific action
   * GET /api/scraper/actions/:type
   */
  async getActionSchema(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;

      if (!type) {
        res.status(400).json({
          success: false,
          error: 'Action type is required'
        });
        return;
      }

      const schema = scraperService.getActionSchema(type);

      if (!schema) {
        res.status(404).json({
          success: false,
          error: `Action type not found: ${type}`
        });
        return;
      }

      res.json({
        success: true,
        data: schema
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get all action schemas
   * GET /api/scraper/actions/schemas/all
   */
  async getAllActionSchemas(req: Request, res: Response): Promise<void> {
    try {
      const schemas = scraperService.getAllActionSchemas();

      res.json({
        success: true,
        data: schemas
      });

    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

export const scraperController = new ScraperController();
