export type ThemeId = 'base' | 'basic' | 'bold' | 'bright' | 'clean' | 'organic' | 'simple' | 'vivid';

export type HeaderVariation =
  | 'full-width'
  | 'full-bleed'
  | 'full-bleed-under-header'
  | 'side-by-side'
  | 'side-by-side-reverse';

export type ThemeMeta = {
  id: ThemeId;
  label: string;
  headerVariation: HeaderVariation;
  accent: string;
};

export const THEMES: ThemeMeta[] = [
  { id: 'clean', label: 'Clean', headerVariation: 'full-width', accent: '#3a3a3a' },
  { id: 'base', label: 'Base', headerVariation: 'full-width', accent: '#222222' },
  { id: 'bold', label: 'Bold', headerVariation: 'full-bleed', accent: '#0b0a0a' },
  { id: 'bright', label: 'Bright', headerVariation: 'side-by-side-reverse', accent: '#d5ff01' },
  { id: 'organic', label: 'Organic', headerVariation: 'full-width', accent: '#7a6f56' },
  { id: 'simple', label: 'Simple', headerVariation: 'full-width', accent: 'split-bw' },
  { id: 'vivid', label: 'Vivid', headerVariation: 'full-bleed', accent: '#ff527e' }
];

export const DEFAULT_THEME: ThemeId = 'clean';

export function themeStylesheetUrl(id: ThemeId): string {
  return `/themes/${id}.css`;
}

export function headerVariationFor(id: ThemeId): HeaderVariation {
  return THEMES.find((t) => t.id === id)?.headerVariation ?? 'full-width';
}
