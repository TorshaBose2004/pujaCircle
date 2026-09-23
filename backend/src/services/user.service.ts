import { UpdateUserProfileInput, ChangePasswordInput } from '../schemas/user.schema.js';

/**
 * [SERVICE] User Service
 * Handles devotee profiles, personal address books, and credentials.
 */
export class UserService {
  /**
   * Retrieve devotee profile details by user ID
   */
  async getProfile(_userId: string): Promise<any> {
    // TODO: [Teammate - User] Query user profile details from PostgreSQL users table
    return null;
  }

  /**
   * Update devotee profile details (name, avatar, contact)
   */
  async updateProfile(_userId: string, _data: UpdateUserProfileInput): Promise<any> {
    // TODO: [Teammate - User] Update user name and avatarUrl in PostgreSQL users table
    return null;
  }

  /**
   * Update devotee password via Supabase Auth
   */
  async changePassword(_userId: string, _data: ChangePasswordInput): Promise<void> {
    // TODO: [Teammate - User] Verify existing password and update password via Supabase Auth Admin client
  }
}

export const userService = new UserService();
