import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { updateUserProfileSchema, changePasswordSchema } from '../schemas/user.schema.js';

const router = Router();

/**
 * [ROUTE] /api/v1/users
 * Devotee profile management, credentials, and settings.
 */
router.use(requireAuth);

router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateUserProfileSchema), userController.updateProfile);
router.post('/change-password', validate(changePasswordSchema), userController.changePassword);

export const userRoutes = router;
