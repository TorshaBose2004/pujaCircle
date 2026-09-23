import { pgTable, uuid, varchar, text, integer, numeric, timestamp, pgEnum, jsonb, boolean } from 'drizzle-orm/pg-core';
import { users } from './user.model.js';

export const approvalStatusEnum = pgEnum('priest_approval_status', ['PENDING', 'APPROVED', 'REJECTED']);
export const slotStatusEnum = pgEnum('slot_status', ['AVAILABLE', 'BOOKED', 'BLOCKED']);

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
 * [MODEL] Priest Slots Table
 * Date-based availability slots configured by priests for ceremony bookings.
 */
export const priestSlots = pgTable('priest_slots', {
  id: uuid('id').defaultRandom().primaryKey(),
  priestId: uuid('priest_id').notNull().references(() => priestProfiles.id, { onDelete: 'cascade' }),
  slotDate: varchar('slot_date', { length: 10 }).notNull(), // YYYY-MM-DD
  startTime: varchar('start_time', { length: 10 }).notNull(), // HH:mm
  endTime: varchar('end_time', { length: 10 }).notNull(), // HH:mm
  status: slotStatusEnum('status').default('AVAILABLE').notNull(),
  bookingId: uuid('booking_id'),
  isException: boolean('is_exception').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type PriestProfile = typeof priestProfiles.$inferSelect;
export type NewPriestProfile = typeof priestProfiles.$inferInsert;
export type PriestService = typeof priestServices.$inferSelect;
export type NewPriestService = typeof priestServices.$inferInsert;
export type PriestSlot = typeof priestSlots.$inferSelect;
export type NewPriestSlot = typeof priestSlots.$inferInsert;
