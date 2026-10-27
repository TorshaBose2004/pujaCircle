import { eq, and, or, desc } from 'drizzle-orm';
import { db } from '../db/index.js';
import { bookings, priestProfiles, priestServices, pujaCatalog, addresses, users } from '../models/index.js';
import { CreateBookingInput, RatingInput } from '../schemas/booking.schema.js';
import { AppError } from '../utils/AppError.js';
import { availabilityService } from './availability.service.js';

function addMinutesToTime(time: string, minutes: number): string {
  const [h = '9', m = '0'] = time.split(':');
  const totalMinutes = parseInt(h, 10) * 60 + parseInt(m, 10) + minutes;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

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
  async getBookingById(id: string): Promise<any> {
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, id),
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

    if (!booking) {
      throw new AppError(404, `Booking with ID ${id} not found.`);
    }

    return {
      ...booking,
      priest: booking.priestProfile
        ? {
            ...booking.priestProfile,
            displayName: booking.priestProfile.user?.name || 'Assigned Purohit',
            fullName: booking.priestProfile.user?.name || 'Assigned Purohit',
            phoneNumber: booking.priestProfile.user?.phoneNumber,
            email: booking.priestProfile.user?.email,
          }
        : undefined,
      ritual: booking.catalog || undefined,
      slot: {
        startTime: booking.startTime,
        endTime: booking.endTime,
      },
      venueAddressSnapshot: booking.address || undefined,
      userName: booking.user?.name,
      userPhone: booking.user?.phoneNumber,
    };
  }

  /**
   * Submit a new ceremony reservation request in PENDING state
   */
  async createBooking(userId: string, data: CreateBookingInput): Promise<any> {
    // 1. Resolve priestProfileId if data.priestId is a userId (priestProfiles foreign key)
    const [profile] = await db
      .select({ id: priestProfiles.id })
      .from(priestProfiles)
      .where(or(eq(priestProfiles.id, data.priestId), eq(priestProfiles.userId, data.priestId)))
      .limit(1);

    if (!profile) {
      throw new AppError(404, 'Priest profile not found.');
    }
    const resolvedPriestId = profile.id;

    // Validate venue address
    const [addr] = await db
      .select({ id: addresses.id })
      .from(addresses)
      .where(eq(addresses.id, data.addressId))
      .limit(1);

    if (!addr) {
      throw new AppError(404, 'Ceremony venue address not found.');
    }

    // 2. Generate unique bookingReference (e.g. PC-2026-XXXX)
    let bookingReference = `PC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    let exists = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(eq(bookings.bookingReference, bookingReference))
      .limit(1);
    while (exists.length > 0) {
      bookingReference = `PC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      exists = await db
        .select({ id: bookings.id })
        .from(bookings)
        .where(eq(bookings.bookingReference, bookingReference))
        .limit(1);
    }

    // 4. Lock authoritative price snapshot: servicePrice = priestService.price, totalPrice = servicePrice
    let servicePrice = data.servicePrice || 1001;
    let totalPrice = data.totalPrice || servicePrice;
    let serviceName = data.serviceName || 'Puja Ceremony';
    let resolvedPujaCatalogId = data.pujaCatalogId;

    if (data.priestServiceId) {
      const [service] = await db
        .select()
        .from(priestServices)
        .where(and(eq(priestServices.id, data.priestServiceId), eq(priestServices.priestId, resolvedPriestId)))
        .limit(1);

      if (service) {
        servicePrice = service.price;
        totalPrice = service.price;
        serviceName = service.serviceName;
        if (!resolvedPujaCatalogId && service.pujaCatalogId) {
          resolvedPujaCatalogId = service.pujaCatalogId;
        }
      }
    }

    // 3. If endTime missing: calculate endTime = startTime + pujaCatalog.durationMinutes
    const startTime = data.startTime || '09:00';
    let endTime = data.endTime;

    if (!endTime) {
      let durationMinutes = 120;
      if (resolvedPujaCatalogId) {
        const [catalog] = await db
          .select({ durationMinutes: pujaCatalog.durationMinutes, name: pujaCatalog.name })
          .from(pujaCatalog)
          .where(eq(pujaCatalog.id, resolvedPujaCatalogId))
          .limit(1);

        if (catalog?.durationMinutes) {
          durationMinutes = catalog.durationMinutes;
        }
        if (!serviceName || serviceName === 'Puja Ceremony') {
          serviceName = catalog?.name || serviceName;
        }
      }
      endTime = addMinutesToTime(startTime, durationMinutes);
    }

    // 5. Verify no overlap via availabilityService.checkBookingOverlap, then insert with status = 'PENDING'
    const hasOverlap = await availabilityService.checkBookingOverlap(
      resolvedPriestId,
      data.bookingDate,
      startTime,
      endTime
    );
    if (hasOverlap) {
      throw new AppError(409, 'The priest already has a confirmed ceremony booking during this time slot.');
    }

    let scheduledDate = new Date(`${data.bookingDate}T${startTime.length === 5 ? startTime : '09:00'}:00`);
    if (isNaN(scheduledDate.getTime())) {
      scheduledDate = new Date();
    }

    const [newBooking] = await db
      .insert(bookings)
      .values({
        bookingReference,
        userId,
        priestId: resolvedPriestId,
        priestServiceId: data.priestServiceId || null,
        pujaCatalogId: resolvedPujaCatalogId || null,
        addressId: data.addressId,
        serviceName,
        servicePrice,
        totalPrice,
        bookingDate: data.bookingDate,
        startTime,
        endTime,
        scheduledDate,
        status: 'PENDING',
        paymentMethod: 'OFFLINE_CASH',
        paymentStatus: 'PENDING',
        specialInstructions: data.specialInstructions || null,
        notes: data.notes || null,
      })
      .returning();

    return this.getBookingById(newBooking.id);
  }

  /**
   * Priest accepts a pending ceremony booking (status -> CONFIRMED)
   */
  async acceptBooking(bookingId: string, priestId: string): Promise<any> {
    // 1. Resolve priestProfileId if priestId is a userId
    const [profile] = await db
      .select({ id: priestProfiles.id })
      .from(priestProfiles)
      .where(or(eq(priestProfiles.id, priestId), eq(priestProfiles.userId, priestId)))
      .limit(1);

    const resolvedPriestId = profile ? profile.id : priestId;

    // 2. Fetch booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      throw new AppError(404, `Booking with ID ${bookingId} not found.`);
    }

    // 3. Verify that the booking belongs to this priest
    if (booking.priestId !== resolvedPriestId) {
      throw new AppError(403, 'You are not authorized to accept this ceremony booking.');
    }

    // 4. Validate current booking status
    if (booking.status !== 'PENDING') {
      throw new AppError(400, `Cannot accept booking. Current status is ${booking.status}.`);
    }

    // 5. Check for any overlapping confirmed bookings
    const hasOverlap = await availabilityService.checkBookingOverlap(
      resolvedPriestId,
      booking.bookingDate,
      booking.startTime,
      booking.endTime
    );
    if (hasOverlap) {
      throw new AppError(409, 'Cannot accept booking: you already have a confirmed ceremony during this time slot.');
    }

    // 6. Generate 4-digit completion code for devotee verification
    const completionCode = Math.floor(1000 + Math.random() * 9000).toString();

    // 7. Update status to CONFIRMED
    await db
      .update(bookings)
      .set({
        status: 'CONFIRMED',
        completionCode,
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    return this.getBookingById(bookingId);
  }

  /**
   * Priest declines a pending ceremony booking (status -> REJECTED)
   */
  async rejectBooking(bookingId: string, priestId: string, reason?: string): Promise<any> {
    // 1. Resolve priestProfileId if priestId is a userId
    const [profile] = await db
      .select({ id: priestProfiles.id })
      .from(priestProfiles)
      .where(or(eq(priestProfiles.id, priestId), eq(priestProfiles.userId, priestId)))
      .limit(1);

    const resolvedPriestId = profile ? profile.id : priestId;

    // 2. Fetch booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      throw new AppError(404, `Booking with ID ${bookingId} not found.`);
    }

    // 3. Verify that the booking belongs to this priest
    if (booking.priestId !== resolvedPriestId) {
      throw new AppError(403, 'You are not authorized to decline this ceremony booking.');
    }

    // 4. Validate current booking status
    if (booking.status !== 'PENDING') {
      throw new AppError(400, `Cannot reject booking. Current status is ${booking.status}.`);
    }

    // 5. Update booking status to REJECTED with rejection reason
    await db
      .update(bookings)
      .set({
        status: 'REJECTED',
        rejectionReason: reason || 'Declined by priest due to schedule constraints',
        updatedAt: new Date(),
      })
      .where(eq(bookings.id, bookingId));

    return this.getBookingById(bookingId);
  }

  /**
   * Devotee or priest cancels a ceremony booking (status -> CANCELLED)
   */
  async cancelBooking(bookingId: string, userId: string, reason?: string): Promise<any> {
    // 1. Fetch user account to determine role
    const [user] = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new AppError(404, 'User account not found.');
    }

    // 2. Fetch booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      throw new AppError(404, `Booking with ID ${bookingId} not found.`);
    }

    // 3. Status checks
    if (booking.status === 'COMPLETED') {
      throw new AppError(400, 'Cannot cancel a completed ceremony.');
    }
    if (booking.status === 'CANCELLED') {
      throw new AppError(400, 'This ceremony booking has already been cancelled.');
    }
    if (booking.status === 'REJECTED') {
      throw new AppError(400, 'Cannot cancel a declined ceremony booking.');
    }

    // 4. Resolve priest profile to check if user is the assigned priest
    const [priestProfile] = await db
      .select({ id: priestProfiles.id })
      .from(priestProfiles)
      .where(or(eq(priestProfiles.id, userId), eq(priestProfiles.userId, userId)))
      .limit(1);

    const isDevotee = booking.userId === userId;
    const isPriest = priestProfile && booking.priestId === priestProfile.id;
    const isAdmin = user.role === 'ADMIN';

    if (!isDevotee && !isPriest && !isAdmin) {
      throw new AppError(403, 'You are not authorized to cancel this ceremony booking.');
    }

    const cancelledBy: 'USER' | 'PRIEST' | 'ADMIN' = isAdmin
      ? 'ADMIN'
      : isPriest
      ? 'PRIEST'
      : 'USER';

    // 5. Update booking to CANCELLED state and record metadata
    const now = new Date();
    await db
      .update(bookings)
      .set({
        status: 'CANCELLED',
        cancellationReason: reason || (isPriest ? 'Cancelled by priest' : 'Cancelled by devotee'),
        cancelledBy,
        cancelledAt: now,
        updatedAt: now,
      })
      .where(eq(bookings.id, bookingId));

    return this.getBookingById(bookingId);
  }

  /**
   * Priest marks ceremony completed after verifying 4-digit devotee completionCode (status -> COMPLETED)
   */
  async completeBooking(
    bookingId: string,
    priestId: string,
    completionCode?: string
  ): Promise<any> {
    // 1. Resolve priestProfileId if priestId is a userId
    const [profile] = await db
      .select({ id: priestProfiles.id })
      .from(priestProfiles)
      .where(or(eq(priestProfiles.id, priestId), eq(priestProfiles.userId, priestId)))
      .limit(1);

    const resolvedPriestId = profile ? profile.id : priestId;

    // 2. Fetch booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId))
      .limit(1);

    if (!booking) {
      throw new AppError(404, `Booking with ID ${bookingId} not found.`);
    }

    // 3. Verify that the booking belongs to this priest
    if (booking.priestId !== resolvedPriestId) {
      throw new AppError(403, 'You are not authorized to complete this ceremony booking.');
    }

    // 4. Validate current booking status
    if (booking.status === 'COMPLETED') {
      throw new AppError(400, 'This ceremony is already marked as completed.');
    }
    if (booking.status !== 'CONFIRMED') {
      throw new AppError(
        400,
        `Cannot complete booking. Current status is ${booking.status}. Only confirmed ceremonies can be completed.`
      );
    }

    // 5. Verify 4-digit devotee completion verification code
    if (!completionCode || !completionCode.trim()) {
      throw new AppError(400, '4-digit devotee completion verification code is required.');
    }

    if (booking.completionCode && booking.completionCode.trim() !== completionCode.trim()) {
      throw new AppError(400, 'Invalid completion code. Please verify the 4-digit code provided by the devotee.');
    }

    // 6. Update booking status to COMPLETED and payment status to PAID_OFFLINE
    const now = new Date();
    await db
      .update(bookings)
      .set({
        status: 'COMPLETED',
        paymentStatus: 'PAID_OFFLINE',
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(bookings.id, bookingId));

    return this.getBookingById(bookingId);
  }

  /**
   * Devotee submits star rating and sacred review feedback for a completed ceremony
   */
  async submitRating(userId: string, data: RatingInput): Promise<any> {
    if (!data.bookingId) {
      throw new AppError(400, 'Booking ID is required to submit a rating.');
    }

    // 1. Fetch booking
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, data.bookingId))
      .limit(1);

    if (!booking) {
      throw new AppError(404, `Booking with ID ${data.bookingId} not found.`);
    }

    // 2. Authorization: verify that active user is the devotee who booked
    if (booking.userId !== userId) {
      throw new AppError(403, 'You are not authorized to submit a review for this ceremony booking.');
    }

    // 3. Status validation: must be COMPLETED
    if (booking.status !== 'COMPLETED') {
      throw new AppError(400, 'Ratings and reviews can only be submitted for completed ceremonies.');
    }

    // 4. Record review rating on booking
    const now = new Date();
    await db
      .update(bookings)
      .set({
        rating: data.rating,
        review: data.review ? data.review.trim() : null,
        updatedAt: now,
      })
      .where(eq(bookings.id, data.bookingId));

    // 5. Recompute priest average rating & reviewCount
    const priestCompletedBookings = await db
      .select({ rating: bookings.rating })
      .from(bookings)
      .where(
        and(
          eq(bookings.priestId, booking.priestId),
          eq(bookings.status, 'COMPLETED')
        )
      );

    const validRatings = priestCompletedBookings
      .map((b) => b.rating)
      .filter((r): r is number => typeof r === 'number' && r > 0);

    const reviewCount = validRatings.length;
    const avgRating = reviewCount > 0
      ? (validRatings.reduce((sum, r) => sum + r, 0) / reviewCount).toFixed(2)
      : '0.00';

    await db
      .update(priestProfiles)
      .set({
        rating: avgRating,
        reviewCount,
        updatedAt: now,
      })
      .where(eq(priestProfiles.id, booking.priestId));

    return this.getBookingById(data.bookingId);
  }
}

export const bookingService = new BookingService();
