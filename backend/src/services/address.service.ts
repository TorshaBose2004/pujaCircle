import { eq, desc, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { addresses, Address } from '../models/address.model.js';
import { CreateAddressInput, UpdateAddressInput } from '../schemas/address.schema.js';

/**
 * [SERVICE] Address Service
 * Handles devotee in-person ceremonial venue addresses.
 */
export class AddressService {
  /**
   * Retrieve all saved addresses for a devotee
   */
  async getAddresses(userId: string): Promise<Address[]> {
    return await db
      .select()
      .from(addresses)
      .where(eq(addresses.userId, userId))
      .orderBy(desc(addresses.isDefault));
  }

  /**
   * Add a new ceremonial address for a devotee
   */
  async createAddress(userId: string, data: CreateAddressInput): Promise<Address> {
    if (data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(addresses.userId, userId));
    }

    const [newAddress] = await db
      .insert(addresses)
      .values({
        userId,
        ...data,
      })
      .returning();

    return newAddress;
  }

  /**
   * Update an existing address
   */
  async updateAddress(
    addressId: string,
    userId: string,
    data: UpdateAddressInput
  ): Promise<Address> {
    if (data.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(addresses.userId, userId));
    }

    const [updated] = await db
      .update(addresses)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .returning();

    if (!updated) {
      throw { statusCode: 404, message: 'Address not found or unauthorized.' };
    }

    return updated;
  }

  /**
   * Delete an address by ID
   */
  async deleteAddress(addressId: string, userId: string): Promise<void> {
    const [deleted] = await db
      .delete(addresses)
      .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
      .returning();

    if (!deleted) {
      throw { statusCode: 404, message: 'Address not found or unauthorized.' };
    }
  }

  /**
   * Set an address as the default ceremonial venue
   */
  async setDefaultAddress(addressId: string, userId: string): Promise<Address> {
    return await db.transaction(async (tx) => {
      // 1. Unset default for all addresses of this user
      await tx
        .update(addresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(addresses.userId, userId));

      // 2. Set isDefault = true for the target addressId
      const [updated] = await tx
        .update(addresses)
        .set({ isDefault: true, updatedAt: new Date() })
        .where(and(eq(addresses.id, addressId), eq(addresses.userId, userId)))
        .returning();

      if (!updated) {
        throw { statusCode: 404, message: 'Address not found or unauthorized.' };
      }

      return updated;
    });
  }
}

export const addressService = new AddressService();
