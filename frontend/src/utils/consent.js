// Cookie-consent store shared by the banner (CookieConsent), the trackers
// (PageviewTracker, VisitorTools) and anything else that must not run before
// the visitor agreed. Values: 'yes' (accepted analytics), 'no' (declined),
// null (not answered yet — the banner is showing).
const KEY = 'sologix_cookie_consent';
const subscribers = new Set();

export function getConsent() {
  try {
    const v = window.localStorage.getItem(KEY);
    return v === 'yes' || v === 'no' ? v : null;
  } catch (e) { return null; } // storage blocked → treat as unanswered, track nothing
}

export function setConsent(v) {
  try { window.localStorage.setItem(KEY, v); } catch (e) { /* ignore */ }
  subscribers.forEach((fn) => { try { fn(v); } catch (e) { /* ignore */ } });
}

export function onConsentChange(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

// Random visitor id for first-party footfall counting (unique-visitor numbers).
// Created only after consent; deleted again if the visitor later declines.
const VID_KEY = 'sologix_vid';
export function visitorId() {
  try {
    let v = window.localStorage.getItem(VID_KEY);
    if (!v || !/^[a-f0-9]{16,32}$/.test(v)) {
      const bytes = new Uint8Array(12);
      (window.crypto || {}).getRandomValues ? window.crypto.getRandomValues(bytes) : bytes.forEach((_, i) => { bytes[i] = Math.floor(Math.random() * 256); });
      v = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
      window.localStorage.setItem(VID_KEY, v);
    }
    return v;
  } catch (e) { return null; }
}

export function clearVisitorId() {
  try { window.localStorage.removeItem(VID_KEY); } catch (e) { /* ignore */ }
}
