import { checkRateLimit, clientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_HOSTS = [
  'cdn.evbuc.com',
  'img.evbuc.com',
  'images.unsplash.com',
  'res.cloudinary.com'
];

export async function GET(request: Request) {
  const ip = clientIp(request);
  const limit = checkRateLimit(ip);
  if (!limit.allowed) {
    return new Response('Too many requests', {
      status: 429,
      headers: { 'retry-after': String(Math.ceil(limit.retryAfterMs / 1000)) }
    });
  }

  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');
  if (!target) return new Response('Missing url', { status: 400 });

  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }
  if (parsed.protocol !== 'https:') {
    return new Response('Only https allowed', { status: 400 });
  }
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    return new Response('Host not allowed', { status: 400 });
  }

  const upstream = await fetch(target, {
    headers: { accept: 'image/*' }
  });
  if (!upstream.ok || !upstream.body) {
    return new Response(`Upstream ${upstream.status}`, { status: 502 });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'image/jpeg',
      'cache-control': 'public, max-age=86400',
      'access-control-allow-origin': '*'
    }
  });
}
