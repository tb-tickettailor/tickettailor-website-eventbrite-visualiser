// Cloudflare Turnstile siteverify wrapper.
// Set TURNSTILE_SECRET (and NEXT_PUBLIC_TURNSTILE_SITE_KEY for the client) in
// .env.local. Without keys, the verifier returns true so local dev still works.

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET);
}

export async function verifyTurnstileToken(token: string, ip: string): Promise<boolean> {
  if (!turnstileEnabled()) return true;
  if (!token) return false;

  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET ?? '',
        response: token,
        remoteip: ip
      })
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
