import { NextResponse } from 'next/server';
import { fetchEventbritePreview, isValidEventbriteUrl } from '@/lib/eventbrite';
import { checkRateLimit, clientIp } from '@/lib/rateLimit';
import { turnstileEnabled, verifyTurnstileToken } from '@/lib/turnstile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const ip = clientIp(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const url =
    typeof body === 'object' && body !== null && 'url' in body
      ? (body as { url: unknown }).url
      : null;
  const turnstileToken =
    typeof body === 'object' && body !== null && 'turnstileToken' in body
      ? (body as { turnstileToken: unknown }).turnstileToken
      : null;

  if (typeof url !== 'string' || url.length === 0) {
    return NextResponse.json({ error: 'Missing url' }, { status: 400 });
  }
  if (url.length > 500) {
    return NextResponse.json({ error: 'URL too long' }, { status: 400 });
  }

  if (!isValidEventbriteUrl(url)) {
    return NextResponse.json(
      {
        error:
          'That does not look like an Eventbrite URL. Expected e.g. https://www.eventbrite.com/e/...'
      },
      { status: 400 }
    );
  }

  // If a Turnstile token was supplied, verify it. A valid token bypasses the
  // rate limit (the user has just proved they're a human).
  let humanVerified = false;
  if (typeof turnstileToken === 'string' && turnstileToken.length > 0) {
    humanVerified = await verifyTurnstileToken(turnstileToken, ip);
    if (!humanVerified) {
      return NextResponse.json(
        { error: 'Captcha verification failed. Please try again.' },
        { status: 400 }
      );
    }
  }

  if (!humanVerified) {
    const limit = checkRateLimit(ip);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          error: 'Too many requests. Please complete the check below to continue.',
          requiresCaptcha: turnstileEnabled()
        },
        {
          status: 429,
          headers: { 'retry-after': String(Math.ceil(limit.retryAfterMs / 1000)) }
        }
      );
    }
  }

  try {
    const preview = await fetchEventbritePreview(url);
    return NextResponse.json({ preview });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: `Could not load that event: ${message}` }, { status: 502 });
  }
}
