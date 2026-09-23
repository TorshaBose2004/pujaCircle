import { pgTable, uuid, varchar, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';

/**
 * [MODEL] Puja Catalog Table
 * Authoritative repository of sacred pujas, deities, intent tags, samagri requirements,
 * and step sequences matched by the Sankalp Advisor engine.
 */
export const pujaCatalog = pgTable('puja_catalog', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  deity: varchar('deity', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(), // 'life-event' | 'dosha-nivaran' | 'festival' | 'business' | 'ancestral'
  intentTags: jsonb('intent_tags').$type<string[]>().default([]).notNull(),
  samagriList: jsonb('samagri_list').$type<string[]>().default([]).notNull(),
  steps: jsonb('steps').$type<string[]>().default([]).notNull(),
  timingNote: text('timing_note').default('').notNull(),
  coverImage: text('cover_image'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type PujaCatalog = typeof pujaCatalog.$inferSelect;
export type NewPujaCatalog = typeof pujaCatalog.$inferInsert;
