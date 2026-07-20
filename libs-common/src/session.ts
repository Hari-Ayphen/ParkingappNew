/**
 * Session and booking state vocabulary, shared by the API, mobile and admin.
 *
 * These mirror lookup-table rows — they are NOT the source of truth. The database is
 * (docs/architecture/data.md). They exist so TypeScript can check a state name at compile
 * time; the seed must match, and a mismatch is a bug in the seed, not here.
 */

/** The six sub-states of an active session. docs/features/06-booking-flow.md */
export const SESSION_STATES = [
  'arriving',
  'condition_check',
  'otp_ack',
  'otp_display',
  'active',
  'exit_verification_pending',
] as const;
export type SessionState = (typeof SESSION_STATES)[number];

/**
 * The billable window. ADR-0006.
 * Starts on entry to `active`; stops on entry to `exit_verification_pending` — NOT on the
 * owner's confirmation, so owner latency can never inflate a parker's bill.
 */
export const BILLING_STARTS_AT: SessionState = 'active';
export const BILLING_STOPS_AT: SessionState = 'exit_verification_pending';

/**
 * Cancellation is available up to and including `arriving`, and unavailable from
 * `condition_check` onward. docs/features/21-cancellation-flow.md BR-1.
 */
export function isCancellable(state: SessionState | null): boolean {
  if (state === null) return true; // approved but not yet started
  return state === 'arriving';
}

export const BOOKING_STATUSES = [
  'requested',
  'approved',
  'rejected',
  'expired',
  'cancelled_by_parker',
  'cancelled_by_owner',
  'active',
  'completed',
] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

/** docs/architecture/data.md — no `pending_approval`; the gate was removed by ADR-0002. */
export const SPACE_STATUSES = ['active', 'suspended', 'suspended_pending_review'] as const;
export type SpaceStatus = (typeof SPACE_STATUSES)[number];

/** A space is visible to parkers only when admin permits it AND the owner has it switched on. */
export function isSpaceBookable(status: SpaceStatus, isLive: boolean): boolean {
  return status === 'active' && isLive;
}

export const VEHICLE_TYPES = ['two_wheeler', 'four_wheeler', 'ev'] as const;
export type VehicleType = (typeof VEHICLE_TYPES)[number];
