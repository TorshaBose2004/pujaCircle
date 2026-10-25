import { Router } from 'express';
import { authRoutes } from './auth.routes.js';
import { adminRoutes } from './admin.routes.js';
import { userRoutes } from './user.routes.js';
import { priestRoutes } from './priest.routes.js';
import { catalogRoutes } from './catalog.routes.js';
import { addressRoutes } from './address.routes.js';
import { bookingRoutes } from './booking.routes.js';
import { geoRoutes } from './geo.routes.js';
import { ritualRoutes } from './ritual.routes.js';
import { availabilityRoutes } from './availability.routes.js';
import { bookingController } from '../controllers/booking.controller.js';
import { mediaController } from '../controllers/media.controller.js';
import { sendSuccess } from '../views/response.view.js';
import { validate } from '../middlewares/validate.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { ratingSchema } from '../schemas/booking.schema.js';

const apiRouter = Router();

/**
 * Health Check Endpoint
 */
apiRouter.get('/health', (_req, res) => {
  sendSuccess(res, 'PujaCircle API is operating smoothly.', {
    status: 'ONLINE',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * Cloudinary Media Storage
 * Provides direct upload endpoint and signed parameters for Cloudinary storage.
 */
apiRouter.get('/media/signature', mediaController.getUploadSignature);
apiRouter.post('/media/upload', mediaController.uploadImage);
apiRouter.delete('/media', mediaController.deleteMedia);

/**
 * Module Subrouters
 */
apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/priests', priestRoutes);
apiRouter.use('/catalog', catalogRoutes);
apiRouter.use('/addresses', addressRoutes);
apiRouter.use('/bookings', bookingRoutes);
apiRouter.use('/geo', geoRoutes);
apiRouter.use('/rituals', ritualRoutes);
apiRouter.use('/availability', availabilityRoutes);
apiRouter.post('/ratings', requireAuth, validate(ratingSchema), bookingController.submitRating);

export const routes = apiRouter;
