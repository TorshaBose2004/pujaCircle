import { pgTable, uuid, varchar, text, integer, numeric, timestamp, pgEnum, jsonb, boolean, time } from 'drizzle-orm/pg-core';
import { users } from './user.model.js';

export const approvalStatusEnum = pgEnum('priest_approval_status', ['PENDING', 'APPROVED', 'REJECTED']);
export const exceptionTypeEnum = pgEnum('exception_type', ['BLOCK', 'CUSTOM_HOURS']);

/**
 * [MODEL] Priest Profiles Table
 * Detailed credentials, verification status, and metadata for registered Purohits.
 */
export const priestProfiles = pgTable('priest_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  approvalStatus: approvalStatusEnum('approval_status').default('PENDING').notNull(),
  rejectionReason: text('rejection_reason'),
  experienceYears: integer('experience_years').default(0).notNull(),
  bio: text('bio').default('').notNull(),
  languages: jsonb('languages').$type<string[]>().default([]).notNull(),
  specializations: jsonb('specializations').$type<string[]>().default([]).notNull(),
  serviceAreas: jsonb('service_areas').$type<string[]>().default([]).notNull(),
  city: varchar('city', { length: 100 }).default('').notNull(),
  state: varchar('state', { length: 100 }).default('').notNull(),
  pincode: varchar('pincode', { length: 10 }),
  profileImageUrl: text('profile_image_url').default('').notNull(),
  rating: numeric('rating', { precision: 3, scale: 2 }).default('0.00').notNull(),
  reviewCount: integer('review_count').default(0).notNull(),
  defaultStartTime: time('default_start_time'),
  defaultEndTime: time('default_end_time'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * [MODEL] Priest Services Table
 * Individual pujas and ritual offerings with pricing configured by each priest.
 */
export const priestServices = pgTable('priest_services', {
  id: uuid('id').defaultRandom().primaryKey(),
  priestId: uuid('priest_id').notNull().references(() => priestProfiles.id, { onDelete: 'cascade' }),
  serviceName: varchar('service_name', { length: 255 }).notNull(),
  pujaCatalogId: uuid('puja_catalog_id'),
  isCustom: boolean('is_custom').default(false).notNull(),
  category: varchar('category', { length: 100 }).default('General').notNull(),
  samagriList: jsonb('samagri_list').$type<string[]>().default([]).notNull(),
  price: integer('price').notNull(), // INR amount in rupees (₹)
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * [MODEL] Priest Availability Exceptions Table
 * Blocked intervals and custom hours overrides for priests.
 */
export const priestAvailabilityExceptions = pgTable('priest_availability_exceptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  priestId: uuid('priest_id').notNull().references(() => priestProfiles.id, { onDelete: 'cascade' }),
  exceptionType: exceptionTypeEnum('exception_type').default('BLOCK').notNull(),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  reason: varchar('reason', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export type PriestProfile = typeof priestProfiles.$inferSelect;
export type NewPriestProfile = typeof priestProfiles.$inferInsert;
export type PriestService = typeof priestServices.$inferSelect;
export type NewPriestService = typeof priestServices.$inferInsert;
export type PriestAvailabilityException = typeof priestAvailabilityExceptions.$inferSelect;
export type NewPriestAvailabilityException = typeof priestAvailabilityExceptions.$inferInsert;
