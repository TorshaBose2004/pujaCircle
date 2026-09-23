export type Role = 'USER' | 'PRIEST' | 'ADMIN';
export type AccountStatus = 'ACTIVE' | 'BANNED';

export interface AuthUser {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  role: Role;
  avatarUrl?: string;
  accountStatus?: AccountStatus;
  banReason?: string;
  hasAddress?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: AuthUser;
    token?: string;
  };
}

export interface RegisterUserRequest {
  fullName: string;
  phoneNumber: string;
  email: string;
  password?: string;
  address?: {
    houseNo: string;
    houseBuilding?: string;
    street?: string;
    locality?: string;
    villageTown?: string;
    city: string;
    district: string;
    state: string;
    pincode: string;
  };
}

export interface RegisterPriestRequest {
  fullName: string;
  phoneNumber: string;
  email?: string;
  password?: string;
  experienceYears?: number;
  bio?: string;
  languages?: string[];
  specializations?: string[];
  city?: string;
  state?: string;
  pincode?: string;
}

export interface PhoneOtpRequest {
  phoneNumber: string;
}

export interface VerifyPhoneOtpRequest {
  phoneNumber: string;
  otp: string;
}

export interface EmailOtpRequest {
  email: string;
}

export interface VerifyEmailOtpRequest {
  email: string;
  otp: string;
  newPassword?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}
