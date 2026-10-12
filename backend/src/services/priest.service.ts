import { eq, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { users, priestProfiles, priestServices } from '../models/index.js';
import {
  UpdatePriestProfileInput,
  CreatePriestServiceInput,
  UpdatePriestServiceInput,
  PriestFilterParams,
  CreatePriestAvailabilityExceptionInput,
  UpdatePriestAvailabilityExceptionInput,
  PriestWorkingHoursInput,
} from '../schemas/priest.schema.js';
import { cloudinaryService } from './cloudinary.service.js';


/**
 * [SERVICE] Priest Service
 * Handles verified purohit directory, profile configuration, service pricing, and availability exceptions.
 */
export class PriestService {
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
      .innerJoin(users, eq(priestProfiles.userId, users.id));

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
      .select()
      .from(priestServices)
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
   * Create a new ritual service offering for a priest
   */
  async createPriestService(_priestId: string, _data: CreatePriestServiceInput): Promise<any> {
    // TODO: [Teammate - Priest] Insert new service offering into priest_services table
    return null;
  }

  /**
   * Update service pricing and samagri list for a priest service
   */
  async updatePriestService(
    _priestId: string,
    _serviceId: string,
    _data: UpdatePriestServiceInput
  ): Promise<any> {
    // TODO: [Teammate - Priest] Update service in priest_services table by id and priestId
    return null;
  }

  /**
   * Remove a service offering from a priest's roster
   */
  async deletePriestService(_priestId: string, _serviceId: string): Promise<void> {
    // TODO: [Teammate - Priest] Delete service from priest_services table by id and priestId
  }

  /**
   * Toggle service active/inactive status for bookings
   */
  async togglePriestService(_priestId: string, _serviceId: string): Promise<any> {
    // TODO: [Teammate - Priest] Toggle isActive flag in priest_services table
    return null;
  }


  /**
   * Query all availability exceptions (full-day leaves, partial blackouts) for a priest
   */
  async getPriestExceptions(
    _priestId: string,
    _query?: { startDate?: string; endDate?: string; date?: string }
  ): Promise<any[]> {
    // TODO: [Teammate - Priest] Query priest_availability_exceptions table by priestId and date filters
    return [];
  }

  /**
   * Create a new availability exception (Mark Full Day Off or Block Specific Hours)
   */
  async createPriestException(
    _priestId: string,
    _data: CreatePriestAvailabilityExceptionInput
  ): Promise<any> {
    // TODO: [Teammate - Priest] Insert record into priest_availability_exceptions table
    return null;
  }

  /**
   * Update an existing availability exception
   */
  async updatePriestException(
    _priestId: string,
    _exceptionId: string,
    _data: UpdatePriestAvailabilityExceptionInput
  ): Promise<any> {
    // TODO: [Teammate - Priest] Update record in priest_availability_exceptions table by exceptionId
    return null;
  }

  /**
   * Delete an availability exception (Cancel Leave or Remove Blackout)
   */
  async deletePriestException(_priestId: string, _exceptionId: string): Promise<void> {
    // TODO: [Teammate - Priest] Delete record from priest_availability_exceptions table by exceptionId
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
