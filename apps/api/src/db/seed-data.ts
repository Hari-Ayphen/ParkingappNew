/**
 * The status vocabularies, with no database import — so they can be tested without a DB
 * and asserted against the string unions in `@spotkey/common`.
 *
 * These `code` values are the contract. Changing one is a data migration, not a rename.
 */

export type LookupRow = { code: string; label: string };

/** docs/features/06-booking-flow.md — the six sub-states of an active session. */
export const SESSION_STATES: LookupRow[] = [
  { code: 'arriving', label: 'Arriving' },
  { code: 'condition_check', label: 'Condition check' },
  { code: 'otp_ack', label: 'OTP acknowledgement' },
  { code: 'otp_display', label: 'OTP display' },
  { code: 'active', label: 'Active' },
  { code: 'exit_verification_pending', label: 'Exit verification pending' },
];

export const BOOKING_STATUSES: LookupRow[] = [
  { code: 'requested', label: 'Requested' },
  { code: 'approved', label: 'Approved' },
  { code: 'rejected', label: 'Rejected' },
  { code: 'expired', label: 'Expired' },
  { code: 'cancelled_by_parker', label: 'Cancelled by parker' },
  { code: 'cancelled_by_owner', label: 'Cancelled by owner' },
  { code: 'active', label: 'Active' },
  { code: 'completed', label: 'Completed' },
];

/**
 * There is deliberately NO `pending_approval` row. The listing approval gate was removed by
 * ADR-0002 — a space is created directly as `active`. Re-adding that code would silently
 * reintroduce a queue that nothing implements, and `seed.test.ts` fails if anyone tries.
 */
export const SPACE_STATUSES: LookupRow[] = [
  { code: 'active', label: 'Active' },
  { code: 'suspended', label: 'Suspended' },
  { code: 'suspended_pending_review', label: 'Suspended pending review' },
];

export const SPACE_TYPES: LookupRow[] = [
  { code: 'driveway', label: 'Driveway' },
  { code: 'lot', label: 'Lot' },
  { code: 'covered', label: 'Covered' },
  { code: 'open', label: 'Open' },
];

export const VEHICLE_TYPES: LookupRow[] = [
  { code: 'two_wheeler', label: '2-wheeler' },
  { code: 'four_wheeler', label: '4-wheeler' },
  { code: 'ev', label: 'EV' },
];

export const AMENITIES: LookupRow[] = [
  { code: 'covered', label: 'Covered' },
  { code: 'cctv', label: 'CCTV' },
  { code: 'security_guard', label: 'Security guard' },
  { code: 'ev_charging', label: 'EV charging' },
  { code: 'lighting', label: 'Lighting' },
  { code: 'washroom', label: 'Washroom access' },
];

export const INVOICE_STATUSES: LookupRow[] = [
  { code: 'draft', label: 'Draft' },
  { code: 'issued', label: 'Issued' },
  { code: 'debit_pending', label: 'Debit pending' },
  { code: 'paid', label: 'Paid' },
  { code: 'failed', label: 'Failed' },
  { code: 'retrying', label: 'Retrying' },
];

export const MANDATE_STATUSES: LookupRow[] = [
  { code: 'none', label: 'None' },
  { code: 'pending', label: 'Pending' },
  { code: 'active', label: 'Active' },
  { code: 'revoked', label: 'Revoked' },
  { code: 'lapsed', label: 'Lapsed' },
];

export const TICKET_STATUSES: LookupRow[] = [
  { code: 'open', label: 'Open' },
  { code: 'in_progress', label: 'In progress' },
  { code: 'resolved', label: 'Resolved' },
];

export const TICKET_CATEGORIES: LookupRow[] = [
  { code: 'safety', label: 'Safety concern' },
  { code: 'not_as_described', label: 'Space not as described' },
  { code: 'damage', label: 'Damage / condition dispute' },
  { code: 'wrong_vehicle', label: 'Wrong vehicle / unauthorised parking' },
  { code: 'amount_dispute', label: 'Amount dispute' },
  { code: 'other', label: 'Other' },
];

/** Safety reports take the urgent lane. docs/features/25-issue-dispute-report-flow.md */
export const TICKET_LANES: LookupRow[] = [
  { code: 'urgent', label: 'Urgent' },
  { code: 'standard', label: 'Standard' },
];

export const INDIA = {
  iso2: 'IN',
  name: 'India',
  dialCode: '+91',
  phonePattern: '^[6-9]\\d{9}$',
  platePattern: '^[A-Z]{2}\\d{1,2}[A-Z]{0,3}\\d{4}$',
} as const;
