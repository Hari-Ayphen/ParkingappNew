import { uuidv7 } from 'uuidv7';
import { db, pool } from './client';
import type { LookupTable } from './schema/_shared';
import {
  AMENITIES,
  BOOKING_STATUSES,
  INDIA,
  INVOICE_STATUSES,
  MANDATE_STATUSES,
  SESSION_STATES,
  SPACE_STATUSES,
  SPACE_TYPES,
  TICKET_CATEGORIES,
  TICKET_LANES,
  TICKET_STATUSES,
  VEHICLE_TYPES,
  type LookupRow,
} from './seed-data';
import { country } from './schema/identity';
import * as lookups from './schema/lookups';

/**
 * Master data. Idempotent — safe to re-run.
 *
 * These rows are the status vocabularies the whole product matches on. The string unions in
 * `@spotkey/common` must stay in step with the `code` values here; a mismatch is a bug in
 * whichever drifted, and the DB wins.
 */

async function seedLookup(table: LookupTable, rows: LookupRow[]): Promise<void> {
  for (const row of rows) {
    await db
      .insert(table)
      .values({ id: uuidv7(), ...row })
      .onConflictDoNothing({ target: table.code });
  }
}

async function main(): Promise<void> {
  await seedLookup(lookups.sessionState, SESSION_STATES);
  await seedLookup(lookups.bookingStatus, BOOKING_STATUSES);
  await seedLookup(lookups.spaceStatus, SPACE_STATUSES);
  await seedLookup(lookups.spaceType, SPACE_TYPES);
  await seedLookup(lookups.vehicleType, VEHICLE_TYPES);
  await seedLookup(lookups.amenity, AMENITIES);
  await seedLookup(lookups.invoiceStatus, INVOICE_STATUSES);
  await seedLookup(lookups.mandateStatus, MANDATE_STATUSES);
  await seedLookup(lookups.ticketStatus, TICKET_STATUSES);
  await seedLookup(lookups.ticketCategory, TICKET_CATEGORIES);
  await seedLookup(lookups.ticketLane, TICKET_LANES);

  await db
    .insert(country)
    .values({
      id: uuidv7(),
      ...INDIA,
    })
    .onConflictDoNothing({ target: country.iso2 });

  /**
   * Deliberately NOT seeded: `platform_rate`.
   * The rate table's shape is decided (slot count × vehicle type, ADR-0003) but its values
   * are not. Seeding a placeholder would put a fabricated number into the one table that
   * decides what real owners are charged. Blocked on the product owner — see
   * PROJECT_PLAN.md v0.5-A.
   */

  await pool.end();
  // eslint-disable-next-line no-console
  console.log('seed complete');
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
