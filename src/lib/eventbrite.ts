export type EventbriteOccurrence = {
  start: string;
  end: string | null;
};

export type EventbritePriceRange = {
  currency: string;
  min: number;
  max: number;
  isFree: boolean;
};

export type EventbritePreview = {
  name: string;
  imageUrls: string[];
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  timezone: string | null;
  venueName: string | null;
  venueLocation: string | null;
  isOnline: boolean;
  imageUrl: string | null;
  sourceUrl: string;
  isSeries: boolean;
  occurrences: EventbriteOccurrence[];
  priceRange: EventbritePriceRange | null;
  organizerName: string | null;
};

const EVENTBRITE_HOST_SUFFIXES = [
  '.eventbrite.com',
  '.eventbrite.co.uk',
  '.eventbrite.ca',
  '.eventbrite.com.au',
  '.eventbrite.ie',
  '.eventbrite.de',
  '.eventbrite.fr',
  '.eventbrite.es',
  '.eventbrite.nl',
  '.eventbrite.it',
  '.eventbrite.pt',
  '.eventbrite.sg',
  '.eventbrite.hk',
  '.eventbrite.com.br',
  '.eventbrite.com.mx',
  '.eventbrite.com.ar'
];

export function isValidEventbriteUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:') return false;
    const host = u.hostname.toLowerCase();
    if (host === 'eventbrite.com' || host === 'www.eventbrite.com') return true;
    return EVENTBRITE_HOST_SUFFIXES.some((s) => host.endsWith(s));
  } catch {
    return false;
  }
}

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

export async function fetchEventbritePreview(url: string): Promise<EventbritePreview> {
  const res = await fetch(url, {
    headers: { 'user-agent': BROWSER_UA, accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow'
  });

  if (!res.ok) {
    throw new Error(`Eventbrite returned ${res.status}`);
  }

  const html = await res.text();
  const finalUrl = res.url || url;

  const isSeries = /"isSeries"\s*:\s*true/.test(html);
  const organizerName = extractOrganizerName(html);
  const eventId = extractEventIdFromUrl(finalUrl);
  const apiHost = extractApiHost(finalUrl);

  const base = parseEventFromHtml(html, finalUrl);
  const galleryImages = extractGalleryImages(html);

  // Use the gallery for slideshow if it has multiple, else fall back to the
  // single JSON-LD image. Always put the JSON-LD image first if present.
  const imageUrls: string[] = (() => {
    if (galleryImages.length > 1) return galleryImages;
    if (base.imageUrl) return [base.imageUrl];
    return galleryImages;
  })();

  let occurrences: EventbriteOccurrence[] = [];
  let priceRange: EventbritePriceRange | null = null;
  if (eventId) {
    const apiData = await fetchDestinationEvent(apiHost, eventId);
    if (isSeries) occurrences = apiData.occurrences;
    priceRange = apiData.priceRange;
  }

  return { ...base, imageUrls, isSeries, occurrences, priceRange, organizerName };
}

// Pull all gallery images from the embedded "images":[{ url:... },...] block
// in the page HTML. We use the largest signed variant available for each.
function extractGalleryImages(html: string): string[] {
  // Find each `"images":[ ... ]` block and pull out the `url` field of each
  // entry, plus its largest cropped variant if present.
  const out: string[] = [];
  const blockRe = /"images"\s*:\s*\[(.*?)\]/g;
  let block: RegExpExecArray | null;
  while ((block = blockRe.exec(html)) !== null) {
    const inner = block[1];
    // Each image is its own object — match the leading `"url"` plus optional
    // larger cropped variants. Prefer the largest image we can find for each.
    const objRe = /\{[^}]*?"url"\s*:\s*"([^"]*)"[^}]*?\}/g;
    let obj: RegExpExecArray | null;
    while ((obj = objRe.exec(inner)) !== null) {
      const raw = obj[0];
      // Try the biggest cropped variant first, fall back to plain url.
      const big =
        raw.match(/"croppedLogoUrl1880"\s*:\s*"([^"]+)"/)?.[1] ??
        raw.match(/"croppedLogoUrl940"\s*:\s*"([^"]+)"/)?.[1] ??
        obj[1];
      if (big && big.length > 0) {
        const decoded = decodeJsonString(big);
        const upscaled = upscaleImage(decoded);
        if (upscaled && !out.includes(upscaled)) out.push(upscaled);
      }
    }
    if (out.length > 0) break;
  }
  return out;
}

function decodeJsonString(s: string): string {
  // Handle the \u003 etc. encodings that come from JSON embedded in HTML.
  return s.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
}

function extractOrganizerName(html: string): string | null {
  const match = html.match(/"organizer":\{[^}]*?"name":"((?:[^"\\]|\\.)*)"/);
  if (!match) return null;
  try {
    return JSON.parse(`"${match[1]}"`);
  } catch {
    return match[1];
  }
}

function extractEventIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/e\/(?:[^/]*-)?(\d{8,20})\/?/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

function extractApiHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'www.eventbrite.com';
  }
}

type DestinationPrice = {
  currency?: string;
  major_value?: string;
  value?: number;
};

type DestinationEventResponse = {
  events?: Array<{
    is_free?: boolean;
    series?: {
      next_dates?: Array<{
        start?: string;
        end?: string;
      }>;
    };
    ticket_availability?: {
      minimum_ticket_price?: DestinationPrice;
      maximum_ticket_price?: DestinationPrice;
      is_free?: boolean;
    };
  }>;
};

async function fetchDestinationEvent(
  host: string,
  eventId: string
): Promise<{ occurrences: EventbriteOccurrence[]; priceRange: EventbritePriceRange | null }> {
  const apiUrl = `https://${host}/api/v3/destination/events/?event_ids=${eventId}&expand=series,ticket_availability`;
  try {
    const res = await fetch(apiUrl, {
      headers: { 'user-agent': BROWSER_UA, accept: 'application/json' }
    });
    if (!res.ok) return { occurrences: [], priceRange: null };
    const data = (await res.json()) as DestinationEventResponse;
    const event = data.events?.[0];

    const occurrences = (event?.series?.next_dates ?? [])
      .filter((d): d is { start: string; end?: string } => typeof d.start === 'string')
      .map((d) => ({ start: d.start, end: d.end ?? null }));

    const min = parseDestinationPrice(event?.ticket_availability?.minimum_ticket_price);
    const max = parseDestinationPrice(event?.ticket_availability?.maximum_ticket_price);

    const isFree =
      event?.is_free === true || event?.ticket_availability?.is_free === true;

    let priceRange: EventbritePriceRange | null = null;
    if (isFree) {
      priceRange = { currency: min?.currency ?? 'USD', min: 0, max: 0, isFree: true };
    } else if (min) {
      priceRange = {
        currency: min.currency,
        min: min.value,
        max: max?.value ?? min.value,
        isFree: false
      };
    }

    return { occurrences, priceRange };
  } catch {
    return { occurrences: [], priceRange: null };
  }
}

function parseDestinationPrice(p: DestinationPrice | undefined): { currency: string; value: number } | null {
  if (!p || typeof p.currency !== 'string') return null;
  const value =
    typeof p.major_value === 'string' && !Number.isNaN(Number(p.major_value))
      ? Number(p.major_value)
      : typeof p.value === 'number'
        ? p.value / 100
        : null;
  if (value === null) return null;
  return { currency: p.currency, value };
}

function parseEventFromHtml(html: string, finalUrl: string): Omit<EventbritePreview, 'isSeries' | 'occurrences' | 'priceRange' | 'organizerName' | 'imageUrls'> {
  const jsonLd = extractJsonLdEvent(html);
  if (jsonLd) {
    return jsonLdToPreview(jsonLd, finalUrl);
  }

  const og = extractOpenGraph(html);
  return {
    name: og.title ?? 'Untitled event',
    description: og.description ?? null,
    startDate: null,
    endDate: null,
    timezone: null,
    venueName: null,
    venueLocation: null,
    isOnline: false,
    imageUrl: upscaleImage(og.image ?? null),
    sourceUrl: finalUrl
  };
}

type JsonLdEvent = {
  '@type'?: string | string[];
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  image?: string | Array<string | { url?: string }> | { url?: string };
  eventAttendanceMode?: string;
  location?: JsonLdLocation | JsonLdLocation[] | string;
  url?: string;
};

type JsonLdLocation = {
  '@type'?: string;
  name?: string;
  address?: string | JsonLdAddress;
  url?: string;
};

type JsonLdAddress = {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
};

function extractJsonLdEvent(html: string): JsonLdEvent | null {
  const regex = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const raw = match[1].trim();
    try {
      const parsed = JSON.parse(raw) as JsonLdEvent | JsonLdEvent[] | { '@graph'?: JsonLdEvent[] };
      const candidates: JsonLdEvent[] = Array.isArray(parsed)
        ? parsed
        : '@graph' in parsed && Array.isArray(parsed['@graph'])
          ? parsed['@graph']
          : [parsed as JsonLdEvent];

      for (const item of candidates) {
        if (isEventType(item['@type'])) return item;
      }
    } catch {
      // ignore malformed JSON-LD blocks
    }
  }
  return null;
}

// Schema.org event types we want to recognise. Includes the base "Event" type
// plus all the well-known subtypes we'd actually encounter on Eventbrite.
const EVENT_TYPE_HINTS = [
  'event',
  'festival',
  'concert',
  'exhibition',
  'screening',
  'conference',
  'workshop'
];

function isEventType(type: string | string[] | undefined): boolean {
  if (!type) return false;
  const types = Array.isArray(type) ? type : [type];
  return types.some(
    (t) =>
      typeof t === 'string' &&
      EVENT_TYPE_HINTS.some((hint) => t.toLowerCase().includes(hint))
  );
}

function jsonLdToPreview(
  event: JsonLdEvent,
  sourceUrl: string
): Omit<EventbritePreview, 'isSeries' | 'occurrences' | 'priceRange' | 'organizerName' | 'imageUrls'> {
  const image = pickImage(event.image);
  const { venueName, venueLocation, isOnline } = extractLocation(event);

  return {
    name: event.name?.trim() || 'Untitled event',
    description: stripHtml(event.description) || null,
    startDate: event.startDate ?? null,
    endDate: event.endDate ?? null,
    timezone: null,
    venueName,
    venueLocation,
    isOnline:
      isOnline ||
      event.eventAttendanceMode?.toLowerCase().includes('online') === true,
    imageUrl: upscaleImage(image),
    sourceUrl
  };
}

// Eventbrite has a few flavours of image URL we need to unwrap to get a
// fetchable, full-resolution cdn.evbuc.com URL:
//
//   1. img.evbuc.com/<encoded cdn URL>?... — the standard signed proxy
//   2. /e/_next/image?url=<encoded img.evbuc.com URL>&w=...&q=... — relative
//      Next.js image proxy used on some marketing pages
//
// Walk the chain until we hit the underlying cdn.evbuc.com URL.
function upscaleImage(url: string | null): string | null {
  if (!url) return null;

  let current: string | null = url;

  // Resolve relative `/e/_next/image?url=...` against the eventbrite domain
  // so we can parse it.
  if (current.startsWith('/')) {
    try {
      current = new URL(current, 'https://www.eventbrite.com').toString();
    } catch {
      return url;
    }
  }

  for (let i = 0; i < 4; i++) {
    let parsed: URL;
    try {
      parsed = new URL(current);
    } catch {
      return current;
    }

    // Already at the source — done.
    if (parsed.hostname === 'cdn.evbuc.com') return current;

    // Next.js image proxy: ?url=<encoded inner URL>
    if (parsed.pathname.includes('_next/image')) {
      const inner = parsed.searchParams.get('url');
      if (!inner) return current;
      current = inner;
      continue;
    }

    // img.evbuc.com proxy: path is encoded cdn URL
    if (parsed.hostname === 'img.evbuc.com') {
      const decoded = decodeURIComponent(parsed.pathname.replace(/^\//, ''));
      if (decoded.startsWith('https://cdn.evbuc.com/')) {
        return decoded;
      }
      return current;
    }

    return current;
  }

  return current;
}

function pickImage(image: JsonLdEvent['image']): string | null {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) {
    const first = image[0];
    if (typeof first === 'string') return first;
    if (first && typeof first === 'object' && 'url' in first && typeof first.url === 'string') {
      return first.url;
    }
    return null;
  }
  if (typeof image === 'object' && 'url' in image && typeof image.url === 'string') {
    return image.url;
  }
  return null;
}

function extractLocation(event: JsonLdEvent): {
  venueName: string | null;
  venueLocation: string | null;
  isOnline: boolean;
} {
  const loc = Array.isArray(event.location) ? event.location[0] : event.location;
  if (!loc) return { venueName: null, venueLocation: null, isOnline: false };
  if (typeof loc === 'string') return { venueName: null, venueLocation: loc, isOnline: false };

  const isOnline = loc['@type']?.toLowerCase() === 'virtuallocation';
  const venueName = loc.name ?? null;

  let venueLocation: string | null = null;
  if (typeof loc.address === 'string') {
    venueLocation = loc.address;
  } else if (loc.address && typeof loc.address === 'object') {
    const a = loc.address;
    venueLocation = [a.streetAddress, a.addressLocality, a.addressRegion, a.postalCode, a.addressCountry]
      .filter((p): p is string => typeof p === 'string' && p.length > 0)
      .join(', ') || null;
  }

  return { venueName, venueLocation, isOnline };
}

function extractOpenGraph(html: string): { title: string | null; description: string | null; image: string | null } {
  return {
    title: metaContent(html, 'og:title') ?? metaContent(html, 'twitter:title'),
    description: metaContent(html, 'og:description') ?? metaContent(html, 'twitter:description'),
    image: metaContent(html, 'og:image') ?? metaContent(html, 'twitter:image')
  };
}

function metaContent(html: string, property: string): string | null {
  const escaped = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+property=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+name=["']${escaped}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${escaped}["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${escaped}["']`, 'i')
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return decodeHtmlEntities(m[1]);
  }
  return null;
}

function stripHtml(input: string | undefined): string {
  if (!input) return '';
  return decodeHtmlEntities(input.replace(/<[^>]*>/g, ' ')).replace(/\s+/g, ' ').trim();
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ');
}
