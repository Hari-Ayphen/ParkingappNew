/**
 * Money and duration rules — the single implementation of ADR-0006.
 *
 * Every amount the product prints passes through here. Do not compute an amount
 * anywhere else: payment happens outside the app and is never tracked, so a figure
 * that disagrees with this module cannot be reconciled against any record. It goes
 * to human mediation (docs/features/17-support-flow.md).
 *
 * All money is integer **paise**. Never a float, never rupees-as-decimal.
 */

/** Round elapsed time up to this increment. ADR-0006. */
export const BILLING_INCREMENT_MINUTES = 15;

/** No session bills for less than this. ADR-0006. */
export const MINIMUM_BILLABLE_MINUTES = 30;

/** A calendar day is billable once a space has been live this long, cumulative. ADR-0006. */
export const BILLABLE_DAY_THRESHOLD_MINUTES = 60;

/** The one timezone. Every user is in India, so a "calendar day" has one boundary. */
export const BILLING_TIMEZONE = 'Asia/Kolkata';

const PAISE_PER_RUPEE = 100;

/**
 * Elapsed minutes → billable minutes.
 *
 * Rounds UP to the next increment, then applies the minimum. Rounding up favours the
 * owner deliberately: a slot cannot be re-let for the thirteen minutes someone overstayed.
 */
export function billableMinutes(elapsedMinutes: number): number {
  if (!Number.isFinite(elapsedMinutes) || elapsedMinutes < 0) {
    throw new RangeError(
      `elapsedMinutes must be a non-negative finite number, got ${elapsedMinutes}`,
    );
  }
  const rounded = Math.ceil(elapsedMinutes / BILLING_INCREMENT_MINUTES) * BILLING_INCREMENT_MINUTES;
  return Math.max(rounded, MINIMUM_BILLABLE_MINUTES);
}

/**
 * Billable minutes × hourly rate → the amount actually charged, in paise.
 *
 * The result is always a whole number of rupees. Payment is frequently cash
 * (docs/features/06-booking-flow.md), and ₹37.50 is not payable without change
 * neither party is carrying.
 */
export function sessionAmountPaise(elapsedMinutes: number, hourlyRatePaise: number): number {
  if (!Number.isInteger(hourlyRatePaise) || hourlyRatePaise < 0) {
    throw new RangeError(`hourlyRatePaise must be a non-negative integer, got ${hourlyRatePaise}`);
  }
  const minutes = billableMinutes(elapsedMinutes);
  const raw = (hourlyRatePaise * minutes) / 60;
  // Round up to whole rupees.
  return Math.ceil(raw / PAISE_PER_RUPEE) * PAISE_PER_RUPEE;
}

/**
 * Was this calendar day billable for the platform fee?
 *
 * An active session makes the day billable regardless of toggle time — if someone was
 * parked there, the space was in service.
 */
export function isBillableDay(cumulativeLiveMinutes: number, hadActiveSession: boolean): boolean {
  if (hadActiveSession) return true;
  return cumulativeLiveMinutes >= BILLABLE_DAY_THRESHOLD_MINUTES;
}

/** Display helper. Amounts are always whole rupees, so this never shows paise. */
export function formatRupees(paise: number): string {
  if (!Number.isInteger(paise)) {
    throw new RangeError(`paise must be an integer, got ${paise}`);
  }
  return `₹${Math.round(paise / PAISE_PER_RUPEE).toLocaleString('en-IN')}`;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * PAISE_PER_RUPEE);
}
