import React, { useEffect, useState } from 'react';
import CRMLayout from '../../components/CRMLayout';
import { siteSettingsAPI } from '../../utils/api';

// Lead-capture settings are stored server-side in site_settings key `capture`
// and applied to every visitor by components/VisitorTools.js. Shape:
//   {
//     exit_intent_enabled: boolean,   // desktop: cursor leaves top of the window
//     timed_popup_enabled: boolean,   // show after delay_seconds on the site
//     delay_seconds: integer 5–300,
//     popup_heading: string (≤120), popup_subheading: string (≤250), popup_button_text: string (≤40),
//     live_chat_enabled: boolean,     // Tidio chat widget on public pages
//     tidio_key: string ("" or 20–40 letters/digits)
//   }
const DEFAULTS = {
  exit_intent_enabled: false,
  timed_popup_enabled: false,
  delay_seconds: 30,
  popup_heading: 'Get a FREE Solar Quote!',
  popup_subheading: 'Find out how much you can save on electricity bills.',
  popup_button_text: 'Get Free Quote',
  live_chat_enabled: false,
  tidio_key: '',
};
const TIDIO_RE = /^[a-z0-9]{20,40}$/i;
const LIMITS = { popup_heading: 120, popup_subheading: 250, popup_button_text: 40 };

const parseObj = (v) => {
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { return null; } }
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
};

// Merge a stored object over the defaults, coercing each field to the right type.
function normalize(raw) {
  const s = { ...DEFAULTS };
  if (!raw) return s;
  ['exit_intent_enabled', 'timed_popup_enabled', 'live_chat_enabled'].forEach(k => {
    if (raw[k] !== undefined) s[k] = raw[k] === true || raw[k] === 'true' || raw[k] === 1;
  });
  const d = parseInt(raw.delay_seconds, 10);
  if (Number.isFinite(d)) s.delay_seconds = d;
  ['popup_heading', 'popup_subheading', 'popup_button_text', 'tidio_key'].forEach(k => {
    if (typeof raw[k] === 'string') s[k] = raw[k];
  });
  return s;
}

// Values the old version kept only in the admin's browser (never reached visitors).
function readLegacy() {
  try {
    const g = (k) => localStorage.getItem('crm_' + k);
    if (![g('exit_intent'), g('timed_popup'), g('timed_delay'), g('tidio_key'), g('popup_heading'), g('popup_subtext')].some(v => v !== null)) return null;
    return {
      exit_intent_enabled: g('exit_intent') === 'true',
      timed_popup_enabled: g('timed_popup') === 'true',
      delay_seconds: g('timed_delay') || DEFAULTS.delay_seconds,
      popup_heading: g('popup_heading') || DEFAULTS.popup_heading,
      popup_subheading: g('popup_subtext') || DEFAULTS.popup_subheading,
      tidio_key: g('tidio_key') || '',
      live_chat_enabled: !!g('tidio_key') && (g('live_chat') || 'tidio') === 'tidio',
    };
  } catch (e) { return null; }
}
const LEGACY_KEYS = ['exit_intent', 'timed_popup', 'timed_delay', 'live_chat', 'tidio_key', 'popup_heading', 'popup_subtext'];

const serverMsg = (err, fallback) => err?.response?.data?.message || (err?.response ? fallback : 'Network error — could not reach the server.');

export default function CRMCapture() {
  const [settings, setSettings] = useState(DEFAULTS);
  const [live, setLive] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [legacyNote, setLegacyNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);

  useEffect(() => {
    let alive = true;
    siteSettingsAPI.getAll()
      .then(res => {
        if (!alive) return;
        const stored = parseObj(res?.data?.data?.capture);
        if (stored) {
          const s = normalize(stored);
          setSettings(s); setLive(s);
        } else {
          const legacy = readLegacy();
          if (legacy) { setSettings(normalize(legacy)); setLegacyNote(true); }
        }
      })
      .catch(err => { if (alive) setLoadError(serverMsg(err, 'Could not load the saved capture settings.')); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const update = (key, val) => {
    setSettings(prev => ({ ...prev, [key]: val }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validate = (s) => {
    const e = {};
    const d = Number(s.delay_seconds);
    if (!Number.isInteger(d) || d < 5 || d > 300) e.delay_seconds = 'Enter a whole number of seconds between 5 and 300.';
    Object.entries(LIMITS).forEach(([k, max]) => {
      if (s[k].length > max) e[k] = 'Maximum ' + max + ' characters.';
    });
    if ((s.exit_intent_enabled || s.timed_popup_enabled) && !s.popup_heading) e.popup_heading = 'A heading is required while a pop-up is enabled.';
    if (s.tidio_key && !TIDIO_RE.test(s.tidio_key)) e.tidio_key = 'The Tidio public key is 20–40 letters/digits (Tidio → Settings → Developer → Public key).';
    if (s.live_chat_enabled && !s.tidio_key) e.tidio_key = 'Enter your Tidio public key, or switch live chat off.';
    return e;
  };

  const save = async () => {
    const value = {
      exit_intent_enabled: !!settings.exit_intent_enabled,
      timed_popup_enabled: !!settings.timed_popup_enabled,
      delay_seconds: Number(settings.delay_seconds),
      popup_heading: settings.popup_heading.trim(),
      popup_subheading: settings.popup_subheading.trim(),
      popup_button_text: settings.popup_button_text.trim(),
      live_chat_enabled: !!settings.live_chat_enabled,
      tidio_key: settings.tidio_key.trim(),
    };
    const e = validate(value);
    setErrors(e);
    setStatus(null);
    if (Object.keys(e).length) { setStatus({ type: 'error', text: 'Please fix the highlighted fields.' }); return; }
    setSaving(true);
    try {
      const res = await siteSettingsAPI.update('capture', value);
      if (res?.data?.success === false) throw Object.assign(new Error('fail'), { response: { data: res.data } });
      setSettings(value); setLive(value); setLegacyNote(false);
      setStatus({ type: 'success', text: 'Saved. Changes are live on the website for new page loads.' });
      try { LEGACY_KEYS.forEach(k => localStorage.removeItem('crm_' + k)); } catch (err) { /* ignore */ }
    } catch (err) {
      setStatus({ type: 'error', text: serverMsg(err, 'Saving failed.') });
    } finally {
      setSaving(false);
    }
  };

  const inputCls = (bad) => 'w-full bg-gray-950 border text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006948] disabled:opacity-60 ' + (bad ? 'border-red-500/70' : 'border-white/10');
  const err = (k) => (errors[k] ? <p className="text-red-400 text-xs mt-1.5">{errors[k]}</p> : null);
  const toggle = (k, label) => (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" aria-label={label} checked={!!settings[k]} disabled={loading} onChange={e => update(k, e.target.checked)} className="sr-only peer" />
      <div className="w-11 h-6 bg-gray-700 peer-checked:bg-[#006948] peer-focus-visible:ring-2 peer-focus-visible:ring-green-400 rounded-full transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
    </label>
  );

  const popupLive = live.exit_intent_enabled || live.timed_popup_enabled;
  const chatLive = live.live_chat_enabled && TIDIO_RE.test(live.tidio_key);

  return (
    <CRMLayout title="Lead Capture Settings">
      <div className="space-y-6 max-w-4xl">
        {loadError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-4">{loadError} Values below may not reflect what is live.</div>
        )}
        {legacyNote && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm rounded-xl p-4">
            These settings were found in this browser only (old version) and are <b>not live yet</b>. Review them and click “Save Settings” to publish them to the website.
          </div>
        )}

        {/* Live status */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <h3 className="text-white font-semibold mb-4">Status on the public website</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { label: 'Exit-intent pop-up', on: live.exit_intent_enabled },
              { label: 'Timed pop-up', on: live.timed_popup_enabled, extra: live.timed_popup_enabled ? 'after ' + live.delay_seconds + 's' : '' },
              { label: 'Live chat (Tidio)', on: chatLive },
            ].map(({ label, on, extra }) => (
              <div key={label} className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
                <span className={'w-2.5 h-2.5 rounded-full flex-shrink-0 ' + (loading ? 'bg-gray-500' : on ? 'bg-green-400' : 'bg-gray-600')} />
                <div className="min-w-0">
                  <p className="text-gray-200 text-sm">{label}</p>
                  <p className="text-gray-500 text-xs">{loading ? 'Loading…' : on ? 'Live' + (extra ? ' — ' + extra : '') : 'Off'}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-gray-500 text-xs mt-3">
            {popupLive
              ? 'Each visitor sees the pop-up at most once every 7 days. It is not shown on the booking, contact and login pages, or on phones (the mobile booking pop-up runs there).'
              : 'Pop-ups are off: visitors see no lead pop-up.'}
            {' '}Pop-up submissions appear in CRM → Leads with source “consultation”.
          </p>
        </div>

        {/* PRD requirements (reference checklist) */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <h3 className="text-white font-semibold mb-4">📋 PRD Requirements — Lead Capture Module</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id:'LC-01', label:'Quote form: Name, Email, Phone, Address, Energy usage', status:'live' },
              { id:'LC-02', label:'Exit-intent pop-up on cursor move to close tab', status: live.exit_intent_enabled ? 'live' : 'configure' },
              { id:'LC-03', label:'Timed pop-up after N seconds on site', status: live.timed_popup_enabled ? 'live' : 'configure' },
              { id:'LC-04', label:'Live chat widget on all pages (Tidio)', status: chatLive ? 'live' : 'configure' },
              { id:'LC-05', label:'Form submissions create lead record in CRM instantly', status:'live' },
              { id:'LC-06', label:'Chat linked to CRM contact records', status:'manual' },
              { id:'LC-07', label:"Pop-up leads tagged with source='consultation'", status: popupLive ? 'live' : 'configure' },
              { id:'LC-08', label:'Multi-step quote form (3 steps max)', status:'live' },
            ].map(({ id, label, status: st }) => (
              <div key={id} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                <span className={"text-xs px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 " + (st==='live' ? 'bg-green-500/20 text-green-400' : st==='configure' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400')}>{id}</span>
                <p className="text-gray-300 text-xs flex-1">{label}</p>
                <span className="text-xs flex-shrink-0 text-gray-400">{st==='live' ? '✅ Live' : st==='configure' ? '⚙️ Off' : '📌 Manual'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Pop-up content */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">📝</span>
            <div>
              <h3 className="text-white font-semibold">Pop-up Content</h3>
              <p className="text-gray-500 text-xs">Used by both the exit-intent and the timed pop-up. The form asks for name, phone and an optional message.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cap-heading" className="text-xs text-gray-400 font-medium block mb-2">Popup Heading</label>
              <input id="cap-heading" value={settings.popup_heading} maxLength={LIMITS.popup_heading + 20} disabled={loading}
                onChange={e => update('popup_heading', e.target.value)} className={inputCls(errors.popup_heading)} />
              {err('popup_heading')}
            </div>
            <div>
              <label htmlFor="cap-button" className="text-xs text-gray-400 font-medium block mb-2">Button Text</label>
              <input id="cap-button" value={settings.popup_button_text} maxLength={LIMITS.popup_button_text + 20} disabled={loading}
                placeholder={DEFAULTS.popup_button_text}
                onChange={e => update('popup_button_text', e.target.value)} className={inputCls(errors.popup_button_text)} />
              {err('popup_button_text')}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="cap-sub" className="text-xs text-gray-400 font-medium block mb-2">Popup Sub-text</label>
              <input id="cap-sub" value={settings.popup_subheading} maxLength={LIMITS.popup_subheading + 20} disabled={loading}
                onChange={e => update('popup_subheading', e.target.value)} className={inputCls(errors.popup_subheading)} />
              {err('popup_subheading')}
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-950 rounded-xl border border-white/5">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <div className="bg-white rounded-xl p-4 max-w-xs">
              <p className="font-bold text-gray-900 text-sm mb-1 break-words">{settings.popup_heading || DEFAULTS.popup_heading}</p>
              {settings.popup_subheading && <p className="text-gray-500 text-xs mb-3 break-words">{settings.popup_subheading}</p>}
              <div className="space-y-1.5 mb-3">
                <div className="h-7 rounded-lg border border-gray-200 text-[11px] text-gray-400 px-2 flex items-center">Your name</div>
                <div className="h-7 rounded-lg border border-gray-200 text-[11px] text-gray-400 px-2 flex items-center">Phone number</div>
              </div>
              <div className="w-full bg-[#006948] text-white py-2 rounded-lg text-xs font-semibold text-center">{settings.popup_button_text || DEFAULTS.popup_button_text}</div>
            </div>
            <p className="text-[11px] text-gray-600 mt-2">Hindi visitors see the built-in Hindi translation for the default texts; custom text is shown as typed.</p>
          </div>
        </div>

        {/* Exit-intent popup */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚪</span>
              <div>
                <h3 className="text-white font-semibold">Exit-Intent Pop-up</h3>
                <p className="text-gray-500 text-xs">Desktop only: shown when the cursor moves up to leave the page (PRD: LC-02)</p>
              </div>
            </div>
            {toggle('exit_intent_enabled', 'Enable exit-intent pop-up')}
          </div>
        </div>

        {/* Timed popup */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <h3 className="text-white font-semibold">Timed Pop-up</h3>
                <p className="text-gray-500 text-xs">Show pop-up after N seconds on site (PRD: LC-03)</p>
              </div>
            </div>
            {toggle('timed_popup_enabled', 'Enable timed pop-up')}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <label htmlFor="cap-delay" className="text-xs text-gray-400">Show after</label>
            <input id="cap-delay" type="number" value={settings.delay_seconds} disabled={loading}
              onChange={e => update('delay_seconds', e.target.value)} min="5" max="300" step="1"
              className={"w-24 bg-gray-950 border text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#006948] " + (errors.delay_seconds ? 'border-red-500/70' : 'border-white/10')} />
            <span className="text-xs text-gray-400">seconds (5–300)</span>
          </div>
          {err('delay_seconds')}
        </div>

        {/* Live chat */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <h3 className="text-white font-semibold">Live Chat Widget (Tidio)</h3>
                <p className="text-gray-500 text-xs">Embedded on all public pages (PRD: LC-04) — Tidio has a free tier</p>
              </div>
            </div>
            {toggle('live_chat_enabled', 'Enable live chat')}
          </div>
          <div>
            <label htmlFor="cap-tidio" className="text-xs text-gray-400 font-medium block mb-2">Tidio Public Key</label>
            <input id="cap-tidio" value={settings.tidio_key} disabled={loading} autoComplete="off" spellCheck={false}
              onChange={e => update('tidio_key', e.target.value)}
              placeholder="Tidio → Settings → Developer → Public key"
              className={inputCls(errors.tidio_key)} />
            {err('tidio_key')}
            <a href="https://www.tidio.com" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline mt-2 inline-block">Create free Tidio account →</a>
          </div>
        </div>

        {status && (
          <div role="status" className={"text-sm rounded-xl p-4 border " + (status.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300')}>
            {status.text}
          </div>
        )}

        <button onClick={save} disabled={saving || loading} className="bg-[#006948] text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </div>
    </CRMLayout>
  );
}
