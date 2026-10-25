import { AccountStatus } from './auth.types';

export type PriestApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PriestService {
  id: string;
  priestId: string;
  serviceName: string;
  pujaCatalogId?: string;
  isCustom?: boolean;
  category?: string;
  samagriList?: string[];
  price: number; // Single authoritative service price in INR (₹)
  durationMinutes?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Priest {
  id: string;
  userId?: string;
  fullName: string;
  displayName: string;
  phoneNumber: string;
  email?: string;
  isPhoneVerified: boolean;
  isEmailVerified?: boolean;
  approvalStatus: PriestApprovalStatus;
  accountStatus: AccountStatus;
  banReason?: string;
  rejectionReason?: string;
  experienceYears: number;
  bio: string;
  languages: string[];
  specializations: string[];
  serviceAreas: string[];
  city: string;
  state: string;
  profileImageUrl: string;
  rating?: number;
  reviewCount?: number;
  defaultStartTime?: string;
  defaultEndTime?: string;
  services?: PriestService[];
  createdAt: string;
  updatedAt?: string;
}

export interface Ritual {
  id: string;
  name: string;
  slug: string;
  description: string;
  approximateDurationMinutes: number;
  category: string;
  requirements: string[];
  imageUrl?: string;
  suggestedDakshina?: number;
}



/**
 * Legacy interfaces kept for backward-compatibility
 */
export interface WeeklyAvailabilityRule {
  id: string;
  priestId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  bufferMinutes: number;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export type PriestExceptionType = 'BLOCK' | 'CUSTOM_HOURS';

export interface PriestAvailabilityException {
  id: string;
  priestId: string;
  exceptionType: PriestExceptionType;
  startAt: string;
  endAt: string;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityException {
  id: string;
  priestId: string;
  date: string;
  type: 'BLOCKED' | 'CUSTOM';
  reason?: string;
  customSlots?: Array<{
    startTime: string;
    endTime: string;
  }>;
  createdAt: string;
}

export interface PriestRegistrationRequest {
  fullName: string;
  phoneNumber: string;
  email?: string;
  experienceYears: number;
  bio: string;
  languages: string[];
  specializations: string[];
  serviceAreas: string[];
  city: string;
  state: string;
}

export interface PriestFilterParams {
  city?: string;
  catalogId?: string;
  serviceName?: string;
  ritualSlug?: string;
  language?: string;
  specialization?: string;
  searchQuery?: string;
  date?: string;
  status?: PriestApprovalStatus | 'ALL';
  accountStatus?: AccountStatus | 'ALL';
  minPrice?: number;
  maxPrice?: number;
  minExperience?: number;
  minRating?: number;
}
