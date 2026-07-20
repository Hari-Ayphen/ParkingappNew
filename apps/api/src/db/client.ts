import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

/**
 * Single-tenant: queries use `db` directly. There is no `forOrg(orgId)` helper and no
 * `org_id` column anywhere — see ADR-0001.
 */
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env.');
}

export const pool = new Pool({ connectionString });
export const db = drizzle(pool, { schema });
export type Db = typeof db;
