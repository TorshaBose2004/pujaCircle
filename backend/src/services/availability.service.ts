import { and, eq, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { priestAvailabilityExceptions, priestProfiles } from '../models/priest.model.js';
import { bookings } from '../models/booking.model.js';
import { AppError } from '../utils/AppError.js';

export interface FormattedAvailabilityException {
  id: string;
  priestId: string;
  date: string;
  type: 'FULL_DAY_LEAVE' | 'PARTIAL_BLACKOUT';
  startTime: string;
  endTime: string;
  exceptionType: string;
  startAt: string;
  endAt: string;
  reason: string;
  createdAt: string;
}

/**
 * Represents daily availability status for the calendar grid
 */
export interface DayAvailability {
  date: string; // YYYY-MM-DD
  status: 'AVAILABLE' | 'FULL_DAY_OFF' | 'PARTIAL_BLOCK';
  hasBooking: boolean;
  blockedSlots: Array<{
    startTime: string;
    endTime: string;
    reason?: string | null;
  }>;
}

/** Helper: format Date object to YYYY-MM-DD in Asia/Kolkata */
export function toISTDateString(date: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
}

/** Helper: format Date object to HH:mm in Asia/Kolkata */
export function toISTTimeString(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Helper: parse local date and time string in Asia/Kolkata into Date object */
export function parseISTDateTime(date: string, time: string): Date {
  const normalizedTime = time.length === 5 ? `${time}:00` : time;
  return new Date(`${date}T${normalizedTime}+05:30`);
}

/**
 * Service Layer: Priest Availability & Scheduling
 */
export class AvailabilityService {
  /**
   * Mark a priest's entire working day off using configured working hours.
   * Throws an error if default working hours are not configured.
   */
  async markFullDayOff(
    priestId: string,
    date: string,
    reason?: string
  ): Promise<FormattedAvailabilityException> {
    const [profile] = await db
      .select({
        id: priestProfiles.id,
        defaultStartTime: priestProfiles.defaultStartTime,
        defaultEndTime: priestProfiles.defaultEndTime,
      })
      .from(priestProfiles)
      .where(or(eq(priestProfiles.id, priestId), eq(priestProfiles.userId, priestId)))
      .limit(1);

    if (!profile) {
      throw new AppError(404, `Priest profile not found for ID: ${priestId}`);
    }

    if (!profile.defaultStartTime || !profile.defaultEndTime) {
      throw new AppError(
        400,
        'Default working hours are not configured for this priest profile. Please configure working hours first.'
      );
    }

    const startTime = profile.defaultStartTime.slice(0, 5);
    const endTime = profile.defaultEndTime.slice(0, 5);

    if (startTime >= endTime) {
      throw new AppError(400, 'Configured working hours are invalid: start time must be earlier than end time.');
    }

    // 1. Check confirmed booking overlap across working hours
    const hasBookingOverlap = await this.checkBookingOverlap(profile.id, date, startTime, endTime);
    if (hasBookingOverlap) {
      throw new AppError(400, 'Cannot mark day off: you have confirmed ceremony bookings during your working hours on this date.');
    }

    // 2. Check existing exception overlap
    const startAt = parseISTDateTime(date, startTime);
    const endAt = parseISTDateTime(date, endTime);

    const hasExceptionOverlap = await this.checkExceptionOverlap(profile.id, startAt, endAt);
    if (hasExceptionOverlap) {
      throw new AppError(409, 'An availability block or day off already exists for this date.');
    }

    const [record] = await db
      .insert(priestAvailabilityExceptions)
      .values({
        priestId: profile.id,
        exceptionType: 'BLOCK',
        startAt,
        endAt,
        reason: reason || 'Full Day Off / Leave',
      })
      .returning();

    return {
      id: record.id,
      priestId: record.priestId,
      date,
      type: 'FULL_DAY_LEAVE',
      startTime,
      endTime,
      exceptionType: record.exceptionType,
      startAt: record.startAt ? new Date(record.startAt).toISOString() : '',
      endAt: record.endAt ? new Date(record.endAt).toISOString() : '',
      reason: record.reason || '',
      createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Block specific hours on a given day for a priest.
   */
  async blockHours(
    priestId: string,
    date: string,
    startTime: string,
    endTime: string,
    reason?: string
  ): Promise<FormattedAvailabilityException> {
    const sTime = startTime.slice(0, 5);
    const eTime = endTime.slice(0, 5);

    if (sTime >= eTime) {
      throw new AppError(400, 'End time must be later than start time.');
    }

    const [profile] = await db
      .select({ id: priestProfiles.id })
      .from(priestProfiles)
      .where(or(eq(priestProfiles.id, priestId), eq(priestProfiles.userId, priestId)))
      .limit(1);

    if (!profile) {
      throw new AppError(404, `Priest profile not found for ID: ${priestId}`);
    }

    // 1. Check confirmed booking overlap
    const hasBookingOverlap = await this.checkBookingOverlap(profile.id, date, sTime, eTime);
    if (hasBookingOverlap) {
      throw new AppError(400, 'Cannot block hours: you have confirmed ceremony bookings during this time range.');
    }

    // 2. Check existing exception overlap
    const startAt = parseISTDateTime(date, sTime);
    const endAt = parseISTDateTime(date, eTime);

    const hasExceptionOverlap = await this.checkExceptionOverlap(profile.id, startAt, endAt);
    if (hasExceptionOverlap) {
      throw new AppError(409, 'An availability block already exists that overlaps with this time range.');
    }

    const [record] = await db
      .insert(priestAvailabilityExceptions)
      .values({
        priestId: profile.id,
        exceptionType: 'BLOCK',
        startAt,
        endAt,
        reason: reason || 'Blocked Hours',
      })
      .returning();

    return {
      id: record.id,
      priestId: record.priestId,
      date,
      type: 'PARTIAL_BLACKOUT',
      startTime: sTime,
      endTime: eTime,
      exceptionType: record.exceptionType,
      startAt: record.startAt ? new Date(record.startAt).toISOString() : '',
      endAt: record.endAt ? new Date(record.endAt).toISOString() : '',
      reason: record.reason || '',
      createdAt: record.createdAt ? new Date(record.createdAt).toISOString() : new Date().toISOString(),
    };
  }

  /**
   * Check if requested timestamp range overlaps with any existing availability exception.
   */
  async checkExceptionOverlap(
    priestId: string,
    startAt: Date,
    endAt: Date
  ): Promise<boolean> {
    const exceptions = await db
      .select({
        startAt: priestAvailabilityExceptions.startAt,
        endAt: priestAvailabilityExceptions.endAt,
      })
      .from(priestAvailabilityExceptions)
      .where(eq(priestAvailabilityExceptions.priestId, priestId));

    return exceptions.some((ex) => {
      const exStart = new Date(ex.startAt);
      const exEnd = new Date(ex.endAt);
      return startAt < exEnd && endAt > exStart;
    });
  }

  /**
   * Check if a requested time range overlaps with any confirmed booking.
   * Overlap condition: requestedStart < bookingEnd AND requestedEnd > bookingStart.
   */
  async checkBookingOverlap(
    priestId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const [profile] = await db
      .select({ id: priestProfiles.id })
      .from(priestProfiles)
      .where(or(eq(priestProfiles.id, priestId), eq(priestProfiles.userId, priestId)))
      .limit(1);

    const targetPriestId = profile ? profile.id : priestId;

    const confirmedBookings = await db
      .select({
        startTime: bookings.startTime,
        endTime: bookings.endTime,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.priestId, targetPriestId),
          eq(bookings.bookingDate, date),
          eq(bookings.status, 'CONFIRMED')
        )
      );

    return confirmedBookings.some(
      (b) => startTime < b.endTime && endTime > b.startTime
    );
  }

  /**
   * Calculate 3-month availability calendar (90 rolling days).
   */
  async calculateMonthAvailability(
    priestId: string,
    startDate?: string,
    endDate?: string
  ): Promise<DayAvailability[]> {
    const [profile] = await db
      .select({ id: priestProfiles.id })
      .from(priestProfiles)
      .where(or(eq(priestProfiles.id, priestId), eq(priestProfiles.userId, priestId)))
      .limit(1);

    const targetPriestId = profile ? profile.id : priestId;

    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date(start.getTime() + 90 * 24 * 60 * 60 * 1000);

    const exceptions = await db
      .select()
      .from(priestAvailabilityExceptions)
      .where(eq(priestAvailabilityExceptions.priestId, targetPriestId));

    const confirmedBookings = await db
      .select({
        bookingDate: bookings.bookingDate,
      })
      .from(bookings)
      .where(
        and(
          eq(bookings.priestId, targetPriestId),
          eq(bookings.status, 'CONFIRMED')
        )
      );

    const result: DayAvailability[] = [];
    const current = new Date(start);
    current.setUTCHours(0, 0, 0, 0);
    const endLimit = new Date(end);
    endLimit.setUTCHours(23, 59, 59, 999);

    while (current <= endLimit) {
      const dateStr = toISTDateString(current);

      const dayExceptions = exceptions.filter((e) => {
        const eDate = toISTDateString(new Date(e.startAt));
        return eDate === dateStr;
      });

      const isFullDayOff = dayExceptions.some((e) => {
        const s = new Date(e.startAt);
        const en = new Date(e.endAt);
        const sTime = toISTTimeString(s);
        const eTime = toISTTimeString(en);
        return (
          e.reason?.includes('Full Day') ||
          (sTime === '07:00' && eTime === '21:00') ||
          (sTime === '00:00' && eTime === '23:59')
        );
      });

      const status: 'AVAILABLE' | 'FULL_DAY_OFF' | 'PARTIAL_BLOCK' = isFullDayOff
        ? 'FULL_DAY_OFF'
        : dayExceptions.length > 0
        ? 'PARTIAL_BLOCK'
        : 'AVAILABLE';

      const hasBooking = confirmedBookings.some((b) => b.bookingDate === dateStr);

      const blockedSlots = dayExceptions.map((e) => {
        const s = new Date(e.startAt);
        const en = new Date(e.endAt);
        return {
          startTime: toISTTimeString(s),
          endTime: toISTTimeString(en),
          reason: e.reason,
        };
      });

      result.push({
        date: dateStr,
        status,
        hasBooking,
        blockedSlots,
      });

      current.setDate(current.getDate() + 1);
    }

    return result;
  }
}

export const availabilityService = new AvailabilityService();
