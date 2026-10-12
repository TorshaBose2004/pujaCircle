import { z } from 'zod';

export const priestRegistrationSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Full name must be at least 3 characters').max(100, 'Name is too long'),
    phoneNumber: z
      .string()
      .trim()
      .min(10, '10-digit mobile number required')
      .max(15, 'Mobile number is too long')
      .regex(/^(\+91)?[6-9]\d{9}$/, 'Invalid Indian mobile number format'),
    email: z.string().trim().email('Invalid email').max(150).optional().or(z.literal('')),
    experienceYears: z.coerce.number().int('Years of experience must be an integer').min(0, 'Experience cannot be negative').max(70, 'Experience cannot exceed 70 years'),
    bio: z.string().trim().min(20, 'Please write at least 20 characters about your Vedic lineage & experience').max(2000, 'Bio cannot exceed 2000 characters'),
    languages: z.array(z.string().trim().min(1, 'Language cannot be empty').max(50)).min(1, 'Select at least one language').max(20),
    specializations: z.array(z.string().trim().min(1, 'Specialization cannot be empty').max(100)).min(1, 'Select at least one puja specialization').max(50),
    serviceAreas: z.array(z.string().trim().min(1, 'Service area cannot be empty').max(100)).min(1, 'Select at least one service area / locality').max(50),
    city: z.string().trim().min(2, 'City is required').max(100),
    state: z.string().trim().min(2, 'State is required').max(100),
  })
  .strict();

export const priestServiceSchema = z
  .object({
    serviceName: z.string().trim().min(2, 'Service name must be at least 2 characters').max(100, 'Service name is too long'),
    price: z.coerce.number().int('Price must be a whole number').positive('Price must be a positive amount in Indian Rupees (₹)').max(500000, 'Price cannot exceed ₹5,00,000'),
    pujaCatalogId: z.string().trim().max(100).optional(),
    isCustom: z.boolean().optional(),
    category: z.string().trim().max(100).optional(),
    samagriList: z.array(z.string().trim().min(1).max(200)).max(100).optional(),
    isActive: z.boolean().optional().default(true),
  })
  .strict();

/**
 * Weekly Recurring Availability Rule Schema Base
 */
export const baseWeeklyAvailabilityRuleSchema = z
  .object({
    dayOfWeek: z.coerce.number().int('Day of week must be an integer').min(0, 'Select a valid day (0=Sun, 6=Sat)').max(6, 'Select a valid day (0=Sun, 6=Sat)'),
    startTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid start time required (HH:MM format, 00:00 to 23:59)'),
    endTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid end time required (HH:MM format, 00:00 to 23:59)'),
    slotDurationMinutes: z.coerce.number().int().min(30, 'Slot duration must be at least 30 minutes').max(240, 'Slot duration cannot exceed 240 minutes').default(60),
    bufferMinutes: z.coerce.number().int().min(0, 'Buffer cannot be negative').max(60, 'Buffer cannot exceed 60 minutes').default(0),
    isActive: z.boolean().default(true),
  })
  .strict();

/**
 * Weekly Recurring Availability Rule Schema (with time range duration refinement)
 */
export const weeklyAvailabilityRuleSchema = baseWeeklyAvailabilityRuleSchema.refine(
  (data) => {
    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);
    const startTotal = startHour * 60 + startMin;
    const endTotal = endHour * 60 + endMin;
    const duration = endTotal - startTotal;
    return duration >= data.slotDurationMinutes;
  },
  {
    message: 'End time must be after start time by at least the slot duration',
    path: ['endTime'],
  }
);

/**
 * Date-Specific Availability Exception Schema
 */
export const availabilityExceptionSchema = z
  .object({
    date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid date required (YYYY-MM-DD format)'),
    type: z.enum(['BLOCKED', 'CUSTOM']),
    reason: z.string().trim().max(200, 'Reason cannot exceed 200 characters').optional().or(z.literal('')),
    customSlots: z
      .array(
        z
          .object({
            startTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid start time (HH:MM)'),
            endTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid end time (HH:MM)'),
          })
          .strict()
      )
      .optional(),
  })
  .strict();



export const updatePriestProfileSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100, 'Name is too long').optional(),
    displayName: z.string().trim().min(2, 'Display name must be at least 2 characters').max(100, 'Display name too long').optional(),
    experienceYears: z.coerce.number().int('Experience must be an integer').min(0, 'Experience cannot be negative').max(70, 'Experience cannot exceed 70 years').optional(),
    bio: z.string().trim().min(10, 'Bio must be at least 10 characters').max(2000, 'Bio cannot exceed 2000 characters').optional(),
    languages: z.array(z.string().trim().min(1, 'Language cannot be empty').max(50)).min(1, 'Select at least one language').max(20).optional(),
    specializations: z.array(z.string().trim().min(1, 'Specialization cannot be empty').max(100)).max(50).optional(),
    serviceAreas: z.array(z.string().trim().min(1, 'Service area cannot be empty').max(100)).max(50).optional(),
    city: z.string().trim().min(2, 'City is required').max(100).optional(),
    state: z.string().trim().min(2, 'State is required').max(100).optional(),
    profileImageUrl: z.string().trim().max(10000000).optional().or(z.literal('')),
    defaultStartTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Valid time required (HH:MM)').optional(),
    defaultEndTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, 'Valid time required (HH:MM)').optional(),
  })
  .strict();

export const priestAvailabilityExceptionSchema = z
  .object({
    exceptionType: z.enum(['BLOCK', 'CUSTOM_HOURS']).default('BLOCK'),
    startAt: z.string().datetime({ message: 'Valid start date/time ISO string required' }),
    endAt: z.string().datetime({ message: 'Valid end date/time ISO string required' }),
    reason: z.string().trim().max(255, 'Reason cannot exceed 255 characters').optional().or(z.literal('')),
  })
  .strict();

export type PriestRegistrationInput = z.infer<typeof priestRegistrationSchema>;
export type PriestServiceInput = z.infer<typeof priestServiceSchema>;
export type WeeklyAvailabilityRuleInput = z.infer<typeof weeklyAvailabilityRuleSchema>;
export type AvailabilityExceptionInput = z.infer<typeof availabilityExceptionSchema>;
export type PriestAvailabilityExceptionInput = z.infer<typeof priestAvailabilityExceptionSchema>;
export type UpdatePriestProfileInput = z.infer<typeof updatePriestProfileSchema>;
