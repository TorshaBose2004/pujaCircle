import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users } from '../models/user.model.js';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import { toUserView, UserViewModel } from '../views/user.view.js';
import { UpdateUserProfileInput, ChangePasswordInput } from '../schemas/user.schema.js';

/**
 * [SERVICE] User Service
 * Handles devotee profiles, personal address books, and credentials.
 */
export class UserService {
  /**
   * Retrieve devotee profile details by user ID
   */
  async getProfile(userId: string): Promise<UserViewModel> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw { statusCode: 404, message: 'User profile not found.' };
    }

    return toUserView(user);
  }

  /**
   * Update devotee profile details (name, avatar, contact)
   */
  async updateProfile(userId: string, data: UpdateUserProfileInput): Promise<UserViewModel> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) {
      throw { statusCode: 404, message: 'User profile not found.' };
    }

    return toUserView(updatedUser);
  }

  /**
   * Update devotee password via Supabase Auth
   */
  async changePassword(userId: string, data: ChangePasswordInput): Promise<void> {
    // 1. Fetch user to verify email and existence
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw { statusCode: 404, message: 'User profile not found.' };
    }

    // 2. If current password is provided, verify it against Supabase Auth
    if (data.currentPassword && user.email) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email.trim().toLowerCase(),
        password: data.currentPassword,
      });

      if (signInError) {
        throw { statusCode: 400, message: 'Current password is incorrect.' };
      }
    }

    // 3. Update password in Supabase Auth using privileged admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: data.newPassword,
    });

    if (updateError) {
      throw {
        statusCode: 400,
        message: updateError.message || 'Failed to update credentials. Please try again.',
      };
    }
  }
}

export const userService = new UserService();
