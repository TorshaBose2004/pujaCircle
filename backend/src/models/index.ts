import { relations } from 'drizzle-orm';
import { users } from './user.model.js';
import { priestProfiles, priestServices, priestSlots } from './priest.model.js';
import { addresses } from './address.model.js';
import { pujaCatalog } from './catalog.model.js';
import { bookings } from './booking.model.js';

/**
 * Entity Relations Configuration (Drizzle ORM)
 */
export const usersRelations = relations(users, ({ one, many }) => ({
  priestProfile: one(priestProfiles, {
    fields: [users.id],
    references: [priestProfiles.userId],
  }),
  addresses: many(addresses),
  bookings: many(bookings),
}));

export const priestProfilesRelations = relations(priestProfiles, ({ one, many }) => ({
  user: one(users, {
    fields: [priestProfiles.userId],
    references: [users.id],
  }),
  services: many(priestServices),
  slots: many(priestSlots),
  bookings: many(bookings),
}));

export const priestServicesRelations = relations(priestServices, ({ one }) => ({
  priestProfile: one(priestProfiles, {
    fields: [priestServices.priestId],
    references: [priestProfiles.id],
  }),
  catalogItem: one(pujaCatalog, {
    fields: [priestServices.pujaCatalogId],
    references: [pujaCatalog.id],
  }),
}));

export const priestSlotsRelations = relations(priestSlots, ({ one }) => ({
  priestProfile: one(priestProfiles, {
    fields: [priestSlots.priestId],
    references: [priestProfiles.id],
  }),
}));

export const addressesRelations = relations(addresses, ({ one, many }) => ({
  user: one(users, {
    fields: [addresses.userId],
    references: [users.id],
  }),
  bookings: many(bookings),
}));

export const pujaCatalogRelations = relations(pujaCatalog, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  user: one(users, {
    fields: [bookings.userId],
    references: [users.id],
  }),
  priestProfile: one(priestProfiles, {
    fields: [bookings.priestId],
    references: [priestProfiles.id],
  }),
  priestService: one(priestServices, {
    fields: [bookings.priestServiceId],
    references: [priestServices.id],
  }),
  slot: one(priestSlots, {
    fields: [bookings.slotId],
    references: [priestSlots.id],
  }),
  catalog: one(pujaCatalog, {
    fields: [bookings.pujaCatalogId],
    references: [pujaCatalog.id],
  }),
  address: one(addresses, {
    fields: [bookings.addressId],
    references: [addresses.id],
  }),
}));

// Export all models
export * from './user.model.js';
export * from './priest.model.js';
export * from './address.model.js';
export * from './catalog.model.js';
export * from './booking.model.js';
