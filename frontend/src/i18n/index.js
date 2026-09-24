// Tiny language layer for the public site (English / Hindi).
//
// Usage in a component:
//   const { t, lang, setLang } = useT();
//   <h1>{t('Our Solar Services')}</h1>
//   t('Hello {name}', { name })        // placeholders
//
// The English text itself is the key. If a Hindi translation is missing the
// English text is shown, so nothing ever breaks. Translations live in
// ./hi/*.json (one file per area of the site) and are merged below.
// Values from the database (service names, site settings, etc.) can also be
// passed through t(): the default ones are translated, anything an admin
// types later simply stays as typed.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import HI from './hi';

const STORAGE_KEY = 'sologix_lang';
const LANGS = ['en', 'hi'];

function readInitial() {
  try {
    const q = new URLSearchParams(window.location.search).get('lang');
    if (LANGS.includes(q)) return q;               // shareable link: ?lang=hi
  } catch (e) { /* ignore */ }
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    if (LANGS.includes(v)) return v;               // remembered choice
  } catch (e) { /* storage blocked */ }
  return 'en';
}

const fill = (s, vars) => (vars ? s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : m)) : s);

function translate(lang, text, vars) {
  if (typeof text !== 'string' || text === '') return text;
  if (lang === 'hi') {
    const hit = HI[text] ?? HI[text.trim()];
    if (hit) return fill(hit, vars);
  }
  return fill(text, vars);
}

const LangContext = createContext({ lang: 'en', setLang: () => {}, t: (s, v) => translate('en', s, v), locale: 'en-IN' });

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readInitial);

  const setLang = useCallback((l) => {
    if (!LANGS.includes(l)) return;
    setLangState(l);
    try { window.localStorage.setItem(STORAGE_KEY, l); } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang === 'hi' ? 'hi' : 'en';
  }, [lang]);

  const value = useMemo(() => ({
    lang,
    setLang,
    t: (s, v) => translate(lang, s, v),
    locale: lang === 'hi' ? 'hi-IN' : 'en-IN',   // for toLocaleDateString etc.
  }), [lang, setLang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useT = () => useContext(LangContext);
