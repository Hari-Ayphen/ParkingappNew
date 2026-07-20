import { lookupTable } from './_shared';

/**
 * Status vocabularies. Seeded by `db:seed`; the seed is the source of truth for the rows,
 * and libs-common's string unions must match it.
 */

/** docs/features/06-booking-flow.md — the six sub-states of an active session. */
export const sessionState = lookupTable('session_state');

/** docs/architecture/data.md */
export const bookingStatus = lookupTable('booking_status');

/**
 * NO `pending_approval` row — the approval gate was removed (ADR-0002).
 * `suspended_pending_review` is set automatically by a safety report, not by an admin
 * (docs/features/25-issue-dispute-report-flow.md BR-2).
 */
export const spaceStatus = lookupTable('space_status');

export const spaceType = lookupTable('space_type');
export const vehicleType = lookupTable('vehicle_type');
export const amenity = lookupTable('amenity');
export const invoiceStatus = lookupTable('invoice_status');
export const mandateStatus = lookupTable('mandate_status');
export const ticketStatus = lookupTable('ticket_status');
export const ticketCategory = lookupTable('ticket_category');
export const ticketLane = lookupTable('ticket_lane');
export const notificationType = lookupTable('notification_type');
