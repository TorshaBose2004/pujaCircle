import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { sendSuccess, sendError } from '../views/response.view.js';
import { env } from '../config/env.js';

/**
 * Cookie options helper for session security
 */
const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

/**
 * [CONTROLLER] Authentication Controller
 * Handles HTTP request dispatch, sets auth cookies, and calls response views.
 */
export class AuthController {
  /**
   * POST /api/v1/auth/login
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);

      if (result.token) {
        res.cookie('access_token', result.token, getAuthCookieOptions());
      }

      sendSuccess(res, 'Signed in successfully.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/register/user
   */
  async registerUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.registerUser(req.body);

      if (result.token) {
        res.cookie('access_token', result.token, getAuthCookieOptions());
      }

      sendSuccess(res, 'Devotee account created successfully.', result, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/register/priest
   */
  async registerPriest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.registerPriest(req.body);

      if (result.token) {
        res.cookie('access_token', result.token, getAuthCookieOptions());
      }

      sendSuccess(
        res,
        'Priest onboarding application submitted successfully. Pending admin review.',
        result,
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized session', 401);
        return;
      }

      const user = await authService.getMe(req.user.id);
      sendSuccess(res, 'Session profile retrieved successfully.', { user });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.access_token || req.headers.authorization?.split(' ')[1];
      const result = await authService.logout(token);

      res.clearCookie('access_token');
      res.clearCookie('token');

      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/otp/send-phone
   */
  async sendPhoneOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.sendPhoneOtp(req.body.phoneNumber);
      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/otp/verify-phone
   */
  async verifyPhoneOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.verifyPhoneOtp(req.body);

      if (result.token) {
        res.cookie('access_token', result.token, getAuthCookieOptions());
      }

      sendSuccess(res, 'Phone verification successful.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/otp/send-email
   */
  async sendEmailOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.sendEmailOtp(req.body.email);
      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/otp/verify-email
   */
  async verifyEmailOtp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.verifyEmailOtp(req.body);
      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/forgot-password
   */
  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.forgotPassword(req.body);
      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/reset-password
   */
  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.resetPassword(req.body);
      sendSuccess(res, result.message);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
