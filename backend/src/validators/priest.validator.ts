import { z } from 'zod';

/**
 * [VALIDATOR] Priest Schemas
 * Strict validation bounds for priest profiles, services, and slots.
 */
export const updatePriestProfileSchema = z.object({
  experienceYears: z.coerce.number().int().min(0).max(80).optional(),
  bio: z.string().trim().max(1000).optional(),
  languages: z.array(z.string().trim().max(50)).optional(),
  specializations: z.array(z.string().trim().max(100)).optional(),
  serviceAreas: z.array(z.string().trim().max(100)).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  pincode: z.string().trim().regex(/^\d{6}$/, 'PIN code must be a 6-digit number').optional(),
  profileImageUrl: z.string().url('Invalid image URL format').optional().or(z.literal('')),
});

export const createPriestServiceSchema = z.object({
  serviceName: z.string().trim().min(2, 'Service name must be at least 2 characters').max(255),
  pujaCatalogId: z.string().uuid('Invalid catalog ID format').optional(),
  category: z.string().trim().max(100).default('General'),
  samagriList: z.array(z.string().trim().max(255)).default([]),
  price: z.coerce.number().int().positive('Price must be greater than zero'),
  isCustom: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const updatePriestServiceSchema = createPriestServiceSchema.partial();

export const createPriestSlotSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'Valid date required' }),
  startTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm 24hr format'),
  endTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm 24hr format'),
  isAvailable: z.boolean().default(true),
});

export type UpdatePriestProfileInput = z.infer<typeof updatePriestProfileSchema>;
export type CreatePriestServiceInput = z.infer<typeof createPriestServiceSchema>;
export type UpdatePriestServiceInput = z.infer<typeof updatePriestServiceSchema>;
