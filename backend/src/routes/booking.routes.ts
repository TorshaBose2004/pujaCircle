import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createBookingSchema, bookingActionReasonSchema } from '../validators/booking.validator.js';

const router = Router();

/**
 * [ROUTE] /api/v1/bookings
 * Reservation and ceremony lifecycle routes.
 */
router.get('/', bookingController.getBookings);
router.post('/', requireAuth, validate(createBookingSchema), bookingController.createBooking);
router.get('/:id', bookingController.getBookingById);
router.post('/:id/accept', requireAuth, bookingController.acceptBooking);
router.post('/:id/reject', requireAuth, validate(bookingActionReasonSchema), bookingController.rejectBooking);
router.post('/:id/cancel', requireAuth, validate(bookingActionReasonSchema), bookingController.cancelBooking);
router.post('/:id/complete', requireAuth, bookingController.completeBooking);

export const bookingRoutes = router;

