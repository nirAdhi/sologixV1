// First-party footfall counter: sends one tiny event per page view to
// POST /api/track — but only after the visitor accepted cookies, and never on
// admin/portal/CRM pages. The numbers appear on Admin > Analytics.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getConsent, onConsentChange, visitorId } from '../utils/consent';

const isPrivatePath = (p) => /^\/(admin|portal|crm)(\/|$)/.test(p);
const device = () => {
  try { return window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1100 ? 'tablet' : 'desktop'; }
  catch (e) { return ''; }
};

const sent = new Set(); // avoid double-counting the same path per page load burst

function send(pathname) {
  if (getConsent() !== 'yes' || isPrivatePath(pathname)) return;
  const vid = visitorId();
  if (!vid) return;
  const key = pathname + ':' + Math.floor(Date.now() / 5000);
  if (sent.has(key)) return;
  sent.add(key);
  let lang = 'en';
  try { lang = window.localStorage.getItem('sologix_lang') === 'hi' ? 'hi' : 'en'; } catch (e) { /* ignore */ }
  const body = JSON.stringify({
    path: pathname.slice(0, 200),
    visitor: vid,
    referrer: document.referrer || '',
    device: device(),
    lang,
  });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
    } else {
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, keepalive: true }).catch(() => {});
    }
  } catch (e) { /* analytics must never break the site */ }
}

export default function PageviewTracker() {
  const location = useLocation();

  useEffect(() => { send(location.pathname || '/'); }, [location.pathname]);

  // If the visitor accepts on this page, count this page too.
  useEffect(() => onConsentChange((v) => { if (v === 'yes') send(window.location.pathname || '/'); }), []);

  return null;
}
