// "Authorised channel partner" band — the brands whose equipment Sologix
// officially sells and installs (edited in Admin > Site Content).
// Styled on the site's calculator palette: soft mint gradient, white chips,
// brand-green accents, with the gold medal + laurels as the award mark.
// Shown on the homepage (below the hero) and on the Products page.
import React from 'react';
import { useSiteContent, DEFAULT_CHANNEL_PARTNERS } from '../utils/siteContent';
import { useT } from '../i18n';

const monogram = (name) => name
  .split(/[\s-]+/)
  .filter(Boolean)
  .slice(0, 2)
  .map(w => w[0])
  .join('')
  .toUpperCase();

// Gold laurel branch (mirrored for the left side).
const Laurel = ({ flip }) => (
  <svg width="30" height="52" viewBox="0 0 34 52" aria-hidden="true" className="flex-shrink-0"
    style={flip ? { transform: 'scaleX(-1)' } : undefined}>
    <g fill="#d4a017" opacity="0.8">
      <ellipse cx="26" cy="46" rx="7" ry="2.9" transform="rotate(35 26 46)" />
      <ellipse cx="21" cy="37" rx="7" ry="2.9" transform="rotate(50 21 37)" />
      <ellipse cx="17.5" cy="27" rx="7" ry="2.9" transform="rotate(65 17.5 27)" />
      <ellipse cx="16" cy="17" rx="7" ry="2.9" transform="rotate(80 16 17)" />
      <ellipse cx="17" cy="7" rx="6" ry="2.5" transform="rotate(95 17 7)" />
    </g>
  </svg>
);

// Gold medal seal with ribbon and star.
const MedalSeal = () => (
  <svg width="46" height="46" viewBox="0 0 44 44" aria-hidden="true" className="drop-shadow-sm">
    <defs>
      <linearGradient id="cp-gold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fde68a" />
        <stop offset="0.55" stopColor="#fbbf24" />
        <stop offset="1" stopColor="#b45309" />
      </linearGradient>
    </defs>
    <path d="M15 25 L11 42 L18 37 L22 44 L26 37 L33 42 L29 25 Z" fill="url(#cp-gold)" opacity="0.9" />
    <circle cx="22" cy="18" r="13" fill="url(#cp-gold)" />
    <circle cx="22" cy="18" r="10" fill="#006948" />
    <polygon fill="#ffffff"
      points="22,11.2 23.7,15.65 28.47,15.9 24.76,18.9 26,23.5 22,20.9 18,23.5 19.24,18.9 15.53,15.9 20.3,15.65" />
  </svg>
);

export default function ChannelPartners() {
  const { t } = useT();
  const { pick } = useSiteContent();
  const brands = (pick('channel_partners', DEFAULT_CHANNEL_PARTNERS) || [])
    .filter(b => typeof b === 'string' && b.trim());
  if (!brands.length) return null;

  return (
    <div className="bg-white py-8">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <div className="bg-gradient-to-br from-[#e9edff] to-[#d1fae5] rounded-[2rem] px-6 py-7 flex flex-col items-center gap-5">
          {/* award seal between laurels */}
          <div className="flex items-center gap-3 sm:gap-4">
            <Laurel flip />
            <div className="flex items-center gap-3.5">
              <MedalSeal />
              <div className="text-left">
                <p className="text-xs sm:text-[13px] font-bold uppercase tracking-[0.24em] text-[#006948]">
                  {t('Authorised Channel Partner')}
                </p>
                <p className="text-gray-500 text-xs mt-1">{t('Genuine equipment · Manufacturer warranty')}</p>
              </div>
            </div>
            <Laurel />
          </div>

          {/* brand chips */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {brands.map((b, i) => (
              <span key={i}
                className="inline-flex items-center gap-2.5 rounded-full pl-1.5 pr-4 py-1.5 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
                <span aria-hidden="true"
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-extrabold text-[#006948] bg-green-50 border border-green-200">
                  {monogram(b)}
                </span>
                <span className="text-gray-900 font-semibold text-sm whitespace-nowrap">{b}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
