import { db, queryClient } from './index.js';

/**
 * [SEED] Database Seeding Script
 * Run with: npm run db:seed or npm run seed
 */
async function seed(): Promise<void> {
  console.log('🕉️ Starting PujaCircle database seeding...');

  try {
    // TODO: [Teammate - Database] 1. Populate initial admin account
    // TODO: [Teammate - Database] 2. Populate puja_catalog entries with durationMinutes (REQUIRED, e.g. Satyanarayan = 120, Griha Pravesh = 240)
    // TODO: [Teammate - Database] 3. Populate test priest profiles and services
    console.log('🌱 Seed skeleton ready for teammate entity population.');
  } catch (error) {
    console.error('❌ Database seeding encountered an error:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

seed();
