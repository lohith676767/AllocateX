import { seedDatabase } from '../seed/seed.js';

/**
 * Full demo reset: wipes and re-seeds the deterministic scenario so the
 * judge can never accidentally leave the system in a broken state. Reuses
 * the same seed routine the initial `npm run db:seed` uses, so "fresh
 * install" and "reset demo" are guaranteed to produce identical state.
 */
export async function resetDemo() {
  return seedDatabase();
}
