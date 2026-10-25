import { Request, Response, NextFunction } from 'express';
import { availabilityService } from '../services/availability.service.js';
import { sendSuccess, sendError } from '../views/response.view.js';

/**
 * Controller: Priest Availability & Calendar
 * Request handlers for priest schedule management.
 */
export class AvailabilityController {
  /**
   * POST /day-off
   * Mark a full day off based on priest's configured working hours
   */
  async markFullDayOff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Prioritize authenticated priest user id
      const priestId = req.user?.id || req.body.priestId;
      const { date, reason } = req.body;

      if (!priestId) {
        sendError(res, 'Authentication required or priestId must be provided', 401);
        return;
      }

      const result = await availabilityService.markFullDayOff(priestId, date, reason);
      sendSuccess(res, 'Full day off marked successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /block-hours
   * Block specific hours on a date
   */
  async blockHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Prioritize authenticated priest user id
      const priestId = req.user?.id || req.body.priestId;
      const { date, startTime, endTime, reason } = req.body;

      if (!priestId) {
        sendError(res, 'Authentication required or priestId must be provided', 401);
        return;
      }

      const result = await availabilityService.blockHours(
        priestId,
        date,
        startTime,
        endTime,
        reason
      );
      sendSuccess(res, 'Hours blocked successfully', result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /calendar
   * Get 3-month availability calendar
   */
  async getCalendar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priestId = req.query.priestId as string || req.user?.id;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!priestId) {
        sendError(res, 'priestId is required to query calendar', 400);
        return;
      }

      const calendar = await availabilityService.calculateMonthAvailability(
        priestId,
        startDate,
        endDate
      );

      sendSuccess(res, 'Availability calendar fetched successfully', calendar, 200);
    } catch (error) {
      next(error);
    }
  }
}

export const availabilityController = new AvailabilityController();
