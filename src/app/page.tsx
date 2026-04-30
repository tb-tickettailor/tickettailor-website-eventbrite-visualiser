'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent
} from 'react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';
import type { EventbritePreview } from '@/lib/eventbrite';
import { darkerForButton, samplePalette, textOnHex, type SampledPalette } from '@/lib/imageColors';
import {
  DEFAULT_THEME,
  THEMES,
  headerVariationFor,
  sampleImageFor,
  themeStylesheetUrl,
  type ThemeId
} from '@/lib/themes';
import { EventPreview } from '@/components/EventPreview';
import {
  SelectDateView,
  SelectTicketsView,
  useOccurrences
} from '@/components/CheckoutViews';
import Logo from '@/components/Logo';
import { ThemeDropdown } from '@/components/ThemeDropdown';
import { SAMPLE_PREVIEW } from '@/lib/samplePreview';
import { computeSavings } from '@/lib/savings';

const SIGN_UP_URL = 'https://app.tickettailor.com/sign-up';
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';

type PreviewTab = 'page' | 'date' | 'tickets';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<EventbritePreview | null>(SAMPLE_PREVIEW);
  const [hasUserPreview, setHasUserPreview] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasUserPreview) return;
    // Wait for the savings callout (if it's going to render) and the
    // preview to mount before measuring scroll position.
    requestAnimationFrame(() => {
      const callout = document.querySelector('.tt-savings');
      const el = callout ?? previewRef.current;
      if (!el) return;
      const top = (el as HTMLElement).getBoundingClientRect().top + window.scrollY - 24;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  }, [hasUserPreview]);
  const [theme, setTheme] = useState<ThemeId>(DEFAULT_THEME);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  useEffect(() => {
    const id = 'tt-theme-stylesheet';
    let style = document.getElementById(id) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = id;
      document.head.appendChild(style);
    }
    let cancelled = false;
    fetch(themeStylesheetUrl(theme))
      .then((r) => r.text())
      .then((css) => {
        if (cancelled || !style) return;
        // Scope the theme to .tt-preview-frame so its CSS variables and `body`
        // rules don't leak onto the marketing wrapper.
        style.textContent = css
          .replace(/:root\b/g, '.tt-preview-frame')
          .replace(/(^|\s|,)body\b/g, '$1.tt-preview-frame');
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [theme]);

  async function submitFetch(turnstileToken?: string) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/fetch-eventbrite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, turnstileToken })
      });
      const data = await res.json();
      if (res.status === 429 && data.requiresCaptcha) {
        setShowCaptcha(true);
        setError(data.error ?? 'Please complete the check below to continue.');
        return;
      }
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong');
        return;
      }
      setPreview(data.preview as EventbritePreview);
      setHasUserPreview(true);
      // Captcha succeeded (if shown) — hide it for next time.
      setShowCaptcha(false);
      turnstileRef.current?.reset();
    } catch {
      setError('Network error — check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (showCaptcha) return; // wait for the captcha callback
    submitFetch();
  }

  function handleCaptchaSuccess(token: string) {
    submitFetch(token);
  }

  return (
    <div className="tt-site">
      <header className="tt-header">
        <div className="tt-header__inner">
          <a className="tt-header__logo" href="https://www.tickettailor.com" aria-label="Ticket Tailor">
            <Logo />
          </a>
          <nav className="tt-header__nav" aria-label="Primary">
            <a href="https://www.tickettailor.com/">Back to website</a>
            <a href="https://www.tickettailor.com/eventbrite-alternative">
              Compare with Eventbrite
            </a>
          </nav>
          <a className="tt-button tt-button--navy" href={SIGN_UP_URL} target="_blank" rel="noopener noreferrer">
            Sign up free
          </a>
        </div>
      </header>

      <section className="tt-hero">
        <div className="tt-hero__inner">
          <h1>See your Eventbrite event on Ticket Tailor</h1>
          <p>Paste your Eventbrite URL and preview it instantly in any of our most-loved themes.</p>

          <form className="tt-form" onSubmit={handleSubmit}>
            <input
              type="url"
              required
              placeholder="https://www.eventbrite.com/e/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              aria-label="Eventbrite URL"
            />
            {hasUserPreview ? (
              <button
                type="button"
                className="tt-form__clear"
                onClick={() => {
                  setUrl('');
                  setPreview(SAMPLE_PREVIEW);
                  setHasUserPreview(false);
                  setError(null);
                  setShowCaptcha(false);
                }}
                aria-label="Clear URL and reset preview"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            ) : null}
            <button className="tt-button tt-button--navy" type="submit" disabled={loading || url.length === 0}>
              {loading ? 'Loading…' : 'Preview it'}
            </button>
          </form>

          {error ? <div className="tt-error" role="alert">{error}</div> : null}
          {showCaptcha && TURNSTILE_SITE_KEY ? (
            <div className="tt-captcha">
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={handleCaptchaSuccess}
                options={{ theme: 'light' }}
              />
            </div>
          ) : null}
          {hasUserPreview && preview ? <SavingsCallout preview={preview} /> : null}
        </div>
      </section>

      {preview ? (
        <div ref={previewRef}>
          <PreviewSection
            preview={preview}
            theme={theme}
            setTheme={setTheme}
            hasUserPreview={hasUserPreview}
          />
        </div>
      ) : null}

      <footer className="tt-footer">
        Standalone preview · powered by <a href="https://www.tickettailor.com">Ticket Tailor</a>
      </footer>
    </div>
  );
}

function SavingsCallout({ preview }: { preview: EventbritePreview }) {
  const savings = computeSavings(preview);
  if (!savings) return null;

  const symbol = savings.currency === 'GBP' ? '£' : '$';

  return (
    <div className="tt-savings" role="status">
      <i className="fa-solid fa-tag" aria-hidden="true" />
      <div className="tt-savings__body">
        <div className="tt-savings__headline">
          Save {savings.percentLessFees}% compared to Eventbrite
        </div>
        <div className="tt-savings__detail">
          {symbol}
          {savings.eventbriteFee.toFixed(2)} Eventbrite vs {symbol}
          {savings.ticketTailorFee.toFixed(2)} Ticket Tailor per ticket.
          <a
            className="tt-savings__link"
            href="https://www.tickettailor.com/pricing"
            target="_blank"
            rel="noopener noreferrer"
          >
            Save even more with credits
            <i className="fa-solid fa-arrow-up-right-from-square" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
}

function PreviewSection({
  preview,
  theme,
  setTheme,
  hasUserPreview
}: {
  preview: EventbritePreview;
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  hasUserPreview: boolean;
}) {
  const occurrences = useOccurrences(preview);
  const hasDateStep = occurrences.length > 1;

  const [tab, setTab] = useState<PreviewTab>('page');
  const [selectedOccurrenceIso, setSelectedOccurrenceIso] = useState<string | null>(
    occurrences[0]?.startIso ?? null
  );
  const [useEventColours, setUseEventColours] = useState(false);
  const [sampledPalette, setSampledPalette] = useState<SampledPalette | null>(null);

  const displayImageUrl = hasUserPreview
    ? preview.imageUrl
    : sampleImageFor(theme);

  useEffect(() => {
    if (!useEventColours || !displayImageUrl) {
      setSampledPalette(null);
      return;
    }
    let cancelled = false;
    samplePalette(displayImageUrl).then((p) => {
      if (!cancelled) setSampledPalette(p);
    });
    return () => {
      cancelled = true;
    };
  }, [useEventColours, displayImageUrl]);

  const frameStyle = useMemo<CSSProperties | undefined>(() => {
    if (!useEventColours || !sampledPalette) return undefined;

    // Always override both the regular and "-alt" button tokens with the
    // sampled primary. Different themes use different selectors for the
    // hero button — base/clean/bold/simple use --button-primary-background,
    // bright uses the same, and vivid/organic use --button-primary-background-alt.
    // Setting both means whichever one paints, it lands on our colour.
    const base: CSSProperties = {
      '--button-primary-background': sampledPalette.primary,
      '--button-primary-color': sampledPalette.primaryText,
      '--button-primary-background-alt': sampledPalette.primary,
      '--button-primary-color-alt': sampledPalette.primaryText
    } as CSSProperties;

    // Themes with an accent strip behind the hero text — colour the strip
    // with the sampled primary AND override the buttons to use the
    // contrasting accent so they pop against the strip.
    const altThemes: ThemeId[] = ['vivid', 'organic', 'bright'];
    if (altThemes.includes(theme)) {
      // Pick the darker of primary/accent for the button so it's never a
      // washed-out white/pale; if both are too light, fall back to a deep
      // grey so the button stays legible against the strip.
      const buttonBg = darkerForButton(sampledPalette.primary, sampledPalette.accent);
      return {
        '--background-color-alt': sampledPalette.primary,
        '--text-color-alt': sampledPalette.primaryText,
        '--button-primary-background': buttonBg,
        '--button-primary-color': textOnHex(buttonBg),
        '--button-primary-background-alt': buttonBg,
        '--button-primary-color-alt': textOnHex(buttonBg)
      } as CSSProperties;
    }
    return base;
  }, [useEventColours, sampledPalette, theme]);

  function handleBuyClick() {
    setTab(hasDateStep ? 'date' : 'tickets');
    const section = document.querySelector('.tt-preview-section');
    if (section) {
      const top = section.getBoundingClientRect().top + window.scrollY - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  }

  function pickDate(iso: string) {
    setSelectedOccurrenceIso(iso);
    setTab('tickets');
  }

  const selectedOccurrence =
    occurrences.find((o) => o.startIso === selectedOccurrenceIso) ?? occurrences[0] ?? null;

  return (
    <>
    <section className="tt-preview-section">
      <div className="tt-preview-main">
        <nav className="tt-preview-tabs" role="tablist" aria-label="Preview view">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'page'}
            className={`tt-preview-tab${tab === 'page' ? ' tt-preview-tab--active' : ''}`}
            onClick={() => setTab('page')}
          >
            <i className="fa-solid fa-image" aria-hidden="true" /> Event page
          </button>
          {hasDateStep ? (
            <button
              type="button"
              role="tab"
              aria-selected={tab === 'date'}
              className={`tt-preview-tab${tab === 'date' ? ' tt-preview-tab--active' : ''}`}
              onClick={() => setTab('date')}
            >
              <i className="fa-solid fa-calendar-days" aria-hidden="true" /> Dates
            </button>
          ) : null}
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'tickets'}
            className={`tt-preview-tab${tab === 'tickets' ? ' tt-preview-tab--active' : ''}`}
            onClick={() => setTab('tickets')}
          >
            <i className="fa-solid fa-ticket" aria-hidden="true" /> Tickets
          </button>
          <div className="tt-theme-pills" role="radiogroup" aria-label="Choose a theme">
            <span className="tt-theme-pills__label">Theme</span>
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={theme === t.id}
                className={`tt-theme-pill${theme === t.id ? ' tt-theme-pill--active' : ''}`}
                onClick={() => setTheme(t.id)}
                title={t.label}
              >
                <span
                  className={`tt-theme-pill__dot${t.accent === 'split-bw' ? ' tt-theme-pill__dot--split' : ''}`}
                  style={t.accent === 'split-bw' ? undefined : { background: t.accent }}
                  aria-hidden="true"
                />
                {t.label}
              </button>
            ))}
          </div>
          <div className="tt-theme-dropdown-wrap">
            <ThemeDropdown
              theme={theme}
              setTheme={setTheme}
              autoColorEnabled={hasUserPreview}
              autoColor={useEventColours}
              setAutoColor={setUseEventColours}
            />
          </div>
          {hasUserPreview ? (
            <span className="tt-tooltip-host">
              <button
                type="button"
                className={`tt-event-colours-toggle${useEventColours ? ' tt-event-colours-toggle--on' : ''}`}
                onClick={() => setUseEventColours((v) => !v)}
                aria-pressed={useEventColours}
                aria-describedby="auto-color-tooltip"
              >
                <i className="fa-solid fa-palette" aria-hidden="true" />
                <span>Auto color</span>
                <span className="tt-event-colours-toggle__switch" aria-hidden="true">
                  <span className="tt-event-colours-toggle__thumb" />
                </span>
              </button>
              <span className="tt-tooltip" role="tooltip" id="auto-color-tooltip">
                Pulls colours from your event image to style buttons and accents
                automatically. You can fully customise the look once you sign up.
              </span>
            </span>
          ) : null}
          </nav>

          <div className="tt-preview-frame" style={frameStyle}>
            <EventPreview
              preview={
                hasUserPreview
                  ? preview
                  : { ...preview, imageUrl: displayImageUrl }
              }
              onBuyClick={handleBuyClick}
              headerVariation={headerVariationFor(theme)}
            />
            {tab !== 'page' ? (
              <div
                className="tt-checkout-overlay"
                onClick={() => setTab('page')}
                role="presentation"
              >
                <div className="tt-checkout-overlay__panel" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="tt-checkout-overlay__close"
                    onClick={() => setTab('page')}
                    aria-label="Close"
                  >
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                  {tab === 'date' ? (
                    <SelectDateView
                      event={preview}
                      occurrences={occurrences}
                      selectedIso={selectedOccurrenceIso}
                      onPick={pickDate}
                    />
                  ) : (
                    <SelectTicketsView
                      event={preview}
                      occurrence={selectedOccurrence}
                      onBack={hasDateStep ? () => setTab('date') : undefined}
                    />
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </section>
      <div className="tt-sticky-cta tt-sticky-cta--visible">
        <span className="tt-sticky-cta__label">
          Like what you see? Bring your event over in minutes.
        </span>
        <a
          className="tt-button tt-button--peach"
          href={SIGN_UP_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          Import your event
        </a>
      </div>
    </>
  );
}
