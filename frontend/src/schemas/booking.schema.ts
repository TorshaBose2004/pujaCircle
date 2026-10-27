import { z } from 'zod';

export const createBookingSchema = z
  .object({
    priestId: z.string().trim().min(1, 'Priest must be selected').max(100),
    priestServiceId: z.string().trim().max(100).optional(),
    pujaCatalogId: z.string().trim().max(100).optional(),
    ritualId: z.string().trim().max(100).optional(),
    addressId: z.string().trim().min(1, 'Address must be selected').max(100),
    slotId: z.string().trim().min(1, 'Time slot must be selected').max(150),
    availabilitySlotId: z.string().trim().max(150).optional(),
    bookingDate: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/, 'Valid booking date required (YYYY-MM-DD)'),
    startTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid start time required (HH:MM)').optional(),
    endTime: z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Valid end time required (HH:MM)').optional(),
    specialInstructions: z.string().trim().max(500, 'Special instructions cannot exceed 500 characters').optional().or(z.literal('')),
    userNotes: z.string().trim().max(500, 'Notes cannot exceed 500 characters').optional().or(z.literal('')),
    dakshinaAmount: z.coerce.number().min(0, 'Amount cannot be negative').max(1000000, 'Amount too high').optional(),
  })
  .strict();

export const cancelBookingSchema = z
  .object({
    bookingId: z.string().trim().min(1, 'Booking ID is required').max(100),
    reason: z.string().trim().min(3, 'Please provide a cancellation reason (min 3 characters)').max(500, 'Reason too long'),
  })
  .strict();

export const rejectBookingSchema = z
  .object({
    bookingId: z.string().trim().min(1, 'Booking ID is required').max(100),
    reason: z.string().trim().min(3, 'Please provide a reason for declining (min 3 characters)').max(500, 'Reason too long'),
  })
  .strict();

export const ratingSchema = z.object({
  bookingId: z.string().trim().max(150).optional().or(z.literal('')),
  rating: z.coerce.number().int('Rating must be an integer').min(1, 'Please give at least 1 star').max(5, 'Maximum rating is 5 stars').optional().default(5),
  review: z.string().trim().max(2000, 'Review cannot exceed 2000 characters').optional().or(z.literal('')),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type RejectBookingInput = z.infer<typeof rejectBookingSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
