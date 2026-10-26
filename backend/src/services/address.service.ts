import { eq, desc } from 'drizzle-orm';
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
  async createAddress(_userId: string, _data: CreateAddressInput): Promise<any> {
    // TODO: [Teammate - Address] Insert new address into addresses table, handling default flag unset on existing
    return null;
  }

  /**
   * Update an existing address
   */
  async updateAddress(
    _addressId: string,
    _userId: string,
    _data: UpdateAddressInput
  ): Promise<any> {
    // TODO: [Teammate - Address] Update address in addresses table by id and userId
    return null;
  }

  /**
   * Delete an address by ID
   */
  async deleteAddress(_addressId: string, _userId: string): Promise<void> {
    // TODO: [Teammate - Address] Delete address from addresses table by id and userId
  }

  /**
   * Set an address as the default ceremonial venue
   */
  async setDefaultAddress(_addressId: string, _userId: string): Promise<any> {
    // TODO: [Teammate - Address] Transaction: set isDefault = false for all user addresses, then set isDefault = true for addressId
    return null;
  }
}

export const addressService = new AddressService();
