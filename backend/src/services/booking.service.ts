import { eq, and, or, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { bookings, priestProfiles } from '../models/index.js';
import { CreateBookingInput, RatingInput } from '../schemas/booking.schema.js';

export interface BookingFilterOptions {
  userId?: string;
  priestId?: string;
}

/**
 * [SERVICE] Booking Service
 * Handles ceremony reservation lifecycle (request, confirm, decline, cancel, complete) and ratings.
 */
export class BookingService {
  /**
   * Query bookings with optional devotee and priest filters
   */
  async getBookings(filters: BookingFilterOptions): Promise<any[]> {
    let resolvedPriestId = filters.priestId;
    if (filters.priestId) {
      const [profile] = await db
        .select({ id: priestProfiles.id })
        .from(priestProfiles)
        .where(or(eq(priestProfiles.id, filters.priestId), eq(priestProfiles.userId, filters.priestId)))
        .limit(1);
      if (profile) {
        resolvedPriestId = profile.id;
      }
    }

    const conditions = [];
    if (filters.userId) {
      conditions.push(eq(bookings.userId, filters.userId));
    }
    if (resolvedPriestId) {
      conditions.push(eq(bookings.priestId, resolvedPriestId));
    }

    const whereClause =
      conditions.length === 0
        ? undefined
        : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

    const rawBookings = await db.query.bookings.findMany({
      where: whereClause,
      orderBy: [desc(bookings.createdAt)],
      with: {
        user: true,
        priestProfile: {
          with: {
            user: true,
          },
        },
        priestService: true,
        catalog: true,
        address: true,
      },
    });

    return rawBookings.map((b) => ({
      ...b,
      priest: b.priestProfile
        ? {
            ...b.priestProfile,
            displayName: b.priestProfile.user?.name || 'Assigned Purohit',
            fullName: b.priestProfile.user?.name || 'Assigned Purohit',
            phoneNumber: b.priestProfile.user?.phoneNumber,
            email: b.priestProfile.user?.email,
          }
        : undefined,
      ritual: b.catalog || undefined,
      slot: {
        startTime: b.startTime,
        endTime: b.endTime,
      },
      venueAddressSnapshot: b.address || undefined,
      userName: b.user?.name,
      userPhone: b.user?.phoneNumber,
    }));
  }

  /**
   * Retrieve a single booking details by ID
   */
  async getBookingById(_id: string): Promise<any> {
    // TODO: [Teammate - Booking] Query single booking by id with full joined relations
    return null;
  }

  /**
   * Submit a new ceremony reservation request in PENDING state
   */
  async createBooking(_userId: string, _data: CreateBookingInput): Promise<any> {
    // TODO: [Teammate - Booking] 1. Resolve priestProfileId if data.priestId is a userId (priestProfiles foreign key)
    // TODO: [Teammate - Booking] 2. Generate unique bookingReference (e.g. PC-2026-XXXX)
    // TODO: [Teammate - Booking] 3. If endTime missing: calculate endTime = startTime + pujaCatalog.durationMinutes
    // TODO: [Teammate - Booking] 4. Lock authoritative price snapshot: servicePrice = priestService.price, totalPrice = servicePrice
    // TODO: [Teammate - Booking] 5. Verify no overlap via availabilityService.checkBookingOverlap, then insert with status = 'PENDING'
    return null;
  }

  /**
   * Priest accepts a pending ceremony booking (status -> CONFIRMED)
   */
  async acceptBooking(_bookingId: string, _priestId: string): Promise<any> {
    // TODO: [Teammate - Booking] Set booking status = 'CONFIRMED' and generate 4-digit completionCode for devotee
    return null;
  }

  /**
   * Priest declines a pending ceremony booking (status -> REJECTED)
   */
  async rejectBooking(_bookingId: string, _priestId: string, _reason?: string): Promise<any> {
    // TODO: [Teammate - Booking] Set booking status = 'REJECTED' with reason and release slot to AVAILABLE
    return null;
  }

  /**
   * Devotee or priest cancels a ceremony booking (status -> CANCELLED)
   */
  async cancelBooking(_bookingId: string, _userId: string, _reason?: string): Promise<any> {
    // TODO: [Teammate - Booking] Set booking status = 'CANCELLED' with cancellationReason and release slot
    return null;
  }

  /**
   * Priest marks ceremony completed after verifying 4-digit devotee completionCode (status -> COMPLETED)
   */
  async completeBooking(
    _bookingId: string,
    _priestId: string,
    _completionCode?: string
  ): Promise<any> {
    // TODO: [Teammate - Booking] Verify completionCode against booking record, set status = 'COMPLETED', completedAt = now
    return null;
  }

  /**
   * Devotee submits star rating and sacred review feedback for a completed ceremony
   */
  async submitRating(_userId: string, _data: RatingInput): Promise<any> {
    // TODO: [Teammate - Booking] Record review rating on booking, recompute priest average rating & reviewCount
    return null;
  }
}

export const bookingService = new BookingService();
