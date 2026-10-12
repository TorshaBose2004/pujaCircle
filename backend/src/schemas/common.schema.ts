import { z } from 'zod';

/**
 * [SCHEMA] Common Parameter & Query Validation Schemas
 * Strict validation of UUID IDs, PIN codes, and pagination/filter queries.
 */
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid identifier format (UUID required)'),
});

export const pincodeParamSchema = z.object({
  pincode: z.string().trim().regex(/^\d{6}$/, 'PIN code must be a 6-digit number'),
});

export const priestServiceParamSchema = z.object({
  id: z.string().uuid('Invalid Priest ID format'),
  serviceId: z.string().uuid('Invalid Service ID format'),
});


export const priestExceptionParamSchema = z.object({
  id: z.string().uuid('Invalid Priest ID format'),
  exceptionId: z.string().uuid('Invalid Exception ID format'),
});

export const exceptionIdParamSchema = z.object({
  exceptionId: z.string().uuid('Invalid Exception ID format'),
});
