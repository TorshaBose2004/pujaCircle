import { Address } from './address.types';
import { Priest, Ritual, PriestService } from './priest.types';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'COMPLETED';

export type PaymentMethod = 'OFFLINE_CASH' | 'CASH';
export type PaymentStatus = 'PENDING' | 'PAID_OFFLINE';

export interface Booking {
  id: string;
  bookingReference: string; // e.g. PC-2026-0812
  userId: string;
  priestId: string;
  priestServiceId?: string;
  pujaCatalogId?: string;
  ritualId?: string;
  addressId: string;
  venueAddressSnapshot?: Address;
  slotId: string;
  availabilitySlotId?: string;
  serviceName: string;
  servicePrice: number; // Authoritative price snapshot locked at request submission
  dakshinaAmount?: number; // Backwards-compatibility alias for servicePrice
  samagriList?: string[];
  bookingDate: string; // YYYY-MM-DD
  startTime: string;
  endTime: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  specialInstructions?: string;
  userNotes?: string;
  responseDeadline?: string; // 5 hours after creation
  rejectionReason?: string;
  cancellationReason?: string;
  cancelledBy?: 'USER' | 'PRIEST' | 'ADMIN';
  cancelledAt?: string;
  completedAt?: string;
  ratingSubmitted?: boolean;
  completionCode?: string; // 4-digit verification code provided to devotee upon confirmation
  createdAt: string;
  updatedAt?: string;

  // Joined/Populated Details for views
  priest?: Priest;
  ritual?: Ritual;
  priestService?: PriestService;
  address?: Address;
  slot?: { id?: string; startTime: string; endTime: string };
  user?: { id: string; name: string; phoneNumber: string; email?: string };
  userName?: string;
  userPhone?: string;
  rating?: number;
  review?: string;
}

export interface CreateBookingRequest {
  priestId: string;
  priestServiceId?: string;
  pujaCatalogId?: string;
  ritualId?: string;
  addressId: string;
  slotId: string;
  availabilitySlotId?: string;
  bookingDate: string;
  startTime?: string;
  endTime?: string;
  specialInstructions?: string;
  userNotes?: string;
}

export interface CancelBookingRequest {
  bookingId: string;
  reason: string;
}

export interface RejectBookingRequest {
  bookingId: string;
  reason: string;
}

export interface Rating {
  id: string;
  bookingId: string;
  userId: string;
  priestId: string;
  rating: number; // 1 to 5
  review?: string;
  createdAt: string;
}

export interface SubmitRatingRequest {
  bookingId: string;
  rating: number;
  review?: string;
}
