import { useEffect } from 'react';

export const SITE_THEMES = [
  {
    id: 'emerald', name: 'Emerald Green', preview: '#006948',
    primary: '#006948', dark: '#004d34', hover: '#005a3c',
    light: '#f0fdf4', muted: '#dcfce7', border: '#86efac',
    accent: '#34d399', sectionBg: '#EFF6FF',
  },
  {
    id: 'ocean', name: 'Ocean Blue', preview: '#1d4ed8',
    primary: '#1d4ed8', dark: '#1e3a8a', hover: '#1e40af',
    light: '#eff6ff', muted: '#dbeafe', border: '#93c5fd',
    accent: '#60a5fa', sectionBg: '#eff6ff',
  },
  {
    id: 'forest', name: 'Forest', preview: '#15803d',
    primary: '#15803d', dark: '#14532d', hover: '#166534',
    light: '#f0fdf4', muted: '#dcfce7', border: '#86efac',
    accent: '#4ade80', sectionBg: '#f0fdf4',
  },
  {
    id: 'sunset', name: 'Sunset Orange', preview: '#c2410c',
    primary: '#c2410c', dark: '#9a3412', hover: '#b45309',
    light: '#fff7ed', muted: '#fed7aa', border: '#fdba74',
    accent: '#fb923c', sectionBg: '#fff7ed',
  },
  {
    id: 'violet', name: 'Royal Violet', preview: '#7c3aed',
    primary: '#7c3aed', dark: '#6d28d9', hover: '#5b21b6',
    light: '#f5f3ff', muted: '#ede9fe', border: '#c4b5fd',
    accent: '#a78bfa', sectionBg: '#f5f3ff',
  },
  {
    id: 'slate', name: 'Professional Slate', preview: '#334155',
    primary: '#334155', dark: '#1e293b', hover: '#1e293b',
    light: '#f8fafc', muted: '#e2e8f0', border: '#94a3b8',
    accent: '#64748b', sectionBg: '#f8fafc',
  },
];

export const getTheme = () => {
  try {
    const saved = localStorage.getItem('sologix_site_theme');
    const found = SITE_THEMES.find(t => t.id === saved);
    return found || SITE_THEMES[0];
  } catch { return SITE_THEMES[0]; }
};

const buildCSS = (t) => `
  :root {
    --sp: ${t.primary};
    --sphero-start: ${t.primary}e0;
    --sphero-end: ${t.dark}cc;
    --spd: ${t.dark};
    --sph: ${t.hover};
    --spl: ${t.light};
    --spm: ${t.muted};
    --spb: ${t.border};
    --spa: ${t.accent};
    --spsb: ${t.sectionBg};
  }

  /* ── Primary colour overrides ── */
  .text-\\[\\#006948\\]    { color: var(--sp) !important; }
  .bg-\\[\\#006948\\]      { background-color: var(--sp) !important; }
  .border-\\[\\#006948\\]  { border-color: var(--sp) !important; }
  .ring-\\[\\#006948\\]    { --tw-ring-color: var(--sp) !important; }
  .from-\\[\\#006948\\]    { --tw-gradient-from: var(--sp) !important; }
  .to-\\[\\#006948\\]      { --tw-gradient-to: var(--sp) !important; }
  .bg-\\[\\#006948\\]\\/10 { background-color: color-mix(in srgb, var(--sp) 10%, transparent) !important; }

  .hover\\:bg-\\[\\#006948\\]:hover   { background-color: var(--spd) !important; }
  .hover\\:text-\\[\\#006948\\]:hover { color: var(--sp) !important; }
  .hover\\:border-\\[\\#006948\\]:hover { border-color: var(--sp) !important; }
  .focus\\:ring-\\[\\#006948\\]:focus  { --tw-ring-color: var(--sp) !important; }
  .hover\\:bg-green-700:hover { background-color: var(--spd) !important; }
  .hover\\:bg-green-600:hover { background-color: var(--sph) !important; }

  /* Green Tailwind overrides */
  .text-green-600  { color: var(--sp) !important; }
  .text-green-700  { color: var(--spd) !important; }
  .bg-green-600    { background-color: var(--sp) !important; }
  .bg-green-700    { background-color: var(--spd) !important; }
  .bg-green-50     { background-color: var(--spl) !important; }
  .bg-green-100    { background-color: var(--spm) !important; }
  .border-green-200 { border-color: var(--spb) !important; }
  .border-green-300 { border-color: var(--spb) !important; }
  .border-green-600 { border-color: var(--sp) !important; }
  .text-green-400  { color: var(--spa) !important; }
  .text-\\[\\#34d399\\] { color: var(--spa) !important; }
  .text-\\[\\#68dba9\\] { color: var(--spa) !important; }
  .focus\\:ring-green-500:focus { --tw-ring-color: var(--sp) !important; }
  .hover\\:border-green-300:hover { border-color: var(--spb) !important; }
  .hover\\:border-green-500:hover { border-color: var(--sp) !important; }
  .hover\\:text-green-700:hover { color: var(--spd) !important; }
  .ring-green-600  { --tw-ring-color: var(--sp) !important; }
  .ring-4.ring-\\[\\#006948\\] { --tw-ring-color: var(--sp) !important; }
  .ring-\\[\\#006948\\]\\/30 { --tw-ring-color: color-mix(in srgb, var(--sp) 30%, transparent) !important; }

  /* Section backgrounds */
  .bg-\\[\\#EFF6FF\\] { background-color: var(--spsb) !important; }

  /* Gradient overrides */
  .from-\\[\\#e9edff\\]  { --tw-gradient-from: var(--spm) !important; }
  .to-\\[\\#d1fae5\\]    { --tw-gradient-to: var(--spl) !important; }


  /* Hero overlay responds to theme */
  [data-theme-hero] {
    background: linear-gradient(135deg, color-mix(in srgb, var(--sp) 88%, black) 0%, color-mix(in srgb, var(--spd) 85%, black) 50%, color-mix(in srgb, var(--spd) 75%, black) 100%) !important;
  }

  /* Accent text in footer */
  .text-\\[\\#34d399\\] { color: var(--spa) !important; }
  /* ── Global heading size & darkness boost (only non-white headings) ── */
  .text-gray-800 { color: #111827 !important; }
  .text-gray-700 { color: #1f2937 !important; }
  .text-4xl { font-size: 2.4rem !important; }
  .text-3xl { font-size: 2rem !important; }
  .text-2xl { font-size: 1.6rem !important; }

`;

const ThemeProvider = ({ children }) => {
  useEffect(() => {
    const applyCSS = () => {
      const t = getTheme();
      let style = document.getElementById('sologix-site-theme');
      if (!style) {
        style = document.createElement('style');
        style.id = 'sologix-site-theme';
        document.head.appendChild(style);
      }
      style.textContent = buildCSS(t);
    };
    applyCSS();
    // Sync from DB max once per hour to avoid slowing every page load
    const lastSync = localStorage.getItem('sologix_theme_sync');
    const oneHour = 60 * 60 * 1000;
    if (!lastSync || Date.now() - parseInt(lastSync) > oneHour) {
      fetch('/api/site-settings')
        .then(r => r.json())
        .then(d => {
          const saved = d.data && d.data.site_theme;
          if (saved && saved !== localStorage.getItem('sologix_site_theme')) {
            localStorage.setItem('sologix_site_theme', saved);
            applyCSS();
          }
          localStorage.setItem('sologix_theme_sync', Date.now().toString());
        })
        .catch(() => {});
    }
    window.addEventListener('sologix-theme-change', applyCSS);
    return () => window.removeEventListener('sologix-theme-change', applyCSS);
  }, []);

  return children;
};

export const applyTheme = (themeId) => {
  localStorage.setItem('sologix_site_theme', themeId);
  window.dispatchEvent(new Event('sologix-theme-change'));
};

export default ThemeProvider;
