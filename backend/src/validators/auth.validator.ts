import { z } from 'zod';

/**
 * [VALIDATOR] Auth Validation Schemas
 * Type-safe input checking for authentication, registration, and OTP flows.
 */

// Phone number validator: Allows +91 prefix or 10-digit format
const phoneRegex = /^(\+91[\-\s]?)?[6-9]\d{9}$/;

export const loginSchema = z
  .object({
    identifier: z.string().optional(),
    email: z.string().email('Invalid email address').optional(),
    phoneNumber: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
  })
  .refine((data) => data.identifier || data.email || data.phoneNumber, {
    message: 'Please provide either an email, phone number, or identifier.',
    path: ['identifier'],
  });

export const registerAddressSchema = z.object({
  houseNo: z.string().trim().min(1, 'House/Flat number is required').max(100),
  houseBuilding: z.string().trim().max(255).optional(),
  street: z.string().trim().max(255).optional(),
  locality: z.string().trim().max(255).optional(),
  villageTown: z.string().trim().max(255).optional(),
  city: z.string().trim().min(1, 'City is required').max(100),
  district: z.string().trim().min(1, 'District is required').max(100),
  state: z.string().trim().min(1, 'State is required').max(100),
  pincode: z.string().trim().regex(/^\d{6}$/, 'PIN code must be a 6-digit number'),
});

export const registerUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  phoneNumber: z.string().trim().regex(phoneRegex, 'Please enter a valid 10-digit Indian phone number'),
  email: z.string().trim().email('Invalid email address').max(255),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100).optional(),
  address: registerAddressSchema.optional(),
});

export const registerPriestSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100),
  phoneNumber: z.string().trim().regex(phoneRegex, 'Please enter a valid 10-digit Indian phone number'),
  email: z.string().trim().email('Invalid email address').max(255).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100).optional(),
  experienceYears: z.coerce.number().int().min(0).max(80).default(0),
  bio: z.string().trim().max(1000).default(''),
  languages: z.array(z.string().trim().max(50)).default([]),
  specializations: z.array(z.string().trim().max(100)).default([]),
  serviceAreas: z.array(z.string().trim().max(100)).default([]),
  city: z.string().trim().max(100).default(''),
  state: z.string().trim().max(100).default(''),
  pincode: z.string().trim().regex(/^\d{6}$/, 'PIN code must be a 6-digit number').optional(),
});

export const phoneOtpRequestSchema = z.object({
  phoneNumber: z.string().trim().regex(phoneRegex, 'Please enter a valid 10-digit Indian phone number'),
});

export const verifyPhoneOtpSchema = z.object({
  phoneNumber: z.string().trim().regex(phoneRegex, 'Please enter a valid 10-digit Indian phone number'),
  otp: z.string().trim().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
});

export const emailOtpRequestSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  otp: z.string().trim().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(255),
  otp: z.string().trim().regex(/^\d{6}$/, 'Verification code must be exactly 6 digits'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type RegisterPriestInput = z.infer<typeof registerPriestSchema>;
export type PhoneOtpRequestInput = z.infer<typeof phoneOtpRequestSchema>;
export type VerifyPhoneOtpInput = z.infer<typeof verifyPhoneOtpSchema>;
export type EmailOtpRequestInput = z.infer<typeof emailOtpRequestSchema>;
export type VerifyEmailOtpInput = z.infer<typeof verifyEmailOtpSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
