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
      const priestId = req.user?.id || req.params.id;
      const service = await priestService.createPriestService(priestId, req.body);
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
      const priestId = req.user?.id || req.params.id;
      const updated = await priestService.updatePriestService(
        priestId,
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
      const priestId = req.user?.id || req.params.id;
      await priestService.deletePriestService(priestId, req.params.serviceId);
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
      const priestId = req.user?.id || req.params.id;
      const result = await priestService.togglePriestService(priestId, req.params.serviceId);
      sendSuccess(res, 'Service status toggled.', result);
    } catch (error) {
      next(error);
    }
  }


  /**
   * GET /api/v1/priests/me/exceptions
   */
  async getMyExceptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized session', 401);
        return;
      }
      const exceptions = await priestService.getPriestExceptions(req.user.id, req.query as any);
      sendSuccess(res, 'Priest availability exceptions retrieved.', exceptions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/priests/me/exceptions/:exceptionId
   */
  async deleteMyException(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized session', 401);
        return;
      }
      await priestService.deletePriestException(req.user.id, req.params.exceptionId);
      sendSuccess(res, 'Availability exception deleted successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/priests/:id/exceptions
   */
  async getPriestExceptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exceptions = await priestService.getPriestExceptions(req.params.id, req.query as any);
      sendSuccess(res, 'Priest availability exceptions retrieved.', exceptions);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/priests/:id/exceptions/:exceptionId
   */
  async updatePriestException(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await priestService.updatePriestException(
        req.params.id,
        req.params.exceptionId,
        req.body
      );
      sendSuccess(res, 'Availability exception updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/priests/:id/exceptions/:exceptionId
   */
  async deletePriestException(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await priestService.deletePriestException(req.params.id, req.params.exceptionId);
      sendSuccess(res, 'Availability exception deleted successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/priests/me/working-hours
   */
  async getMyWorkingHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized session', 401);
        return;
      }
      const workingHours = await priestService.getWorkingHours(req.user.id);
      sendSuccess(res, 'Priest default working hours retrieved.', workingHours);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/priests/me/working-hours
   */
  async updateMyWorkingHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'Unauthorized session', 401);
        return;
      }
      const updated = await priestService.updateWorkingHours(req.user.id, req.body);
      sendSuccess(res, 'Priest default working hours updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/priests/:id/working-hours
   */
  async getPriestWorkingHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workingHours = await priestService.getWorkingHours(req.params.id);
      sendSuccess(res, 'Priest working hours retrieved.', workingHours);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/priests/:id/working-hours
   */
  async updatePriestWorkingHours(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await priestService.updateWorkingHours(req.params.id, req.body);
      sendSuccess(res, 'Priest working hours updated successfully.', updated);
    } catch (error) {
      next(error);
    }
  }
}

export const priestController = new PriestController();
