import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../views/response.view.js';
import { ritualService } from '../services/ritual.service.js';

/**
 * [CONTROLLER] Ritual Controller
 * Responsibility: Sacred ritual taxonomy and guidelines.
 */
export class RitualController {
  /**
   * GET /api/v1/rituals
   */
  async getRituals(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rituals = await ritualService.getRituals();
      sendSuccess(res, 'Sacred rituals retrieved.', rituals);
    } catch (error) {
      next(error);
    }
  }
}

export const ritualController = new RitualController();
