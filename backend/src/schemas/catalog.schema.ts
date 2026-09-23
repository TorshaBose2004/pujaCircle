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
  intentTags: z.array(z.string().trim().max(100)).default([]),
  samagriList: z.array(z.string().trim().max(255)).default([]),
  steps: z.array(z.string().trim().max(500)).default([]),
  timingNote: z.string().trim().max(500).default(''),
  coverImage: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const updateCatalogEntrySchema = createCatalogEntrySchema.partial();

export type CreateCatalogEntryInput = z.infer<typeof createCatalogEntrySchema>;
export type UpdateCatalogEntryInput = z.infer<typeof updateCatalogEntrySchema>;
