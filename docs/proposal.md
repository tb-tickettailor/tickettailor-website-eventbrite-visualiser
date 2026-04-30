# Eventbrite Event Visualiser

A marketing tool: prospect pastes a public Eventbrite URL, we show their event styled in Ticket Tailor's themes. Hook to drive sign-ups.

**Live:** `eventbrite-preview.vercel.app`
**Repo:** `github.com/tb-tickettailor/tickettailor-website-eventbrite-visualiser`

## How it works

Next.js app on Vercel. Two API routes:

1. **Fetch event** — server fetches the public Eventbrite page, parses the JSON-LD block for name/dates/image/venue. For recurring events, also hits Eventbrite's public destination API for upcoming dates and price.
2. **Image proxy** — only used when "auto color" is on, so we can read pixels from the event image without CORS issues.

Both Eventbrite endpoints are public and don't need an API key. No DB, no auth, no user state.

## Security

Main risk: someone using us as a scraping proxy. Mitigations:

- URL must be an Eventbrite domain (allowlist)
- Per-IP rate limit: 15 requests/min on both routes
- Cloudflare Turnstile shown when rate limit fires
- Image proxy locked to 4 known image hosts
- HTTPS only, no PII stored or logged

## Cost

Free. Vercel free tier, no Eventbrite API charges.

## Where it lives next

Three options, in order of effort:

1. **Leave on Vercel** — simplest, already deployed, free, separate URL
2. **Move to wherever we host the marketing site, but keep it standalone** — single hosting setup, still its own subdomain/path, no merge
3. **Merge into `tickettailor-website`** — same Next.js + SASS stack as the marketing repo, drops in as a route or Prismic slice
