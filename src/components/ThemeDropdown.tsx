'use client';

import { useEffect, useRef, useState } from 'react';
import { THEMES, type ThemeId } from '@/lib/themes';

type Props = {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
};

export function ThemeDropdown({ theme, setTheme }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const current = THEMES.find((t) => t.id === theme) ?? THEMES[0];

  return (
    <div className="tt-theme-dropdown" ref={ref}>
      <button
        type="button"
        className="tt-theme-dropdown__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="tt-theme-dropdown__trigger-label">
          <span className="tt-theme-dropdown__trigger-prefix">Theme</span>
          <strong>{current.label}</strong>
        </span>
        <i className="fa-solid fa-chevron-down" aria-hidden="true" />
      </button>

      {open ? (
        <div className="tt-theme-dropdown__panel" role="listbox">
          <ul className="tt-theme-dropdown__list">
            {THEMES.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  className={`tt-theme-card${theme === t.id ? ' tt-theme-card--active' : ''}`}
                  onClick={() => {
                    setTheme(t.id);
                    setOpen(false);
                  }}
                  aria-pressed={theme === t.id}
                  role="option"
                  aria-selected={theme === t.id}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/themes/thumbnails/${t.id}.png`}
                    alt=""
                    className="tt-theme-card__thumb"
                  />
                  <span className="tt-theme-card__label">{t.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
