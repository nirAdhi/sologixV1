// Homepage content that the admin edits in Admin > Site Content
// (GET /api/site-settings). Loaded ONCE per page load and shared by every
// component (HomePage, About, ThemeProvider ...), so there is only one request.
//
//   const { data, loaded, failed, pick } = useSiteContent();
//   const stats = pick('stats', DEFAULT_STATS);
//
// pick(key, default):
//   - request failed / still loading / key never saved  -> default
//   - key saved as an array (even an empty one)          -> that array
//   - anything malformed (object, number, bad JSON ...)  -> default
// An empty array means the admin removed every item on purpose: the page hides
// that block instead of showing the defaults.
//
// The DEFAULT_* lists below are the single source of truth for the built-in
// content: the homepage shows them when nothing was saved, and the admin page
// uses them for "Restore defaults". Their English texts are the keys of the
// Hindi translations in i18n/hi/home.json, so keep them word-for-word.
import { useEffect, useState } from 'react';

export const DEFAULT_STATS = [
  { target: '7', suffix: '+', label: 'Years of Experience' },
  { target: '100', suffix: '+', label: 'Satisfied Customers' },
  { target: '50', suffix: '+', label: 'Projects Completed' },
  { target: '300', suffix: ' MWh', label: 'Power Generated' },
];

export const DEFAULT_OFFERING_IMG = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=900&h=675&fit=crop';

export const DEFAULT_OFFERINGS = [
  { label: 'Residential', desc: 'Smart solar solutions for homes & villas.', img: 'https://res.cloudinary.com/dsiratycd/image/upload/v1775250334/Gemini_Generated_Image_gqdagugqdagugqda_pbwa73.png', link: '/solutions' },
  { label: 'Commercial', desc: 'Powering offices, malls & businesses.', img: 'https://res.cloudinary.com/dsiratycd/image/upload/v1774797121/comercial_fie2wd.png', link: '/solutions' },
  { label: 'Industrial', desc: 'High-capacity solar for factories & industries.', img: 'https://res.cloudinary.com/dsiratycd/image/upload/v1774797121/Maintanance_mdwhei.png', link: '/solutions' },
];

export const DEFAULT_WHY = [
  { icon: '🏅', title: 'Certification', desc: 'ISO certified operations meeting global standards of quality and safety.' },
  { icon: '💳', title: 'Easy Finance / EMI', desc: 'Flexible EMI options from as low as ₹1,000/month. No heavy upfront cost.' },
  { icon: '🏛️', title: 'Assistance in Availing Subsidy', desc: 'Empanelled with JBVNL & TSUISL. We handle the entire subsidy process for you.' },
  { icon: '💰', title: 'Value for Money', desc: 'Best ROI with payback in 3–5 years and 20+ years of savings thereafter.' },
  { icon: '🏢', title: 'Brand Identity Since 2018', desc: "Jharkhand's trusted solar brand founded by IIT, NIT & DTU engineers." },
  { icon: '🔧', title: 'Operation & Maintenance', desc: '5-year comprehensive O&M. Issues resolved within 24 working hours.' },
  { icon: '⭐', title: 'Best Quality Equipment', desc: 'Premium panels and inverters sourced directly from top manufacturers.' },
  { icon: '📋', title: 'Government Subsidy', desc: 'PM Surya Ghar Yojana — get up to ₹78,000 subsidy with our guidance.' },
];

export const DEFAULT_PROCESS = [
  { num: '01', title: 'On-Site Survey', desc: 'Our experts visit your rooftop to assess space, sunlight, shadow patterns, and energy consumption to design the perfect system.', icon: '🔍' },
  { num: '02', title: 'Financial Modeling', desc: 'We calculate your ROI, payback period, savings projections, and applicable PM Surya Ghar subsidies to give you the complete financial picture.', icon: '📊' },
  { num: '03', title: 'System Design', desc: 'Custom engineering of your solar system including panel layout, inverter sizing, cable routing, and structural mounting requirements.', icon: '📐' },
  { num: '04', title: 'Project Installation', desc: 'Our certified technicians install your system safely and efficiently, typically completing the job within 2–7 working days.', icon: '🔧' },
  { num: '05', title: 'Operations & Maintenance', desc: '5-year comprehensive O&M support with IoT monitoring, periodic cleaning, and 24-hour issue resolution guarantee.', icon: '📡' },
];

export const DEFAULT_YOUTUBE = {
  enabled: true,
  title: 'Watch Sologix in Action',
  subtitle: 'Real installations, customer stories and solar tips from our YouTube channel',
  max: 8,
  include_shorts: true,
  hidden: [],
};

export const SITE_CONTENT_DEFAULTS = {
  stats: DEFAULT_STATS,
  offerings: DEFAULT_OFFERINGS,
  why_us: DEFAULT_WHY,
  work_process: DEFAULT_PROCESS,
};

// ── tiny shared store ──────────────────────────────────────────────────────
let state = { loaded: false, failed: false, data: null };
let promise = null;
const subscribers = new Set();

const notify = () => subscribers.forEach((fn) => { try { fn(state); } catch (e) { /* ignore */ } });
const setState = (next) => { state = next; notify(); };

// Values from MariaDB can arrive as JSON strings; parse them safely.
const parseMaybe = (v) => {
  if (typeof v !== 'string') return v;
  const s = v.trim();
  if (!s || (s[0] !== '[' && s[0] !== '{' && s[0] !== '"')) return v;
  try { return JSON.parse(s); } catch (e) { return v; }
};

// Loads GET /api/site-settings once. Never throws; resolves with the data
// object, or null when the request failed / timed out.
export function loadSiteContent(timeoutMs = 2500) {
  if (promise) return promise;
  promise = (async () => {
    let timer = null;
    try {
      const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      timer = setTimeout(() => ctrl && ctrl.abort(), timeoutMs);
      const res = await fetch('/api/site-settings', ctrl ? { signal: ctrl.signal } : undefined);
      clearTimeout(timer);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const raw = json && json.success !== false ? json.data : null;
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('bad payload');
      const data = {};
      Object.keys(raw).forEach((k) => { data[k] = parseMaybe(raw[k]); });
      setState({ loaded: true, failed: false, data });
      return data;
    } catch (e) {
      if (timer) clearTimeout(timer);
      setState({ loaded: true, failed: true, data: null });
      return null;
    }
  })();
  return promise;
}

// Current data object (null while loading or after a failed request).
export const getSiteContent = () => state.data;
export const getSiteContentState = () => state;

export function subscribeSiteContent(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

// Used by the admin page after a successful save, so the public pages in the
// same browser tab show the new value without a reload.
export function setSiteContentKey(key, value) {
  const data = { ...(state.data || {}), [key]: value };
  setState({ loaded: true, failed: false, data });
}

const pickFrom = (data, key, def) => {
  if (!data || typeof data !== 'object' || !Object.prototype.hasOwnProperty.call(data, key)) return def;
  const v = parseMaybe(data[key]);
  return Array.isArray(v) ? v : def;
};

export const pick = (key, def) => pickFrom(state.data, key, def);

// React hook: re-renders when the settings arrive.
export function useSiteContent() {
  const [snap, setSnap] = useState(state);
  useEffect(() => {
    const unsub = subscribeSiteContent(setSnap);
    setSnap(state);          // in case it arrived between render and effect
    loadSiteContent();
    return unsub;
  }, []);
  return {
    data: snap.data,
    loaded: snap.loaded,
    failed: snap.failed,
    pick: (key, def) => pickFrom(snap.data, key, def),
  };
}

// ── helpers for list items ─────────────────────────────────────────────────
export const toText = (v) => (v === null || v === undefined ? '' : (typeof v === 'object' ? '' : String(v)));
export const padNum = (n) => String(n).padStart(2, '0');
