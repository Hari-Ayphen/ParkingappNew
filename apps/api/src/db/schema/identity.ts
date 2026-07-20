import { boolean, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { primaryKey, timestamps } from './_shared';

/**
 * Identity and compliance — the v0.1 surface.
 * docs/features/01-login-flow.md, 02-after-login-flow.md, 19-terms-acceptance-flow.md
 */

export const country = pgTable('country', {
  id: primaryKey(),
  iso2: text('iso2').notNull().unique(),
  name: text('name').notNull(),
  dialCode: text('dial_code').notNull(),
  /** Per-country phone validation. Not one global regex — docs/features/01-login-flow.md BR-2. */
  phonePattern: text('phone_pattern').notNull(),
  /** Vehicle plate format, used by docs/features/20-vehicle-management-flow.md. */
  platePattern: text('plate_pattern'),
  ...timestamps,
});

/**
 * Better Auth owns `user` / `session` / `account` / `verification` (singular).
 * **Extend, never rename.** The columns below are SpotKey's additions.
 *
 * There is no `role` column: one account is both parker and owner, and role is contextual —
 * you are an owner *of a space* and a parker *on a booking* (docs/overview/product.md).
 */
export const user = pgTable(
  'user',
  {
    id: primaryKey(),
    // Better Auth's own columns are managed by its migrations; these are ours.
    phone: text('phone').notNull(),
    countryId: uuid('country_id')
      .notNull()
      .references(() => country.id),
    firstName: text('first_name'),
    lastName: text('last_name'),
    email: text('email'),
    /**
     * Collected once at Profile Completion. Used to generate the exit QR a parker scans.
     * NOT an instrument SpotKey charges — see docs/overview/product.md.
     */
    upiId: text('upi_id'),
    photoUrl: text('photo_url'),
    isProfileComplete: boolean('is_profile_complete').notNull().default(false),
    ...timestamps,
  },
  (t) => ({
    /** A person is uniquely identified by (country, phone). */
    phoneUnique: unique('user_country_phone_unique').on(t.countryId, t.phone),
  }),
);

export const termsVersion = pgTable('terms_version', {
  id: primaryKey(),
  version: text('version').notNull().unique(),
  bodyUrl: text('body_url').notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  ...timestamps,
});

/**
 * The legal audit trail. **Append-only** — never updated, never deleted
 * (docs/features/19-terms-acceptance-flow.md).
 *
 * Invariant 8 in docs/architecture/data.md notes this has no DB-level protection yet:
 * revoke UPDATE and DELETE at the role level before launch.
 */
export const termsAcceptance = pgTable('terms_acceptance', {
  id: primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => user.id),
  termsVersionId: uuid('terms_version_id')
    .notNull()
    .references(() => termsVersion.id),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }).notNull(),
  ...timestamps,
});

/** docs/features/16-settings-flow.md. Theme defaults to System. */
export const userPreference = pgTable('user_preference', {
  id: primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .unique()
    .references(() => user.id),
  /** 'light' | 'dark' | 'system' */
  theme: text('theme').notNull().default('system'),
  pushEnabled: boolean('push_enabled').notNull().default(true),
  bookingAlerts: boolean('booking_alerts').notNull().default(true),
  billingAlerts: boolean('billing_alerts').notNull().default(true),
  whatsappEnabled: boolean('whatsapp_enabled').notNull().default(true),
  ...timestamps,
});

/**
 * Deliberately absent: an OTP table.
 * OTPs expire in minutes and must not accumulate — they live in Redis with a TTL
 * (docs/architecture/data.md).
 */
