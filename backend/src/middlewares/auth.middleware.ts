import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { supabase } from '../config/supabase.js';
import { db } from '../db/index.js';
import { users } from '../models/user.model.js';
import { sendError } from '../views/response.view.js';
import { AuthUserContext } from '../types/express.js';

/**
 * [MIDDLEWARE] Supabase JWT Authentication Guard
 * 1. Extracts Bearer token from Authorization header or HTTP-only cookies.
 * 2. Validates token authenticity using Supabase Auth.
 * 3. Fetches the active user profile from PostgreSQL.
 * 4. Rejects banned accounts and attaches req.user context.
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && (req.cookies.access_token || req.cookies.token)) {
      // 2. Check cookies
      token = req.cookies.access_token || req.cookies.token;
    }

    if (!token) {
      sendError(res, 'Authentication required. Please sign in to continue.', 401);
      return;
    }

    // 3. Verify token with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authData.user) {
      sendError(res, 'Invalid or expired session. Please sign in again.', 401);
      return;
    }

    const supabaseUserId = authData.user.id;

    // 4. Retrieve application user record from PostgreSQL
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, supabaseUserId))
      .limit(1);

    if (!existingUser) {
      sendError(res, 'User record not found in system.', 401);
      return;
    }

    // 5. Account moderation check
    if (existingUser.accountStatus === 'BANNED') {
      sendError(
        res,
        `Account suspended: ${existingUser.banReason || 'Administrative restriction'}. Please contact support.`,
        403
      );
      return;
    }

    // 6. Inject user context into request
    const userContext: AuthUserContext = {
      id: existingUser.id,
      email: existingUser.email || undefined,
      phoneNumber: existingUser.phoneNumber,
      name: existingUser.name,
      role: existingUser.role,
      accountStatus: existingUser.accountStatus,
      avatarUrl: existingUser.avatarUrl,
    };

    req.user = userContext;
    next();
  } catch (error: any) {
    console.error('Auth middleware error:', error);
    sendError(res, 'Authentication failed due to an unexpected error.', 500);
  }
};
