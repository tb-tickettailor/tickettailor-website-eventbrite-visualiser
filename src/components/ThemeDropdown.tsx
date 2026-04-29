'use client';

import { useEffect, useRef, useState } from 'react';
import { THEMES, type ThemeId } from '@/lib/themes';

type Props = {
  theme: ThemeId;
  setTheme: (t: ThemeId) => void;
  autoColorEnabled?: boolean;
  autoColor?: boolean;
  setAutoColor?: (v: boolean) => void;
};

export function ThemeDropdown({
  theme,
  setTheme,
  autoColorEnabled = false,
  autoColor = false,
  setAutoColor
}: Props) {
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
          <span
            className={`tt-theme-pill__dot${current.accent === 'split-bw' ? ' tt-theme-pill__dot--split' : ''}`}
            style={current.accent === 'split-bw' ? undefined : { background: current.accent }}
            aria-hidden="true"
          />
          <strong>{current.label}</strong>
        </span>
        <i className="fa-solid fa-chevron-down" aria-hidden="true" />
      </button>

      {open ? (
        <div className="tt-theme-dropdown__panel" role="listbox">
          <div className="tt-theme-dropdown__pills">
            {THEMES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="option"
                aria-selected={theme === t.id}
                className={`tt-theme-pill${theme === t.id ? ' tt-theme-pill--active' : ''}`}
                onClick={() => {
                  setTheme(t.id);
                  setOpen(false);
                }}
              >
                <span
                  className={`tt-theme-pill__dot${t.accent === 'split-bw' ? ' tt-theme-pill__dot--split' : ''}`}
                  style={t.accent === 'split-bw' ? undefined : { background: t.accent }}
                  aria-hidden="true"
                />
                {t.label}
              </button>
            ))}
          </div>
          {autoColorEnabled && setAutoColor ? (
            <button
              type="button"
              className={`tt-theme-dropdown__auto${autoColor ? ' tt-theme-dropdown__auto--on' : ''}`}
              onClick={() => setAutoColor(!autoColor)}
              aria-pressed={autoColor}
            >
              <i className="fa-solid fa-palette" aria-hidden="true" />
              <span>Auto color</span>
              <span className="tt-event-colours-toggle__switch" aria-hidden="true">
                <span className="tt-event-colours-toggle__thumb" />
              </span>
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
