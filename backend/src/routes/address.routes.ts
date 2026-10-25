import { Router } from 'express';
import { addressController } from '../controllers/address.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createAddressSchema, updateAddressSchema } from '../schemas/address.schema.js';
import { uuidParamSchema } from '../schemas/common.schema.js';

const router = Router();

/**
 * [ROUTE] /api/v1/addresses
 * Devotee addresses for ceremonial ceremonies.
 */
// All address routes require auth — addresses are private user data
router.get('/', requireAuth, addressController.getAddresses);
router.post('/', requireAuth, validate(createAddressSchema), addressController.createAddress);
router.put('/:id', requireAuth, validate(uuidParamSchema, 'params'), validate(updateAddressSchema), addressController.updateAddress);
router.delete('/:id', requireAuth, validate(uuidParamSchema, 'params'), addressController.deleteAddress);
router.patch('/:id/default', requireAuth, validate(uuidParamSchema, 'params'), addressController.setDefaultAddress);

export const addressRoutes = router;

