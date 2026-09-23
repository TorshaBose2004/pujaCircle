import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../views/response.view.js';
import { env } from '../config/env.js';

/**
 * [MIDDLEWARE] Global Error Handler
 * Sanitizes errors, preventing stack traces, internal file paths, or raw DB errors from leaking to clients.
 * Full technical errors are logged server-side for debugging.
 */
export const errorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Always log full error details server-side for observability and debugging
  console.error('[SERVER ERROR DETAIL]:', err);

  // Zod Validation Error handling
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const message = issue ? `${issue.path.join('.') || 'input'}: ${issue.message}` : 'Validation failed';
    // Return clean user-facing validation errors without internal parser metadata
    const cleanErrors = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    sendError(res, message, 400, cleanErrors);
    return;
  }

  // Known custom operational errors with safe status codes
  if (err.statusCode && typeof err.statusCode === 'number' && err.statusCode < 500) {
    // Ensure raw SQL errors or internal paths are not passed in err.message
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

  // Fallback for unexpected or database 500 errors:
  // Strictly return generic messages to clients - never expose raw DB internals or stack traces
  sendError(
    res,
    'An unexpected server error occurred. Please try again.',
    500
  );
};
