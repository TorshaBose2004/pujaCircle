import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../views/response.view.js';
import { bookingService } from '../services/booking.service.js';

/**
 * [CONTROLLER] Booking Controller
 * Responsibility: Ceremony reservations, lifecycle status transitions, and devotee reviews.
 */
export class BookingController {
  /**
   * GET /api/v1/bookings
   */
  async getBookings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
      const priestId = typeof req.query.priestId === 'string' ? req.query.priestId : undefined;
      const bookings = await bookingService.getBookings({ userId, priestId });
      sendSuccess(res, 'Bookings retrieved.', bookings);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/bookings/:id
   */
  async getBookingById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const booking = await bookingService.getBookingById(req.params.id);
      sendSuccess(res, `Booking ${req.params.id} retrieved.`, booking);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/bookings
   */
  async createBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeUserId = req.user?.id || req.body?.userId;
      if (!activeUserId) {
        sendError(res, 'Authentication required to create a booking.', 401);
        return;
      }
      const booking = await bookingService.createBooking(activeUserId, req.body);
      sendSuccess(res, 'Booking request submitted successfully.', booking, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/bookings/:id/accept
   */
  async acceptBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activePriestId = req.user?.id || req.body?.priestId || '';
      const result = await bookingService.acceptBooking(req.params.id, activePriestId);
      sendSuccess(res, `Booking ${req.params.id} accepted successfully.`, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/bookings/:id/reject
   */
  async rejectBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activePriestId = req.user?.id || req.body?.priestId || '';
      const result = await bookingService.rejectBooking(
        req.params.id,
        activePriestId,
        req.body?.reason
      );
      sendSuccess(res, `Booking ${req.params.id} declined.`, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/bookings/:id/cancel
   */
  async cancelBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeUserId = req.user?.id || req.body?.userId || '';
      const result = await bookingService.cancelBooking(
        req.params.id,
        activeUserId,
        req.body?.reason
      );
      sendSuccess(res, `Booking ${req.params.id} cancelled successfully.`, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/bookings/:id/complete
   */
  async completeBooking(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activePriestId = req.user?.id || req.body?.priestId || '';
      const result = await bookingService.completeBooking(
        req.params.id,
        activePriestId,
        req.body?.completionCode
      );
      sendSuccess(res, `Ceremony ${req.params.id} marked as completed.`, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/ratings
   */
  async submitRating(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeUserId = req.user?.id || req.body?.userId || '';
      const result = await bookingService.submitRating(activeUserId, req.body);
      sendSuccess(res, 'Devotee rating submitted with blessings.', result, 201);
    } catch (error) {
      next(error);
    }
  }
}

export const bookingController = new BookingController();
