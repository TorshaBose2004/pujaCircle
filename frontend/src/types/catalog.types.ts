export interface PujaCatalogEntry {
  id: string;
  name: string;
  deity: string;
  description: string;
  intentTags: string[];
  samagriList: string[];
  steps: string[];
  // Static reference text this phase per TRD §4
  timingNote: string;
  durationMinutes: number;
  coverImage: string;
  category: 'life-event' | 'dosha-nivaran' | 'festival' | 'business' | 'ancestral';
}
