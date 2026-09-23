import { Request, Response, NextFunction } from 'express';
import { sendSuccess, sendError } from '../views/response.view.js';
import { priestService } from '../services/priest.service.js';

/**
 * [CONTROLLER] Priest Controller
 * Responsibility: Verified priest directory, profile customizations, service offerings, and slot scheduling.
 */
export class PriestController {
  /**
   * GET /api/v1/priests
   */
  async searchPriests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priests = await priestService.searchPriests(req.query as any);
      sendSuccess(res, 'Verified priests retrieved.', priests);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/priests/:id
   */
  async getPriestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priest = await priestService.getPriestById(req.params.id);
      if (!priest) {
        sendError(res, `Priest profile ${req.params.id} not found.`, 404);
        return;
      }
      sendSuccess(res, `Priest profile ${req.params.id} retrieved.`, priest);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/priests/me/profile
   */
  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized session', 401);
        return;
      }
      const profile = await priestService.getMyProfile(req.user.id);
      sendSuccess(res, 'Priest profile details retrieved.', profile ?? req.user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/priests/me/profile
   */
  async updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized session', 401);
        return;
      }
      const updated = await priestService.updatePriestProfile(req.user.id, req.body);
      sendSuccess(res, 'Priest profile updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/priests/me/services
   */
  async getMyServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized session', 401);
        return;
      }
      const services = await priestService.getPriestServices(req.user.id);
      sendSuccess(res, 'Priest services retrieved.', services);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/priests/me/services
   */
  async addService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized session', 401);
        return;
      }
      const service = await priestService.createPriestService(req.user.id, req.body);
      sendSuccess(res, 'Service offering added.', service, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/priests/me/services/:serviceId
   */
  async deleteService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized session', 401);
        return;
      }
      await priestService.deletePriestService(req.user.id, req.params.serviceId);
      sendSuccess(res, `Service ${req.params.serviceId} removed.`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/priests/:id
   */
  async updatePriestProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await priestService.updatePriestProfile(req.params.id, req.body);
      sendSuccess(res, `Priest ${req.params.id} updated.`, updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/priests/:id/services
   */
  async getPriestServices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const services = await priestService.getPriestServices(req.params.id);
      sendSuccess(res, 'Priest services retrieved.', services);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/priests/:id/services
   */
  async createPriestService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const service = await priestService.createPriestService(req.params.id, req.body);
      sendSuccess(res, 'Service offering created.', service, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/priests/:id/services/:serviceId
   */
  async updatePriestService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await priestService.updatePriestService(
        req.params.id,
        req.params.serviceId,
        req.body
      );
      sendSuccess(res, 'Service offering updated.', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/priests/:id/services/:serviceId
   */
  async deletePriestService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await priestService.deletePriestService(req.params.id, req.params.serviceId);
      sendSuccess(res, 'Service offering removed.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/priests/:id/services/:serviceId/toggle
   */
  async togglePriestService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await priestService.togglePriestService(req.params.id, req.params.serviceId);
      sendSuccess(res, 'Service status toggled.', result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/priests/:id/slots
   */
  async getPriestSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = typeof req.query.date === 'string' ? req.query.date : undefined;
      const slots = await priestService.getPriestSlots(req.params.id, date);
      sendSuccess(res, 'Availability slots retrieved.', slots);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/priests/:id/slots/available
   */
  async getAvailableSlots(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const date = typeof req.query.date === 'string' ? req.query.date : undefined;
      const slots = await priestService.getAvailableSlots(req.params.id, date);
      sendSuccess(res, 'Available slots retrieved.', slots);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/priests/:id/slots
   */
  async createPriestSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const slot = await priestService.createPriestSlot(req.params.id, req.body);
      sendSuccess(res, 'Slot created successfully.', slot, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/priests/:id/slots/:slotId
   */
  async updatePriestSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await priestService.updatePriestSlot(
        req.params.id,
        req.params.slotId,
        req.body
      );
      sendSuccess(res, 'Slot updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/priests/:id/slots/:slotId
   */
  async deletePriestSlot(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await priestService.deletePriestSlot(req.params.id, req.params.slotId);
      sendSuccess(res, 'Slot deleted successfully.');
    } catch (error) {
      next(error);
    }
  }
}

export const priestController = new PriestController();
