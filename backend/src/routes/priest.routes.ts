import { Router } from 'express';
import { z } from 'zod';
import { priestController } from '../controllers/priest.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  updatePriestProfileSchema,
  createPriestServiceSchema,
  updatePriestServiceSchema,
  updatePriestAvailabilityExceptionSchema,
  priestWorkingHoursSchema,
} from '../schemas/priest.schema.js';
import {
  uuidParamSchema,
  priestServiceParamSchema,
  priestExceptionParamSchema,
  exceptionIdParamSchema,
} from '../schemas/common.schema.js';

const router = Router();

/**
 * [ROUTE] /api/v1/priests
 * Priest directory, profile customization, and service pricing (Teammate Skeleton)
 */

// Protected priest self-management — MUST be before /:id to avoid Express swallowing 'me' as an id
router.get('/me/profile', requireAuth, requireRole('PRIEST'), priestController.getMyProfile);
router.put('/me/profile', requireAuth, requireRole('PRIEST'), validate(updatePriestProfileSchema), priestController.updateMyProfile);
router.get('/me/services', requireAuth, requireRole('PRIEST'), priestController.getMyServices);
router.post('/me/services', requireAuth, requireRole('PRIEST'), validate(createPriestServiceSchema), priestController.addService);
router.delete('/me/services/:serviceId', requireAuth, requireRole('PRIEST'), validate(z.object({ serviceId: z.string().uuid() }), 'params'), priestController.deleteService);

// Protected priest availability & leaves self-management
router.get('/me/exceptions', requireAuth, requireRole('PRIEST'), priestController.getMyExceptions);
router.delete('/me/exceptions/:exceptionId', requireAuth, requireRole('PRIEST'), validate(exceptionIdParamSchema, 'params'), priestController.deleteMyException);
router.get('/me/working-hours', requireAuth, requireRole('PRIEST'), priestController.getMyWorkingHours);
router.put('/me/working-hours', requireAuth, requireRole('PRIEST'), validate(priestWorkingHoursSchema), priestController.updateMyWorkingHours);

// Priest-specific endpoints by ID (sub-resource routes before bare /:id)
router.get('/:id/services', validate(uuidParamSchema, 'params'), priestController.getPriestServices);
router.post('/:id/services', requireAuth, validate(uuidParamSchema, 'params'), validate(createPriestServiceSchema), priestController.createPriestService);
router.put('/:id/services/:serviceId', requireAuth, validate(priestServiceParamSchema, 'params'), validate(updatePriestServiceSchema), priestController.updatePriestService);
router.delete('/:id/services/:serviceId', requireAuth, validate(priestServiceParamSchema, 'params'), priestController.deletePriestService);
router.patch('/:id/services/:serviceId/toggle', requireAuth, validate(priestServiceParamSchema, 'params'), priestController.togglePriestService);

// Working Hours by priest ID
router.get('/:id/working-hours', validate(uuidParamSchema, 'params'), priestController.getPriestWorkingHours);
router.put('/:id/working-hours', requireAuth, validate(uuidParamSchema, 'params'), validate(priestWorkingHoursSchema), priestController.updatePriestWorkingHours);

// Priest Availability Exceptions by priest ID
router.get('/:id/exceptions', validate(uuidParamSchema, 'params'), priestController.getPriestExceptions);
router.put('/:id/exceptions/:exceptionId', requireAuth, validate(priestExceptionParamSchema, 'params'), validate(updatePriestAvailabilityExceptionSchema), priestController.updatePriestException);
router.delete('/:id/exceptions/:exceptionId', requireAuth, validate(priestExceptionParamSchema, 'params'), priestController.deletePriestException);

// Update priest profile by ID
router.put('/:id', requireAuth, validate(uuidParamSchema, 'params'), validate(updatePriestProfileSchema), priestController.updatePriestProfile);

// Public priest listings — LAST so they don't shadow /me/* or sub-resource routes
router.get('/', priestController.searchPriests);
router.get('/:id', validate(uuidParamSchema, 'params'), priestController.getPriestById);



export const priestRoutes = router;

