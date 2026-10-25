import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../views/response.view.js';
import { AppError } from '../utils/AppError.js';

/**
 * [MIDDLEWARE] Global Error Handler
 * Sanitizes errors — prevents stack traces, DB internals, or file paths from leaking to clients.
 * Full technical details are logged server-side for debugging.
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Always log full error server-side for observability
  console.error('[SERVER ERROR DETAIL]:', err);

  // Zod validation errors — return clean field-level messages to the client
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const message = issue ? `${issue.path.join('.') || 'input'}: ${issue.message}` : 'Validation failed';
    const cleanErrors = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    sendError(res, message, 400, cleanErrors);
    return;
  }

  // AppError — typed operational errors with a safe status code and message
  if (err instanceof AppError && err.statusCode < 500) {
    sendError(res, err.message, err.statusCode);
    return;
  }

  // Legacy plain-object errors { statusCode, message } — supported during migration to AppError
  if (err.statusCode && typeof err.statusCode === 'number' && err.statusCode < 500) {
    // Ensure raw SQL or internal paths are not passed through
    const isSafeMessage = typeof err.message === 'string' &&
      !err.message.includes('relation') &&
      !err.message.includes('column') &&
      !err.message.includes('syntax') &&
      !err.message.includes('SELECT') &&
      !err.message.includes('INSERT') &&
      !err.message.includes('UPDATE') &&
      !err.message.includes('DELETE') &&
      !err.message.includes('\\') &&
      !err.message.includes('/');

    const safeMessage = isSafeMessage ? err.message : 'The requested operation could not be completed.';
    sendError(res, safeMessage, err.statusCode);
    return;
  }

  // Fallback for unexpected 500 errors — never expose raw DB internals or stack traces
  sendError(res, 'An unexpected server error occurred. Please try again.', 500);
};

