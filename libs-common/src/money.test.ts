import { describe, expect, it } from 'vitest';
import { billableMinutes, formatRupees, isBillableDay, sessionAmountPaise } from './money';

describe('billableMinutes — ADR-0006', () => {
  it('rounds up to the next 15 minutes', () => {
    expect(billableMinutes(61)).toBe(75);
    expect(billableMinutes(75)).toBe(75);
    expect(billableMinutes(76)).toBe(90);
  });

  it('applies the 30-minute minimum', () => {
    expect(billableMinutes(1)).toBe(30);
    expect(billableMinutes(20)).toBe(30);
    expect(billableMinutes(31)).toBe(45);
  });

  it('rejects nonsense input rather than silently billing zero', () => {
    expect(() => billableMinutes(-1)).toThrow(RangeError);
    expect(() => billableMinutes(NaN)).toThrow(RangeError);
  });
});

describe('sessionAmountPaise — the worked example from ADR-0006', () => {
  it('bills 1h05m at ₹30/hr as ₹38', () => {
    // 65 min → 75 min billable → ₹37.50 → ₹38
    expect(sessionAmountPaise(65, 3000)).toBe(3800);
  });

  it('always returns whole rupees — cash must be handable', () => {
    for (const minutes of [30, 45, 61, 90, 137, 200]) {
      for (const rate of [1500, 3000, 3500, 8000]) {
        expect(sessionAmountPaise(minutes, rate) % 100).toBe(0);
      }
    }
  });

  it('never rounds down', () => {
    // 30 min at ₹35/hr is ₹17.50 exactly → must land on ₹18, not ₹17
    expect(sessionAmountPaise(30, 3500)).toBe(1800);
  });

  it('applies the minimum before the rate', () => {
    // A 2-minute session still bills 30 minutes
    expect(sessionAmountPaise(2, 3000)).toBe(sessionAmountPaise(30, 3000));
  });
});

describe('isBillableDay — ADR-0006', () => {
  it('is free below one hour cumulative', () => {
    expect(isBillableDay(59, false)).toBe(false);
    expect(isBillableDay(5, false)).toBe(false);
  });

  it('bills at one hour or more', () => {
    expect(isBillableDay(60, false)).toBe(true);
    expect(isBillableDay(61, false)).toBe(true);
  });

  it('bills any day carrying an active session, however brief the toggle', () => {
    expect(isBillableDay(5, true)).toBe(true);
    expect(isBillableDay(0, true)).toBe(true);
  });
});

describe('formatRupees', () => {
  it('uses the Indian digit grouping', () => {
    expect(formatRupees(250000)).toBe('₹2,500');
  });

  it('never prints paise', () => {
    expect(formatRupees(3800)).toBe('₹38');
  });
});
