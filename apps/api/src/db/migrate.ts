import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './client';

/**
 * The ONLY way schema reaches any database. `db:push` is banned.
 */
async function main(): Promise<void> {
  await migrate(db, { migrationsFolder: './src/db/migrations' });
  await pool.end();
  // eslint-disable-next-line no-console
  console.log('migrations applied');
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
