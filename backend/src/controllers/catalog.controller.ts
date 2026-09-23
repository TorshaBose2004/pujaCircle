import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../views/response.view.js';
import { catalogService } from '../services/catalog.service.js';

/**
 * [CONTROLLER] Catalog Controller
 * Responsibility: Public sacred puja catalog exploration and catalog administration.
 */
export class CatalogController {
  // GET /api/v1/catalog
  async getCatalog(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : undefined;
      const query = typeof req.query.query === 'string' ? req.query.query : undefined;
      const catalog = await catalogService.getCatalog(category, query);
      sendSuccess(res, 'Puja catalog retrieved successfully.', catalog);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/v1/catalog/:id
  async getCatalogById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await catalogService.getCatalogById(req.params.id);
      if (!entry) {
        sendError(res, `Catalog entry ${req.params.id} not found.`, 404);
        return;
      }
      sendSuccess(res, `Catalog entry ${req.params.id} retrieved.`, entry);
    } catch (error) {
      next(error);
    }
  }

  // POST /api/v1/catalog
  async createCatalogEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const entry = await catalogService.createCatalogEntry(req.body);
      sendSuccess(res, 'Ceremony catalog entry created successfully.', entry, 201);
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/v1/catalog/:id
  async updateCatalogEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await catalogService.updateCatalogEntry(req.params.id, req.body);
      sendSuccess(res, `Ceremony catalog entry ${req.params.id} updated successfully.`, updated);
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/v1/catalog/:id
  async deleteCatalogEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await catalogService.deleteCatalogEntry(req.params.id);
      sendSuccess(res, `Ceremony ${req.params.id} removed from catalog.`);
    } catch (error) {
      next(error);
    }
  }
}

export const catalogController = new CatalogController();
