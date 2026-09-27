// Public-site helpers driven by admin settings (GET /api/site-settings):
//   tracking: { ga4_id, clarity_id }             → Google Analytics 4 + Microsoft Clarity
//   capture:  { exit_intent_enabled, timed_popup_enabled, delay_seconds,
//               popup_heading, popup_subheading, popup_button_text,
//               live_chat_enabled, tidio_key }   → lead pop-up + Tidio live chat
// Everything is a no-op unless the admin configured it; network/parse errors
// are swallowed so the site never breaks because of this component.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useT } from '../i18n';
import { BRANDING } from '../utils/branding';
import { loadSiteContent } from '../utils/siteContent';
import { getConsent, onConsentChange } from '../utils/consent';

const API = (BRANDING && BRANDING.apiUrl) || '/api';
const GA4_RE = /^G-[A-Z0-9]{4,12}$/;
const CLARITY_RE = /^[a-z0-9]{6,20}$/i;
const TIDIO_RE = /^[a-z0-9]{20,40}$/i;
const PHONE_RE = /^[\d\s+\-()]{7,20}$/;

const SEEN_KEY = 'sologix_lead_popup_seen';
const SEEN_DAYS = 7;
const DEFAULT_HEADING = 'Get a FREE Solar Quote!';
const DEFAULT_SUB = 'Find out how much you can save on electricity bills.';
const DEFAULT_BUTTON = 'Get Free Quote';

// Pages where nothing from here should run (staff areas).
const isPrivatePath = (p) => /^\/(admin|portal|crm)(\/|$)/.test(p);
// Pages where the lead pop-up must not interrupt the visitor.
const isNoPopupPath = (p) => /^\/(booking|contact|login|forgot-password)/.test(p);

// Settings come from the shared site-content store (one GET /api/site-settings
// per page load, 2.5 s timeout, resolves null on failure, never throws).
const loadSettings = () => Promise.resolve(loadSiteContent(2500)).then((d) => d || {}, () => ({}));

const parseObj = (v) => {
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { return null; } }
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
};
const isOn = (v) => v === true || v === 'true' || v === 1 || v === '1';
const str = (v) => (typeof v === 'string' ? v.trim() : '');

function normalize(data) {
  const tracking = parseObj(data && data.tracking) || {};
  const capture = parseObj(data && data.capture) || {};
  const ga4 = str(tracking.ga4_id).toUpperCase();
  const clarity = str(tracking.clarity_id);
  const tidio = str(capture.tidio_key);
  let delay = parseInt(capture.delay_seconds, 10);
  if (!Number.isFinite(delay) || delay < 5 || delay > 300) delay = 30;
  return {
    ga4: GA4_RE.test(ga4) ? ga4 : '',
    clarity: CLARITY_RE.test(clarity) ? clarity : '',
    tidio: isOn(capture.live_chat_enabled) && TIDIO_RE.test(tidio) ? tidio : '',
    exitIntent: isOn(capture.exit_intent_enabled),
    timed: isOn(capture.timed_popup_enabled),
    delay,
    heading: str(capture.popup_heading) || DEFAULT_HEADING,
    // A deliberately emptied sub-heading is hidden; a missing one uses the default.
    sub: capture.popup_subheading === undefined || capture.popup_subheading === null ? DEFAULT_SUB : str(capture.popup_subheading),
    button: str(capture.popup_button_text) || DEFAULT_BUTTON,
  };
}

// ── third-party script loaders (each runs at most once per page load) ──
function injectScript(id, src) {
  try {
    if (document.getElementById(id)) return;
    const s = document.createElement('script');
    s.id = id;
    s.async = true;
    s.src = src;
    (document.head || document.body).appendChild(s);
  } catch (e) { /* ignore */ }
}

function initGA(id) {
  try {
    if (window.__sologixGA === id) return;
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== 'function') {
      // gtag must push the real `arguments` object, as in Google's snippet.
      window.gtag = function gtag() { window.dataLayer.push(arguments); };
    }
    window.gtag('js', new Date());
    window.gtag('config', id, { anonymize_ip: true, send_page_view: false });
    injectScript('sologix-ga4', 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(id));
    window.__sologixGA = id;
  } catch (e) { /* ignore */ }
}

function initClarity(id) {
  try {
    if (document.getElementById('sologix-clarity')) return;
    window.clarity = window.clarity || function clarity() { (window.clarity.q = window.clarity.q || []).push(arguments); };
    injectScript('sologix-clarity', 'https://www.clarity.ms/tag/' + encodeURIComponent(id));
  } catch (e) { /* ignore */ }
}

function initTidio(key) {
  injectScript('sologix-tidio', 'https://code.tidio.co/' + encodeURIComponent(key) + '.js');
}

// ── "seen in the last 7 days" memory ──
let seenThisLoad = false; // fallback when localStorage is blocked
function seenRecently() {
  if (seenThisLoad) return true;
  try {
    const ts = parseInt(window.localStorage.getItem(SEEN_KEY), 10);
    return Number.isFinite(ts) && Date.now() - ts < SEEN_DAYS * 24 * 60 * 60 * 1000;
  } catch (e) { return false; }
}
function markSeen() {
  seenThisLoad = true;
  try { window.localStorage.setItem(SEEN_KEY, String(Date.now())); } catch (e) { /* ignore */ }
}
const isDesktop = () => {
  try { return window.innerWidth >= 768; } catch (e) { return false; }
};

export default function VisitorTools() {
  const location = useLocation();
  const path = location.pathname || '/';
  const [cfg, setCfg] = useState(null);
  const [due, setDue] = useState(false);
  const [open, setOpen] = useState(false);
  const blockedRef = useRef(false);
  blockedRef.current = isPrivatePath(path) || isNoPopupPath(path) || !isDesktop();

  useEffect(() => {
    let alive = true;
    loadSettings().then((data) => { if (alive) setCfg(normalize(data)); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  const privatePage = isPrivatePath(path);

  // Analytics scripts run only after the visitor accepted cookies
  // (CookieConsent banner); Tidio live chat is a site feature, not tracking.
  const [consent, setConsentState] = useState(getConsent);
  useEffect(() => onConsentChange(setConsentState), []);

  // Third-party scripts (public pages only).
  useEffect(() => {
    if (!cfg || privatePage) return;
    if (consent === 'yes') {
      if (cfg.ga4) initGA(cfg.ga4);
      if (cfg.clarity) initClarity(cfg.clarity);
    }
    if (cfg.tidio) initTidio(cfg.tidio);
  }, [cfg, privatePage, consent]);

  // GA4 page_view on every route change (only with cookie consent).
  const ga4 = cfg && consent === 'yes' ? cfg.ga4 : '';
  useEffect(() => {
    if (!ga4 || privatePage) return undefined;
    // Small delay so pages can update document.title first.
    const id = setTimeout(() => {
      try {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'page_view', {
            send_to: ga4,
            page_path: location.pathname + location.search,
            page_location: window.location.href,
            page_title: document.title,
          });
        }
      } catch (e) { /* ignore */ }
    }, 300);
    return () => clearTimeout(id);
  }, [ga4, privatePage, location.pathname, location.search]);

  // Timed pop-up: counts time on the site, not per page.
  const timed = !!(cfg && cfg.timed);
  const delay = cfg ? cfg.delay : 30;
  useEffect(() => {
    if (!timed || seenRecently()) return undefined;
    const id = setTimeout(() => setDue(true), delay * 1000);
    return () => clearTimeout(id);
  }, [timed, delay]);

  // Exit intent: desktop mouse leaving through the top of the viewport.
  const exitIntent = !!(cfg && cfg.exitIntent);
  useEffect(() => {
    if (!exitIntent || due || seenRecently()) return undefined;
    let finePointer = true;
    try { finePointer = !window.matchMedia || window.matchMedia('(pointer: fine)').matches; } catch (e) { finePointer = true; }
    if (!finePointer) return undefined;
    const onOut = (e) => {
      if (blockedRef.current) return;
      if (!e.relatedTarget && !e.toElement && e.clientY <= 0) setDue(true);
    };
    document.addEventListener('mouseout', onOut);
    return () => document.removeEventListener('mouseout', onOut);
  }, [exitIntent, due]);

  // Open once the trigger fired and we are on a page where it is allowed.
  useEffect(() => {
    if (!due || open || blockedRef.current || seenRecently()) return;
    markSeen();
    setOpen(true);
  }, [due, open, path]);

  if (!open || !cfg) return null;
  return <LeadPopup cfg={cfg} onClose={() => { setOpen(false); setDue(false); }} />;
}

function LeadPopup({ cfg, onClose }) {
  const { t } = useT();
  const [form, setForm] = useState({ name: '', phone: '', message: '' });
  const [state, setState] = useState('idle'); // idle | sending | success
  const [error, setError] = useState('');
  const dialogRef = useRef(null);
  const firstRef = useRef(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const close = useCallback(() => { onCloseRef.current(); }, []);

  // Focus the first field on open; give focus back on close. Esc closes.
  useEffect(() => {
    const prev = document.activeElement;
    const id = setTimeout(() => { try { (firstRef.current || dialogRef.current)?.focus(); } catch (e) { /* ignore */ } }, 30);
    const onKey = (e) => { if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); close(); } };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(id);
      document.removeEventListener('keydown', onKey);
      try { if (prev && typeof prev.focus === 'function') prev.focus(); } catch (e) { /* ignore */ }
    };
  }, [close]);

  // Keep Tab / Shift+Tab inside the dialog.
  const onKeyDown = (e) => {
    if (e.key !== 'Tab' || !dialogRef.current) return;
    const items = Array.from(dialogRef.current.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), a[href]'));
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const change = (e) => { setForm((f) => ({ ...f, [e.target.name]: e.target.value })); setError(''); };

  const submit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (!name) { setError(t('Name is required')); return; }
    if (!phone) { setError(t('Phone is required')); return; }
    if (!PHONE_RE.test(phone)) { setError(t('Invalid phone number')); return; }
    setState('sending');
    setError('');
    try {
      const r = await fetch(API + '/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ name, phone, message: form.message.trim(), source: 'consultation' }),
      });
      let j = null;
      try { j = await r.json(); } catch (err) { j = null; }
      if (r.ok && j && j.success !== false) {
        setState('success');
        try { if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead', { method: 'popup' }); } catch (err) { /* ignore */ }
      } else {
        setState('idle');
        setError(j && typeof j.message === 'string' && j.message ? t(j.message) : t('Something went wrong. Please try again or call us.'));
      }
    } catch (err) {
      setState('idle');
      setError(t('Could not connect. Please check your internet and try again.'));
    }
  };

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={close} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vt-lead-title"
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6 outline-none"
      >
        <button
          type="button"
          onClick={close}
          aria-label={t('Close')}
          className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 text-2xl leading-none"
        >
          <span aria-hidden="true">×</span>
        </button>

        {state === 'success' ? (
          <div className="text-center py-4" role="status">
            <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-green-100 text-[#006948] flex items-center justify-center text-2xl" aria-hidden="true">✓</div>
            <h2 id="vt-lead-title" className="text-xl font-bold text-gray-900 mb-2">{t('Thank you!')}</h2>
            <p className="text-gray-600 text-sm mb-5">{t('We received your request. Our team will call you shortly.')}</p>
            <button type="button" onClick={close} className="bg-[#006948] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-green-700">{t('Close')}</button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h2 id="vt-lead-title" className="text-xl font-bold text-gray-900 pr-8 mb-1 break-words line-clamp-3">{t(cfg.heading)}</h2>
            {cfg.sub && <p className="text-gray-600 text-sm mb-4 break-words line-clamp-4">{t(cfg.sub)}</p>}
            <div className="space-y-3 mt-3">
              <div>
                <label htmlFor="vt-lead-name" className="block text-xs font-medium text-gray-700 mb-1">{t('Your name')}</label>
                <input ref={firstRef} id="vt-lead-name" name="name" value={form.name} onChange={change} maxLength={100} autoComplete="name" required className={inputCls} />
              </div>
              <div>
                <label htmlFor="vt-lead-phone" className="block text-xs font-medium text-gray-700 mb-1">{t('Phone number')}</label>
                <input id="vt-lead-phone" name="phone" type="tel" inputMode="tel" value={form.phone} onChange={change} maxLength={20} autoComplete="tel" required className={inputCls} />
              </div>
              <div>
                <label htmlFor="vt-lead-message" className="block text-xs font-medium text-gray-700 mb-1">{t('Message (optional)')}</label>
                <textarea id="vt-lead-message" name="message" rows={2} value={form.message} onChange={change} maxLength={2000} className={inputCls + ' resize-none'} />
              </div>
            </div>
            {error && <p className="text-red-600 text-sm mt-3" role="alert">{error}</p>}
            <button type="submit" disabled={state === 'sending'} className="mt-4 w-full bg-[#006948] text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60 break-words">
              {state === 'sending' ? t('Sending...') : t(cfg.button)}
            </button>
            <button type="button" onClick={close} className="mt-2 w-full text-gray-500 text-sm py-2 hover:text-gray-800">{t('No thanks')}</button>
          </form>
        )}
      </div>
    </div>
  );
}
