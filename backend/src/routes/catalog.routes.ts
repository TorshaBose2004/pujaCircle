import { Router } from 'express';
import { catalogController } from '../controllers/catalog.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { createCatalogEntrySchema, updateCatalogEntrySchema } from '../schemas/catalog.schema.js';

const router = Router();

/**
 * [ROUTE] /api/v1/catalog
 * Public sacred puja catalog exploration and management.
 */
router.get('/', catalogController.getCatalog);
router.get('/:id', catalogController.getCatalogById);
router.post('/', validate(createCatalogEntrySchema), catalogController.createCatalogEntry);
router.put('/:id', validate(updateCatalogEntrySchema), catalogController.updateCatalogEntry);
router.delete('/:id', catalogController.deleteCatalogEntry);

export const catalogRoutes = router;

