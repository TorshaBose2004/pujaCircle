import { pgTable, uuid, integer, timestamp, pgEnum, text, varchar } from 'drizzle-orm/pg-core';
import { users } from './user.model.js';
import { priestProfiles, priestServices } from './priest.model.js';
import { addresses } from './address.model.js';
import { pujaCatalog } from './catalog.model.js';

export const bookingStatusEnum = pgEnum('booking_status', [
  'PENDING',
  'CONFIRMED',
  'REJECTED',
  'EXPIRED',
  'CANCELLED',
  'COMPLETED',
]);

export const paymentMethodEnum = pgEnum('payment_method', ['OFFLINE_CASH', 'CASH']);
export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'PAID_OFFLINE']);
export const cancelledByEnum = pgEnum('cancelled_by', ['USER', 'PRIEST', 'ADMIN']);

/**
 * [MODEL] Bookings Table
 * Represents devotee reservations with assigned verified priests.
 */
export const bookings = pgTable('bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  bookingReference: varchar('booking_reference', { length: 50 }).notNull().unique(), // e.g. PC-2026-0812 — must be unique across all bookings
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  priestId: uuid('priest_id').notNull().references(() => priestProfiles.id, { onDelete: 'cascade' }),
  priestServiceId: uuid('priest_service_id').references(() => priestServices.id),
  pujaCatalogId: uuid('puja_catalog_id').references(() => pujaCatalog.id),
  addressId: uuid('address_id').references(() => addresses.id),
  serviceName: varchar('service_name', { length: 255 }).default('Puja Ceremony').notNull(),
  servicePrice: integer('service_price').notNull(), // INR amount in rupees (₹)
  totalPrice: integer('total_price').notNull(), // INR amount in rupees (₹)
  bookingDate: varchar('booking_date', { length: 10 }).notNull(), // YYYY-MM-DD
  startTime: varchar('start_time', { length: 10 }).default('').notNull(), // HH:mm
  endTime: varchar('end_time', { length: 10 }).default('').notNull(), // HH:mm
  scheduledDate: timestamp('scheduled_date').defaultNow().notNull(),
  status: bookingStatusEnum('status').default('PENDING').notNull(),
  paymentMethod: paymentMethodEnum('payment_method').default('OFFLINE_CASH').notNull(),
  paymentStatus: paymentStatusEnum('payment_status').default('PENDING').notNull(),
  specialInstructions: text('special_instructions'),
  notes: text('notes'),
  completionCode: varchar('completion_code', { length: 10 }),
  rejectionReason: text('rejection_reason'),
  cancellationReason: text('cancellation_reason'),
  cancelledBy: cancelledByEnum('cancelled_by'),
  cancelledAt: timestamp('cancelled_at'),
  completedAt: timestamp('completed_at'),
  rating: integer('rating'),
  review: text('review'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
