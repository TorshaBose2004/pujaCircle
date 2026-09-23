import { z } from 'zod';

/**
 * [SCHEMA] Priest Validation Schemas
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

const basePriestSlotSchema = z.object({
  slotDate: z.string().optional(),
  date: z.string().optional(),
  startTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm 24hr format'),
  endTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be in HH:mm 24hr format'),
  isAvailable: z.boolean().default(true),
});

export const createPriestSlotSchema = basePriestSlotSchema.refine(
  (data) => Boolean(data.slotDate || data.date),
  {
    message: 'Slot date is required',
    path: ['slotDate'],
  }
);

export const updatePriestSlotSchema = basePriestSlotSchema.partial();

export const priestFilterParamsSchema = z.object({
  city: z.string().optional(),
  catalogId: z.string().optional(),
  serviceName: z.string().optional(),
  ritualSlug: z.string().optional(),
  language: z.string().optional(),
  specialization: z.string().optional(),
  searchQuery: z.string().optional(),
  date: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ALL']).optional(),
  accountStatus: z.enum(['ACTIVE', 'BANNED', 'ALL']).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minExperience: z.coerce.number().optional(),
  minRating: z.coerce.number().optional(),
});

export type UpdatePriestProfileInput = z.infer<typeof updatePriestProfileSchema>;
export type CreatePriestServiceInput = z.infer<typeof createPriestServiceSchema>;
export type UpdatePriestServiceInput = z.infer<typeof updatePriestServiceSchema>;
export type CreatePriestSlotInput = z.infer<typeof createPriestSlotSchema>;
export type UpdatePriestSlotInput = z.infer<typeof updatePriestSlotSchema>;
export type PriestFilterParams = z.infer<typeof priestFilterParamsSchema>;
