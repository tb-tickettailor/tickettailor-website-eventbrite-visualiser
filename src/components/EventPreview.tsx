import type { EventbritePreview } from '@/lib/eventbrite';
import type { HeaderVariation } from '@/lib/themes';

type Props = {
  preview: EventbritePreview;
  onBuyClick: () => void;
  headerVariation: HeaderVariation;
};

export function EventPreview({ preview, onBuyClick, headerVariation }: Props) {
  // For series, the JSON-LD start/end describes the whole envelope (e.g. Jan
  // → May). Prefer the first concrete occurrence so the hero shows a real
  // single-event window. Falls back to the series-level dates otherwise.
  const heroStart = preview.occurrences[0]?.start ?? preview.startDate;
  const heroEnd = preview.occurrences[0]?.end ?? preview.endDate;
  const dateLabel = formatEventDate(heroStart, heroEnd);
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
        className={`hero detail-hero${preview.imageUrl ? '' : ' hero--no-image'}`}
        data-variation={headerVariation}
      >
        {preview.imageUrl ? (
          <div className="hero__slides__container">
            <ul className="hero__slides">
              <li className="hero__slide" data-index="0">
                <figure className="hero__slide-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview.imageUrl} alt={preview.name} />
                </figure>
              </li>
            </ul>
          </div>
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
