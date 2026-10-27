import { z } from 'zod';

/**
 * [SCHEMA] Booking Validation Schemas
 * Strict validation bounds for ceremony bookings, devotee ratings, and cancellations.
 */
export const createBookingSchema = z.object({
  priestId: z.string().uuid('Invalid Priest ID format'),
  priestServiceId: z.string().uuid('Invalid Priest Service ID format').optional(),
  pujaCatalogId: z.string().uuid('Invalid Puja Catalog ID format').optional(),
  addressId: z.string().uuid('Invalid Address ID format'),
  // bookingDate is required — a puja booking must have a scheduled date
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'bookingDate must be in YYYY-MM-DD format'),
  scheduledDate: z.string().optional(), // derived server-side, optional from client
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  totalPrice: z.coerce.number().int().positive('Price must be greater than zero').optional(),
  servicePrice: z.coerce.number().int().positive('Price must be greater than zero').optional(),
  serviceName: z.string().optional(),
  specialInstructions: z.string().trim().max(1000).optional(),
  notes: z.string().trim().max(1000).optional(),
});

export const ratingSchema = z.object({
  bookingId: z.string().uuid('Invalid Booking ID format').optional(),
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5').optional(),
  review: z.string().trim().max(2000, 'Review cannot exceed 2000 characters').optional().nullable(),
  userId: z.string().optional(),
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
