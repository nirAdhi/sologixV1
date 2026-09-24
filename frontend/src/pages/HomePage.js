import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { avatarUrl } from '../utils/avatar';
import { useT } from '../i18n';
import { getSiteConfig, whatsappHref } from '../utils/siteConfig';
import {
  useSiteContent, DEFAULT_STATS, DEFAULT_OFFERINGS, DEFAULT_WHY, DEFAULT_PROCESS,
  DEFAULT_OFFERING_IMG, toText, padNum,
} from '../utils/siteContent';

// Renders a translated sentence that contains one bold part, marked {b}.
const withBold = (sentence, bold) => {
  const [before, after = ''] = sentence.split('{b}');
  return <>{before}<strong>{bold}</strong>{after}</>;
};

// ── Data helpers (every admin/API value is treated as untrusted) ──────────
const isObj = (v) => !!v && typeof v === 'object' && !Array.isArray(v);

// Strings where arrays are expected (JSON text from MariaDB) are parsed safely.
const asArray = (v) => {
  if (Array.isArray(v)) return v;
  if (typeof v === 'string') {
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : null; } catch (e) { return null; }
  }
  return null;
};

// fetch + timeout. Resolves with json.data, rejects on network error / non-2xx /
// success:false, so callers can tell "request failed" from "empty list".
const fetchJSON = async (url, timeoutMs = 8000) => {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = setTimeout(() => ctrl && ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const json = await res.json();
    if (!json || json.success === false) throw new Error('request failed');
    return json.data;
  } finally { clearTimeout(timer); }
};

// onError handler: swap to a fallback image once (no infinite loop if that fails too).
const imgFallback = (fallback) => (e) => {
  const img = e.currentTarget;
  if (img.dataset.fallback) { img.style.visibility = 'hidden'; return; }
  img.dataset.fallback = '1';
  img.src = fallback;
};

// Internal links go through the router, full URLs open in a new tab, anything else -> default.
const SmartLink = ({ to, className, children, fallback = '/solutions' }) => {
  const href = toText(to).trim();
  if (/^https?:\/\//i.test(href)) return <a href={href} target="_blank" rel="noreferrer" className={className}>{children}</a>;
  return <Link to={href.startsWith('/') && !href.startsWith('//') ? href : fallback} className={className}>{children}</Link>;
};

// "1,000" / "4.5" / "7" count up; anything else ("24x7", "ISO") is shown as typed.
const parseStatTarget = (target, decimals) => {
  const raw = toText(target).trim();
  const cleaned = raw.replace(/,/g, '');
  if (!/^\d+(\.\d+)?$/.test(cleaned) || !Number.isFinite(parseFloat(cleaned))) return { numeric: false, raw };
  const dec = Math.min(3, Math.max(parseInt(decimals, 10) || 0, (cleaned.split('.')[1] || '').length));
  return { numeric: true, value: parseFloat(cleaned), decimals: dec, raw };
};
const fmtCount = (n, decimals) => (decimals > 0 ? n.toFixed(decimals) : Math.floor(n).toLocaleString('en-IN'));

const CountUp = ({ target, suffix = '', decimals, className }) => {
  const ref = useRef(null);
  const p = parseStatTarget(target, decimals);
  const { numeric, value } = p;
  const dec = p.decimals || 0;
  useEffect(() => {
    const el = ref.current;
    if (!el || !numeric) return undefined;
    let raf = 0;
    const done = () => { el.textContent = fmtCount(value, dec) + suffix; };
    if (typeof IntersectionObserver === 'undefined' || typeof requestAnimationFrame === 'undefined') { done(); return undefined; }
    const run = () => {
      const start = performance.now();
      const step = (now) => {
        const progress = Math.min((now - start) / 2000, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = fmtCount(eased * value, dec) + suffix;
        if (progress < 1) raf = requestAnimationFrame(step); else done();
      };
      raf = requestAnimationFrame(step);
    };
    const obs = new IntersectionObserver((entries) => {
      if (entries.some(en => en.isIntersecting)) { obs.disconnect(); run(); }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => { obs.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [numeric, value, dec, suffix]);
  return (
    <div ref={ref} className={className} data-target={p.raw}>
      {numeric ? fmtCount(0, dec) + suffix : p.raw + suffix}
    </div>
  );
};

const SOLAR_IMGS = [
  'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=600&h=400&fit=crop',
  'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=400&fit=crop',
];

// Built-in projects: shown when /api/projects can't be reached.
const STATIC_PROJECTS = [
  { title:'Ranchi Gymkhana Club', location:'Ranchi, Jharkhand', capacity:'40 kW', type:'Commercial', savings:'Rs 3,36,000/yr', img:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop' },
  { title:'DBMS English School', location:'Jamshedpur, Jharkhand', capacity:'100 kW', type:'Institutional', savings:'Rs 8,40,000/yr', img:'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600&h=400&fit=crop' },
  { title:'Raj Ceramics', location:'Hardag, Ranchi', capacity:'55 kW', type:'Industrial', savings:'Rs 4,20,000/yr', img:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=400&fit=crop' },
  { title:'CMS Kerala Bhavan', location:'Pune, Maharashtra', capacity:'30 kW', type:'Commercial', savings:'Rs 6,30,000/yr', img:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=400&fit=crop' },
  { title:'Dayanand Public School', location:'Jamshedpur, Jharkhand', capacity:'40 kW', type:'Institutional', savings:'Rs 3,36,000/yr', img:'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=600&h=400&fit=crop' },
  { title:'Solar Mini Grid', location:'Chatra, Jharkhand', capacity:'25 kW', type:'Industrial', savings:'Rs 2,10,000/yr', img:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=400&fit=crop' },
].map((p, i) => ({ ...p, key: 's' + i }));

// Built-in product cards: shown when /api/catalog can't be reached or is empty.
const STATIC_PRODUCTS = [
  { name:'Deye Inverters', spec:'3 kW – 200 kW | On-Grid', img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop' },
  { name:'Growatt Inverters', spec:'Residential & Commercial', img:'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=300&h=200&fit=crop' },
  { name:'LuxPower Hybrid', spec:'3–30 kW | Battery Ready', img:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=300&h=200&fit=crop' },
  { name:'Adani Solar Panels', spec:'580 W – 620 W | DCR', img:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=300&h=200&fit=crop' },
  { name:'Tata Power Solar', spec:'570 W – 600 W', img:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=300&h=200&fit=crop' },
  { name:'Rayzon Solar', spec:'545 W – 550 W', img:'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=300&h=200&fit=crop' },
  { name:'ZEN Energy Panels', spec:'580 W – 600 W', img:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=300&h=200&fit=crop' },
  { name:'Bi-Tech Li-Ion Battery', spec:'5 kWh | Long Cycle Life', img:'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=300&h=200&fit=crop' },
  { name:'Solis Storage', spec:'5 kWh | Smart BMS', img:'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&h=200&fit=crop' },
  { name:'Microtek Solar', spec:'Home & Small Business', img:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=300&h=200&fit=crop' },
].map((p, i) => ({ ...p, key: 's' + i, link: '/products', badge: '' }));

// ── YouTube section ────────────────────────────────────────────────────────
const YT_ID = /^[A-Za-z0-9_-]{6,20}$/;
const YT_DEFAULT_TITLE = 'Watch Sologix in Action';
const YT_DEFAULT_SUBTITLE = 'Real installations, customer stories and solar tips from our YouTube channel';

const VideoModal = ({ video, onClose }) => {
  const { t } = useT();
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  useEffect(() => {
    const prevFocus = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (closeRef.current) closeRef.current.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      // keep keyboard focus inside the dialog
      const items = Array.from(dialogRef.current.querySelectorAll('button, iframe, a[href]'));
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (!dialogRef.current.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (prevFocus && typeof prevFocus.focus === 'function') prevFocus.focus();
    };
  }, [onClose]);

  const label = video.title || t('YouTube video');
  return (
    <div className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4" onClick={onClose} role="presentation">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative w-full"
        style={{ maxWidth: video.isShort ? 'min(420px, calc(85vh * 9 / 16))' : 'min(64rem, calc(85vh * 16 / 9))' }}
        onClick={e => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={t('Close video')}
          className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white text-xl flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-white"
        >
          ✕
        </button>
        <div className={(video.isShort ? 'aspect-[9/16]' : 'aspect-video') + ' w-full bg-black rounded-xl overflow-hidden shadow-2xl'}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0`}
            title={label}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

const VideoCard = ({ video, onPlay, dateText }) => {
  const { t } = useT();
  return (
    <button
      type="button"
      onClick={() => onPlay(video)}
      aria-label={t('Play video: {title}', { title: video.title || t('YouTube video') })}
      className={'group text-left snap-start shrink-0 md:w-auto bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md hover:border-green-300 transition-all focus:outline-none focus:ring-2 focus:ring-[#006948] '
        + (video.isShort ? 'w-[44%] sm:w-[30%]' : 'w-[82%] sm:w-[46%]')}
    >
      <div className={'relative overflow-hidden bg-gray-900 ' + (video.isShort ? 'aspect-[9/16]' : 'aspect-video')}>
        <img
          src={video.thumbnail}
          alt=""
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={imgFallback(`https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`)}
        />
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="w-14 h-10 rounded-xl bg-[#FF0000]/90 group-hover:bg-[#FF0000] flex items-center justify-center shadow-lg transition-colors">
            <svg viewBox="0 0 24 24" className="w-6 h-6" fill="white"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </span>
        {video.isShort && (
          <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{t('Short')}</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{video.title}</p>
        {dateText && <p className="text-xs text-gray-400 mt-1">{dateText}</p>}
      </div>
    </button>
  );
};

const YouTubeSection = () => {
  const { t, locale } = useT();
  const [yt, setYt] = useState(null);          // null = loading / failed -> section hidden
  const [playing, setPlaying] = useState(null);
  const closeModal = useCallback(() => setPlaying(null), []);

  useEffect(() => {
    let alive = true;
    fetchJSON('/api/youtube')
      .then(d => { if (alive && isObj(d)) setYt(d); })
      .catch(() => { /* hidden */ });
    return () => { alive = false; };
  }, []);

  const videos = useMemo(() => {
    const list = asArray(yt && yt.videos) || [];
    return list.filter(isObj).map(v => {
      const id = toText(v.id).trim();
      const thumb = toText(v.thumbnail).trim();
      return {
        id,
        title: toText(v.title).trim(),
        published: toText(v.published),
        thumbnail: /^https:\/\//i.test(thumb) ? thumb : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        isShort: v.is_short === true || v.is_short === 1 || v.is_short === '1' || v.is_short === 'true',
      };
    }).filter(v => YT_ID.test(v.id));
  }, [yt]);

  if (!yt || yt.enabled === false || !videos.length) return null;

  const regular = videos.filter(v => !v.isShort);
  const shorts = videos.filter(v => v.isShort);
  const fmtDate = (iso) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) { return ''; }
  };
  const chRaw = isObj(yt.channel) ? toText(yt.channel.url).trim() : '';
  const channelUrl = /^https:\/\//i.test(chRaw) ? chRaw : ((getSiteConfig().social || {}).youtube || '');
  const subscribeUrl = /youtube\.com\/(channel\/|@|c\/|user\/)/i.test(channelUrl)
    ? channelUrl + (channelUrl.includes('?') ? '&' : '?') + 'sub_confirmation=1'
    : '';
  const title = toText(yt.title).trim() || YT_DEFAULT_TITLE;
  const subtitle = toText(yt.subtitle).trim() || YT_DEFAULT_SUBTITLE;
  // Mobile: one horizontal row with snap; tablet/desktop: a grid.
  const rowCls = 'flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 -mx-6 px-6 md:mx-0 md:px-0 md:pb-0 md:overflow-visible md:grid md:gap-6';

  return (
    <section className="py-24 bg-gray-50 border-t border-gray-100" aria-labelledby="yt-section-heading">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
        <div className="text-center mb-10">
          <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-4 text-sm">{t('Our Videos')}</span>
          <h2 id="yt-section-heading" className="text-4xl font-bold break-words">{t(title)}</h2>
          <p className="text-gray-500 mt-3 text-sm max-w-2xl mx-auto line-clamp-3">{t(subtitle)}</p>
        </div>
        {regular.length > 0 && (
          <div className={rowCls + ' md:grid-cols-2 lg:grid-cols-4'}>
            {regular.map(v => <VideoCard key={v.id} video={v} onPlay={setPlaying} dateText={fmtDate(v.published)} />)}
          </div>
        )}
        {shorts.length > 0 && (
          <>
            {regular.length > 0 && <h3 className="text-lg font-semibold text-gray-800 mt-12 mb-4">{t('Shorts')}</h3>}
            <div className={rowCls + ' md:grid-cols-4 lg:grid-cols-6'}>
              {shorts.map(v => <VideoCard key={v.id} video={v} onPlay={setPlaying} dateText={fmtDate(v.published)} />)}
            </div>
          </>
        )}
        {channelUrl && (
          <div className="flex flex-wrap justify-center gap-3 mt-10">
            <a href={channelUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-800 px-6 py-3 rounded-full font-medium hover:border-gray-400 transition-all">
              <svg viewBox="0 0 48 48" className="w-6 h-6" aria-hidden="true"><path d="M44 12.7a5.5 5.5 0 0 0-3.9-3.9C36.6 8 24 8 24 8S11.4 8 7.9 8.8A5.5 5.5 0 0 0 4 12.7C3.2 16.2 3.2 24 3.2 24s0 7.8.8 11.3A5.5 5.5 0 0 0 7.9 39.2C11.4 40 24 40 24 40s12.6 0 16.1-.8a5.5 5.5 0 0 0 3.9-3.9c.8-3.5.8-11.3.8-11.3s0-7.8-.8-11.3z" fill="#FF0000"/><path d="M19.6 30.5v-13L31.2 24l-11.6 6.5z" fill="white"/></svg>
              {t('Visit our YouTube channel')}
            </a>
            {subscribeUrl && (
              <a href={subscribeUrl} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 bg-[#FF0000] text-white px-6 py-3 rounded-full font-semibold hover:opacity-90 transition-all">
                {t('Subscribe')}
              </a>
            )}
          </div>
        )}
      </div>
      {playing && <VideoModal video={playing} onClose={closeModal} />}
    </section>
  );
};

const HERO_VIDEOS = [
  'https://res.cloudinary.com/dsiratycd/video/upload/v1780431091/gemini_generated_video_70213f58_wjemga.mp4',
  'https://res.cloudinary.com/dsiratycd/video/upload/v1780431090/Create_a_second_ultra_re_1_sgawv9.mp4',
  'https://res.cloudinary.com/dsiratycd/video/upload/v1780431090/Create_a_second_ultra_re_ddarqt.mp4',
];

const HomePage = () => {
  const { t } = useT();
  // "Rs 3,36,000/yr" -> translate only the "per year" word, keep the amount as is.
  const fmtSavings = (s) => (typeof s === 'string'
    ? s.replace(/\s*(\/\s*yr|\/\s*year|per\s+year|p\.a\.)\s*$/i, t('/yr'))
    : s);
  // ── Admin-editable content (Admin > Site Content), with built-in defaults ──
  const { pick } = useSiteContent();
  const rawStats = pick('stats', DEFAULT_STATS);
  const rawOfferings = pick('offerings', DEFAULT_OFFERINGS);
  const rawWhy = pick('why_us', DEFAULT_WHY);
  const rawProcess = pick('work_process', DEFAULT_PROCESS);

  const statsList = useMemo(() => rawStats.filter(isObj)
    .map(s => ({ target: toText(s.target), suffix: toText(s.suffix), decimals: s.decimals, label: toText(s.label) }))
    .filter(s => s.target.trim() || s.label.trim()), [rawStats]);
  const offeringsList = useMemo(() => rawOfferings.filter(isObj)
    .map(o => ({ label: toText(o.label), desc: toText(o.desc), img: toText(o.img).trim() || DEFAULT_OFFERING_IMG, link: toText(o.link).trim() || '/solutions' }))
    .filter(o => o.label.trim() || o.desc.trim()), [rawOfferings]);
  const whyList = useMemo(() => rawWhy.filter(isObj)
    .map(w => ({ icon: toText(w.icon), title: toText(w.title), desc: toText(w.desc) }))
    .filter(w => w.title.trim() || w.desc.trim()), [rawWhy]);
  // ONE list feeds the step row, the step details box and the step carousel.
  const processList = useMemo(() => rawProcess.filter(isObj)
    .map(p => ({ num: toText(p.num), title: toText(p.title), desc: toText(p.desc), icon: toText(p.icon) }))
    .filter(p => p.title.trim() || p.desc.trim())
    .map((p, i) => {
      const num = p.num.trim() || padNum(i + 1);
      // "01" -> "1" in the step circle / "Step 1:" heading (as before); other text kept as typed.
      return { ...p, num, short: /^\d+$/.test(num) ? String(parseInt(num, 10)) : num };
    }), [rawProcess]);

  useEffect(() => {
    // Scroll-in animation. Re-run when the lists change (admin content arrives
    // after the first paint) so newly rendered cards are observed too.
    const els = document.querySelectorAll('.reason-card, .process-step');
    const reveal = (el) => { el.style.transform = 'translateY(0)'; el.style.opacity = '1'; };
    if (typeof IntersectionObserver === 'undefined') { els.forEach(reveal); return undefined; }
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) reveal(entry.target); });
    }, { threshold: 0.1 });
    els.forEach(el => { if (el.style.opacity !== '1') scrollObserver.observe(el); });
    return () => scrollObserver.disconnect();
  }, [whyList, processList]);

  const videoRef = useRef(null);
  const videoIndexRef = useRef(0);

  const playNext = useCallback(() => {
    videoIndexRef.current = (videoIndexRef.current + 1) % HERO_VIDEOS.length;
    const vid = videoRef.current;
    if (!vid) return;
    vid.src = HERO_VIDEOS[videoIndexRef.current];
    vid.load();
    vid.play().catch(() => {});
  }, []);



  // Carousel position is React state (the old version toggled classes by hand and
  // crashed on items[-1] when a list had no active item / was empty).
  const [offerIdx, setOfferIdx] = useState(null);   // null = middle card
  const [procIdx, setProcIdx] = useState(0);
  const activeOffer = offeringsList.length ? Math.min(offerIdx === null ? Math.floor((offeringsList.length - 1) / 2) : offerIdx, offeringsList.length - 1) : -1;
  const activeProc = processList.length ? Math.min(procIdx, processList.length - 1) : -1;
  const moveCarousel = (id, direction, count, current, setIdx) => {
    if (!count) return;
    const cur = Math.min(Math.max(current, 0), count - 1);
    const next = direction === 'next' ? (cur + 1) % count : (cur - 1 + count) % count;
    setIdx(next);
    requestAnimationFrame(() => {
      const container = document.getElementById(id);
      const item = container && container.querySelectorAll('.carousel-item')[next];
      if (!item) return;
      container.scrollTo({ left: item.offsetLeft - container.clientWidth / 2 + item.clientWidth / 2, behavior: 'smooth' });
    });
  };

  const partners = [
    'sakra','sdsm','startupindia','tata-motors','undp','usaid','windworld','xavier-college',
    'ayana','ces','clean','dbms','dps','dvc','estate','germi','jbvnl','jusco',
    'manipal','metafin','panasonic','prfi','raj','rgc'
  ];

  // Testimonials from API. null = not loaded / request failed -> built-in ones;
  // [] = admin hid them all -> section hidden.
  const [testimonials, setTestimonials] = useState(null);
  // Projects: null -> built-in 6; [] -> grid hidden (button stays).
  const [projects, setProjects] = useState(null);
  // Catalog products: null or [] -> built-in cards.
  const [catalog, setCatalog] = useState(null);
  useEffect(() => {
    let alive = true;
    fetchJSON('/api/testimonials')
      .then(d => { const list = asArray(d); if (alive && list) setTestimonials(list.filter(isObj)); })
      .catch(() => {});
    (async () => {
      try {
        let list = asArray(await fetchJSON('/api/projects?featured=true'));
        if (!list) return;                               // malformed -> keep built-in
        list = list.filter(isObj);
        if (!list.length) {                              // nothing featured -> latest projects
          const all = asArray(await fetchJSON('/api/projects'));
          if (!all) return;
          list = all.filter(isObj);
        }
        if (alive) setProjects(list.slice(0, 6));
      } catch (e) { /* keep built-in */ }
    })();
    fetchJSON('/api/catalog')
      .then(d => { const list = asArray(d); if (alive && list) setCatalog(list.filter(isObj)); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const projectCards = projects === null ? STATIC_PROJECTS : projects.map((p, i) => ({
    key: p.id !== undefined && p.id !== null ? 'p' + p.id : 'i' + i,
    title: toText(p.title),
    location: toText(p.location),
    capacity: toText(p.capacity),
    type: toText(p.type),
    savings: toText(p.savings),
    img: toText(p.image_url).trim() || SOLAR_IMGS[i % SOLAR_IMGS.length],
    fallback: SOLAR_IMGS[i % SOLAR_IMGS.length],
  }));

  const productCards = useMemo(() => {
    const real = (catalog || []).map((p, i) => ({
      key: 'c' + (p.id ?? i),
      name: [toText(p.brand).trim(), toText(p.model).trim()].filter(Boolean).join(' '),
      spec: toText(p.category),
      badge: toText(p.badge).trim(),
      img: toText(p.image_url).trim() || SOLAR_IMGS[i % SOLAR_IMGS.length],
      link: p.id !== undefined && p.id !== null && p.id !== '' ? '/products/' + encodeURIComponent(p.id) : '/products',
    })).filter(c => c.name).slice(0, 16);
    return real.length ? real : STATIC_PRODUCTS;
  }, [catalog]);
  // Duplicate the list only when there are enough cards for a seamless loop.
  const productsLoop = productCards.length >= 4;

  const solarImgs = [
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=600&h=300&fit=crop',
  ];
  const staticTestimonials = [
    { id:'s1', name:'Subhash Jha', role:'Head - Administration', company:'Ranchi Gymkhana Club', location:'Ranchi, Jharkhand', capacity:'40 kW', savings:'Rs 3,36,000/yr', rating:5, photo_url:'', installation_photo: solarImgs[0], review:'Overall experience was pleasing. The company and team were customer focused throughout the installation process. I recommend this company for solar installation.' },
    { id:'s2', name:'Arun K. Singh', role:'IAS - DC - Jharkhand Govt.', company:'', location:'Ranchi, Jharkhand', capacity:'3 kW', savings:'Rs 25,200/yr', rating:5, photo_url:'', installation_photo: solarImgs[1], review:'Team Sologix have done a brilliant job. My solar system is generating perfectly. I would recommend Sologix Energy for solar installation.' },
    { id:'s3', name:'R. C. Nandraj', role:'Trustee', company:'Dayanand Public School', location:'Jamshedpur, Jharkhand', capacity:'40 kW', savings:'Rs 3,36,000/yr', rating:5, photo_url:'', installation_photo: solarImgs[2], review:'These young engineers have provided outstanding service. Generation warranty that no other installer provides. Excellent company!' },
    { id:'s4', name:'H. P. Biyani', role:'Founder', company:'Raj Ceramics', location:'Ranchi, Jharkhand', capacity:'55 kW', savings:'Rs 4,20,000/yr', rating:5, photo_url:'', installation_photo: solarImgs[3], review:'Young, dynamic and well qualified technical team. I would highly recommend Sologix Energy for rooftop solar installation.' },
    { id:'s5', name:'S. Chandrashekar', role:'Chairman', company:'D.B.M.S English School', location:'Jamshedpur, Jharkhand', capacity:'100 kW', savings:'Rs 8,40,000/yr', rating:5, photo_url:'', installation_photo: solarImgs[4], review:'Technically best solar team in Jharkhand. Very professional, courteous, and respectful. I recommend Sologix Energy.' },
    { id:'s6', name:'Sandesh Narvane', role:'Manager', company:'CMS Kerala Bhavan', location:'Pune, Maharashtra', capacity:'30 kW', savings:'Rs 6,30,000/yr', rating:5, photo_url:'', installation_photo: solarImgs[5], review:'Sologix Energy did a marvellous job. We are enjoying almost zero electric bills after solar installation.' },
  ];
  const displayTestimonials = testimonials === null ? staticTestimonials : testimonials;
  const testimonialsLoop = displayTestimonials.length >= 3;

  // Mini calculator state
  const [calcBill, setCalcBill] = useState('Rs 2,001 - 5,000');
  const [calcService, setCalcService] = useState('residential');
  const [activeStep, setActiveStep] = useState(null);

  const billMap = { 'Rs 500 - 2,000': 1250, 'Rs 2,001 - 5,000': 3500, 'Rs 5,001 - 15,000': 10000, 'Above Rs 15,000': 22000 };
  const tariffMap = { residential: 6.5, commercial: 8.0, industrial: 7.5 };
  const quickCalc = () => {
    const bill = billMap[calcBill] || 3500;
    const tariff = tariffMap[calcService] || 6.5;
    const units = bill / tariff;
    const kw = Math.max(1, Math.ceil((units / 30 / (4.5 * 0.85)) * 4) / 4);
    const panels = Math.ceil((kw * 1000) / 545);
    const cost = Math.round(kw * 56000);
    const subsidy = calcService === 'residential' ? (kw >= 3 ? 78000 : kw >= 2 ? 60000 : 30000) : 0;
    const landed = Math.max(cost - subsidy, 0);
    const savings = Math.round(units * 0.95 * tariff * 12); // Annual savings
    const roi = (landed / savings).toFixed(1);
    return { kw: kw.toFixed(1), panels, savings: savings.toLocaleString('en-IN'), roi, subsidy: subsidy.toLocaleString('en-IN') };
  };
  const preview = quickCalc();

  return (
    <>
      <style>{`
        .carousel-item{transition:all 0.5s cubic-bezier(0.4,0,0.2,1);flex-shrink:0;width:300px;opacity:0.6;transform:scale(0.85)}
        .carousel-item.active{opacity:1;transform:scale(1.1);width:450px;z-index:10}
        .focused-carousel-container{position:relative;display:flex;align-items:center;justify-content:flex-start;gap:2rem;overflow-x:hidden;padding:2rem 0}
        .focused-carousel-container>:first-child{margin-left:auto}.focused-carousel-container>:last-child{margin-right:auto}
        @media(max-width:768px){.carousel-item{width:240px}.carousel-item.active{width:300px}}
        .reason-card,.process-step{transition:transform 0.6s ease,opacity 0.6s ease}
        .social-float a{transition:transform 0.2s ease}
        .social-float a:hover{transform:scale(1.15)}
        .partners-track{display:flex;gap:0.75rem;animation:scrollX 30s linear infinite;width:max-content}
        .partners-track:hover{animation-play-state:paused}
        @keyframes scrollX{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .testimonial-track{display:flex;animation:slideTestimonials 40s linear infinite;width:max-content;padding:1rem 0}
        .testimonial-track:hover{animation-play-state:paused}
        @keyframes slideTestimonials{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      `}</style>

      {/* ── Floating Social Icons (links from Admin → Site Content) ── */}
      {(() => {
        // BUGFIX: links used to be read from the VISITOR's browser storage, which is only
        // filled in the admin's own browser, so real visitors always got hard-coded links
        // (and the YouTube one was dead). They now come from the server: .env first,
        // then Admin > Site Content.
        const sl = getSiteConfig().social || {};
        const wa = whatsappHref(t('Hi Sologix, I would like to know more about solar for my home.'));
        return (
          <div className="social-float fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
            {wa && (
              <a href={wa} target="_blank" rel="noreferrer" title={t('Chat on WhatsApp')} aria-label={t('Chat on WhatsApp')}
                className="w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg"
                style={{background:'#25D366'}}>
                <svg viewBox="0 0 32 32" className="w-9 h-9" fill="white" aria-hidden="true">
                  <path d="M16.04 3C9.4 3 4 8.36 4 14.97c0 2.64.87 5.08 2.35 7.06L4.8 28.6l6.8-1.52a12.1 12.1 0 0 0 4.44.84h.01C22.68 27.92 28 22.56 28 15.95 28 9.36 22.68 3 16.04 3zm0 22.9h-.01a10.1 10.1 0 0 1-4.1-.87l-.3-.13-4.03.9.93-3.83-.2-.32a9.8 9.8 0 0 1-1.6-5.4c0-5.5 4.5-9.97 10.03-9.97 5.52 0 10.02 4.47 10.02 9.97 0 5.5-4.5 9.97-10.03 9.97zm5.5-7.46c-.3-.15-1.78-.87-2.05-.97-.28-.1-.48-.15-.68.15-.2.3-.78.97-.96 1.17-.18.2-.35.22-.65.07-.3-.15-1.27-.46-2.42-1.48a9.1 9.1 0 0 1-1.67-2.07c-.18-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.63-.93-2.23-.25-.58-.5-.5-.68-.51h-.58c-.2 0-.53.07-.8.37-.28.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.12 3.22 5.13 4.52.72.3 1.28.49 1.71.63.72.23 1.37.2 1.89.12.58-.09 1.78-.72 2.03-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35z"/>
                </svg>
              </a>
            )}
            {sl.youtube && (
              <a href={sl.youtube} target="_blank" rel="noreferrer" title="YouTube"
                className="w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg"
                style={{background:'#FF0000'}}>
                <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
                  <path d="M44 12.7a5.5 5.5 0 0 0-3.9-3.9C36.6 8 24 8 24 8S11.4 8 7.9 8.8A5.5 5.5 0 0 0 4 12.7C3.2 16.2 3.2 24 3.2 24s0 7.8.8 11.3A5.5 5.5 0 0 0 7.9 39.2C11.4 40 24 40 24 40s12.6 0 16.1-.8a5.5 5.5 0 0 0 3.9-3.9c.8-3.5.8-11.3.8-11.3s0-7.8-.8-11.3zM19.6 30.5v-13L31.2 24l-11.6 6.5z" fill="white"/>
                </svg>
              </a>
            )}
            {sl.facebook && (
              <a href={sl.facebook} target="_blank" rel="noreferrer" title="Facebook"
                className="w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg"
                style={{background:'#1877F2'}}>
                <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
                  <path d="M30 8h-4a10 10 0 0 0-10 10v3h-4v6h4v13h7V27h5l1-6h-6v-3a2 2 0 0 1 2-2h4V8z" fill="white"/>
                </svg>
              </a>
            )}
            {sl.instagram && (
              <a href={sl.instagram} target="_blank" rel="noreferrer" title="Instagram"
                className="w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg"
                style={{background:'linear-gradient(135deg,#F58529 0%,#DD2A7B 50%,#8134AF 100%)'}}>
                <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
                  <rect x="8" y="8" width="32" height="32" rx="10" stroke="white" strokeWidth="3" fill="none"/>
                  <circle cx="24" cy="24" r="8" stroke="white" strokeWidth="3" fill="none"/>
                  <circle cx="34.5" cy="13.5" r="2.5" fill="white"/>
                </svg>
              </a>
            )}
            {sl.linkedin && (
              <a href={sl.linkedin} target="_blank" rel="noreferrer" title="LinkedIn"
                className="w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg"
                style={{background:'#0A66C2'}}>
                <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
                  <path d="M14 20H9v19h5V20zm-2.5-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM39 39h-5v-9.5c0-2.5-1-4.5-3.5-4.5S27 27 27 29.5V39h-5V20h5v2.5c.8-1.5 2.8-3 5.5-3C37 19.5 39 22.5 39 27v12z" fill="white"/>
                </svg>
              </a>
            )}
          </div>
        );
      })()}

      {/* ── Hero ── */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="metadata"
            onEnded={playNext}
            className="w-full h-full object-cover"
            src={HERO_VIDEOS[0]}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
        </div>
        <div className="container mx-auto px-6 lg:px-16 relative z-10 text-center lg:text-left">
          <div className="max-w-3xl">
            <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/20 mb-6">
              <span className="text-white font-medium uppercase tracking-widest text-xs">{t("Jharkhand's Leading Solar Panel Installation Company")}</span>
            </div>
            <h1 className="text-[44px] md:text-6xl font-bold text-white mb-4 leading-tight">{t('Powering Jharkhand Through Solar, Renewable Energy & Energy Storage Solutions')}</h1>
            <p className="text-base text-white/80 mb-2 italic">{t('Energizing Naturally')}</p>
            <p className="text-lg text-white/90 mb-10 max-w-xl">{t('Solar installation, maintenance & our products — making clean energy accessible, reliable and affordable for everyone.')}</p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link to="/booking" className="bg-[#006948] text-white px-8 py-4 rounded-full font-medium flex items-center gap-2 hover:bg-green-700 transition-all">{t('Get a Quote')} →</Link>
              <Link to="/services" className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-full font-medium hover:bg-white/20 transition-all">{t('Our Services')}</Link>
            </div>
          </div>
        </div>

      </section>

      {/* ── Stats Badges (Admin > Site Content > Statistics) ── */}
      {statsList.length > 0 && (
        <section className="py-12 bg-white border-y border-gray-100">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {statsList.map(({ target, suffix, decimals, label }, i) => (
                <div key={i + '|' + target + '|' + suffix} className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 hover:border-green-300 hover:shadow-md transition-all min-w-0">
                  <CountUp target={target} suffix={suffix} decimals={decimals} className="text-3xl md:text-4xl font-bold text-[#006948] break-words" />
                  <div className="text-sm text-gray-500 mt-2 font-medium line-clamp-2">{t(label)}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Our Offerings (Admin > Site Content > Offerings) ── */}
      {offeringsList.length > 0 && (
      <section className="py-24 bg-gray-50 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16 text-center mb-4">
          <p className="text-gray-500 text-sm mb-2">{t("Jharkhand's Leading Solar Panel Installation Company")}</p>
          <span className="text-[#006948] font-semibold uppercase tracking-[0.2em] block mb-2 text-base">{t('Our Offerings')}</span>
          <p className="text-gray-400 text-xs italic">{t('Click to explore details about each offering')}</p>
        </div>
        <div className="focused-carousel-container" id="offerings-carousel">
          {offeringsList.map(({ label, desc, img, link }, i) => (
            <SmartLink key={i} to={link} className={`carousel-item${i === activeOffer ? ' active' : ''}`}>
              <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3] bg-gray-200">
                <img src={img} alt={t(label)} className="w-full h-full object-cover" loading="lazy" onError={imgFallback(DEFAULT_OFFERING_IMG)} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 text-left">
                  <h3 className="text-white text-3xl font-bold mb-3 line-clamp-2 break-words">{t(label)}</h3>
                  <p className="text-white/80 text-base line-clamp-3">{t(desc)}</p>
                  <span className="text-[#68dba9] text-sm mt-3 font-semibold">{t('Click to learn more')} →</span>
                </div>
              </div>
            </SmartLink>
          ))}
        </div>
        {offeringsList.length > 1 && (
          <div className="flex justify-center gap-4 mt-4">
            <button type="button" aria-label={t('Previous')} onClick={() => moveCarousel('offerings-carousel', 'prev', offeringsList.length, activeOffer, setOfferIdx)} className="w-12 h-12 rounded-full border border-[#006948] text-[#006948] flex items-center justify-center hover:bg-[#006948] hover:text-white transition-all text-2xl">‹</button>
            <button type="button" aria-label={t('Next')} onClick={() => moveCarousel('offerings-carousel', 'next', offeringsList.length, activeOffer, setOfferIdx)} className="w-12 h-12 rounded-full border border-[#006948] text-[#006948] flex items-center justify-center hover:bg-[#006948] hover:text-white transition-all text-2xl">›</button>
          </div>
        )}
      </section>
      )}


      {/* ── Our Projects ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
          <div className="text-center mb-12">
            <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-4 text-sm">{t('Portfolio')}</span>
            <h2 className="text-4xl font-bold">{t('Our Projects')}</h2>
          </div>
          {/* Featured projects from Admin > Projects (built-in 6 if the API can't be reached) */}
          {projectCards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectCards.map(({ key, title, location, capacity, type, savings, img, fallback }) => (
              <div key={key} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 group">
                <div className="relative h-52 overflow-hidden bg-gray-100">
                  <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" onError={imgFallback(fallback || SOLAR_IMGS[0])} />
                  {type && (
                    <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full border border-gray-100 max-w-[80%]">
                      <span className="text-xs font-medium text-[#006948] block truncate">{t(type)}</span>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold text-gray-800 mb-1 line-clamp-2">{title}</h3>
                  {location && <p className="text-gray-500 text-sm mb-3 truncate">📍 {location}</p>}
                  <div className="flex justify-between items-center gap-3 border-t border-gray-100 pt-3">
                    <span className="text-xs font-semibold text-[#006948] truncate">{capacity}</span>
                    {savings && <span className="text-xs text-green-600 font-medium truncate">{fmtSavings(savings)}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}
          <div className="text-center mt-10">
            <Link to="/projects-gallery" className="inline-flex items-center gap-2 bg-[#006948] text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-all">{t('View All Projects')}</Link>
          </div>
        </div>
      </section>

      {/* ── Our Products ── */}
      <section className="py-20 bg-white overflow-hidden border-y border-gray-100">
        <div className="text-center mb-10">
          <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-2 text-sm">{t('What We Offer')}</span>
          <h2 className="text-3xl font-bold">{t('Our Products')}</h2>
          <p className="text-gray-400 text-xs mt-2 italic">{t('Click any product to view full details')}</p>
        </div>
        {/* Real products from Admin > Product Catalog (built-in cards if unavailable) */}
        <div className="relative flex overflow-x-hidden">
          <div
            className={productsLoop ? 'partners-track' : 'flex flex-wrap justify-center gap-3 w-full px-6'}
            style={productsLoop ? { animationDuration: Math.max(30, productCards.length * 3) + 's' } : undefined}
          >
            {(productsLoop ? [...productCards, ...productCards] : productCards).map(({ key, name, spec, img, link, badge }, i) => (
              <Link to={link} key={key + '-' + i} aria-hidden={productsLoop && i >= productCards.length ? 'true' : undefined} tabIndex={productsLoop && i >= productCards.length ? -1 : undefined}
                className="inline-flex flex-col items-center bg-white border border-gray-100 rounded-2xl shadow-sm min-w-[240px] w-[240px] overflow-hidden hover:shadow-md transition-all hover:border-green-200">
                <div className="relative w-full h-36 bg-gray-100">
                  <img src={img} alt={t(name)} className="w-full h-36 object-cover" loading="lazy" onError={imgFallback(SOLAR_IMGS[i % SOLAR_IMGS.length])} />
                  {badge && <span className="absolute top-2 left-2 bg-[#006948] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full max-w-[85%] truncate">{t(badge)}</span>}
                </div>
                <div className="p-4 text-center w-full">
                  <h4 className="font-bold text-sm text-gray-800 line-clamp-2">{t(name)}</h4>
                  {spec && <p className="text-xs text-gray-500 mt-1 truncate">{t(spec)}</p>}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PM Surya Yojana ── */}
      <section className="py-24 bg-[#EFF6FF] relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-[#006948]/10 rounded-[3rem] blur-2xl"></div>
              <img src="https://res.cloudinary.com/dsiratycd/image/upload/v1780332120/Gemini_Generated_Image_3t00r93t00r93t00_jkpvx2.png" alt={t('PM Surya Ghar Yojana')}
                className="rounded-[2.5rem] shadow-2xl relative z-10 border-8 border-white w-full object-cover"
                onError={e => { e.target.src='https://res.cloudinary.com/dsiratycd/image/upload/v1774797121/comercial_fie2wd.png'; }} />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#006948]/10 rounded-full text-[#006948] font-medium text-sm mb-6">✅ {t('Government Initiative')}</div>
              <h2 className="text-4xl font-bold mb-6">{t('PM Surya Ghar: Muft Bijli Yojana')}</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">{withBold(t("India's flagship rooftop solar scheme — eligible households receive up to {b} every month with direct government subsidy support."), t('300 units of free electricity'))}</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon:'₹', label:'₹30,000 subsidy for 1 kW' },
                  { icon:'₹', label:'₹60,000 subsidy for 2 kW' },
                  { icon:'₹', label:'Up to ₹78,000 for 3 kW+' },
                  { icon:'⚡', label:'300 Units Free Electricity' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                    <span className="w-8 h-8 bg-[#006948] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{icon}</span>
                    <span className="text-sm font-semibold text-gray-700">{t(label)}</span>
                  </div>
                ))}
              </div>
              <Link to="/subsidies" className="inline-block bg-[#006948] text-white px-10 py-4 rounded-full font-medium shadow-xl hover:scale-105 transition-all hover:bg-green-700">
                {t('Apply Subsidy Now')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us (Admin > Site Content > Why Customers Choose Us) ── */}
      {whyList.length > 0 && (
      <section className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16 text-center">
          <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-4 text-sm">{t('The Sologix Advantage')}</span>
          <h2 className="text-4xl font-bold mb-16">{t('Why Customers Choose Us?')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyList.map(({ icon, title, desc }, i) => (
              <div key={i} className="reason-card p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:border-[#006948] transition-all opacity-0 translate-y-10 text-left min-w-0" style={{ transitionDelay:`${Math.min(i, 12) * 80}ms` }}>
                {icon && <div className="text-3xl mb-4">{icon}</div>}
                <h3 className="font-semibold text-base mb-2 line-clamp-2 break-words">{t(title)}</h3>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-5">{t(desc)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ── Work Process (Admin > Site Content > Work Process) ──
           One list feeds the step row, the details box and the carousel. */}
      {processList.length > 0 && (
      <section className="py-24 bg-gray-50 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16 text-center mb-12">
          <h2 className="text-4xl font-bold">{t('Our Work Process')}</h2>
          <p className="text-gray-500 mt-3">{t('From first survey to final installation')}</p>
        </div>
        <div className="max-w-4xl mx-auto px-6 mb-12">
          <div className="flex items-start justify-between gap-2 relative">
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0"></div>
            {processList.map(({ short, title, icon }, i) => {
              const isActive = activeStep === i;
              return (
                <button type="button" key={i}
                  className="process-step flex flex-col items-center z-10 opacity-0 translate-y-10 cursor-pointer group min-w-0 flex-1"
                  style={{ transitionDelay:`${Math.min(i, 10) * 150}ms` }}
                  aria-expanded={isActive}
                  onClick={() => setActiveStep(isActive ? null : i)}
                >
                  <div className={"w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mb-3 shadow-lg transition-all duration-300 " + (isActive ? "bg-white text-[#006948] scale-125 ring-4 ring-[#006948]" : "bg-[#006948] text-white group-hover:scale-110 group-hover:ring-4 group-hover:ring-[#006948]/30")}>
                    {isActive && icon ? icon : <span className="truncate max-w-[3rem]">{short}</span>}
                  </div>
                  <p className={"text-xs font-semibold text-center max-w-[80px] line-clamp-3 break-words transition-colors " + (isActive ? "text-[#006948]" : "text-gray-600")}>{t(title)}</p>
                </button>
              );
            })}
          </div>
          {activeStep !== null && processList[activeStep] && (
            <div className="mt-8 bg-white rounded-2xl p-6 shadow-md border border-green-100 animate-fade-in text-center max-w-xl mx-auto">
              <h4 className="font-bold text-lg text-[#006948] mb-2">{t('Step {num}: {title}', { num: processList[activeStep].short, title: t(processList[activeStep].title) })}</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{t(processList[activeStep].desc)}</p>
            </div>
          )}
        </div>
        <div className="focused-carousel-container" id="process-carousel">
          {processList.map(({ num, title, desc, icon }, i) => (
            <div key={i} className={`carousel-item${i === activeProc ? ' active' : ''}`}>
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 h-[320px] flex flex-col justify-center text-center overflow-hidden">
                {icon && <div className="text-5xl mb-4">{icon}</div>}
                <div className="text-sm text-[#006948] font-bold mb-2">{num}</div>
                <h4 className="text-xl font-bold mb-3 line-clamp-2 break-words">{t(title)}</h4>
                <p className="text-sm text-gray-500 leading-relaxed line-clamp-5">{t(desc)}</p>
              </div>
            </div>
          ))}
        </div>
        {processList.length > 1 && (
          <div className="flex justify-center gap-4 mt-6">
            <button type="button" aria-label={t('Previous')} onClick={() => moveCarousel('process-carousel', 'prev', processList.length, activeProc, setProcIdx)} className="w-12 h-12 rounded-full border border-[#006948] text-[#006948] flex items-center justify-center hover:bg-[#006948] hover:text-white transition-all text-2xl">&#8249;</button>
            <button type="button" aria-label={t('Next')} onClick={() => moveCarousel('process-carousel', 'next', processList.length, activeProc, setProcIdx)} className="w-12 h-12 rounded-full border border-[#006948] text-[#006948] flex items-center justify-center hover:bg-[#006948] hover:text-white transition-all text-2xl">&#8250;</button>
          </div>
        )}
      </section>
      )}

      {/* ── Mini Calculator ── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
          <div className="text-center mb-10">
            <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-2 text-sm">{t('Instant Estimate')}</span>
            <h2 className="text-4xl font-bold">{t('Solar Calculator')}</h2>
            <p className="text-gray-500 mt-3">{t('Get a quick glimpse of your solar potential — select your bill and service type')}</p>
          </div>
          <div className="bg-gradient-to-br from-[#e9edff] to-[#d1fae5] rounded-[2.5rem] p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Inputs */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">{t('Monthly Bill Range')}</label>
                    <select value={calcBill} onChange={e => setCalcBill(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] shadow-sm">
                      {['Rs 500 - 2,000','Rs 2,001 - 5,000','Rs 5,001 - 15,000','Above Rs 15,000'].map(o => <option key={o} value={o}>{t(o)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">{t('Service Type')}</label>
                    <select value={calcService} onChange={e => setCalcService(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] shadow-sm">
                      <option value="residential">{t('Residential')}</option>
                      <option value="commercial">{t('Commercial')}</option>
                      <option value="industrial">{t('Industrial')}</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-6">{withBold(t('* Live estimate based on {b}. Tariff varies by state — visit the full calculator to select your state for accurate results.'), t('Jharkhand tariff (₹6.5/unit residential)'))}</p>
                <Link to="/solar-calculator" className="inline-flex items-center gap-2 bg-[#006948] text-white px-8 py-4 rounded-full font-semibold hover:bg-green-700 shadow-lg transition-all">
                  {t('Calculate My Savings in Detail')} →
                </Link>
              </div>
              {/* Live preview */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon:'⚡', label:'System Size', value: preview.kw + ' kW', color:'bg-blue-50 border-blue-100' },
                  { icon:'🔲', label:'Solar Panels', value: t('{n} panels', { n: preview.panels }), color:'bg-purple-50 border-purple-100' },
                  { icon:'💰', label:'Yearly Savings', value: 'Rs ' + preview.savings, color:'bg-green-50 border-green-100' },
                  { icon:'📈', label:'ROI Period', value: t('{n} years', { n: preview.roi }), color:'bg-yellow-50 border-yellow-100' },
                  { icon:'🏛️', label:'Govt Subsidy', value: 'Rs ' + preview.subsidy, color:'bg-red-50 border-red-100', span: true },
                ].map(({ icon, label, value, color, span }) => (
                  <div key={label} className={"bg-white rounded-2xl p-5 border shadow-sm text-center transition-all hover:shadow-md hover:scale-105 " + color + (span ? " col-span-2" : "")}>
                    <div className="text-3xl mb-2">{icon}</div>
                    <p className="text-xs text-gray-500 mb-1">{t(label)}</p>
                    <p className="text-lg font-bold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── Testimonials — auto-sliding carousel ──
           API down -> built-in reviews; admin hid every review -> section hidden. */}
      {displayTestimonials.length > 0 && (
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
          <div className="text-center mb-12">
            <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-4 text-sm">{t('What Our Customers Say')}</span>
            <h2 className="text-4xl font-bold">{t('Client Testimonials')}</h2>
            <p className="text-gray-500 mt-3 text-sm">{t('Real reviews from our satisfied customers across Jharkhand & India')}</p>
          </div>
        </div>
        {/* Infinite sliding track */}
        <div className="relative">
          <div className={testimonialsLoop ? 'testimonial-track' : 'flex flex-wrap justify-center gap-y-6 px-4 py-4'}>
            {(testimonialsLoop ? [...displayTestimonials, ...displayTestimonials] : displayTestimonials).map((tm, idx) => {
              const fallbackImg = solarImgs[idx % solarImgs.length];
              const installImg = toText(tm.installation_photo).trim() || fallbackImg;
              return (
                <div key={idx} className="testimonial-card bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col flex-shrink-0" style={{width:'340px', margin:'0 12px'}}>
                  <div className="relative h-44 overflow-hidden">
                    <img src={installImg} alt={t('Solar installation')} className="w-full h-full object-cover" loading="lazy" onError={imgFallback(fallbackImg)} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                    <div className="absolute bottom-3 left-4 flex gap-0.5">
                      {[1,2,3,4,5].map(s => <span key={s} className={"text-base drop-shadow " + (s <= (tm.rating||5) ? 'text-yellow-400' : 'text-white/30')}>★</span>)}
                    </div>
                    {tm.capacity && (
                      <div className="absolute top-3 right-3 bg-[#006948] text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow">{tm.capacity}</div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-4 -mt-10 relative z-10">
                      {/* BUGFIX: photo_url was never rendered, so no testimonial photo ever showed. */}
                      {tm.photo_url ? (
                        <img
                          src={avatarUrl(tm.photo_url)}
                          alt={tm.name}
                          loading="lazy"
                          className="w-14 h-14 rounded-full object-cover flex-shrink-0 shadow-lg bg-white"
                          style={{border:'3px solid white'}}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fb = e.currentTarget.nextElementSibling;
                            if (fb) fb.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-14 h-14 bg-gradient-to-br from-[#006948] to-green-400 rounded-full items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg" style={{border:'3px solid white', display: tm.photo_url ? 'none' : 'flex'}}>
                        {toText(tm.name).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 pt-8">
                        <p className="font-bold text-gray-800 text-sm leading-tight truncate">{toText(tm.name)}</p>
                        <p className="text-xs text-gray-500 truncate">{[tm.role, tm.company].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed italic flex-1 line-clamp-5 break-words" title={toText(tm.review)}>"{toText(tm.review)}"</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                      {tm.location && <p className="text-xs text-gray-400 flex items-center gap-1"><span>📍</span>{tm.location}</p>}
                      {tm.savings && <span className="text-xs bg-green-50 text-[#006948] px-2.5 py-1 rounded-full font-semibold">{fmtSavings(tm.savings)}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* ── YouTube videos (Admin > Site Content > YouTube videos) ── */}
      <YouTubeSection />

      {/* ── Partners & Clients ── */}
      <section className="py-20 bg-gray-50 overflow-hidden border-t border-gray-100">
        <div className="text-center mb-10">
          <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-4 text-sm">{t('Trusted By')}</span>
          <h2 className="text-3xl font-bold">{t('Our Partners & Clients')}</h2>
        </div>
        <div className="relative flex overflow-x-hidden">
          <div className="partners-track">
            {[...partners, ...partners].map((p, i) => (
              <div key={i} className="inline-flex items-center justify-center bg-white border border-gray-200 rounded-2xl shadow-sm min-w-[180px] h-32 px-4 hover:shadow-md hover:border-green-300 transition-all">
                <img
                  src={/* served from frontend/public/partners/ (the old sologixenergy.in site no longer exists) */ "/partners/" + p + ".jpg"}
                  alt={p}
                  className="max-h-28 max-w-[160px] object-contain" loading="lazy"
                  onError={e => {
                    e.target.style.display = 'none';
                    if (e.target.parentElement) {
                      const span = document.createElement('span');
                      span.textContent = p;
                      span.style.cssText = 'font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em';
                      e.target.parentElement.replaceChildren(span);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
