import type { EventbritePreview } from './eventbrite';

// Per-ticket fee comparison: Eventbrite Essentials vs Ticket Tailor.
//
// Eventbrite (public pricing, Essentials):
//   3.7% + £0.59 service fee + 2.9% payment processing per ticket.
// Ticket Tailor (Pay-Per-Ticket, public pricing):
//   £0.60 service fee + ~2% payment processing per ticket.
//
// Numbers in GBP. We don't try to convert other currencies — for non-GBP
// events we just skip the comparison rather than mislead with the wrong
// currency assumption.

const EB_SERVICE_PCT = 0.037;
const EB_SERVICE_FIXED = 0.59;
const EB_PAYMENT_PCT = 0.029;

const TT_SERVICE_FIXED = 0.6;
const TT_PAYMENT_PCT = 0.02;

export type SavingsBreakdown = {
  perTicket: number;
  ticketPrice: number;
  eventbriteFee: number;
  ticketTailorFee: number;
  currency: string;
};

export function computeSavings(event: EventbritePreview): SavingsBreakdown | null {
  const range = event.priceRange;
  if (!range || range.isFree || range.min <= 0) return null;
  if (range.currency !== 'GBP') return null;

  const price = range.min;
  const ebFee = price * EB_SERVICE_PCT + EB_SERVICE_FIXED + price * EB_PAYMENT_PCT;
  const ttFee = TT_SERVICE_FIXED + price * TT_PAYMENT_PCT;
  const saving = ebFee - ttFee;

  if (saving < 0.5) return null; // not worth shouting about

  return {
    perTicket: round2(saving),
    ticketPrice: price,
    eventbriteFee: round2(ebFee),
    ticketTailorFee: round2(ttFee),
    currency: range.currency
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
