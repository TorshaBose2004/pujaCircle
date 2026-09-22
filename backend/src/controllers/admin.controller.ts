import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users, priestProfiles } from '../models/index.js';
import { sendSuccess } from '../views/response.view.js';
import { adminService } from '../services/admin.service.js';

/**
 * [CONTROLLER] Admin Controller (Teammate Skeleton)
 * 
 * Responsibility: Platform oversight, priest approval/rejection, user moderation, analytics.
 * Assigned to: Teammate (Admin Module)
 */
export class AdminController {
  // GET /api/v1/admin/dashboard/stats
  async getDashboardStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Delegate platform analytics aggregation to service layer
      const stats = await adminService.getDashboardStats();
      sendSuccess(res, 'Admin dashboard statistics retrieved.', stats);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/priests
  async getAllPriests(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Fetch all priest records joined with user profile data
      const priests = await adminService.getAllPriests();
      sendSuccess(res, 'Priest records retrieved.', priests);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/priests/pending
   */
  async getPendingPriests(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Admin] Query priest_profiles where approvalStatus = 'PENDING'
      sendSuccess(res, 'Pending priest applications retrieved.', []);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/priests/:id/approve
   */
  async approvePriest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await db
        .update(priestProfiles)
        .set({ approvalStatus: 'APPROVED' })
        .where(eq(priestProfiles.id, req.params.id));
      sendSuccess(res, `Priest application ${req.params.id} has been approved.`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/priests/:id/reject
   */
  async rejectPriest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await db
        .update(priestProfiles)
        .set({
          approvalStatus: 'REJECTED',
          rejectionReason: req.body?.reason || 'Application declined by administrator',
        })
        .where(eq(priestProfiles.id, req.params.id));
      sendSuccess(res, `Priest application ${req.params.id} has been rejected.`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/priests/:id/ban
  async banPriest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Suspend priest account with optional reason
      await adminService.banPriest(req.params.id, req.body?.reason);
      sendSuccess(res, `Priest ${req.params.id} has been suspended.`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/priests/:id/unban
   */
  async unbanPriest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const [priest] = await db
        .select({ userId: priestProfiles.userId })
        .from(priestProfiles)
        .where(eq(priestProfiles.id, req.params.id))
        .limit(1);

      if (priest) {
        await db
          .update(users)
          .set({ accountStatus: 'ACTIVE', banReason: null })
          .where(eq(users.id, priest.userId));
      }
      sendSuccess(res, `Priest ${req.params.id} account has been reactivated.`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/priests/:id/reopen
   */
  async reopenPriestApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Admin] Update priest_profiles SET approvalStatus = 'PENDING' WHERE id = req.params.id
      sendSuccess(res, `Priest application ${req.params.id} reopened for review.`);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/admin/users
  async getAllUsers(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Fetch all devotee accounts with booking counts
      const usersList = await adminService.getAllUsers();
      sendSuccess(res, 'Devotee user accounts retrieved.', usersList);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/users/:id/suspend
  async suspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Suspend devotee user account with optional reason
      await adminService.suspendUser(req.params.id, req.body?.reason);
      sendSuccess(res, `User ${req.params.id} has been suspended.`);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/admin/users/:id/unsuspend
  async unsuspendUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Reactivate / Unsuspend devotee user account
      await adminService.unsuspendUser(req.params.id);
      sendSuccess(res, `User ${req.params.id} has been unsuspended.`);
    } catch (error) {
      next(error);
    }
  }


}


export const adminController = new AdminController();
