import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import {
  loginSchema,
  registerUserSchema,
  registerPriestSchema,
  phoneOtpRequestSchema,
  verifyPhoneOtpSchema,
  emailOtpRequestSchema,
  verifyEmailOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../schemas/auth.schema.js';

const router = Router();

/**
 * [ROUTE] /api/v1/auth
 * Authentication endpoints supporting Devotee, Priest, and Admin credentials.
 */

// Primary Authentication & Registration
router.post('/login', validate(loginSchema), authController.login);
router.post('/register/user', validate(registerUserSchema), authController.registerUser);
router.post('/register/priest', validate(registerPriestSchema), authController.registerPriest);

// Session State
router.get('/me', requireAuth, authController.getMe);
router.post('/logout', authController.logout);

// Phone OTP Endpoints
router.post('/otp/send-phone', validate(phoneOtpRequestSchema), authController.sendPhoneOtp);
router.post('/otp/verify-phone', validate(verifyPhoneOtpSchema), authController.verifyPhoneOtp);

// Email OTP Endpoints
router.post('/otp/send-email', validate(emailOtpRequestSchema), authController.sendEmailOtp);
router.post('/otp/verify-email', validate(verifyEmailOtpSchema), authController.verifyEmailOtp);

// Password Recovery Endpoints
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export const authRoutes = router;
