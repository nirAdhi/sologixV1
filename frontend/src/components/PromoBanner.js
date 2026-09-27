// Festive offer banner shown at the top of every public page (under the navbar).
// Content is edited in Admin > Site Content > Festive offer banner and stored as
// the "promo_banner" site setting; until something is saved the defaults from
// utils/siteContent.js are shown. Hidden automatically outside the start/end
// dates and for the rest of the session after the visitor closes it.
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSiteContent, DEFAULT_PROMO_BANNER } from '../utils/siteContent';
import { useT } from '../i18n';

// Literal class strings per theme so Tailwind's build keeps them.
const THEMES = {
  diwali: {
    wrap: 'bg-gradient-to-r from-[#2e1065] via-[#701a75] to-[#9d174d] text-amber-50',
    btn: 'bg-amber-400 text-[#431407] hover:bg-amber-300',
    pill: 'border-amber-200/60 text-amber-100',
    icon: '🪔',
  },
  navratri: {
    wrap: 'bg-gradient-to-r from-[#7c2d12] via-[#c2410c] to-[#b91c1c] text-orange-50',
    btn: 'bg-yellow-300 text-[#7c2d12] hover:bg-yellow-200',
    pill: 'border-yellow-200/60 text-yellow-100',
    icon: '🏵️',
  },
  green: {
    wrap: 'bg-gradient-to-r from-[#064e3b] via-[#047857] to-[#065f46] text-emerald-50',
    btn: 'bg-yellow-300 text-[#064e3b] hover:bg-yellow-200',
    pill: 'border-emerald-200/60 text-emerald-100',
    icon: '✨',
  },
};

// End of the given YYYY-MM-DD day in the visitor's timezone.
const endOfDay = (ymd) => {
  const t = Date.parse(ymd + 'T23:59:59');
  return Number.isNaN(t) ? null : t;
};
const startOfDay = (ymd) => {
  const t = Date.parse(ymd + 'T00:00:00');
  return Number.isNaN(t) ? null : t;
};

const daysLeftText = (endMs, now, t) => {
  const days = Math.floor((endMs - now) / 86400000);
  if (days <= 0) return t('Offer ends today');
  if (days === 1) return t('Offer ends tomorrow');
  return t('Offer ends in {days} days', { days });
};

export default function PromoBanner() {
  const { data, loaded } = useSiteContent();
  const { t } = useT();
  const [closed, setClosed] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const banner = useMemo(() => {
    const saved = data && typeof data.promo_banner === 'object' && !Array.isArray(data.promo_banner) ? data.promo_banner : null;
    return saved ? { ...DEFAULT_PROMO_BANNER, ...saved } : DEFAULT_PROMO_BANNER;
  }, [data]);

  // One key per campaign, so a new/changed banner shows again after a dismissal.
  const dismissKey = 'sologix_promo_closed:' + banner.heading + ':' + banner.end_date;

  useEffect(() => {
    try { setClosed(window.sessionStorage.getItem(dismissKey) === '1'); } catch (e) { setClosed(false); }
  }, [dismissKey]);

  const endMs = banner.end_date ? endOfDay(banner.end_date) : null;
  const startMs = banner.start_date ? startOfDay(banner.start_date) : null;
  const live = banner.enabled && !!String(banner.heading).trim()
    && (!startMs || now >= startMs) && (!endMs || now <= endMs);

  // Tick once a minute so the countdown and the end-of-offer cut-off stay right.
  useEffect(() => {
    if (!live || (!banner.show_countdown && !endMs)) return undefined;
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, [live, banner.show_countdown, endMs]);

  // Wait for the saved settings before showing anything, so a switched-off
  // banner never flashes on for a moment while the settings load. To avoid the
  // page jumping when the banner then appears (layout shift), we remember that
  // it was visible and reserve its space on the next load.
  if (!loaded) {
    let wasVisible = false;
    try { wasVisible = window.localStorage.getItem('sologix_pb_visible') === '1'; } catch (e) { /* ignore */ }
    return wasVisible && !closed ? <div aria-hidden="true" style={{ height: 56 }}></div> : null;
  }
  try { window.localStorage.setItem('sologix_pb_visible', live && !closed ? '1' : '0'); } catch (e) { /* ignore */ }
  if (!live || closed) return null;

  const theme = THEMES[banner.theme] || THEMES.diwali;
  const ctaText = String(banner.cta_text || '').trim();
  const ctaLink = String(banner.cta_link || '/booking');
  const external = /^https:\/\//i.test(ctaLink);
  const coupon = String(banner.coupon || '').trim();

  const close = () => {
    setClosed(true);
    try { window.sessionStorage.setItem(dismissKey, '1'); } catch (e) { /* ignore */ }
  };

  const cta = ctaText ? (
    external
      ? <a href={ctaLink} target="_blank" rel="noreferrer" className={`inline-block px-5 py-2 rounded-full text-sm font-bold shadow-md transition-colors whitespace-nowrap ${theme.btn}`}>{t(ctaText)}</a>
      : <Link to={ctaLink} className={`inline-block px-5 py-2 rounded-full text-sm font-bold shadow-md transition-colors whitespace-nowrap ${theme.btn}`}>{t(ctaText)}</Link>
  ) : null;

  return (
    <div role="region" aria-label={t('Festive offer')} className={`relative overflow-hidden ${theme.wrap}`}>
      {/* soft festive sparkles */}
      <span aria-hidden="true" className="pointer-events-none absolute left-[6%] top-1 text-white/25 text-lg select-none">✦</span>
      <span aria-hidden="true" className="pointer-events-none absolute left-[30%] bottom-1 text-white/15 text-sm select-none">✦</span>
      <span aria-hidden="true" className="pointer-events-none absolute right-[22%] top-1.5 text-white/20 text-base select-none">✦</span>
      <span aria-hidden="true" className="pointer-events-none absolute right-[8%] bottom-1 text-white/25 text-lg select-none">✦</span>

      <div className="container mx-auto px-4 py-3 pr-12 sm:pr-14 flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-5">
        <div className="flex items-center gap-3 min-w-0">
          <span aria-hidden="true" className="text-2xl flex-shrink-0 drop-shadow">{theme.icon}</span>
          <div className="min-w-0">
            <p className="font-extrabold text-sm sm:text-base leading-snug">{t(banner.heading)}</p>
            {banner.subheading && <p className="text-xs sm:text-sm opacity-90 leading-snug">{t(banner.subheading)}</p>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:ml-auto">
          {coupon && (
            <span className={`px-3 py-1 rounded-full border border-dashed text-xs font-semibold tracking-wide ${theme.pill}`}>
              {t('Use code')} <span className="font-mono font-bold">{coupon}</span>
            </span>
          )}
          {banner.show_countdown && endMs && (
            <span className={`px-3 py-1 rounded-full border text-xs font-semibold ${theme.pill}`}>
              ⏳ {daysLeftText(endMs, now, t)}
            </span>
          )}
          {cta}
        </div>
      </div>

      <button type="button" onClick={close} aria-label={t('Close this offer')}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-colors">
        ✕
      </button>
    </div>
  );
}
