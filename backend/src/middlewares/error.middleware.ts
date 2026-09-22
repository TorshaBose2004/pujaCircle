import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../views/response.view.js';
import { env } from '../config/env.js';

/**
 * [MIDDLEWARE] Global Error Handler
 * Sanitizes and logs errors, preventing stack traces from leaking to clients in production.
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('Unhandled Server Error:', err);

  // Zod Validation Error handling
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const message = issue ? `${issue.path.join('.') || 'input'}: ${issue.message}` : 'Validation failed';
    sendError(res, message, 400, err.format());
    return;
  }

  // Known custom or Supabase operational errors
  if (err.statusCode && typeof err.statusCode === 'number') {
    sendError(res, err.message || 'Operation failed', err.statusCode);
    return;
  }

  // Fallback for unexpected errors: Always return a generic error message to clients, while logging full stack trace server-side
  sendError(
    res,
    'An unexpected server error occurred. Please try again.',
    500
  );
};
