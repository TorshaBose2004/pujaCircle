import { Request, Response, NextFunction } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users, priestProfiles, priestServices } from '../models/index.js';
import { sendSuccess } from '../views/response.view.js';

export class PriestController {
  /**
   * GET /api/v1/priests
   */
  async searchPriests(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const records = await db
        .select({
          id: priestProfiles.id,
          userId: users.id,
          fullName: users.name,
          displayName: users.name,
          phoneNumber: users.phoneNumber,
          email: users.email,
          approvalStatus: priestProfiles.approvalStatus,
          accountStatus: users.accountStatus,
          banReason: users.banReason,
          experienceYears: priestProfiles.experienceYears,
          bio: priestProfiles.bio,
          languages: priestProfiles.languages,
          specializations: priestProfiles.specializations,
          serviceAreas: priestProfiles.serviceAreas,
          city: priestProfiles.city,
          state: priestProfiles.state,
          profileImageUrl: priestProfiles.profileImageUrl,
          rating: priestProfiles.rating,
          reviewCount: priestProfiles.reviewCount,
          createdAt: priestProfiles.createdAt,
        })
        .from(priestProfiles)
        .innerJoin(users, eq(priestProfiles.userId, users.id));

      const formatted = records.map((p) => ({
        ...p,
        isPhoneVerified: true,
        rating: Number(p.rating || 0),
        createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
      }));

      sendSuccess(res, 'Verified priests retrieved.', formatted);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/priests/:id
   */
  async getPriestById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const priestId = req.params.id;
      const [record] = await db
        .select({
          id: priestProfiles.id,
          userId: users.id,
          fullName: users.name,
          displayName: users.name,
          phoneNumber: users.phoneNumber,
          email: users.email,
          approvalStatus: priestProfiles.approvalStatus,
          accountStatus: users.accountStatus,
          banReason: users.banReason,
          experienceYears: priestProfiles.experienceYears,
          bio: priestProfiles.bio,
          languages: priestProfiles.languages,
          specializations: priestProfiles.specializations,
          serviceAreas: priestProfiles.serviceAreas,
          city: priestProfiles.city,
          state: priestProfiles.state,
          profileImageUrl: priestProfiles.profileImageUrl,
          rating: priestProfiles.rating,
          reviewCount: priestProfiles.reviewCount,
          createdAt: priestProfiles.createdAt,
        })
        .from(priestProfiles)
        .innerJoin(users, eq(priestProfiles.userId, users.id))
        .where(eq(priestProfiles.id, priestId))
        .limit(1);

      if (!record) {
        sendSuccess(res, `Priest profile ${priestId} not found.`, null);
        return;
      }

      const services = await db
        .select()
        .from(priestServices)
        .where(eq(priestServices.priestId, priestId));

      const formatted = {
        ...record,
        isPhoneVerified: true,
        rating: Number(record.rating || 0),
        createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
        services,
      };

      sendSuccess(res, `Priest profile ${priestId} retrieved.`, formatted);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/priests/me/profile
   */
  async getMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Priest] Query authenticated priest's profile using req.user.id
      sendSuccess(res, 'Priest profile details retrieved.', req.user || null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/priests/me/profile
   */
  async updateMyProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Priest] Update authenticated priest's bio, languages, specializations
      sendSuccess(res, 'Priest profile updated successfully.', req.user || null);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/priests/me/services
   */
  async getMyServices(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Priest] Query priest_services for authenticated priest
      sendSuccess(res, 'Priest services retrieved.', []);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/priests/me/services
   */
  async addService(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Priest] Insert new service offering into priest_services table
      sendSuccess(res, 'Service offering added.', null, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/priests/me/services/:serviceId
   */
  async deleteService(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Priest] Delete service from priest_services table where id = req.params.serviceId
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
      // TODO: [Teammate - Priest] Update priest profile by ID
      sendSuccess(res, `Priest ${req.params.id} updated.`);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/priests/:id/services
   */
  async getPriestServices(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Priest] Query priest_services by priest ID
      sendSuccess(res, 'Priest services retrieved.', []);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/priests/:id/services
   */
  async createPriestService(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Priest] Create priest service offering
      sendSuccess(res, 'Service offering created.', null, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/priests/:id/services/:serviceId
   */
  async updatePriestService(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Priest] Update priest service offering
      sendSuccess(res, 'Service offering updated.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/priests/:id/services/:serviceId
   */
  async deletePriestService(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Priest] Delete priest service offering
      sendSuccess(res, 'Service offering removed.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/priests/:id/services/:serviceId/toggle
   */
  async togglePriestService(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Priest] Toggle service active/inactive status
      sendSuccess(res, 'Service status toggled.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/priests/:id/slots
   */
  async getPriestSlots(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Priest] Query availability slots for priest
      sendSuccess(res, 'Availability slots retrieved.', []);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/priests/:id/slots
   */
  async createPriestSlot(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Priest] Create availability slot
      sendSuccess(res, 'Slot created successfully.', null, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/priests/:id/slots/:slotId
   */
  async updatePriestSlot(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Priest] Update availability slot
      sendSuccess(res, 'Slot updated successfully.');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/priests/:id/slots/:slotId
   */
  async deletePriestSlot(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // TODO: [Teammate - Priest] Delete availability slot
      sendSuccess(res, 'Slot deleted successfully.');
    } catch (error) {
      next(error);
    }
  }
}

export const priestController = new PriestController();
