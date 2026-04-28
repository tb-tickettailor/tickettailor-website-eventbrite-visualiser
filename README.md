# Eventbrite Preview

Standalone prototype: paste an Eventbrite URL, see what the event would look
like rendered on Ticket Tailor's themes. Marketing-site hook, not a real
import. CTA goes to `https://app.tickettailor.com/sign-up`.

## Stack

- Next.js 15 (app router)
- TypeScript (strict)
- SASS

Mirrors the `tickettailor-website` stack so it can be merged in later.

## Local dev

```sh
npm install
npm run dev
```

Open http://localhost:3000.

## How it works

1. User pastes an Eventbrite URL
2. Client POSTs `/api/fetch-eventbrite`
3. Server-side route fetches the public event page, parses JSON-LD + the
   destination API for series occurrences and ticket prices
4. Preview renders using the copied base/basic/bold/bright/clean/organic/
   simple/vivid theme styles
5. Tabs (Event page / Pick a date / Tickets) switch the preview view; the
   date and tickets views overlay the page to mimic the real checkout modal

## Deploying on Vercel

This app needs both static frontend and a Node API route, so:

1. Push this repo to GitHub
2. Import the repo in Vercel
3. Set env vars (optional, for Turnstile captcha):
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
   - `TURNSTILE_SECRET`
4. Deploy

Without Turnstile keys, the per-IP rate limit still works (15 req/min) but
no captcha fallback when exceeded.

## Style source

Styles + fonts copied from `~/workspace/app/master/public/assets/checkout/`.
Theme thumbnails from
`~/workspace/app/master/public/assets/dashboard/img/box-office-themes/`.
