import { and, eq, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { priestAvailabilityExceptions, priestProfiles, PriestAvailabilityException } from '../models/priest.model.js';
import { bookings } from '../models/booking.model.js';

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

/**
 * Service Layer: Priest Availability & Scheduling
 * Implements empty signatures per architectural specification.
 */
export class AvailabilityService {
  /**
   * Mark a priest's entire day off (07:00 – 21:00 default working window).
   *
   * @param priestId - Target priest ID
   * @param date - Date formatted as YYYY-MM-DD
   * @param reason - Optional reason (e.g., 'Full Day Leave', 'Festival')
   * @returns Newly created availability exception record
   */
  async markFullDayOff(
    priestId: string,
    date: string,
    reason?: string
  ): Promise<PriestAvailabilityException> {
    const [profile] = await db
      .select({ id: priestProfiles.id })
      .from(priestProfiles)
      .where(or(eq(priestProfiles.id, priestId), eq(priestProfiles.userId, priestId)))
      .limit(1);

    if (!profile) {
      throw new Error(`Priest profile not found for ID: ${priestId}`);
    }

    const [record] = await db
      .insert(priestAvailabilityExceptions)
      .values({
        priestId: profile.id,
        exceptionType: 'BLOCK',
        startAt: new Date(`${date}T07:00:00Z`),
        endAt: new Date(`${date}T21:00:00Z`),
        reason: reason || 'Full Day Leave',
      })
      .returning();

    return record;
  }

  /**
   * Block specific hours on a given day for a priest.
   *
   * @param priestId - Target priest ID
   * @param date - Date formatted as YYYY-MM-DD
   * @param startTime - Start time in 24hr format HH:mm (e.g. '13:00')
   * @param endTime - End time in 24hr format HH:mm (e.g. '16:00')
   * @param reason - Optional reason for blackout
   * @returns Newly created availability exception record
   */
  async blockHours(
    priestId: string,
    date: string,
    startTime: string,
    endTime: string,
    reason?: string
  ): Promise<PriestAvailabilityException> {
    const [profile] = await db
      .select({ id: priestProfiles.id })
      .from(priestProfiles)
      .where(or(eq(priestProfiles.id, priestId), eq(priestProfiles.userId, priestId)))
      .limit(1);

    if (!profile) {
      throw new Error(`Priest profile not found for ID: ${priestId}`);
    }

    const [record] = await db
      .insert(priestAvailabilityExceptions)
      .values({
        priestId: profile.id,
        exceptionType: 'BLOCK',
        startAt: new Date(`${date}T${startTime}:00Z`),
        endAt: new Date(`${date}T${endTime}:00Z`),
        reason: reason || 'Blocked Hours',
      })
      .returning();

    return record;
  }

  /**
   * Check if a requested time range overlaps with any confirmed booking.
   * Overlap condition: requestedStart < bookingEnd AND requestedEnd > bookingStart.
   *
   * @param priestId - Target priest ID
   * @param date - Date formatted as YYYY-MM-DD
   * @param startTime - Start time in 24hr format HH:mm
   * @param endTime - End time in 24hr format HH:mm
   * @returns true if an overlap is detected, false otherwise
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
   * Easiest possible calculation: loops through days from startDate to endDate,
   * inspects exceptions and confirmed bookings, and tags each day with status:
   * - FULL_DAY_OFF (Red): Entire 07:00–21:00 is blocked
   * - PARTIAL_BLOCK (Orange): Specific hours are blocked
   * - AVAILABLE (Green): Open for ceremonies
   * - hasBooking (Blue): Devotee ceremony exists
   *
   * @param priestId - Target priest ID
   * @param startDate - Optional window start (default: today)
   * @param endDate - Optional window end (default: today + 90 days)
   * @returns List of daily availability summaries for the 3-month calendar
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
      const dateStr = current.toISOString().split('T')[0];

      const dayExceptions = exceptions.filter((e) => {
        const eDate = new Date(e.startAt).toISOString().split('T')[0];
        return eDate === dateStr;
      });

      const isFullDayOff = dayExceptions.some((e) => {
        const s = new Date(e.startAt);
        const en = new Date(e.endAt);
        const sTime = String(s.getUTCHours()).padStart(2, '0') + ':' + String(s.getUTCMinutes()).padStart(2, '0');
        const eTime = String(en.getUTCHours()).padStart(2, '0') + ':' + String(en.getUTCMinutes()).padStart(2, '0');
        return (sTime === '07:00' && eTime === '21:00') || (sTime === '00:00' && eTime === '23:59') || e.reason?.includes('Full Day');
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
          startTime: String(s.getUTCHours()).padStart(2, '0') + ':' + String(s.getUTCMinutes()).padStart(2, '0'),
          endTime: String(en.getUTCHours()).padStart(2, '0') + ':' + String(en.getUTCMinutes()).padStart(2, '0'),
          reason: e.reason,
        };
      });

      result.push({
        date: dateStr,
        status,
        hasBooking,
        blockedSlots,
      });

      current.setUTCDate(current.getUTCDate() + 1);
    }

    return result;
  }
}

export const availabilityService = new AvailabilityService();
