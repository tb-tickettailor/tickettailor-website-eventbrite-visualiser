'use client';

import { useMemo, useState } from 'react';
import type { EventbritePreview } from '@/lib/eventbrite';
import { buildMockTickets } from '@/lib/mockTickets';

const SIGN_UP_URL = 'https://app.tickettailor.com/sign-up';

export type Occurrence = {
  startIso: string;
  endIso: string | null;
  date: Date;
};

export function useOccurrences(event: EventbritePreview): Occurrence[] {
  return useMemo(() => {
    if (event.occurrences.length > 0) {
      return event.occurrences
        .map((o) => {
          const date = new Date(o.start);
          return { startIso: o.start, endIso: o.end, date };
        })
        .filter((o) => !Number.isNaN(o.date.getTime()))
        .sort((a, b) => a.date.getTime() - b.date.getTime());
    }
    if (event.startDate) {
      const date = new Date(event.startDate);
      if (!Number.isNaN(date.getTime())) {
        return [{ startIso: event.startDate, endIso: event.endDate, date }];
      }
    }
    return [];
  }, [event]);
}

export function SelectDateView({
  event,
  occurrences,
  selectedIso,
  onPick
}: {
  event: EventbritePreview;
  occurrences: Occurrence[];
  selectedIso: string | null;
  onPick: (iso: string) => void;
}) {
  const grouped = useMemo(() => groupByDate(occurrences), [occurrences]);
  const VISIBLE_LIMIT = 20;
  const visible = grouped.slice(0, VISIBLE_LIMIT);
  const remaining = Math.max(0, grouped.length - visible.length);

  return (
    <div id="shop-container" className="checkout-pane">
      <header className="widget_header">
        <h1 id="dialog_header" className="buy-tickets-label">
          {event.name}
        </h1>
        {event.venueName ? (
          <div className="subtitle">
            <div className="venue_name">{event.venueName}</div>
          </div>
        ) : null}
      </header>

      <main className="checkout_main_content">
        <div className="select_date_wrapper">
          <div className="select_date">
            {visible.map((group) => {
              const isSelected = group.events.some((e) => e.startIso === selectedIso);
              const multipleTimes = group.events.length > 1;
              return (
                <div className="date" key={group.dateKey}>
                  <div
                    className={`occurrence date_select${isSelected ? ' selected' : ''}`}
                    id={`occurrence_${group.dateKey}`}
                  >
                    {multipleTimes ? (
                      <DateRowExpandable group={group} selectedIso={selectedIso} onPick={onPick} />
                    ) : (
                      <a
                        href="#"
                        onClick={(ev) => {
                          ev.preventDefault();
                          onPick(group.events[0].startIso);
                        }}
                      >
                        <span className="button" aria-hidden="true" />
                        <div className="date_time_details">
                          <span className="date_portion">{group.formattedDate}</span>
                          <span className="time_portion">{group.formattedTime}</span>
                        </div>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}

            {remaining > 0 ? (
              <div className="date">
                <div className="occurrence date_select more_dates_available">
                  <p>+ {remaining} more {remaining === 1 ? 'date' : 'dates'} available</p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
}

function DateRowExpandable({
  group,
  selectedIso,
  onPick
}: {
  group: GroupedDate;
  selectedIso: string | null;
  onPick: (iso: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setExpanded((v) => !v)}>
        <span className="button" aria-hidden="true" />
        <div className="date_time_details">
          <span className="date_portion">{group.formattedDate}</span>
          <span className="time_portion">{group.events.length} time slots</span>
        </div>
      </button>
      {expanded ? (
        <div className="occurrences time_select">
          <div className="time_select_wrapper">
            {group.events.map((occ) => {
              const isActive = occ.startIso === selectedIso;
              return (
                <div className={`occurrence${isActive ? ' active' : ''}`} key={occ.startIso}>
                  <a
                    href="#"
                    onClick={(ev) => {
                      ev.preventDefault();
                      onPick(occ.startIso);
                    }}
                  >
                    <span className="button" aria-hidden="true" />
                    <span className="date_string">
                      <var>
                        {occ.date.toLocaleTimeString(undefined, {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </var>
                    </span>
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </>
  );
}

export function SelectTicketsView({
  event,
  occurrence,
  onBack
}: {
  event: EventbritePreview;
  occurrence: Occurrence | null;
  onBack?: () => void;
}) {
  const tickets = buildMockTickets(event);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const subtotal = tickets.reduce((acc, t) => acc + (quantities[t.id] ?? 0) * t.rawPrice, 0);
  const totalCount = Object.values(quantities).reduce((a, b) => a + b, 0);
  const currencySymbol = currencySymbolFor(event.priceRange?.currency ?? 'USD');

  function update(id: string, delta: number) {
    setQuantities((prev) => {
      const next = (prev[id] ?? 0) + delta;
      return { ...prev, [id]: Math.max(0, Math.min(10, next)) };
    });
  }

  return (
    <div id="shop-container" className="checkout-pane">
      <header className="widget_header">
        {onBack ? (
          <button
            type="button"
            className="back_arrow"
            onClick={onBack}
            title="Back"
            aria-label="Back to dates"
          />

        ) : null}
        <h1 id="dialog_header" className="buy-tickets-label">
          {event.name}
        </h1>
        {occurrence ? (
          <div className="subtitle">
            <div className="date_and_time">{formatLong(occurrence.date)}</div>
            {event.venueName ? <div className="venue_name">{event.venueName}</div> : null}
          </div>
        ) : null}
      </header>

      <main className="checkout_main_content">
        <div className="event_product_form event_ticket_form form--controls-increment-quantity">
          <div className="ticket_group">
            {tickets.map((ticket) => (
              <div
                className={`ticket_row ga_ticket_row ticket_type${ticket.available ? '' : ' ticket_row--unavailable'}`}
                key={ticket.id}
              >
                <span className="ticket_name">
                  <label htmlFor={`ticket-${ticket.id}`}>
                    <var className="ticket_label">{ticket.name}</var>
                  </label>
                </span>
                <span className="price">
                  <var>{ticket.priceLabel}</var>
                </span>
                <span className="quantity">
                  {ticket.available ? (
                    <span className="quantity-control">
                      <button
                        type="button"
                        onClick={() => update(ticket.id, -1)}
                        disabled={(quantities[ticket.id] ?? 0) === 0}
                        aria-label={`Decrease ${ticket.name}`}
                      >
                        −
                      </button>
                      <span>{quantities[ticket.id] ?? 0}</span>
                      <button
                        type="button"
                        onClick={() => update(ticket.id, 1)}
                        aria-label={`Increase ${ticket.name}`}
                      >
                        +
                      </button>
                    </span>
                  ) : (
                    <span className="status_warning">Sold out</span>
                  )}
                </span>
              </div>
            ))}
          </div>

          <div className="ticket_row submit">
            <span className="subtotal">
              <span className="subtotal_label">
                {totalCount} ticket{totalCount === 1 ? '' : 's'}
              </span>
              <span className="subtotal_amount">{currencySymbol}{subtotal.toFixed(2)}</span>
            </span>
            <a
              className="button button--primary button--size-large btn"
              href={SIGN_UP_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Import event
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}


type GroupedDate = {
  dateKey: string;
  formattedDate: string;
  formattedTime: string;
  events: Occurrence[];
};

function groupByDate(occurrences: Occurrence[]): GroupedDate[] {
  const groups = new Map<string, { formattedDate: string; events: Occurrence[] }>();
  for (const o of occurrences) {
    const key = `${o.date.getFullYear()}-${o.date.getMonth() + 1}-${o.date.getDate()}`;
    const formattedDate = o.date.toLocaleDateString(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    const existing = groups.get(key);
    if (existing) {
      existing.events.push(o);
    } else {
      groups.set(key, { formattedDate, events: [o] });
    }
  }
  return Array.from(groups.entries()).map(([dateKey, value]) => ({
    dateKey,
    formattedDate: value.formattedDate,
    formattedTime: value.events
      .map((e) => e.date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }))
      .join(', '),
    events: value.events
  }));
}

function formatLong(date: Date): string {
  return date.toLocaleString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

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

function currencySymbolFor(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? `${currency} `;
}
