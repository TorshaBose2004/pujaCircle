import { z } from 'zod';

/**
 * Validation schema for marking a priest's entire working day off
 */
export const markDayOffSchema = z.object({
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  reason: z.string().trim().max(255).optional(),
});

/**
 * Validation schema for blocking specific hours on a date
 */
export const blockHoursSchema = z
  .object({
    date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
    startTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be in HH:mm 24hr format'),
    endTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be in HH:mm 24hr format'),
    reason: z.string().trim().max(255).optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: 'End time must be later than start time',
    path: ['endTime'],
  });

export type MarkDayOffInput = z.infer<typeof markDayOffSchema>;
export type BlockHoursInput = z.infer<typeof blockHoursSchema>;
