import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { pujaCatalog } from '../models/catalog.model.js';

/**
 * [SERVICE] Ritual Service
 * Handles ritual taxonomy and guidelines matched with sacred ceremonies.
 */
export class RitualService {
  /**
   * Query all sacred rituals for priest selection and devotee guide
   */
  async getRituals(): Promise<any[]> {
    const rituals = await db
      .select()
      .from(pujaCatalog)
      .where(eq(pujaCatalog.isActive, true));

    return rituals.map((r) => ({
      ...r,
      slug: r.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      approximateDurationMinutes: r.durationMinutes,
      requirements: r.samagriList || [],
      imageUrl: r.coverImage || undefined,
    }));
  }
}

export const ritualService = new RitualService();
