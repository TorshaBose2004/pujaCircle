import { z } from 'zod';

/**
 * [SCHEMA] Booking Validation Schemas
 * Strict validation bounds for ceremony bookings, devotee ratings, and cancellations.
 */
export const createBookingSchema = z.object({
  priestId: z.string().uuid('Invalid Priest ID format'),
  priestServiceId: z.string().uuid('Invalid Priest Service ID format').optional(),
  pujaCatalogId: z.string().uuid('Invalid Puja Catalog ID format').optional(),
  ritualId: z.string().optional(),
  addressId: z.string().uuid('Invalid Address ID format'),
  slotId: z.string().uuid('Invalid Slot ID format').optional(),
  availabilitySlotId: z.string().optional(),
  bookingDate: z.string().optional(),
  scheduledDate: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  totalPrice: z.coerce.number().int().positive('Price must be greater than zero').optional(),
  servicePrice: z.coerce.number().int().positive('Price must be greater than zero').optional(),
  serviceName: z.string().optional(),
  specialInstructions: z.string().trim().max(1000).optional(),
  userNotes: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const ratingSchema = z.object({
  bookingId: z.string().uuid('Invalid Booking ID format').optional(),
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  review: z.string().trim().max(1000, 'Review cannot exceed 1000 characters').optional(),
});

export const bookingActionReasonSchema = z.object({
  reason: z.string().trim().max(500, 'Reason cannot exceed 500 characters').optional(),
  priestId: z.string().optional(),
  userId: z.string().optional(),
  completionCode: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
export type BookingActionReasonInput = z.infer<typeof bookingActionReasonSchema>;
