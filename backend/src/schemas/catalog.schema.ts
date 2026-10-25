import { z } from 'zod';

/**
 * [SCHEMA] Catalog Schemas
 * Strict validation bounds for sacred ceremonies in the Puja catalog.
 */
export const createCatalogEntrySchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(255),
  deity: z.string().trim().min(2, 'Deity must be at least 2 characters').max(255),
  category: z.string().trim().min(2, 'Category is required').max(100),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(3000),
  intentTags: z.array(z.string().trim().min(1)).min(1, 'At least one intent tag is required'),
  samagriList: z.array(z.string().trim().min(1)).min(1, 'At least one samagri item is required'),
  steps: z.array(z.string().trim().min(1)).min(1, 'At least one vidhi step is required'),
  timingNote: z.string().trim().min(2, 'Auspicious timing note is required').max(500),
  durationMinutes: z.coerce.number().int().positive('Duration must be a positive number of minutes'),
  coverImage: z.string().trim().min(1, 'Ceremony cover picture is strictly required'),
  isActive: z.boolean().default(true),
});

export const updateCatalogEntrySchema = createCatalogEntrySchema.partial();

export type CreateCatalogEntryInput = z.infer<typeof createCatalogEntrySchema>;
export type UpdateCatalogEntryInput = z.infer<typeof updateCatalogEntrySchema>;
