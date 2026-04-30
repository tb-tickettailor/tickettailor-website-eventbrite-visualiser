'use client';

import { useEffect, useState } from 'react';
import type { EventbritePreview } from '@/lib/eventbrite';
import type { HeaderVariation } from '@/lib/themes';

type Props = {
  preview: EventbritePreview;
  onBuyClick: () => void;
  headerVariation: HeaderVariation;
};

export function EventPreview({ preview, onBuyClick, headerVariation }: Props) {
  // Multi-occurrence series: show a "Multiple dates and times" placeholder
  // instead of any specific date.
  // Single occurrence: show that occurrence's window (the real upcoming event).
  // No occurrences: fall back to the JSON-LD start/end.
  let dateLabel: string;
  if (preview.occurrences.length > 1) {
    dateLabel = 'Multiple dates and times';
  } else if (preview.occurrences.length === 1) {
    dateLabel = formatEventDate(preview.occurrences[0].start, preview.occurrences[0].end);
  } else {
    dateLabel = formatEventDate(preview.startDate, preview.endDate);
  }
  const locationLabel = preview.isOnline
    ? 'Online event'
    : preview.venueLocation ?? preview.venueName ?? '';

  return (
    <>
    <header className="header">
      <div className="header__inner">
        <a href="#" className="header__logo" onClick={(e) => e.preventDefault()}>
          <div className="text_logo">{preview.organizerName ?? preview.name}</div>
        </a>
        <nav className="header__nav" id="nav">
          <ul className="header__nav-list">
            <li className="header__nav-item">
              <a href="#" className="header__nav-link" onClick={(e) => e.preventDefault()}>Store</a>
            </li>
            <li className="header__nav-item header__nav-item--contact">
              <a href="#" className="header__nav-link" onClick={(e) => e.preventDefault()}>Contact us</a>
            </li>
          </ul>
          <ul className="header__nav-actions">
            <li className="header__nav-action-item">
              <a
                href="#"
                className="button button--header header__nav-action"
                onClick={(e) => e.preventDefault()}
              >
                Manage tickets
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
    <main id="tt-checkout--accessibility--main-content">
      <section
        className={`hero detail-hero${preview.imageUrls.length === 0 ? ' hero--no-image' : ''}`}
        data-variation={headerVariation}
      >
        {preview.imageUrls.length > 0 ? (
          <HeroSlideshow images={preview.imageUrls} alt={preview.name} />
        ) : null}
        <div className="hero__wrapper">
          <div className="hero__content">
            <h1 className="hero__title">{preview.name}</h1>
            <div className="event-meta hero__meta">
              {dateLabel ? <span className="event-meta__date">{dateLabel}</span> : null}
              {locationLabel ? <span className="event-meta__location">{locationLabel}</span> : null}
            </div>
          </div>
          <div className="hero__content__cta">
            <button className="button button--size-large" onClick={onBuyClick} type="button">
              Buy tickets
            </button>
          </div>
        </div>
      </section>

      <div className="detail-content">
        <div className="detail-content__actions">
          <div className="detail-actions">
            <div className="detail-actions__inner">
              <h2 className="detail-actions__title">{preview.name}</h2>
              <div className="event-meta detail-actions__meta">
                {dateLabel ? <span className="event-meta__date">{dateLabel}</span> : null}
                {locationLabel ? <span className="event-meta__location">{locationLabel}</span> : null}
              </div>
              <div className="detail-actions__buy-button-container">
                <button className="button button--size-large" onClick={onBuyClick} type="button">
                  Buy tickets
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="detail-content__wrapper">
          {preview.description ? (
            <section className="detail-content__description event-page-description">
              <div>{preview.description}</div>
            </section>
          ) : null}
          {!preview.isOnline && preview.venueLocation ? (
            <section className="detail-content__location">
              <h3>Location</h3>
              <p>{preview.venueLocation}</p>
              <iframe
                title={`Map of ${preview.venueLocation}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(preview.venueLocation)}&output=embed`}
                width="100%"
                height="450"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                style={{ border: 0, borderRadius: 8, marginTop: '1rem' }}
              />
            </section>
          ) : null}
        </div>
      </div>
    </main>
    </>
  );
}

function formatEventDate(start: string | null, end: string | null): string {
  if (!start) return '';
  const startDate = new Date(start);
  if (Number.isNaN(startDate.getTime())) return '';

  const startLabel = startDate.toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  if (!end) return startLabel;
  const endDate = new Date(end);
  if (Number.isNaN(endDate.getTime())) return startLabel;

  const sameDay = startDate.toDateString() === endDate.toDateString();
  const endLabel = sameDay
    ? endDate.toLocaleString(undefined, { hour: 'numeric', minute: '2-digit' })
    : endDate.toLocaleString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit'
      });

  return `${startLabel} – ${endLabel}`;
}

function HeroSlideshow({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const multiple = total > 1;

  // If the images array changes (new event loaded, or fewer slides than the
  // current index), snap back to the first slide.
  useEffect(() => {
    setIndex((i) => (i >= images.length ? 0 : i));
  }, [images]);

  function go(delta: number) {
    setIndex((i) => (i + delta + total) % total);
  }

  return (
    <div className="hero__slides__container">
      <ul className="hero__slides">
        {images.map((src, i) => (
          <li
            key={src}
            className="hero__slide"
            data-index={i}
            style={{ display: i === index ? 'block' : 'none' }}
          >
            <figure className="hero__slide-image">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={alt} />
            </figure>
          </li>
        ))}
      </ul>
      {multiple ? (
        <div className="hero__controls">
          <nav className="hero__pagination">
            {images.map((_, i) => (
              <button
                type="button"
                key={i}
                className={`hero__pagination-item${i === index ? ' hero__pagination-item--active' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Show image ${i + 1} of ${total}`}
                aria-current={i === index}
              />
            ))}
          </nav>
          <nav className="hero__buttons">
            <button
              type="button"
              className="hero__button hero__button--previous"
              onClick={() => go(-1)}
            >
              <span className="screenreader-text">Previous slide</span>
            </button>
            <button
              type="button"
              className="hero__button hero__button--next"
              onClick={() => go(1)}
            >
              <span className="screenreader-text">Next slide</span>
            </button>
          </nav>
          <span className="hero__counter">
            <span className="hero__counter-current">{index + 1}</span>
            <span className="hero__counter-separator">of</span>
            <span className="hero__counter-total">{total}</span>
          </span>
        </div>
      ) : null}
    </div>
  );
}
