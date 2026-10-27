import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { db } from '../db/index.js';
import { users } from '../models/user.model.js';
import { sendError } from '../views/response.view.js';
import { AuthUserContext } from '../types/express.js';

/**
 * [MIDDLEWARE] Resilient Authentication Guard
 * 1. Extracts Bearer token from Authorization header or HTTP-only cookies.
 * 2. Validates token via:
 *    a) Internal App JWT (7-day lifespan)
 *    b) Supabase Auth API
 *    c) Supabase JWT secret or development decode fallback
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

    let resolvedUserId: string | null = null;

    // A. Attempt verification with internal App JWT_SECRET (7d tokens)
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      if (decoded?.userId || decoded?.id || decoded?.sub) {
        resolvedUserId = decoded.userId || decoded.id || decoded.sub;
      }
    } catch {
      // Not an internal app JWT or expired
    }

    // B. Attempt verification with Supabase Auth API
    if (!resolvedUserId) {
      try {
        const { data: authData, error: authError } = await supabase.auth.getUser(token);
        if (!authError && authData?.user?.id) {
          resolvedUserId = authData.user.id;
        }
      } catch {
        // Supabase network / API error
      }
    }

    // C. Fallback verification with SUPABASE_JWT_SECRET
    if (!resolvedUserId && env.SUPABASE_JWT_SECRET) {
      try {
        const decoded = jwt.verify(token, env.SUPABASE_JWT_SECRET, {
          ignoreExpiration: env.NODE_ENV === 'development',
        }) as any;
        if (decoded?.sub) {
          resolvedUserId = decoded.sub;
        }
      } catch {
        // Supabase secret mismatch
      }
    }

    // D. Development fallback: decode token payload sub if user exists in database
    if (!resolvedUserId && env.NODE_ENV === 'development') {
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded?.sub || decoded?.userId || decoded?.id) {
          resolvedUserId = decoded.sub || decoded.userId || decoded.id;
        }
      } catch {
        // Non-decodable token
      }
    }

    if (!resolvedUserId) {
      sendError(res, 'Invalid or expired session. Please sign in again.', 401);
      return;
    }

    // 4. Retrieve application user record from PostgreSQL
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, resolvedUserId))
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

