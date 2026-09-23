import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireAdmin } from '../middlewares/role.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { adminActionReasonSchema } from '../schemas/admin.schema.js';

const router = Router();

/**
 * [ROUTE] /api/v1/admin
 * Protected Admin Console Endpoints (ADMIN role required)
 */
router.use(requireAuth);
router.use(requireAdmin);

// Platform KPIs & Stats
router.get('/dashboard/stats', adminController.getDashboardStats);

// Platform Bookings Monitoring
router.get('/bookings', adminController.getAllBookings);

// Priest Verification & Lifecycle Management
router.get('/priests', adminController.getAllPriests);
router.get('/priests/pending', adminController.getPendingPriests);
router.post('/priests/:id/approve', adminController.approvePriest);
router.post('/priests/:id/reject', validate(adminActionReasonSchema), adminController.rejectPriest);
router.post('/priests/:id/ban', validate(adminActionReasonSchema), adminController.banPriest);
router.post('/priests/:id/unban', adminController.unbanPriest);
router.post('/priests/:id/reopen', adminController.reopenPriestApplication);

// Devotee Moderation
router.get('/users', adminController.getAllUsers);
router.post('/users/:id/suspend', validate(adminActionReasonSchema), adminController.suspendUser);
router.post('/users/:id/unsuspend', adminController.unsuspendUser);

export const adminRoutes = router;
