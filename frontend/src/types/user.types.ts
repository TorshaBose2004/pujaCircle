import { Role, AccountStatus } from './auth.types';


export interface UserProfile {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  role: Role;
  status?: AccountStatus;
  accountStatus?: AccountStatus;
  banReason?: string;
  primaryCity?: string;
  addressSummary?: string;
  bookingCount?: number;
  createdAt?: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  email?: string;
  phoneNumber?: string;
  accountStatus?: AccountStatus;
  status?: AccountStatus;
  banReason?: string;
}
