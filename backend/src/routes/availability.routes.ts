import { Router } from 'express';
import { availabilityController } from '../controllers/availability.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { markDayOffSchema, blockHoursSchema } from '../schemas/availability.schema.js';

const router = Router();

/**
 * [ROUTES] Priest Availability & Calendar Endpoints
 */

// POST /day-off: Mark full day off
router.post(
  '/day-off',
  requireAuth,
  validate(markDayOffSchema),
  availabilityController.markFullDayOff
);

// POST /block-hours: Block specific hours
router.post(
  '/block-hours',
  requireAuth,
  validate(blockHoursSchema),
  availabilityController.blockHours
);

// GET /calendar: Get 3-month availability grid
router.get('/calendar', availabilityController.getCalendar);

export const availabilityRoutes = router;
