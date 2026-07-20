/**
 * The schema surface Drizzle reads. Add a table's module here or it will not appear in
 * a generated migration.
 *
 * v0.1 covers identity and the lookup vocabularies. Spaces, bookings, sessions and billing
 * land in v0.2–v0.5 per PROJECT_PLAN.md; their design is already settled in
 * docs/architecture/data.md.
 */
export * from './identity';
export * from './lookups';
