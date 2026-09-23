import { z } from 'zod';

/**
 * [SCHEMA] Admin Schemas
 * Strict validation for administrative actions and moderation.
 */
export const adminActionReasonSchema = z.object({
  reason: z.string().trim().max(500, 'Reason cannot exceed 500 characters').optional(),
});

export type AdminActionReasonInput = z.infer<typeof adminActionReasonSchema>;
