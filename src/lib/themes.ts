export type ThemeId = 'base' | 'basic' | 'bold' | 'bright' | 'clean' | 'organic' | 'simple' | 'vivid';

export type HeaderVariation =
  | 'full-width'
  | 'full-bleed'
  | 'full-bleed-under-header'
  | 'side-by-side'
  | 'side-by-side-reverse';

export const THEMES: { id: ThemeId; label: string; headerVariation: HeaderVariation }[] = [
  { id: 'base', label: 'Base', headerVariation: 'full-width' },
  { id: 'basic', label: 'Basic', headerVariation: 'full-bleed' },
  { id: 'bold', label: 'Bold', headerVariation: 'full-bleed' },
  { id: 'bright', label: 'Bright', headerVariation: 'side-by-side-reverse' },
  { id: 'clean', label: 'Clean', headerVariation: 'full-width' },
  { id: 'organic', label: 'Organic', headerVariation: 'full-width' },
  { id: 'simple', label: 'Simple', headerVariation: 'full-width' },
  { id: 'vivid', label: 'Vivid', headerVariation: 'full-bleed' }
];

export const DEFAULT_THEME: ThemeId = 'base';

export function themeStylesheetUrl(id: ThemeId): string {
  return `/themes/${id}.css`;
}

export function headerVariationFor(id: ThemeId): HeaderVariation {
  return THEMES.find((t) => t.id === id)?.headerVariation ?? 'full-width';
}
