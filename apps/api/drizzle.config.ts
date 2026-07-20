import type { Config } from 'drizzle-kit';

/**
 * Migrations only. `db:push` is banned and there is no script for it — push desyncs the
 * migration history from the database and the file tree, and recovering costs far more
 * than one `db:generate`.
 */
export default {
  schema: './src/db/schema/index.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? '',
  },
  strict: true,
  verbose: true,
} satisfies Config;
