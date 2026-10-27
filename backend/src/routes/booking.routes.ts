import { Router } from 'express';
import { bookingController } from '../controllers/booking.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createBookingSchema, bookingActionReasonSchema } from '../schemas/booking.schema.js';
import { uuidParamSchema } from '../schemas/common.schema.js';

const router = Router();

/**
 * [ROUTE] /api/v1/bookings
 * Reservation and ceremony lifecycle routes.
 */
// Bookings are private data — require authentication on all reads
router.get('/', requireAuth, bookingController.getBookings);
router.post('/', requireAuth, validate(createBookingSchema), bookingController.createBooking);
router.get('/:id', requireAuth, validate(uuidParamSchema, 'params'), bookingController.getBookingById);
router.post('/:id/accept', requireAuth, validate(uuidParamSchema, 'params'), bookingController.acceptBooking);
router.post('/:id/reject', requireAuth, validate(uuidParamSchema, 'params'), validate(bookingActionReasonSchema), bookingController.rejectBooking);
router.post('/:id/cancel', requireAuth, validate(uuidParamSchema, 'params'), validate(bookingActionReasonSchema), bookingController.cancelBooking);
router.post('/:id/complete', requireAuth, validate(uuidParamSchema, 'params'), bookingController.completeBooking);
router.post('/:id/rating', requireAuth, validate(uuidParamSchema, 'params'), bookingController.submitRating);
router.post('/:id/ratings', requireAuth, validate(uuidParamSchema, 'params'), bookingController.submitRating);

export const bookingRoutes = router;

