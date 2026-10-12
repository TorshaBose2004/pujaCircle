import { PriestAvailabilityException } from '../models/priest.model.js';

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
    // TODO: Implement logic
    throw new Error('Not implemented');
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
    // TODO: Implement logic
    throw new Error('Not implemented');
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
    // TODO: Implement logic
    throw new Error('Not implemented');
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
    // TODO: Implement logic
    throw new Error('Not implemented');
  }
}

export const availabilityService = new AvailabilityService();
