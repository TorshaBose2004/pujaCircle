import { Request } from 'express';
import { AuthUserContext } from '../types/express.js';

// Check if a user context or request belongs to an authenticated admin
export const isAdmin = (target: Request | AuthUserContext | undefined | null): boolean => {
  if (!target) return false;

  // Extract AuthUserContext whether passed as req or as user object directly
  const user = 'user' in target ? target.user : (target as AuthUserContext);
  return Boolean(user && user.role === 'ADMIN' && user.accountStatus !== 'BANNED');
};
