import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../views/response.view.js';
import { adminService } from '../services/admin.service.js';

/**
 * [CONTROLLER] Admin Controller
 * Responsibility: Platform oversight, priest verification/moderation, user moderation, analytics.
 */
export class AdminController {
  // GET /api/v1/admin/dashboard/stats
  async getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await adminService.getDashboardStats();
      sendSuccess(res, 'Admin dashboard statistics retrieved.', stats);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/priests
  async getAllPriests(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priests = await adminService.getAllPriests();
      sendSuccess(res, 'Priest records retrieved.', priests);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/priests/pending
  async getPendingPriests(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const pendingPriests = await adminService.getPendingPriests();
      sendSuccess(res, 'Pending priest applications retrieved.', pendingPriests);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/priests/:id/approve
  async approvePriest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.approvePriest(req.params.id);
      sendSuccess(res, `Priest application ${req.params.id} has been approved.`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/priests/:id/reject
  async rejectPriest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.rejectPriest(req.params.id, req.body?.reason);
      sendSuccess(res, `Priest application ${req.params.id} has been rejected.`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/priests/:id/ban
  async banPriest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.banPriest(req.params.id, req.body?.reason);
      sendSuccess(res, `Priest ${req.params.id} has been suspended.`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/priests/:id/unban
  async unbanPriest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.unbanPriest(req.params.id);
      sendSuccess(res, `Priest ${req.params.id} account has been reactivated.`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/priests/:id/reopen
  async reopenPriestApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.reopenPriestApplication(req.params.id);
      sendSuccess(res, `Priest application ${req.params.id} reopened for review.`);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/users
  async getAllUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usersList = await adminService.getAllUsers();
      sendSuccess(res, 'Devotee user accounts retrieved.', usersList);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/users/:id/suspend
  async suspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.suspendUser(req.params.id, req.body?.reason);
      sendSuccess(res, `User ${req.params.id} has been suspended.`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/users/:id/unsuspend
  async unsuspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await adminService.unsuspendUser(req.params.id);
      sendSuccess(res, `User ${req.params.id} has been unsuspended.`);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/bookings
  async getAllBookings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const bookingsList = await adminService.getAllBookings();
      sendSuccess(res, 'All platform ceremony bookings retrieved.', bookingsList);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
