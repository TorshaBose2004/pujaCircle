/**
 * [UTIL] Custom Application Error
 * Extends native Error so stack traces are preserved and instanceof checks work cleanly.
 * Usage: throw new AppError(404, 'User not found.');
 */
export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}
