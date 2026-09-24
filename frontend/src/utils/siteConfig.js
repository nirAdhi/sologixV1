// Business details that come from the server's .env (phone numbers, WhatsApp,
// email, social links). Loaded once before the app renders (see index.js) and
// merged into BRANDING so every page that already uses BRANDING shows the
// .env values. If the request fails the built-in values below are used.
import { BRANDING } from './branding';

const DEFAULTS = {
  name: BRANDING.name,
  phone: BRANDING.phone,
  phoneAlt: BRANDING.phoneAlt,
  consultationPhone: '+91 9771419133',
  email: BRANDING.email,
  emailAlt: BRANDING.emailAlt,
  whatsapp: '918287766474',
  address: BRANDING.address,
  siteUrl: 'https://sologixenergy.com',
  social: {
    youtube: '',
    facebook: 'https://www.facebook.com/sologix/',
    instagram: 'https://www.instagram.com/sologixenergy/',
    linkedin: 'https://www.linkedin.com/company/m-s-sologix-energy/',
    x: '',
  },
  socialFromEnv: {},
};

let current = DEFAULTS;

export async function loadSiteConfig(timeoutMs = 1500) {
  try {
    const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = setTimeout(() => ctrl && ctrl.abort(), timeoutMs);
    const res = await fetch('/api/config/public', ctrl ? { signal: ctrl.signal } : undefined);
    clearTimeout(timer);
    const json = await res.json();
    if (json && json.success && json.data) {
      current = { ...DEFAULTS, ...json.data, social: { ...DEFAULTS.social, ...(json.data.social || {}) } };
    }
  } catch (e) { /* offline / timeout: keep defaults */ }
  Object.assign(BRANDING, {
    name: current.name || BRANDING.name,
    phone: current.phone,
    phoneAlt: current.phoneAlt,
    email: current.email,
    emailAlt: current.emailAlt,
    address: current.address,
  });
  return current;
}

export const getSiteConfig = () => current;
export const telHref = (p) => 'tel:' + String(p || '').replace(/[^\d+]/g, '');
export const whatsappHref = (text) => {
  const n = String(current.whatsapp || '').replace(/\D/g, '');
  if (!n) return '';
  return `https://wa.me/${n}` + (text ? `?text=${encodeURIComponent(text)}` : '');
};
