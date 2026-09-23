import { Router } from 'express';
import { addressController } from '../controllers/address.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createAddressSchema, updateAddressSchema } from '../schemas/address.schema.js';

const router = Router();

/**
 * [ROUTE] /api/v1/addresses
 * Devotee addresses for ceremonial ceremonies.
 */
router.get('/', addressController.getAddresses);
router.post('/', requireAuth, validate(createAddressSchema), addressController.createAddress);
router.put('/:id', requireAuth, validate(updateAddressSchema), addressController.updateAddress);
router.delete('/:id', requireAuth, addressController.deleteAddress);
router.patch('/:id/default', requireAuth, addressController.setDefaultAddress);

export const addressRoutes = router;

