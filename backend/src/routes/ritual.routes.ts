import { Router } from 'express';
import { ritualController } from '../controllers/ritual.controller.js';

const router = Router();

/**
 * [ROUTE] /api/v1/rituals
 * Retrieves sacred ceremonial rituals and taxonomy.
 */
router.get('/', ritualController.getRituals);

export const ritualRoutes = router;
