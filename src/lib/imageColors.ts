// Sample dominant colours from an image and derive theme overrides.
// Image is loaded via our /api/proxy-image route to bypass CORS canvas taint.

import { getPalette } from 'colorthief';

export type SampledPalette = {
  primary: string;
  primaryText: string;
  accent: string;
};

export async function samplePalette(imageUrl: string): Promise<SampledPalette | null> {
  try {
    const img = await loadImage(imageUrl);
    // Downscale to ~400px max edge before sampling so we don't churn through
    // 2-megapixel hero images. Cuts sampling time from seconds to ~50ms with
    // basically no impact on the resulting palette.
    const small = downscale(img, 400);
    const palette = (await getPalette(small, { colorCount: 12, quality: 5 })) ?? [];
    if (palette.length === 0) return null;

    const colors = palette
      .map((c) => {
        const hex = c.hex();
        const rgb = hexToRgb(hex);
        if (!rgb) return null;
        return { hex, ...rgbToHsl(rgb) };
      })
      .filter((x): x is { hex: string; h: number; s: number; l: number } => x !== null);

    if (colors.length === 0) return null;

    // Pick the most "branded" colour: prefer high saturation, penalise pale
    // tints (very light) and dark shades. We want the bright pop hue.
    const candidates = colors.filter((c) => c.l >= 0.25 && c.l <= 0.7 && c.s >= 0.3);
    const pool = candidates.length > 0 ? candidates : colors;

    const primary = pool
      .map((c) => {
        // Strong saturation weight; quadratic penalty for distance from
        // ideal mid-lightness (0.5). Hard-discard near-grey tones.
        const ldist = Math.abs(c.l - 0.5);
        const score = c.s * 3 - ldist * ldist * 4;
        return { ...c, score };
      })
      .sort((a, b) => b.score - a.score)[0];

    // Accent: pick the most distant hue/lightness from primary so it
    // contrasts visually.
    const accent = colors
      .filter((c) => c.hex !== primary.hex)
      .map((c) => {
        const hueDiff = Math.min(Math.abs(c.h - primary.h), 1 - Math.abs(c.h - primary.h));
        const distance = hueDiff * 2 + Math.abs(c.l - primary.l);
        return { ...c, score: distance };
      })
      .sort((a, b) => b.score - a.score)[0];

    return {
      primary: primary.hex,
      primaryText: textOn(primary.hex),
      accent: accent?.hex ?? primary.hex
    };
  } catch {
    return null;
  }
}

function downscale(img: HTMLImageElement, maxEdge: number): HTMLCanvasElement | HTMLImageElement {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const longest = Math.max(w, h);
  if (longest <= maxEdge) return img;
  const scale = maxEdge / longest;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return img;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  const proxied = `/api/proxy-image?url=${encodeURIComponent(url)}`;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image load failed'));
    img.src = proxied;
  });
}

// WCAG-ish: pick black or white text depending on luminance.
export function textOnHex(hex: string): string {
  return textOn(hex);
}

// Derive a button colour that contrasts with the strip colour `bg`.
// 1. If we have a candidate (`alt`) that's noticeably darker than the strip,
//    use it.
// 2. Otherwise darken the strip's own hue until it's clearly darker, so the
//    button still feels related but pops.
// 3. If everything ends up too light, fall back to a deep neutral.
export function darkerForButton(bg: string, alt: string): string {
  const lBg = luminance(bg);
  const lAlt = luminance(alt);
  const MIN_GAP = 0.25; // contrast headroom we want vs the strip

  if (lAlt < lBg - MIN_GAP && lAlt < 0.45) return alt;

  // Darken bg by reducing its HSL lightness until it's well below the strip.
  const darkened = darkenHex(bg, 0.55);
  if (luminance(darkened) < lBg - MIN_GAP) return darkened;

  return '#1c232b';
}

function darkenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#1c232b';
  const hsl = rgbToHsl(rgb);
  const newL = Math.max(0.12, hsl.l * (1 - amount));
  return hslToHex(hsl.h, hsl.s, newL);
}

function hslToHex(h: number, s: number, l: number): string {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 1 / 6) [r, g, b] = [c, x, 0];
  else if (h < 2 / 6) [r, g, b] = [x, c, 0];
  else if (h < 3 / 6) [r, g, b] = [0, c, x];
  else if (h < 4 / 6) [r, g, b] = [0, x, c];
  else if (h < 5 / 6) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to255 = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return '#' + to255(r) + to255(g) + to255(b);
}

function luminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 1;
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function textOn(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#1c232b';
  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.5 ? '#1c232b' : '#ffffff';
}

function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace('#', '').match(/^([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

function rgbToHsl([r, g, b]: [number, number, number]): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h, s, l };
}
