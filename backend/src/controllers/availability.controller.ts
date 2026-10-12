import { Request, Response, NextFunction } from 'express';
import { availabilityService } from '../services/availability.service.js';
import { sendSuccess, sendError } from '../views/response.view.js';

/**
 * Controller: Priest Availability & Calendar
 * Minimal and simple request handlers for priest schedule management.
 */
export class AvailabilityController {
  /**
   * POST /day-off
   * Mark a full day off (07:00 – 21:00)
   */
  async markFullDayOff(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priestId = req.user?.id || req.body.priestId;
      const { date, reason } = req.body;

      if (!priestId || !date) {
        sendError(res, 'priestId and date (YYYY-MM-DD) are required', 400);
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
      const priestId = req.user?.id || req.body.priestId;
      const { date, startTime, endTime, reason } = req.body;

      if (!priestId || !date || !startTime || !endTime) {
        sendError(res, 'priestId, date, startTime, and endTime are required', 400);
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
      const priestId = (req.query.priestId as string) || req.user?.id;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;

      if (!priestId) {
        sendError(res, 'priestId is required to query calendar availability', 400);
        return;
      }

      const calendar = await availabilityService.calculateMonthAvailability(
        priestId,
        startDate,
        endDate
      );
      sendSuccess(res, '3-month availability calendar retrieved', calendar);
    } catch (error) {
      next(error);
    }
  }
}

export const availabilityController = new AvailabilityController();
