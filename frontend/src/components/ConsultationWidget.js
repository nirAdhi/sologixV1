import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { getSiteConfig } from '../utils/siteConfig';

// Floating "free consultation" button, bottom-left on every public page.
// It used to be a full-width pill at all times, which overlapped page content
// (e.g. the category sidebar on /products) and could stick out on small
// screens. It now rests as a compact round bubble and expands to the full pill
// on hover / focus / tap; it also expands by itself for a few seconds on the
// first page load so visitors notice it.
const ConsultationWidget = () => {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const introDone = useRef(false);

  // Brief self-introduction on first load, then collapse.
  useEffect(() => {
    if (introDone.current) return undefined;
    introDone.current = true;
    const show = setTimeout(() => setOpen(true), 1200);
    const hide = setTimeout(() => setOpen(false), 5200);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, []);

  const phone = getSiteConfig().consultationPhone || getSiteConfig().phone;

  return (
    <Link
      to="/contact"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onTouchStart={() => setOpen(true)}
      className="fixed bottom-8 left-4 sm:left-6 z-[200] flex items-center bg-white/95 backdrop-blur-md rounded-full border border-gray-200 shadow-2xl hover:shadow-green-200 hover:border-[#006948] transition-all group overflow-hidden"
      style={{ animation: 'floatBounce 2.5s ease-in-out infinite', padding: '6px' }}
      title={t('Contact us for a free consultation')}
      aria-label={t('Free Consultation') + ' ' + (phone || '')}
    >
      <style>{`
        @keyframes floatBounce {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes consultPulse {
          0% { box-shadow: 0 0 0 0 rgba(0,105,72,0.35); }
          70% { box-shadow: 0 0 0 12px rgba(0,105,72,0); }
          100% { box-shadow: 0 0 0 0 rgba(0,105,72,0); }
        }
      `}</style>
      <span className="relative flex-shrink-0 w-11 h-11 rounded-full" style={{ animation: 'consultPulse 2.5s ease-out infinite' }}>
        <img
          src="https://res.cloudinary.com/dsiratycd/image/upload/f_auto,q_auto,c_fill,w_96,h_96/v1780519660/Gemini_Generated_Image_9vrp69vrp69vrp69_yjkv0f.png" width="44" height="44"
          alt=""
          className="w-11 h-11 rounded-full object-cover shadow-md"
          onError={e => { e.target.src = 'https://res.cloudinary.com/dsiratycd/image/upload/f_auto,q_auto,w_160/logo_yo5zg9.png'; }}
        />
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#006948] border-2 border-white" aria-hidden="true"></span>
      </span>
      <span
        className="whitespace-nowrap transition-all duration-300 ease-out"
        style={open
          ? { maxWidth: '240px', opacity: 1, paddingLeft: '12px', paddingRight: '14px' }
          : { maxWidth: 0, opacity: 0, paddingLeft: 0, paddingRight: 0 }}
        aria-hidden={!open}
      >
        <span className="block text-xs text-[#006948] font-bold uppercase tracking-wider">{t('Free Consultation')}</span>
        <span className="block text-sm text-gray-800 font-semibold">{phone}</span>
      </span>
    </Link>
  );
};

export default ConsultationWidget;
