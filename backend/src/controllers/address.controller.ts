import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../views/response.view.js';
import { addressService } from '../services/address.service.js';

/**
 * [CONTROLLER] Address Controller
 * Responsibility: Devotee ceremonial address management.
 */
export class AddressController {
  /**
   * GET /api/v1/addresses
   */
  async getAddresses(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Always use the authenticated user's own id — never trust a userId from the query string
      if (!req.user) {
        sendError(res, 'Authentication required to view addresses.', 401);
        return;
      }
      const addresses = await addressService.getAddresses(req.user.id);
      sendSuccess(res, 'Addresses retrieved.', addresses);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/addresses
   */
  async createAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeUserId = req.user?.id || req.body?.userId;
      if (!activeUserId) {
        sendError(res, 'Authentication required to save address.', 401);
        return;
      }
      const address = await addressService.createAddress(activeUserId, req.body);
      sendSuccess(res, 'Address saved successfully.', address, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/addresses/:id
   */
  async updateAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeUserId = req.user?.id || '';
      const updated = await addressService.updateAddress(req.params.id, activeUserId, req.body);
      sendSuccess(res, `Address ${req.params.id} updated successfully.`, updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/addresses/:id
   */
  async deleteAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeUserId = req.user?.id || '';
      await addressService.deleteAddress(req.params.id, activeUserId);
      sendSuccess(res, `Address ${req.params.id} deleted successfully.`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/addresses/:id/default
   */
  async setDefaultAddress(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const activeUserId = req.user?.id || '';
      const updated = await addressService.setDefaultAddress(req.params.id, activeUserId);
      sendSuccess(res, `Default address set to ${req.params.id}.`, updated);
    } catch (error) {
      next(error);
    }
  }
}

export const addressController = new AddressController();
