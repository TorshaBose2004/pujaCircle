import { z } from 'zod';

// Reusable primitives for strict validation
const indianPhoneRegex = /^(\+91)?[6-9]\d{9}$/;
const numericOtpRegex = /^\d{6}$/;

// ==========================================
// 1. LOGIN SCHEMAS
// ==========================================

export const userLoginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .min(1, 'Please enter your email address')
      .email('Please enter a valid email address')
      .max(150, 'Email is too long'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
  })
  .strict();

export const priestLoginSchema = userLoginSchema;

export const adminLoginSchema = z
  .object({
    email: z.string().trim().email('Please enter a valid administrator email address').max(150, 'Email is too long'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
  })
  .strict();

// ==========================================
// 2. OTP & RECOVERY SCHEMAS
// ==========================================

export const sendPhoneOtpSchema = z
  .object({
    phoneNumber: z
      .string()
      .trim()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number cannot exceed 15 characters')
      .regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian mobile number'),
  })
  .strict();

export const sendEmailOtpSchema = z
  .object({
    email: z.string().trim().email('Please enter a valid email address').max(150, 'Email is too long'),
  })
  .strict();

export const sendOtpSchema = sendPhoneOtpSchema;

export const verifyOtpSchema = z
  .object({
    otp: z.string().trim().length(6, 'OTP must be exactly 6 digits').regex(numericOtpRegex, 'OTP must contain numbers only'),
  })
  .strict();

export const verifyPhoneOtpSchema = z
  .object({
    phoneNumber: z
      .string()
      .trim()
      .min(10, 'Phone number must be at least 10 digits')
      .max(15, 'Phone number cannot exceed 15 characters')
      .regex(indianPhoneRegex, 'Please enter a valid 10-digit Indian mobile number'),
    otp: z.string().trim().length(6, 'OTP must be exactly 6 digits').regex(numericOtpRegex, 'OTP must contain numbers only'),
  })
  .strict();

export const verifyEmailOtpSchema = z
  .object({
    email: z.string().trim().email('Please enter a valid email address').max(150, 'Email is too long'),
    otp: z.string().trim().length(6, 'OTP must be exactly 6 digits').regex(numericOtpRegex, 'OTP must contain numbers only'),
  })
  .strict();

export const forgotPasswordSchema = z
  .object({
    email: z.string().trim().email('Please enter a valid registered email address').max(150, 'Email is too long'),
  })
  .strict();

export const resetPasswordSchema = z
  .object({
    otp: z.string().trim().length(6, 'OTP must be exactly 6 digits').regex(numericOtpRegex, 'OTP must contain numbers only'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ==========================================
// 3. REGISTRATION SCHEMAS
// ==========================================

export const registerUserPersonalSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
    phoneNumber: z
      .string()
      .trim()
      .min(10, 'Enter a valid Indian phone number')
      .max(15, 'Phone number cannot exceed 15 characters')
      .regex(indianPhoneRegex, 'Invalid mobile number format'),
    email: z.string().trim().email('Invalid email address').max(150, 'Email is too long'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
  })
  .strict();

export const registerPriestPersonalSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Name & title must be at least 2 characters').max(100, 'Name is too long'),
    phoneNumber: z
      .string()
      .trim()
      .min(10, 'Enter a valid Indian phone number')
      .max(15, 'Phone number cannot exceed 15 characters')
      .regex(indianPhoneRegex, 'Invalid mobile number format'),
    email: z.string().trim().email('Invalid email address').max(150, 'Email is too long'),
    password: z.string().min(6, 'Password must be at least 6 characters').max(100, 'Password is too long'),
  })
  .strict();

// Inferred Types
export type UserLoginInput = z.infer<typeof userLoginSchema>;
export type PriestLoginInput = z.infer<typeof priestLoginSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type SendOtpInput = z.infer<typeof sendOtpSchema>;
export type SendPhoneOtpInput = z.infer<typeof sendPhoneOtpSchema>;
export type SendEmailOtpInput = z.infer<typeof sendEmailOtpSchema>;
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;
export type VerifyPhoneOtpInput = z.infer<typeof verifyPhoneOtpSchema>;
export type VerifyEmailOtpInput = z.infer<typeof verifyEmailOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type RegisterUserPersonalInput = z.infer<typeof registerUserPersonalSchema>;
export type RegisterPriestPersonalInput = z.infer<typeof registerPriestPersonalSchema>;
