import { db } from '../db/index.js';
import { pujaCatalog, NewPujaCatalog } from '../models/catalog.model.js';

/**
 * [SERVICE] Catalog Service
 * Handles sacred puja catalog listings, ceremony details, and administration.
 */
export class CatalogService {
  /**
   * Get all active sacred ceremonies for catalog
   */
  async getCatalog(_category?: string, _query?: string) {
    const entries = await db
      .select()
      .from(pujaCatalog);

    return entries.map((e) => ({
      ...e,
      coverImage: e.coverImage || '/images/hero_vedic_puja.jpg',
    }));
  }

  /**
   * Query a single sacred ceremony from catalog by ID
   */
  async getCatalogById(_id: string): Promise<any> {
    // TODO: [Teammate - Catalog] Query single ceremony from puja_catalog table by id
    return null;
  }

  /**
   * Insert a new sacred ceremony into the catalog
   */
  async createCatalogEntry(data: NewPujaCatalog) {
    const [entry] = await db
      .insert(pujaCatalog)
      .values({
        name: data.name,
        deity: data.deity,
        category: data.category,
        description: data.description,
        intentTags: data.intentTags || [],
        samagriList: data.samagriList || [],
        steps: data.steps || [],
        timingNote: data.timingNote || '',
        coverImage: data.coverImage || null,
        isActive: data.isActive ?? true,
      })
      .returning();

    return entry;
  }

  /**
   * Update a sacred ceremony in the catalog by ID
   */
  async updateCatalogEntry(_id: string, _data: Partial<NewPujaCatalog>): Promise<any> {
    // TODO: [Teammate - Catalog] Update ceremony in puja_catalog table by id
    return null;
  }

  /**
   * Delete or deactivate a sacred ceremony in the catalog by ID
   */
  async deleteCatalogEntry(_id: string): Promise<void> {
    // TODO: [Teammate - Catalog] Delete or soft-deactivate ceremony from puja_catalog table by id
  }
}

export const catalogService = new CatalogService();
