import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Conventions enforced here so they cannot drift per-table (CLAUDE.md, docs/architecture/data.md):
 *
 *  - UUIDv7 primary keys — time-ordered, btree-friendly, no sequence contention.
 *  - created_at / updated_at with timezone on every table.
 *  - Statuses live in lookup tables + FK. Never a text enum, never pgEnum: renaming a status
 *    should be a data change, not a migration plus a deploy.
 */

/** UUIDv7 is generated in the application (uuidv7 package); Postgres has no v7 builtin yet. */
export const primaryKey = () => uuid('id').primaryKey();

export const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .default(sql`now()`),
};

/**
 * Every status vocabulary in the product is one of these. `code` is the stable identifier
 * that application code matches on; `label` is what a human sees and may change freely.
 */
export function lookupTable(name: string) {
  return pgTable(name, {
    id: primaryKey(),
    code: text('code').notNull().unique(),
    label: text('label').notNull(),
    ...timestamps,
  });
}

/** Every lookup table shares this shape — used by the seed so it needs no `any`. */
export type LookupTable = ReturnType<typeof lookupTable>;
