import { z } from 'zod';

const phoneRegex = /^(\+91[\-\s]?)?[6-9]\d{9}$/;

/**
 * [SCHEMA] User Validation Schemas
 * Type-safe input checking for devotee profile updates and security.
 */

export const updateUserProfileSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100).optional(),
  phoneNumber: z.string().trim().regex(phoneRegex, 'Please enter a valid 10-digit Indian phone number').optional(),
  email: z.string().trim().email('Invalid email address').max(255).optional(),
  avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password must be at least 6 characters').optional(),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
  confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters').max(100),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'New password and confirmation password do not match',
  path: ['confirmPassword'],
});

export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
