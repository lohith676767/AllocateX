import { seedDatabase } from '../seed/seed.js';
import { seedAuthDemo } from '../seed/seedAuth.js';

/**
 * Full demo reset: wipes and re-seeds the deterministic scenario so the
 * judge can never accidentally leave the system in a broken state. Reuses
 * the same seed routine the initial `npm run db:seed` uses, so "fresh
 * install" and "reset demo" are guaranteed to produce identical state.
 *
 * seedAuthDemo() runs again afterward — it's idempotent (upserts by email)
 * — because seedDatabase() just recreated every NGO record with a fresh id;
 * this re-links each demo NGO login to the right NGO by name instead of
 * leaving it pointing at a row that no longer exists. Login accounts and
 * companies themselves are untouched by the wipe, so nobody is logged out.
 */
export async function resetDemo() {
  const counts = await seedDatabase();
  await seedAuthDemo();
  return counts;
}
