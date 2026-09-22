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
import { bookingController } from '../controllers/booking.controller.js';
import { imageKitService } from '../services/imagekit.service.js';
import { sendSuccess } from '../views/response.view.js';
import { validate } from '../middlewares/validate.middleware.js';
import { ratingSchema } from '../validators/booking.validator.js';

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
 * ImageKit Direct Upload Signature
 */
apiRouter.get('/media/auth', (_req, res) => {
  const authParams = imageKitService.getAuthenticationParameters();
  sendSuccess(res, 'ImageKit authentication parameters generated.', authParams);
});

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
apiRouter.post('/ratings', validate(ratingSchema), bookingController.submitRating);


export const routes = apiRouter;

