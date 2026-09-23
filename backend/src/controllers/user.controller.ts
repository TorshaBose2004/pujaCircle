import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../views/response.view.js';
import { userService } from '../services/user.service.js';

/**
 * [CONTROLLER] User Controller
 * Responsibility: Devotee profile management, credentials, and settings.
 */
export class UserController {
  /**
   * GET /api/v1/users/profile
   */
  async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized session', 401);
        return;
      }

      const profile = await userService.getProfile(req.user.id);
      sendSuccess(res, 'Profile retrieved successfully.', profile ?? req.user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/users/profile
   */
  async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized session', 401);
        return;
      }

      const updated = await userService.updateProfile(req.user.id, req.body);
      sendSuccess(res, 'Profile updated successfully.', updated ?? req.user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/users/change-password
   */
  async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized session', 401);
        return;
      }

      await userService.changePassword(req.user.id, req.body);
      sendSuccess(res, 'Password updated successfully.');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
