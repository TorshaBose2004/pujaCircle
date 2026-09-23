import {
  LoginCredentials,
  AuthResponse,
  AuthUser,
  PhoneOtpRequest,
  VerifyPhoneOtpRequest,
  EmailOtpRequest,
  VerifyEmailOtpRequest,
  RegisterUserRequest,
  RegisterPriestRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/types/auth.types';
import { apiClient } from './client';
import { logAppError, getUserFriendlyErrorMessage } from '@/lib/errorHandler';

/**
 * Authentication API (Frontend Layer)
 * Connected directly to live backend (/api/v1/auth)
 */
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const res = await apiClient.post('/auth/login', credentials);
      return res as any;
    } catch (error) {
      logAppError('authApi.login', error, { email: credentials.email });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Sign in failed. Please verify your credentials and try again.'),
      };
    }
  },

  registerUser: async (data: RegisterUserRequest): Promise<AuthResponse> => {
    try {
      const res = await apiClient.post('/auth/register/user', data);
      return res as any;
    } catch (error) {
      logAppError('authApi.registerUser', error, { phone: data.phoneNumber });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Devotee registration failed. Please try again.'),
      };
    }
  },

  registerPriest: async (data: RegisterPriestRequest): Promise<AuthResponse> => {
    try {
      const res = await apiClient.post('/auth/register/priest', data);
      return res as any;
    } catch (error) {
      logAppError('authApi.registerPriest', error, { phone: data.phoneNumber });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Priest application submission failed. Please try again.'),
      };
    }
  },

  getMe: async (): Promise<{ success: boolean; data?: { user: AuthUser }; message?: string }> => {
    try {
      const res = await apiClient.get('/auth/me');
      return res as any;
    } catch (error) {
      logAppError('authApi.getMe', error);
      return { success: false, message: 'Session expired.' };
    }
  },

  logout: async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post('/auth/logout');
      return res as any;
    } catch (error) {
      logAppError('authApi.logout', error);
      return { success: true, message: 'Logged out successfully.' };
    }
  },

  sendPhoneOtp: async (data: PhoneOtpRequest): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post('/auth/otp/send-phone', data);
      return res as any;
    } catch (error) {
      logAppError('authApi.sendPhoneOtp', error, { phoneNumber: data.phoneNumber });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to dispatch verification code. Please try again.'),
      };
    }
  },

  verifyPhoneOtp: async (data: VerifyPhoneOtpRequest): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post('/auth/otp/verify-phone', data);
      return res as any;
    } catch (error) {
      logAppError('authApi.verifyPhoneOtp', error, { phoneNumber: data.phoneNumber });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Verification failed. Please check the code and try again.'),
      };
    }
  },

  sendEmailOtp: async (data: EmailOtpRequest): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post('/auth/otp/send-email', data);
      return res as any;
    } catch (error) {
      logAppError('authApi.sendEmailOtp', error, { email: data.email });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to send verification code. Please try again.'),
      };
    }
  },

  verifyEmailOtp: async (data: VerifyEmailOtpRequest): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post('/auth/otp/verify-email', data);
      return res as any;
    } catch (error) {
      logAppError('authApi.verifyEmailOtp', error, { email: data.email });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Verification failed. Please check the code and try again.'),
      };
    }
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post('/auth/forgot-password', data);
      return res as any;
    } catch (error) {
      logAppError('authApi.forgotPassword', error, { email: data.email });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to send recovery code. Please verify your email and try again.'),
      };
    }
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await apiClient.post('/auth/reset-password', data);
      return res as any;
    } catch (error) {
      logAppError('authApi.resetPassword', error, { email: data.email });
      return {
        success: false,
        message: getUserFriendlyErrorMessage(error, 'Failed to update password. Please check the code and try again.'),
      };
    }
  },
};

