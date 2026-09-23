import { z } from 'zod';

/**
 * [VALIDATOR] Booking Schemas
 * Strict validation bounds for ceremony bookings and devotee reviews.
 */
export const createBookingSchema = z.object({
  priestId: z.string().uuid('Invalid Priest ID format'),
  pujaCatalogId: z.string().uuid('Invalid Puja Catalog ID format').optional(),
  addressId: z.string().uuid('Invalid Address ID format').optional(),
  scheduledDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Valid scheduled ceremony date/time is required',
  }),
  totalPrice: z.coerce.number().int().positive('Price must be greater than zero'),
  notes: z.string().trim().max(1000, 'Notes cannot exceed 1000 characters').optional(),
});

export const ratingSchema = z.object({
  bookingId: z.string().uuid('Invalid Booking ID format').optional(),
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  review: z.string().trim().max(1000, 'Review cannot exceed 1000 characters').optional(),
});

export const bookingActionReasonSchema = z.object({
  reason: z.string().trim().max(500, 'Reason cannot exceed 500 characters').optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type RatingInput = z.infer<typeof ratingSchema>;
