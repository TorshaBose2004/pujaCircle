import { db, queryClient } from './index.js';

/**
 * [SEED] Database Seeding Script
 * Run with: npm run db:seed or npm run seed
 */
async function seed(): Promise<void> {
  console.log('🕉️ Starting PujaCircle database seeding...');

  try {
    // TODO: [Teammate - Database] Populate initial admin account, default sacred puja catalog entries, and test priests.
    console.log('🌱 Seed skeleton ready for teammate entity population.');
  } catch (error) {
    console.error('❌ Database seeding encountered an error:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

seed();
