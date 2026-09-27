import AdminLayout from '../../components/AdminLayout';
import { SITE_THEMES, applyTheme, getTheme } from '../../components/ThemeProvider';
import React, { useState, useEffect, useCallback } from 'react';
import { siteSettingsAPI, youtubeAPI, uploadAPI } from '../../utils/api';
import toast from 'react-hot-toast';
import { getSiteConfig, loadSiteConfig } from '../../utils/siteConfig';
import {
  DEFAULT_STATS, DEFAULT_OFFERINGS, DEFAULT_WHY, DEFAULT_PROCESS, DEFAULT_YOUTUBE, DEFAULT_PROMO_BANNER, DEFAULT_BRANCHES, DEFAULT_CHANNEL_PARTNERS,
  setSiteContentKey, padNum,
} from '../../utils/siteContent';

// The DEFAULT_* lists live in utils/siteContent.js so "Restore defaults" here
// gives exactly what the homepage shows when nothing has been saved.

const DEFAULT_SOCIAL = {
  youtube: 'https://www.youtube.com/@Solar_by_Sologix',
  facebook: 'https://www.facebook.com/sologix/',
  instagram: 'https://www.instagram.com/sologixenergy/',
  linkedin: 'https://www.linkedin.com/company/m-s-sologix-energy/',
  x: '',
};

const LIST_DEFAULTS = {
  stats: DEFAULT_STATS,
  offerings: DEFAULT_OFFERINGS,
  why_us: DEFAULT_WHY,
  work_process: DEFAULT_PROCESS,
  branches: DEFAULT_BRANCHES,
};

const BLANK_ITEM = {
  stats: () => ({ target: '', suffix: '+', label: '' }),
  offerings: () => ({ label: '', desc: '', img: '', link: '/solutions' }),
  why_us: () => ({ icon: '⭐', title: '', desc: '' }),
  work_process: (len) => ({ num: padNum(len + 1), icon: '🔧', title: '', desc: '' }),
  branches: () => ({ name: '', address: '', phones: [] }),
};

const MAX_DATA_URL = 1000000;        // ~1 MB per uploaded image (as a data URL)
const SERVER_VALUE_LIMIT = 3000000;  // the server accepts about 3 MB for offerings (images are normally uploaded, so settings stay small)

const clone = (v) => JSON.parse(JSON.stringify(v));
const str = (v) => (v === null || v === undefined || typeof v === 'object' ? '' : String(v));
const isNumberText = (v) => /^\d+(\.\d+)?$/.test(str(v).trim().replace(/,/g, ''));
const parseMaybe = (v) => {
  if (typeof v !== 'string') return v;
  try { return JSON.parse(v); } catch (e) { return v; }
};
const errMsg = (e, fallback) => (e && e.response && e.response.data && e.response.data.message) || (e && e.message && !/status code/i.test(e.message) ? e.message : '') || fallback;

const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white';
const labelCls = 'text-xs text-gray-500 font-medium block mb-1';
const saveBtnCls = 'bg-[#006948] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-60';
const smallBtnCls = 'px-2.5 py-1 rounded-lg text-xs font-medium border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed';

const Section = ({ title, children, icon, actions }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
    <div className="px-6 py-4 border-b border-gray-50 flex flex-wrap items-center gap-3">
      <span className="text-xl">{icon}</span>
      <h3 className="font-bold text-gray-800">{title}</h3>
      {actions && <div className="ml-auto">{actions}</div>}
    </div>
    <div className="p-6">{children}</div>
  </div>
);

// Move up / Move down / Remove for one list item.
const ItemToolbar = ({ index, count, onMove, onRemove }) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <span className="text-xs font-semibold text-gray-400 mr-1">#{index + 1}</span>
    <button type="button" className={smallBtnCls} disabled={index === 0} onClick={() => onMove(index, -1)} aria-label={`Move item ${index + 1} up`}>↑ Move up</button>
    <button type="button" className={smallBtnCls} disabled={index === count - 1} onClick={() => onMove(index, 1)} aria-label={`Move item ${index + 1} down`}>↓ Move down</button>
    <button type="button" className={smallBtnCls + ' text-red-600 hover:bg-red-50 border-red-200'} onClick={() => onRemove(index)} aria-label={`Remove item ${index + 1}`}>✕ Remove</button>
  </div>
);

// "Restore defaults" with an inline "Are you sure? Yes / No" (no window.confirm).
const RestoreDefaults = ({ onConfirm, busy }) => {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} disabled={busy}
        className="text-xs font-medium text-gray-500 hover:text-gray-800 underline disabled:opacity-50">
        Restore defaults
      </button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2 text-xs">
      <span className="text-gray-600 font-medium">Are you sure? This replaces this section on the website.</span>
      <button type="button" className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700"
        onClick={() => { setAsking(false); onConfirm(); }}>Yes</button>
      <button type="button" className={smallBtnCls} onClick={() => setAsking(false)}>No</button>
    </span>
  );
};

const ErrorList = ({ errors }) => (errors && errors.length ? (
  <ul className="mt-4 text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 list-disc list-inside space-y-0.5" role="alert">
    {errors.map((e, i) => <li key={i}>{e}</li>)}
  </ul>
) : null);

// Resize in the browser (max 1200px, JPEG 0.82) like AdminTestimonials does.
const resizeImage = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(new Error('Could not read that file'));
  reader.onload = (ev) => {
    const img = new Image();
    img.onerror = () => reject(new Error('Could not read that image'));
    img.onload = () => {
      const attempt = (max, quality) => {
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', quality);
      };
      let url = attempt(1200, 0.82);
      if (url.length > MAX_DATA_URL) url = attempt(1200, 0.7);
      if (url.length > MAX_DATA_URL) url = attempt(900, 0.7);
      if (url.length > MAX_DATA_URL) { reject(new Error('Image is too large even after resizing. Please use a smaller image.')); return; }
      resolve(url);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

// ── validation / clean-up before save ──────────────────────────────────────
const prepare = {
  stats: (list) => {
    const errors = []; const warnings = [];
    const value = list.map((s, i) => {
      const item = { ...s, target: str(s.target).trim(), suffix: str(s.suffix), label: str(s.label).trim() };
      if (!item.label) errors.push(`Badge #${i + 1}: the label is required.`);
      if (!item.target) errors.push(`Badge #${i + 1}: the number is required.`);
      else if (!isNumberText(item.target)) warnings.push(`Badge #${i + 1}: "${item.target}" is not a number, so it is shown as text without the count-up animation.`);
      return item;
    });
    return { value, errors, warnings };
  },
  offerings: (list) => {
    const errors = [];
    const value = list.map((o, i) => {
      const link = str(o.link).trim() || '/solutions';
      const item = { ...o, label: str(o.label).trim(), desc: str(o.desc).trim(), img: str(o.img).trim(), link };
      if (!item.label) errors.push(`Offering #${i + 1}: the label is required.`);
      if (!/^\/(?!\/)/.test(link) && !/^https?:\/\//i.test(link)) errors.push(`Offering #${i + 1}: the link must start with "/" (a page on this site) or "https://".`);
      if (item.img && !/^https?:\/\//i.test(item.img) && !/^data:image\//i.test(item.img)) errors.push(`Offering #${i + 1}: the image must be a web address (https://...) or an uploaded image.`);
      return item;
    });
    return { value, errors, warnings: [] };
  },
  why_us: (list) => {
    const errors = [];
    const value = list.map((w, i) => {
      const item = { ...w, icon: str(w.icon).trim(), title: str(w.title).trim(), desc: str(w.desc).trim() };
      if (!item.title) errors.push(`Card #${i + 1}: the title is required.`);
      return item;
    });
    return { value, errors, warnings: [] };
  },
  work_process: (list) => {
    const errors = [];
    const value = list.map((p, i) => {
      const item = { ...p, num: str(p.num).trim(), icon: str(p.icon).trim(), title: str(p.title).trim(), desc: str(p.desc).trim() };
      if (!item.title) errors.push(`Step #${i + 1}: the title is required.`);
      return item;
    });
    return { value, errors, warnings: [] };
  },
  branches: (list) => {
    const errors = [];
    const value = list.map((b, i) => {
      const phones = (Array.isArray(b.phones) ? b.phones : String(b.phones || '').split('\n'))
        .map(x => str(x).trim()).filter(Boolean).slice(0, 5);
      const item = { name: str(b.name).trim(), address: str(b.address).trim(), phones };
      if (!item.name) errors.push(`Branch #${i + 1}: the branch name is required.`);
      return item;
    });
    return { value, errors, warnings: [] };
  },
};

const fmtDate = (iso, withTime) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return withTime ? d.toLocaleString('en-IN') : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const normYoutube = (v) => {
  const o = parseMaybe(v);
  const src = o && typeof o === 'object' && !Array.isArray(o) ? o : {};
  const max = parseInt(src.max, 10);
  return {
    enabled: src.enabled === undefined ? DEFAULT_YOUTUBE.enabled : src.enabled !== false,
    title: typeof src.title === 'string' ? src.title : DEFAULT_YOUTUBE.title,
    subtitle: typeof src.subtitle === 'string' ? src.subtitle : DEFAULT_YOUTUBE.subtitle,
    max: Number.isFinite(max) ? Math.min(24, Math.max(3, max)) : DEFAULT_YOUTUBE.max,
    include_shorts: src.include_shorts === undefined ? DEFAULT_YOUTUBE.include_shorts : src.include_shorts !== false,
    hidden: Array.isArray(src.hidden) ? src.hidden.filter(x => typeof x === 'string') : [],
  };
};

const normPromo = (v) => {
  const o = parseMaybe(v);
  const src = o && typeof o === 'object' && !Array.isArray(o) ? o : {};
  const out = { ...DEFAULT_PROMO_BANNER };
  for (const k of Object.keys(out)) {
    if (src[k] === undefined) continue;
    out[k] = (k === 'enabled' || k === 'show_countdown') ? src[k] !== false && src[k] !== 'false' && src[k] !== 0 : str(src[k]);
  }
  if (!['diwali', 'navratri', 'green'].includes(out.theme)) out.theme = 'diwali';
  return out;
};

// Must match THEMES in components/PromoBanner.js (preview only).
const PROMO_THEMES = [
  { id: 'diwali', name: 'Diwali (purple & gold)', icon: '🪔', preview: 'linear-gradient(90deg,#2e1065,#701a75,#9d174d)', btn: '#fbbf24' },
  { id: 'navratri', name: 'Navratri / Dussehra (orange)', icon: '🏵️', preview: 'linear-gradient(90deg,#7c2d12,#c2410c,#b91c1c)', btn: '#fde047' },
  { id: 'green', name: 'Sologix green', icon: '✨', preview: 'linear-gradient(90deg,#064e3b,#047857,#065f46)', btn: '#fde047' },
];

const Toggle = ({ checked, onChange, label, id }) => (
  <label htmlFor={id} className="inline-flex items-center gap-3 cursor-pointer select-none">
    <span className="relative inline-block w-11 h-6">
      <input id={id} type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="absolute inset-0 rounded-full bg-gray-300 peer-checked:bg-[#006948] transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-green-500 peer-focus-visible:ring-offset-2"></span>
      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5"></span>
    </span>
    <span className="text-sm font-medium text-gray-700">{label}</span>
  </label>
);

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [errors, setErrors] = useState({});
  const [uploading, setUploading] = useState(null);
  const [siteCfg, setSiteCfg] = useState(getSiteConfig());
  const [activeTheme, setActiveTheme] = React.useState(() => getTheme().id);

  // YouTube
  const [yt, setYt] = useState(null);             // { channel, videos, updated_at, stale, error }
  const [ytForm, setYtForm] = useState(() => normYoutube(null));
  const [ytLoading, setYtLoading] = useState(true);
  const [ytLoadError, setYtLoadError] = useState('');
  const [ytBusy, setYtBusy] = useState('');       // '' | 'save' | 'refresh'

  useEffect(() => { loadSiteConfig().then(setSiteCfg); }, []);

  // Channel partner brands (textarea, one per line)
  const [cpText, setCpText] = useState(() => DEFAULT_CHANNEL_PARTNERS.join('\n'));

  // Festive banner
  const [pbForm, setPbForm] = useState(() => normPromo(null));
  const [pbBusy, setPbBusy] = useState(false);

  useEffect(() => {
    siteSettingsAPI.getAll()
      .then(r => {
        const data = (r.data && r.data.data) || {};
        setSettings(data);
        if (data.youtube_section !== undefined) setYtForm(normYoutube(data.youtube_section));
        if (data.promo_banner !== undefined) setPbForm(normPromo(data.promo_banner));
        const cp = parseMaybe(data.channel_partners);
        if (Array.isArray(cp)) setCpText(cp.join('\n'));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const applyYtData = useCallback((d, takeSettings) => {
    if (!d || typeof d !== 'object') return;
    setYt({
      channel: d.channel && typeof d.channel === 'object' ? d.channel : null,
      videos: Array.isArray(d.videos) ? d.videos.filter(v => v && typeof v === 'object' && v.id) : [],
      updated_at: d.updated_at || null,
      stale: !!d.stale,
      error: d.error ? String(d.error) : '',
    });
    if (takeSettings && d.settings) {
      const form = normYoutube(d.settings);
      if (!Array.isArray(d.settings.hidden) && Array.isArray(d.videos)) form.hidden = d.videos.filter(v => v && v.hidden).map(v => String(v.id));
      setYtForm(form);
    }
  }, []);

  useEffect(() => {
    youtubeAPI.getAdmin()
      .then(r => { applyYtData(r.data && r.data.data, true); setYtLoadError(''); })
      .catch(e => setYtLoadError(errMsg(e, 'Could not load the YouTube videos.')))
      .finally(() => setYtLoading(false));
  }, [applyYtData]);

  const get = (key, def) => settings[key] !== undefined ? settings[key] : def;
  const listOf = (key) => {
    const v = parseMaybe(settings[key]);
    return Array.isArray(v) ? v : LIST_DEFAULTS[key];
  };
  const setList = (key, list) => setSettings(s => ({ ...s, [key]: list }));
  const updateItem = (key, i, patch) => {
    const n = [...listOf(key)];
    n[i] = { ...n[i], ...patch };
    setList(key, n);
  };
  const moveItem = (key) => (i, dir) => {
    const n = [...listOf(key)];
    const j = i + dir;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    setList(key, n);
  };
  const removeItem = (key) => (i) => setList(key, listOf(key).filter((_, idx) => idx !== i));
  const addItem = (key) => { const n = listOf(key); setList(key, [...n, BLANK_ITEM[key](n.length)]); };

  const save = async (key, value) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await siteSettingsAPI.update(key, value);
      setSettings(s => ({ ...s, [key]: value }));
      setSiteContentKey(key, value);      // public pages in this tab update too
      toast.success('Saved!');
      return true;
    } catch (e) {
      toast.error(errMsg(e, 'Failed to save'));
      return false;
    } finally { setSaving(s => ({ ...s, [key]: false })); }
  };

  const saveList = (key) => {
    const { value, errors: errs, warnings } = prepare[key](listOf(key));
    setErrors(s => ({ ...s, [key]: errs }));
    if (errs.length) { toast.error(errs.length === 1 ? errs[0] : `Please fix ${errs.length} problems before saving.`); return; }
    const size = JSON.stringify(value).length;
    if (size > SERVER_VALUE_LIMIT) {
      const msg = `This section is too large (${Math.round(size / 1024)} KB, limit about ${Math.round(SERVER_VALUE_LIMIT / 1024)} KB). Replace uploaded images with image web addresses (https://...).`;
      setErrors(s => ({ ...s, [key]: [msg] }));
      toast.error(msg);
      return;
    }
    warnings.forEach(w => toast(w, { icon: '⚠️', duration: 6000 }));
    save(key, value);
  };

  const restoreDefaults = async (key) => {
    const def = clone(LIST_DEFAULTS[key]);
    setErrors(s => ({ ...s, [key]: [] }));
    setList(key, def);
    await save(key, def);
  };

  const handleOfferingImage = async (i, e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error('Image must be under 15MB'); return; }
    setUploading(i);
    try {
      const dataUrl = await resizeImage(file);
      let url = dataUrl;
      // Stored on Cloudinary if set up, otherwise on the server; keeps the setting small.
      try {
        const r = await uploadAPI.uploadImage(dataUrl, 'offerings');
        if (r.data && typeof r.data.imageUrl === 'string' && /^(https:\/\/|\/uploads\/)/.test(r.data.imageUrl)) url = r.data.imageUrl;
      } catch (err) { /* keep the data URL */ }
      updateItem('offerings', i, { img: url });
      if (url === dataUrl) toast('Image added, but it could not be uploaded, so it is stored inside the settings; if saving fails, use an image web address instead.', { icon: 'ℹ️', duration: 7000 });
      else toast.success('Image uploaded');
    } catch (err) {
      toast.error(err.message || 'Could not use that image');
    } finally { setUploading(null); }
  };

  // ── YouTube actions ──
  const saveYoutube = async () => {
    const value = {
      ...ytForm,
      title: ytForm.title.trim(),
      subtitle: ytForm.subtitle.trim(),
      max: Math.min(24, Math.max(3, parseInt(ytForm.max, 10) || DEFAULT_YOUTUBE.max)),
    };
    if (!value.title) { toast.error('Please enter a title (or restore the default one).'); return; }
    setYtBusy('save');
    try {
      await siteSettingsAPI.update('youtube_section', value);
      setYtForm(value);
      setSettings(s => ({ ...s, youtube_section: value }));
      setSiteContentKey('youtube_section', value);
      toast.success('YouTube settings saved');
    } catch (e) { toast.error(errMsg(e, 'Failed to save YouTube settings')); }
    finally { setYtBusy(''); }
  };

  const refreshYoutube = async () => {
    setYtBusy('refresh');
    try {
      const r = await youtubeAPI.refresh();
      applyYtData(r.data && r.data.data, false);
      setYtLoadError('');
      const d = r.data && r.data.data;
      if (d && d.error) toast.error('YouTube: ' + d.error);
      else toast.success('Videos refreshed from YouTube');
    } catch (e) { toast.error(errMsg(e, 'Could not refresh from YouTube')); }
    finally { setYtBusy(''); }
  };

  // ── Festive banner actions ──
  const savePromo = async () => {
    const value = {
      ...pbForm,
      heading: str(pbForm.heading).trim(),
      subheading: str(pbForm.subheading).trim(),
      cta_text: str(pbForm.cta_text).trim(),
      cta_link: str(pbForm.cta_link).trim() || '/booking',
      coupon: str(pbForm.coupon).trim(),
    };
    if (value.enabled && !value.heading) { toast.error('Please enter a heading (or restore the default one).'); return; }
    if (value.cta_link && !/^\/(?!\/)/.test(value.cta_link) && !/^https:\/\//i.test(value.cta_link)) {
      toast.error('The button link must start with "/" (a page on this site) or "https://".'); return;
    }
    if (value.start_date && value.end_date && value.start_date > value.end_date) {
      toast.error('The end date is before the start date.'); return;
    }
    setPbBusy(true);
    const ok = await save('promo_banner', value);
    if (ok) setPbForm(value);
    setPbBusy(false);
  };

  const restorePromoDefaults = async () => {
    const def = clone(DEFAULT_PROMO_BANNER);
    setPbForm(def);
    setPbBusy(true);
    await save('promo_banner', def);
    setPbBusy(false);
  };

  const toggleHidden = (id) => setYtForm(f => ({
    ...f,
    hidden: f.hidden.includes(id) ? f.hidden.filter(x => x !== id) : [...f.hidden, id],
  }));

  if (loading) return <AdminLayout title="Site Settings"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div></div></AdminLayout>;

  const stats = listOf('stats');
  const offerings = listOf('offerings');
  const why = listOf('why_us');
  const process = listOf('work_process');
  const offeringsSize = JSON.stringify(offerings).length;

  const addBtn = (key, label) => (
    <button type="button" onClick={() => addItem(key)}
      className="mt-4 mr-3 px-4 py-2.5 rounded-xl text-sm font-semibold border border-dashed border-[#006948] text-[#006948] hover:bg-green-50">
      + {label}
    </button>
  );
  const emptyNote = (what) => (
    <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
      No {what}. If you save an empty list, this section is hidden on the website.
    </p>
  );

  const channel = yt && yt.channel;
  const channelUrl = channel && typeof channel.url === 'string' && /^https?:\/\//i.test(channel.url) ? channel.url : '';

  return (
    <AdminLayout requiredPerm="manage_settings" title="Site Settings">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Homepage Content Manager</h2>
        <p className="text-sm text-gray-500 mt-1">Edit the festive offer banner, stats, offerings, why-choose-us cards, work process steps and the YouTube section. Visitors see saved changes the next time they open or reload a page.</p>
      </div>

      {/* Festive offer banner */}
      <Section icon="🪔" title="Festive offer banner (top of every page)"
        actions={<RestoreDefaults busy={pbBusy} onConfirm={restorePromoDefaults} />}>
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
          A festive strip shown under the menu on every public page — use it for Dussehra / Diwali / Puja offers.
          It hides itself automatically outside the start and end dates, and visitors can close it for their visit.
          The default text is also shown in Hindi; text you type yourself is shown as typed.
        </p>

        {/* Live preview */}
        {(() => {
          const th = PROMO_THEMES.find(x => x.id === pbForm.theme) || PROMO_THEMES[0];
          return (
            <div className="rounded-xl overflow-hidden mb-5 shadow-sm" style={{ background: th.preview }}>
              <div className="px-4 py-3 flex flex-wrap items-center gap-3 text-white">
                <span className="text-xl">{th.icon}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-extrabold text-sm">{str(pbForm.heading) || '(heading)'}</p>
                  {str(pbForm.subheading) && <p className="text-xs opacity-90">{pbForm.subheading}</p>}
                </div>
                {str(pbForm.coupon) && <span className="px-3 py-1 rounded-full border border-dashed border-white/50 text-xs font-semibold">Use code <span className="font-mono font-bold">{pbForm.coupon}</span></span>}
                {pbForm.show_countdown && str(pbForm.end_date) && <span className="px-3 py-1 rounded-full border border-white/40 text-xs font-semibold">⏳ Offer ends {fmtDate(pbForm.end_date) || pbForm.end_date}</span>}
                {str(pbForm.cta_text) && <span className="px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: th.btn, color: '#3b1d06' }}>{pbForm.cta_text}</span>}
              </div>
              {!pbForm.enabled && <p className="bg-black/40 text-white/90 text-[11px] px-4 py-1">The banner is switched off — visitors do not see it.</p>}
            </div>
          );
        })()}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-3">
            <Toggle id="pb-enabled" checked={pbForm.enabled} onChange={v => setPbForm(f => ({ ...f, enabled: v }))} label="Show the banner on the website" />
            <Toggle id="pb-countdown" checked={pbForm.show_countdown} onChange={v => setPbForm(f => ({ ...f, show_countdown: v }))} label={'Show a countdown ("Offer ends in X days")'} />
          </div>
          <div>
            <label className={labelCls}>Festive style</label>
            <div className="flex flex-wrap gap-2">
              {PROMO_THEMES.map(th => (
                <button key={th.id} type="button" onClick={() => setPbForm(f => ({ ...f, theme: th.id }))}
                  className={'flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 text-xs font-semibold ' + (pbForm.theme === th.id ? 'border-gray-800 text-gray-800' : 'border-gray-200 text-gray-500 hover:border-gray-400')}>
                  <span className="w-6 h-4 rounded" style={{ background: th.preview }}></span>
                  {th.icon} {th.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={labelCls} htmlFor="pb-heading">Heading *</label>
            <input id="pb-heading" value={str(pbForm.heading)} onChange={e => setPbForm(f => ({ ...f, heading: e.target.value }))} maxLength={100} placeholder={DEFAULT_PROMO_BANNER.heading} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="pb-sub">Smaller text under the heading</label>
            <input id="pb-sub" value={str(pbForm.subheading)} onChange={e => setPbForm(f => ({ ...f, subheading: e.target.value }))} maxLength={250} placeholder={DEFAULT_PROMO_BANNER.subheading} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="pb-cta">Button text (empty = no button)</label>
            <input id="pb-cta" value={str(pbForm.cta_text)} onChange={e => setPbForm(f => ({ ...f, cta_text: e.target.value }))} maxLength={40} placeholder={DEFAULT_PROMO_BANNER.cta_text} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="pb-link">Button link</label>
            <input id="pb-link" value={str(pbForm.cta_link)} onChange={e => setPbForm(f => ({ ...f, cta_link: e.target.value }))} placeholder="/booking" className={inputCls} />
            <p className="text-xs text-gray-400 mt-1">A page on this site (e.g. /booking, /contact, /solar-calculator) or an https:// link.</p>
          </div>
          <div>
            <label className={labelCls} htmlFor="pb-coupon">Discount code shown on the banner (optional)</label>
            <input id="pb-coupon" value={str(pbForm.coupon)} onChange={e => setPbForm(f => ({ ...f, coupon: e.target.value }))} maxLength={30} placeholder="e.g. DIWALI10" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls} htmlFor="pb-start">Show from (optional)</label>
              <input id="pb-start" type="date" value={str(pbForm.start_date)} onChange={e => setPbForm(f => ({ ...f, start_date: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} htmlFor="pb-end">Show until (optional)</label>
              <input id="pb-end" type="date" value={str(pbForm.end_date)} onChange={e => setPbForm(f => ({ ...f, end_date: e.target.value }))} className={inputCls} />
            </div>
          </div>
        </div>

        <button type="button" onClick={savePromo} disabled={pbBusy} className={saveBtnCls}>
          {pbBusy ? 'Saving...' : 'Save Festive Banner'}
        </button>
      </Section>

      {/* Stats */}
      <Section icon="📊" title="Statistics Badges (Homepage and About page)"
        actions={<RestoreDefaults busy={saving.stats} onConfirm={() => restoreDefaults('stats')} />}>
        {stats.length === 0 && emptyNote('badges')}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((stat, i) => {
            const target = str(stat.target);
            const notNumber = target.trim() !== '' && !isNumberText(target);
            return (
              <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <div className="mb-3"><ItemToolbar index={i} count={stats.length} onMove={moveItem('stats')} onRemove={removeItem('stats')} /></div>
                <div className="grid grid-cols-3 gap-3 mb-2">
                  <div>
                    <label className={labelCls}>Number</label>
                    <input value={target} onChange={e => updateItem('stats', i, { target: e.target.value })} placeholder="e.g. 100" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Suffix</label>
                    <input value={str(stat.suffix)} onChange={e => updateItem('stats', i, { suffix: e.target.value })} placeholder="+ or  MWh" className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Label *</label>
                    <input value={str(stat.label)} onChange={e => updateItem('stats', i, { label: e.target.value })} placeholder="e.g. Happy Customers" className={inputCls} />
                  </div>
                </div>
                {notNumber && <p className="text-xs text-amber-700 mb-2">Not a number: it will be shown as typed, without the count-up animation.</p>}
                <div className="text-center bg-white rounded-lg p-2 border border-gray-100">
                  <span className="text-2xl font-bold text-[#006948]">{target}{str(stat.suffix)}</span>
                  <span className="text-sm text-gray-500 ml-2">{str(stat.label)}</span>
                </div>
              </div>
            );
          })}
        </div>
        <ErrorList errors={errors.stats} />
        <div className="flex flex-wrap items-center">
          {addBtn('stats', 'Add badge')}
          <button onClick={() => saveList('stats')} disabled={saving.stats} className={'mt-4 ' + saveBtnCls}>
            {saving.stats ? 'Saving...' : 'Save Stats'}
          </button>
        </div>
      </Section>

      {/* Offerings */}
      <Section icon="🏠" title="Our Offerings (carousel)"
        actions={<RestoreDefaults busy={saving.offerings} onConfirm={() => restoreDefaults('offerings')} />}>
        {offerings.length === 0 && emptyNote('offerings')}
        <div className="space-y-4">
          {offerings.map((o, i) => {
            const img = str(o.img);
            return (
              <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                <div className="mb-3"><ItemToolbar index={i} count={offerings.length} onMove={moveItem('offerings')} onRemove={removeItem('offerings')} /></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className={labelCls}>Label *</label>
                    <input value={str(o.label)} onChange={e => updateItem('offerings', i, { label: e.target.value })} className={inputCls} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Description</label>
                    <input value={str(o.desc)} onChange={e => updateItem('offerings', i, { desc: e.target.value })} className={inputCls} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Link (when clicked)</label>
                    <input value={str(o.link)} onChange={e => updateItem('offerings', i, { link: e.target.value })} placeholder="/solutions" className={inputCls} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={labelCls}>Image (web address or upload)</label>
                    <div className="flex flex-wrap gap-3 items-center">
                      <input value={img.startsWith('data:') ? '(uploaded image)' : img}
                        readOnly={img.startsWith('data:')}
                        onChange={e => updateItem('offerings', i, { img: e.target.value })}
                        className={inputCls + ' flex-1 min-w-[200px]'} placeholder="https://..." />
                      <label className={'px-3 py-2 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-gray-700 hover:bg-gray-100 cursor-pointer ' + (uploading === i ? 'opacity-60 pointer-events-none' : '')}>
                        {uploading === i ? 'Uploading...' : 'Upload image'}
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleOfferingImage(i, e)} />
                      </label>
                      {img && <button type="button" onClick={() => updateItem('offerings', i, { img: '' })} className="text-xs text-red-500 hover:underline">Clear</button>}
                      {img && <img src={img} alt="preview" className="w-16 h-12 object-cover rounded-lg border" onError={e => { e.currentTarget.style.display = 'none'; }} />}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">No image? A default solar photo is shown. Uploads are resized automatically.</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {offeringsSize > SERVER_VALUE_LIMIT * 0.8 && (
          <p className="mt-4 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            This section is {Math.round(offeringsSize / 1024)} KB because of uploaded images (limit about {Math.round(SERVER_VALUE_LIMIT / 1024)} KB). Use image web addresses to keep it small.
          </p>
        )}
        <ErrorList errors={errors.offerings} />
        <div className="flex flex-wrap items-center">
          {addBtn('offerings', 'Add offering')}
          <button onClick={() => saveList('offerings')} disabled={saving.offerings || uploading !== null} className={'mt-4 ' + saveBtnCls}>
            {saving.offerings ? 'Saving...' : 'Save Offerings'}
          </button>
        </div>
      </Section>

      {/* Why Choose Us */}
      <Section icon="⭐" title="Why Customers Choose Us (cards)"
        actions={<RestoreDefaults busy={saving.why_us} onConfirm={() => restoreDefaults('why_us')} />}>
        {why.length === 0 && emptyNote('cards')}
        <div className="space-y-3">
          {why.map((w, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
              <div className="mb-3"><ItemToolbar index={i} count={why.length} onMove={moveItem('why_us')} onRemove={removeItem('why_us')} /></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className={labelCls}>Icon (emoji)</label>
                  <input value={str(w.icon)} onChange={e => updateItem('why_us', i, { icon: e.target.value })} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Title *</label>
                  <input value={str(w.title)} onChange={e => updateItem('why_us', i, { title: e.target.value })} className={inputCls} />
                </div>
                <div className="md:col-span-2">
                  <label className={labelCls}>Description</label>
                  <input value={str(w.desc)} onChange={e => updateItem('why_us', i, { desc: e.target.value })} className={inputCls} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <ErrorList errors={errors.why_us} />
        <div className="flex flex-wrap items-center">
          {addBtn('why_us', 'Add card')}
          <button onClick={() => saveList('why_us')} disabled={saving.why_us} className={'mt-4 ' + saveBtnCls}>
            {saving.why_us ? 'Saving...' : 'Save Why Choose Us'}
          </button>
        </div>
      </Section>

      {/* Work Process */}
      <Section icon="🔧" title="Work Process Steps"
        actions={<RestoreDefaults busy={saving.work_process} onConfirm={() => restoreDefaults('work_process')} />}>
        <p className="text-xs text-gray-400 mb-4">These steps are used in all three places of the homepage work-process section (step row, step details and step cards). Leave "Step no." empty to number automatically (01, 02, ...).</p>
        {process.length === 0 && emptyNote('steps')}
        <div className="space-y-3">
          {process.map((p, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
              <div className="mb-3"><ItemToolbar index={i} count={process.length} onMove={moveItem('work_process')} onRemove={removeItem('work_process')} /></div>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div>
                  <label className={labelCls}>Step no.</label>
                  <input value={str(p.num)} onChange={e => updateItem('work_process', i, { num: e.target.value })} placeholder={padNum(i + 1)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Icon (emoji)</label>
                  <input value={str(p.icon)} onChange={e => updateItem('work_process', i, { icon: e.target.value })} className={inputCls} />
                </div>
                <div className="md:col-span-4">
                  <label className={labelCls}>Title *</label>
                  <input value={str(p.title)} onChange={e => updateItem('work_process', i, { title: e.target.value })} placeholder="Step title" className={inputCls} />
                </div>
                <div className="md:col-span-6">
                  <label className={labelCls}>Description</label>
                  <textarea value={str(p.desc)} onChange={e => updateItem('work_process', i, { desc: e.target.value })} rows={2}
                    className={inputCls + ' resize-none'} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <ErrorList errors={errors.work_process} />
        <div className="flex flex-wrap items-center">
          {addBtn('work_process', 'Add step')}
          <button onClick={() => saveList('work_process')} disabled={saving.work_process} className={'mt-4 ' + saveBtnCls}>
            {saving.work_process ? 'Saving...' : 'Save Work Process'}
          </button>
        </div>
      </Section>

      {/* YouTube videos */}
      <Section icon="▶️" title="YouTube videos (Homepage section)">
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
          Videos update automatically from the channel every 30 minutes. The channel link is set by SOCIAL_YOUTUBE / YOUTUBE_CHANNEL in the server .env.
        </p>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mb-5">
          <span className="text-gray-600">
            Channel:{' '}
            {channelUrl
              ? <a href={channelUrl} target="_blank" rel="noreferrer" className="font-semibold text-[#006948] hover:underline">{str(channel.title) || channelUrl}</a>
              : <span className="text-gray-400">{ytLoading ? 'loading...' : 'not set'}</span>}
          </span>
          {yt && yt.updated_at && <span className="text-gray-500">Last updated: {fmtDate(yt.updated_at, true) || str(yt.updated_at)}</span>}
        </div>
        {ytLoadError && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4" role="alert">{ytLoadError}</p>}
        {yt && (yt.error || yt.stale) && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-4" role="status">
            {yt.error ? `YouTube could not be reached: ${yt.error}. ` : ''}
            {yt.stale ? 'Showing the last list that loaded successfully.' : ''}
          </p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col gap-3">
            <Toggle id="yt-enabled" checked={ytForm.enabled} onChange={v => setYtForm(f => ({ ...f, enabled: v }))} label="Show section on homepage" />
            <Toggle id="yt-shorts" checked={ytForm.include_shorts} onChange={v => setYtForm(f => ({ ...f, include_shorts: v }))} label="Include Shorts" />
          </div>
          <div>
            <label className={labelCls} htmlFor="yt-max">How many videos (3–24)</label>
            <input id="yt-max" type="number" min={3} max={24} value={ytForm.max}
              onChange={e => setYtForm(f => ({ ...f, max: e.target.value }))}
              onBlur={() => setYtForm(f => ({ ...f, max: Math.min(24, Math.max(3, parseInt(f.max, 10) || DEFAULT_YOUTUBE.max)) }))}
              className={inputCls + ' max-w-[120px]'} />
          </div>
          <div>
            <label className={labelCls} htmlFor="yt-title">Title</label>
            <input id="yt-title" value={ytForm.title} onChange={e => setYtForm(f => ({ ...f, title: e.target.value }))} placeholder={DEFAULT_YOUTUBE.title} className={inputCls} />
          </div>
          <div>
            <label className={labelCls} htmlFor="yt-subtitle">Subtitle</label>
            <input id="yt-subtitle" value={ytForm.subtitle} onChange={e => setYtForm(f => ({ ...f, subtitle: e.target.value }))} placeholder={DEFAULT_YOUTUBE.subtitle} className={inputCls} />
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4">The default title and subtitle are also shown in Hindi on the Hindi version of the site; text you type yourself is shown as typed.</p>

        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Videos from the channel {yt && yt.videos.length > 0 && <span className="text-gray-400 font-normal">({yt.videos.length}, {ytForm.hidden.filter(id => yt.videos.some(v => String(v.id) === id)).length} hidden)</span>}
          </h4>
          {ytLoading && <p className="text-sm text-gray-400">Loading videos...</p>}
          {!ytLoading && (!yt || yt.videos.length === 0) && <p className="text-sm text-gray-400">No videos loaded yet. Try "Refresh from YouTube now".</p>}
          {yt && yt.videos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[560px] overflow-y-auto pr-1">
              {yt.videos.map(v => {
                const id = String(v.id);
                const hidden = ytForm.hidden.includes(id);
                const isShort = v.is_short === true || v.is_short === 1;
                const off = hidden || (isShort && !ytForm.include_shorts);
                return (
                  <div key={id} className={'flex gap-3 items-start border rounded-xl p-2 ' + (off ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-gray-200')}>
                    <img src={str(v.thumbnail) || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy"
                      className="w-24 h-16 object-cover rounded-lg flex-shrink-0 bg-gray-100" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-800 line-clamp-2" title={str(v.title)}>{str(v.title) || id}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                        {fmtDate(v.published)}
                        {isShort && <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-semibold">Short</span>}
                        {isShort && !ytForm.include_shorts && <span>(Shorts are off)</span>}
                      </p>
                      <button type="button" onClick={() => toggleHidden(id)}
                        className={'mt-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ' + (hidden ? 'border-[#006948] text-[#006948] hover:bg-green-50' : 'border-gray-300 text-gray-600 hover:bg-gray-100')}>
                        {hidden ? 'Show' : 'Hide'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-5">
          <button type="button" onClick={saveYoutube} disabled={!!ytBusy} className={saveBtnCls}>
            {ytBusy === 'save' ? 'Saving...' : 'Save YouTube settings'}
          </button>
          <button type="button" onClick={refreshYoutube} disabled={!!ytBusy}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-60">
            {ytBusy === 'refresh' ? 'Refreshing...' : 'Refresh from YouTube now'}
          </button>
          <span className="text-xs text-gray-400">Hide/Show and the options above take effect after "Save YouTube settings".</span>
        </div>
      </Section>

      {/* Channel partner brands */}
      <Section icon="🤝" title="Channel partner brands (homepage and products page)">
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-4">
          Shown as an "Authorised Channel Partner of ..." ribbon on the homepage and the products page.
          One brand per line, up to 12. Leave empty and save to hide the ribbon.
        </p>
        <textarea rows={5} value={cpText} onChange={e => setCpText(e.target.value)}
          className={inputCls + ' max-w-md font-medium'} placeholder={DEFAULT_CHANNEL_PARTNERS.join('\n')} />
        <div>
          <button onClick={() => {
            const arr = cpText.split('\n').map(x => x.trim()).filter(Boolean).slice(0, 12);
            save('channel_partners', arr);
          }} disabled={saving.channel_partners} className={'mt-4 ' + saveBtnCls}>
            {saving.channel_partners ? 'Saving...' : 'Save Channel Partners'}
          </button>
        </div>
      </Section>

      {/* Branch offices */}
      <Section icon="🏢" title="Branch offices (Contact page and footer)"
        actions={<RestoreDefaults busy={saving.branches} onConfirm={() => restoreDefaults('branches')} />}>
        <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 mb-5">
          Shown as cards on the Contact page and as a compact list in the footer of every page, so customers can
          reach the branch nearest to them. Add a branch whenever you open a new office.
        </p>
        {listOf('branches').length === 0 && emptyNote('branches')}
        <div className="space-y-4">
          {listOf('branches').map((b, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
              <div className="mb-3"><ItemToolbar index={i} count={listOf('branches').length} onMove={moveItem('branches')} onRemove={removeItem('branches')} /></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Branch name *</label>
                  <input value={str(b.name)} onChange={e => updateItem('branches', i, { name: e.target.value })}
                    placeholder="e.g. Jamshedpur Branch" className={inputCls} />
                </div>
                <div className="md:row-span-2">
                  <label className={labelCls}>Contact numbers (one per line, "Name — number")</label>
                  <textarea rows={3}
                    value={Array.isArray(b.phones) ? b.phones.join('\n') : str(b.phones)}
                    onChange={e => updateItem('branches', i, { phones: e.target.value.split('\n') })}
                    placeholder={'Amit Ranjan — 9031018640\nPal Ji — 9835560075'}
                    className={inputCls + ' resize-none'} />
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <textarea rows={2} value={str(b.address)} onChange={e => updateItem('branches', i, { address: e.target.value })}
                    placeholder="Street, area, city, state, PIN" className={inputCls + ' resize-none'} />
                </div>
              </div>
            </div>
          ))}
        </div>
        <ErrorList errors={errors.branches} />
        <div className="flex flex-wrap items-center">
          {addBtn('branches', 'Add branch')}
          <button onClick={() => saveList('branches')} disabled={saving.branches} className={'mt-4 ' + saveBtnCls}>
            {saving.branches ? 'Saving...' : 'Save Branches'}
          </button>
        </div>
      </Section>

      {/* Social Media Links */}
      <Section icon="📱" title="Social Media Links (Floating Icons on Homepage)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key:'youtube',   label:'YouTube', icon:'▶️', placeholder:'https://www.youtube.com/@yourchannel' },
            { key:'facebook',  label:'Facebook', icon:'📘', placeholder:'https://www.facebook.com/sologix/' },
            { key:'instagram', label:'Instagram', icon:'📸', placeholder:'https://www.instagram.com/yourpage/' },
            { key:'linkedin',  label:'LinkedIn',  icon:'💼', placeholder:'https://www.linkedin.com/company/m-s-sologix-energy/' },
            { key:'x',         label:'X (Twitter)', icon:'𝕏', placeholder:'https://x.com/yourhandle' },
          ].map(({ key, label, icon, placeholder }) => {
            const socialLinks = get('social_links', DEFAULT_SOCIAL);
            const fromEnv = siteCfg.socialFromEnv && siteCfg.socialFromEnv[key];
            return (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  {icon} {label}
                  {fromEnv && <span className="ml-2 normal-case font-medium text-amber-600">set in .env (SOCIAL_{key.toUpperCase()}) — edit it there</span>}
                </label>
                <input
                  disabled={!!fromEnv}
                  value={fromEnv ? (siteCfg.social[key] || '(hidden)') : (socialLinks[key] || '')}
                  onChange={e => {
                    const updated = { ...get('social_links', DEFAULT_SOCIAL), [key]: e.target.value };
                    setSettings(s => ({ ...s, social_links: updated }));
                  }}
                  placeholder={placeholder}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3">Leave a field empty to hide that icon. Links set in the server's .env file (SOCIAL_…) take priority and are shown greyed out here. The WhatsApp button uses WHATSAPP_NUMBER from .env.</p>
        <button onClick={() => save('social_links', get('social_links', DEFAULT_SOCIAL))} disabled={saving.social_links}
          className={'mt-4 ' + saveBtnCls}>
          {saving.social_links ? 'Saving...' : 'Save Social Links'}
        </button>
      </Section>

      {/* Website Theme */}
      <Section icon="🎨" title="Website Colour Theme">
        <p className="text-sm text-gray-500 mb-4">Choose a colour theme that applies consistently across ALL pages of the public website — buttons, links, headings, highlights and section backgrounds. Clicking a theme saves it and previews it here straight away.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {SITE_THEMES.map(t => (
            <button
              key={t.id}
              onClick={() => { applyTheme(t.id); setActiveTheme(t.id); save('site_theme', t.id); }}
              className={"rounded-2xl border-2 p-4 text-left transition-all " + (activeTheme === t.id ? 'border-gray-800 shadow-lg' : 'border-gray-200 hover:border-gray-400')}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="w-8 h-8 rounded-full flex-shrink-0 shadow-md" style={{background: t.preview}}></span>
                <span className="font-semibold text-sm text-gray-800">{t.name}</span>
                {activeTheme === t.id && <span className="ml-auto text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Active</span>}
              </div>
              <div className="flex gap-1.5 mt-2">
                {[t.primary, t.muted, t.accent].map((c,i) => (
                  <span key={i} className="flex-1 h-2 rounded-full" style={{background: c}}></span>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">Buttons · Links · Highlights</p>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4 flex items-center gap-1">
          <span>💡</span> No rebuild needed. Website visitors see the new theme on their next page load (opening or refreshing any page).
        </p>
      </Section>
    </AdminLayout>
  );
}
