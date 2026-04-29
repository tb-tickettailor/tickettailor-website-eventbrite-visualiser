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
  sampleImage: string;
};

const UNSPLASH = (id: string) =>
  `https://images.unsplash.com/${id}?w=2000&q=80&auto=format&fit=crop`;

export const THEMES: ThemeMeta[] = [
  {
    id: 'base',
    label: 'Base',
    headerVariation: 'full-width',
    accent: '#ffffff',
    sampleImage: UNSPLASH('photo-1492684223066-81342ee5ff30')
  },
  {
    id: 'bold',
    label: 'Bold',
    headerVariation: 'full-bleed',
    accent: '#0b0a0a',
    sampleImage: UNSPLASH('photo-1429962714451-bb934ecdc4ec')
  },
  {
    id: 'bright',
    label: 'Bright',
    headerVariation: 'side-by-side-reverse',
    accent: '#d5ff01',
    sampleImage: UNSPLASH('photo-1459749411175-04bf5292ceea')
  },
  {
    id: 'organic',
    label: 'Organic',
    headerVariation: 'full-width',
    accent: '#7a6f56',
    sampleImage: UNSPLASH('photo-1470770841072-f978cf4d019e')
  },
  {
    id: 'clean',
    label: 'Clean',
    headerVariation: 'full-width',
    accent: '#3a3a3a',
    sampleImage: UNSPLASH('photo-1540575467063-178a50c2df87')
  },
  {
    id: 'simple',
    label: 'Simple',
    headerVariation: 'full-width',
    accent: 'split-bw',
    sampleImage: UNSPLASH('photo-1511795409834-ef04bbd61622')
  },
  {
    id: 'vivid',
    label: 'Vivid',
    headerVariation: 'full-bleed',
    accent: '#ff527e',
    sampleImage: UNSPLASH('photo-1493676304819-0d7a8d026dcf')
  }
];

export const DEFAULT_THEME: ThemeId = 'base';

export function themeStylesheetUrl(id: ThemeId): string {
  return `/themes/${id}.css`;
}

export function headerVariationFor(id: ThemeId): HeaderVariation {
  return THEMES.find((t) => t.id === id)?.headerVariation ?? 'full-width';
}

export function sampleImageFor(id: ThemeId): string {
  return (
    THEMES.find((t) => t.id === id)?.sampleImage ??
    'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=2000&q=80&auto=format&fit=crop'
  );
}
