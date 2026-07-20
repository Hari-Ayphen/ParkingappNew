import {
  BOOKING_STATUSES,
  SESSION_STATES,
  SPACE_STATUSES,
  VEHICLE_TYPES,
  INDIA,
} from './seed-data';
import {
  BOOKING_STATUSES as TS_BOOKING,
  SESSION_STATES as TS_SESSION,
  SPACE_STATUSES as TS_SPACE,
  VEHICLE_TYPES as TS_VEHICLE,
} from '@spotkey/common';
import { describe, expect, it } from 'vitest';

/**
 * The seed and the TypeScript unions describe the same vocabularies. Nothing enforces that
 * at runtime — the database is the source of truth and the unions are a compile-time
 * convenience — so this test is the only thing keeping them from drifting apart silently.
 */

const codes = (rows: { code: string }[]): string[] => rows.map((r) => r.code).sort();

describe('seed vocabularies match @spotkey/common', () => {
  it('session states', () => {
    expect(codes(SESSION_STATES)).toEqual([...TS_SESSION].sort());
  });

  it('booking statuses', () => {
    expect(codes(BOOKING_STATUSES)).toEqual([...TS_BOOKING].sort());
  });

  it('space statuses', () => {
    expect(codes(SPACE_STATUSES)).toEqual([...TS_SPACE].sort());
  });

  it('vehicle types', () => {
    expect(codes(VEHICLE_TYPES)).toEqual([...TS_VEHICLE].sort());
  });
});

describe('ADR-0002 — the listing approval gate stays removed', () => {
  it('has no pending_approval space status', () => {
    expect(codes(SPACE_STATUSES)).not.toContain('pending_approval');
  });

  it('keeps the automatic safety withhold status', () => {
    // docs/features/25-issue-dispute-report-flow.md BR-2 — set by a report, not by an admin.
    expect(codes(SPACE_STATUSES)).toContain('suspended_pending_review');
  });
});

describe('lookup hygiene', () => {
  it('has no duplicate codes in any vocabulary', () => {
    for (const rows of [SESSION_STATES, BOOKING_STATUSES, SPACE_STATUSES, VEHICLE_TYPES]) {
      const list = codes(rows);
      expect(new Set(list).size).toBe(list.length);
    }
  });

  it('uses snake_case codes throughout', () => {
    for (const rows of [SESSION_STATES, BOOKING_STATUSES, SPACE_STATUSES, VEHICLE_TYPES]) {
      for (const c of codes(rows)) {
        expect(c).toMatch(/^[a-z0-9_]+$/);
      }
    }
  });
});

describe('India seed', () => {
  it('accepts a valid Indian mobile number and rejects a landline-style one', () => {
    const re = new RegExp(INDIA.phonePattern);
    expect(re.test('9876543210')).toBe(true);
    expect(re.test('1234567890')).toBe(false);
    expect(re.test('98765432')).toBe(false);
  });

  it('accepts a typical plate format', () => {
    const re = new RegExp(INDIA.platePattern);
    expect(re.test('KA01AB1234')).toBe(true);
    expect(re.test('TN10Z9999')).toBe(true);
  });
});
