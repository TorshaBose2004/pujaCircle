import { and, eq, ilike, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, priestProfiles, priestServices, priestAvailabilityExceptions, pujaCatalog } from '../models/index.js';
import {
  UpdatePriestProfileInput,
  CreatePriestServiceInput,
  UpdatePriestServiceInput,
  PriestFilterParams,
  UpdatePriestAvailabilityExceptionInput,
  PriestWorkingHoursInput,
} from '../schemas/priest.schema.js';
import { cloudinaryService } from './cloudinary.service.js';
import { toISTDateString, toISTTimeString } from './availability.service.js';
import { AppError } from '../utils/AppError.js';

/**
 * [SERVICE] Priest Service
 * Handles verified purohit directory, profile configuration, service pricing, and availability exceptions.
 */
export class PriestService {
  /**
   * Resolves the canonical priest_profiles.id from either a profile ID or user ID.
   */
  private async resolvePriestProfileId(idOrUserId: string): Promise<string | null> {
    const [profile] = await db
      .select({ id: priestProfiles.id })
      .from(priestProfiles)
      .where(or(eq(priestProfiles.id, idOrUserId), eq(priestProfiles.userId, idOrUserId)))
      .limit(1);
    return profile?.id ?? null;
  }

  /**
   * Search and filter verified priests for devotee catalog listings
   */
  async searchPriests(_params?: PriestFilterParams): Promise<any[]> {
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
        defaultStartTime: priestProfiles.defaultStartTime,
        defaultEndTime: priestProfiles.defaultEndTime,
        createdAt: priestProfiles.createdAt,
      })
      .from(priestProfiles)
      .innerJoin(users, eq(priestProfiles.userId, users.id))
      // Only show verified, active priests on the public devotee listing
      .where(and(
        eq(priestProfiles.approvalStatus, 'APPROVED'),
        eq(users.accountStatus, 'ACTIVE')
      ));

    return records.map((p) => ({
      ...p,
      isPhoneVerified: true,
      rating: Number(p.rating || 0),
      createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
    }));
  }

  /**
   * Retrieve a single priest public profile by ID
   */
  async getPriestById(priestId: string): Promise<any> {
    const [record] = await db
      .select({
        id: priestProfiles.id,
        userId: users.id,
        fullName: users.name,
        displayName: users.name,
        phoneNumber: users.phoneNumber,
        email: users.email,
        approvalStatus: priestProfiles.approvalStatus,
        rejectionReason: priestProfiles.rejectionReason,
        accountStatus: users.accountStatus,
        banReason: users.banReason,
        experienceYears: priestProfiles.experienceYears,
        bio: priestProfiles.bio,
        languages: priestProfiles.languages,
        specializations: priestProfiles.specializations,
        serviceAreas: priestProfiles.serviceAreas,
        city: priestProfiles.city,
        state: priestProfiles.state,
        pincode: priestProfiles.pincode,
        profileImageUrl: priestProfiles.profileImageUrl,
        rating: priestProfiles.rating,
        reviewCount: priestProfiles.reviewCount,
        defaultStartTime: priestProfiles.defaultStartTime,
        defaultEndTime: priestProfiles.defaultEndTime,
        createdAt: priestProfiles.createdAt,
        updatedAt: priestProfiles.updatedAt,
      })
      .from(priestProfiles)
      .innerJoin(users, eq(priestProfiles.userId, users.id))
      .where(or(eq(priestProfiles.id, priestId), eq(priestProfiles.userId, priestId)))
      .limit(1);

    if (!record) return null;

    const services = await db
      .select({
        id: priestServices.id,
        priestId: priestServices.priestId,
        serviceName: priestServices.serviceName,
        pujaCatalogId: priestServices.pujaCatalogId,
        category: priestServices.category,
        samagriList: priestServices.samagriList,
        price: priestServices.price,
        isCustom: priestServices.isCustom,
        isActive: priestServices.isActive,
        durationMinutes: pujaCatalog.durationMinutes,
        createdAt: priestServices.createdAt,
        updatedAt: priestServices.updatedAt,
      })
      .from(priestServices)
      .leftJoin(pujaCatalog, eq(priestServices.pujaCatalogId, pujaCatalog.id))
      .where(eq(priestServices.priestId, record.id));

    return {
      ...record,
      isPhoneVerified: true,
      rating: Number(record.rating || 0),
      createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: record.updatedAt ? new Date(record.updatedAt).toISOString() : undefined,
      services,
    };
  }

  /**
   * Retrieve the current authenticated priest's profile
   */
  async getMyProfile(userId: string): Promise<any> {
    return this.getPriestById(userId);
  }

  /**
   * Update priest profile credentials, bio, and languages.
   * If profileImageUrl is updated, purges the old image from Cloudinary.
   */
  async updatePriestProfile(id: string, updates: UpdatePriestProfileInput): Promise<any> {
    const existing = await this.getPriestById(id);
    if (
      existing &&
      updates.profileImageUrl &&
      existing.profileImageUrl &&
      updates.profileImageUrl !== existing.profileImageUrl
    ) {
      await cloudinaryService.deleteImageByUrl(existing.profileImageUrl);
    }

    await db
      .update(priestProfiles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(or(eq(priestProfiles.id, id), eq(priestProfiles.userId, id)));

    return this.getPriestById(id);
  }

  /**
   * Query all service offerings for a given priest
   */
  async getPriestServices(priestId: string): Promise<any[]> {
    const priest = await this.getPriestById(priestId);
    return priest?.services ?? [];
  }

  /**
   * Create a new ritual service offering for a priest.
   * Priest can only add services from the authoritative puja_catalog table.
   * Prevents adding duplicate services for the same priest.
   */
  async createPriestService(priestId: string, data: CreatePriestServiceInput): Promise<any> {
    const profileId = await this.resolvePriestProfileId(priestId);

    if (!profileId) {
      throw new AppError(404, `Priest profile not found for ID: ${priestId}`);
    }

    // Must exist in puja_catalog table
    let catalogEntry = null;

    if (data.pujaCatalogId) {
      const [entry] = await db
        .select()
        .from(pujaCatalog)
        .where(eq(pujaCatalog.id, data.pujaCatalogId))
        .limit(1);
      catalogEntry = entry;
    } else if (data.serviceName) {
      const [entry] = await db
        .select()
        .from(pujaCatalog)
        .where(ilike(pujaCatalog.name, data.serviceName.trim()))
        .limit(1);
      catalogEntry = entry;
    }

    if (!catalogEntry) {
      throw new AppError(400, 'Please select a valid ceremony from the sacred puja catalog.');
    }

    // Check if priest already added this service (by catalog ID or canonical name)
    const [existing] = await db
      .select({ id: priestServices.id })
      .from(priestServices)
      .where(
        and(
          eq(priestServices.priestId, profileId),
          or(
            eq(priestServices.pujaCatalogId, catalogEntry.id),
            ilike(priestServices.serviceName, catalogEntry.name)
          )
        )
      )
      .limit(1);

    if (existing) {
      throw new AppError(409, `Service "${catalogEntry.name}" has already been added.`);
    }

    const [record] = await db
      .insert(priestServices)
      .values({
        priestId: profileId,
        serviceName: catalogEntry.name,
        pujaCatalogId: catalogEntry.id,
        category: catalogEntry.category || 'General',
        samagriList: catalogEntry.samagriList || [],
        price: data.price,
        isCustom: false,
        isActive: data.isActive ?? true,
      })
      .returning();

    return record;
  }

  /**
   * Update service pricing and details for a priest service
   */
  async updatePriestService(
    priestId: string,
    serviceId: string,
    data: UpdatePriestServiceInput
  ): Promise<any> {
    const profileId = await this.resolvePriestProfileId(priestId);

    if (!profileId) {
      throw new AppError(404, `Priest profile not found for ID: ${priestId}`);
    }

    // Check if the service exists and belongs to this priest
    const [currentService] = await db
      .select()
      .from(priestServices)
      .where(and(eq(priestServices.id, serviceId), eq(priestServices.priestId, profileId)))
      .limit(1);

    if (!currentService) {
      throw new AppError(404, `Service not found for ID: ${serviceId}`);
    }

    // Only check name collision if actually changing the service name to a DIFFERENT name
    if (data.serviceName) {
      const normalizedName = data.serviceName.trim();
      if (normalizedName.toLowerCase() !== currentService.serviceName.toLowerCase()) {
        const [duplicate] = await db
          .select({ id: priestServices.id })
          .from(priestServices)
          .where(
            and(
              eq(priestServices.priestId, profileId),
              ilike(priestServices.serviceName, normalizedName)
            )
          )
          .limit(1);

        if (duplicate) {
          throw new AppError(409, `Another service named "${data.serviceName}" already exists.`);
        }
      }
    }

    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (data.serviceName !== undefined) updateData.serviceName = data.serviceName.trim();
    if (data.price !== undefined) updateData.price = data.price;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.samagriList !== undefined) updateData.samagriList = data.samagriList;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updated] = await db
      .update(priestServices)
      .set(updateData)
      .where(and(eq(priestServices.id, serviceId), eq(priestServices.priestId, profileId)))
      .returning();

    return updated;
  }

  /**
   * Remove a service offering from a priest's roster
   */
  async deletePriestService(priestId: string, serviceId: string): Promise<void> {
    const profileId = await this.resolvePriestProfileId(priestId);
    const targetPriestId = profileId || priestId;

    await db
      .delete(priestServices)
      .where(and(eq(priestServices.id, serviceId), eq(priestServices.priestId, targetPriestId)));
  }

  /**
   * Toggle service active/inactive status for bookings
   */
  async togglePriestService(priestId: string, serviceId: string): Promise<any> {
    const profileId = await this.resolvePriestProfileId(priestId);
    const targetPriestId = profileId || priestId;

    const [existing] = await db
      .select({ id: priestServices.id, isActive: priestServices.isActive })
      .from(priestServices)
      .where(and(eq(priestServices.id, serviceId), eq(priestServices.priestId, targetPriestId)))
      .limit(1);

    if (!existing) {
      throw new AppError(404, `Service not found for ID: ${serviceId}`);
    }

    const [updated] = await db
      .update(priestServices)
      .set({ isActive: !existing.isActive, updatedAt: new Date() })
      .where(eq(priestServices.id, serviceId))
      .returning();

    return updated;
  }


  /**
   * Query all availability exceptions (full-day leaves, partial blackouts) for a priest
   */
  async getPriestExceptions(
    priestId: string,
    _query?: { startDate?: string; endDate?: string; date?: string }
  ): Promise<any[]> {
    const profileId = await this.resolvePriestProfileId(priestId);
    const targetPriestId = profileId || priestId;

    const rows = await db
      .select()
      .from(priestAvailabilityExceptions)
      .where(eq(priestAvailabilityExceptions.priestId, targetPriestId));

    return rows.map((r) => {
      const start = new Date(r.startAt);
      const end = new Date(r.endAt);
      const dateStr = toISTDateString(start);
      const startH = toISTTimeString(start);
      const endH = toISTTimeString(end);
      const isFullLeave = (r.reason?.includes('Full Day') || (startH === '07:00' && endH === '21:00') || (startH === '00:00' && endH === '23:59'));

      return {
        id: r.id,
        priestId: r.priestId,
        date: dateStr,
        type: isFullLeave ? 'FULL_DAY_LEAVE' : 'PARTIAL_BLACKOUT',
        startTime: startH,
        endTime: endH,
        exceptionType: r.exceptionType,
        startAt: r.startAt ? new Date(r.startAt).toISOString() : '',
        endAt: r.endAt ? new Date(r.endAt).toISOString() : '',
        reason: r.reason || '',
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      };
    });
  }

  /**
   * Update an existing availability exception
   */
  async updatePriestException(
    _priestId: string,
    exceptionId: string,
    data: UpdatePriestAvailabilityExceptionInput
  ): Promise<any> {
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (data.startAt) updateData.startAt = new Date(data.startAt);
    if (data.endAt) updateData.endAt = new Date(data.endAt);
    if (data.exceptionType) updateData.exceptionType = data.exceptionType;
    if (data.reason !== undefined) updateData.reason = data.reason;

    const [updated] = await db
      .update(priestAvailabilityExceptions)
      .set(updateData)
      .where(eq(priestAvailabilityExceptions.id, exceptionId))
      .returning();

    return updated;
  }

  /**
   * Delete an availability exception (Cancel Leave or Remove Blackout)
   */
  async deletePriestException(_priestId: string, exceptionId: string): Promise<void> {
    await db
      .delete(priestAvailabilityExceptions)
      .where(eq(priestAvailabilityExceptions.id, exceptionId));
  }

  /**
   * Retrieve default working hours window for a priest
   */
  async getWorkingHours(priestId: string): Promise<any> {
    const [profile] = await db
      .select({
        defaultStartTime: priestProfiles.defaultStartTime,
        defaultEndTime: priestProfiles.defaultEndTime,
      })
      .from(priestProfiles)
      .where(or(eq(priestProfiles.id, priestId), eq(priestProfiles.userId, priestId)))
      .limit(1);

    return {
      defaultStartTime: profile?.defaultStartTime || '07:00',
      defaultEndTime: profile?.defaultEndTime || '21:00',
    };
  }

  /**
   * Update default working hours window for a priest
   */
  async updateWorkingHours(
    priestId: string,
    data: PriestWorkingHoursInput
  ): Promise<any> {
    const updateData: Record<string, any> = { updatedAt: new Date() };
    if (data.defaultStartTime !== undefined) {
      updateData.defaultStartTime = data.defaultStartTime;
    }
    if (data.defaultEndTime !== undefined) {
      updateData.defaultEndTime = data.defaultEndTime;
    }

    const [updated] = await db
      .update(priestProfiles)
      .set(updateData)
      .where(or(eq(priestProfiles.id, priestId), eq(priestProfiles.userId, priestId)))
      .returning({
        defaultStartTime: priestProfiles.defaultStartTime,
        defaultEndTime: priestProfiles.defaultEndTime,
      });

    return updated || {
      defaultStartTime: data.defaultStartTime,
      defaultEndTime: data.defaultEndTime,
    };
  }
}

export const priestService = new PriestService();
