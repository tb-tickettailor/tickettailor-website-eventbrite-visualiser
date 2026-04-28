import type { EventbritePreview } from './eventbrite';

export type MockTicket = {
  id: string;
  name: string;
  priceLabel: string;
  available: boolean;
  rawPrice: number;
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  GBP: '£',
  EUR: '€',
  CAD: 'C$',
  AUD: 'A$',
  NZD: 'NZ$',
  SGD: 'S$',
  HKD: 'HK$',
  BRL: 'R$',
  MXN: 'MX$'
};

function formatPrice(currency: string, value: number): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${value.toFixed(2)}`;
}

export function buildMockTickets(event: EventbritePreview): MockTicket[] {
  const range = event.priceRange;

  if (!range) {
    return [
      {
        id: 'standard',
        name: 'Standard admission',
        priceLabel: 'See pricing',
        available: true,
        rawPrice: 0
      }
    ];
  }

  if (range.isFree) {
    return [
      { id: 'standard', name: 'Standard admission', priceLabel: 'Free', available: true, rawPrice: 0 }
    ];
  }

  if (range.min === range.max) {
    return [
      {
        id: 'standard',
        name: 'Standard admission',
        priceLabel: formatPrice(range.currency, range.min),
        available: true,
        rawPrice: range.min
      }
    ];
  }

  return [
    {
      id: 'standard',
      name: 'Standard admission',
      priceLabel: `From ${formatPrice(range.currency, range.min)}`,
      available: true,
      rawPrice: range.min
    }
  ];
}
