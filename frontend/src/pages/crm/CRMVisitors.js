import React, { useEffect, useState } from 'react';
import CRMLayout from '../../components/CRMLayout';
import { siteSettingsAPI } from '../../utils/api';

// Tracking IDs are stored server-side in site_settings key `tracking`:
//   { ga4_id: "G-XXXXXXX" | "", clarity_id: string | "" }
// The public site (components/VisitorTools.js) reads them and loads GA4 /
// Clarity for every visitor — nothing needs to be pasted into index.html.
const GA4_RE = /^G-[A-Z0-9]{4,12}$/;
const CLARITY_RE = /^[a-z0-9]{6,20}$/i;

const parseObj = (v) => {
  if (typeof v === 'string') { try { v = JSON.parse(v); } catch (e) { return null; } }
  return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
};

const serverMsg = (err, fallback) => err?.response?.data?.message || (err?.response ? fallback : 'Network error — could not reach the server.');

export default function CRMVisitors() {
  const [ga4Id, setGa4Id] = useState('');
  const [clarityId, setClarityId] = useState('');
  const [savedIds, setSavedIds] = useState({ ga4_id: '', clarity_id: '' });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [legacyNote, setLegacyNote] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null); // { type: 'success' | 'error', text }

  useEffect(() => {
    let alive = true;
    siteSettingsAPI.getAll()
      .then(res => {
        if (!alive) return;
        const tracking = parseObj(res?.data?.data?.tracking);
        if (tracking) {
          const ga = typeof tracking.ga4_id === 'string' ? tracking.ga4_id : '';
          const cl = typeof tracking.clarity_id === 'string' ? tracking.clarity_id : '';
          setGa4Id(ga); setClarityId(cl); setSavedIds({ ga4_id: ga, clarity_id: cl });
        } else {
          // Never saved on the server: offer values from the old browser-only storage.
          let ga = '', cl = '';
          try { ga = localStorage.getItem('crm_ga4_id') || ''; cl = localStorage.getItem('crm_clarity_id') || ''; } catch (e) { /* ignore */ }
          if (ga || cl) { setGa4Id(ga); setClarityId(cl); setLegacyNote(true); }
        }
      })
      .catch(err => { if (alive) setLoadError(serverMsg(err, 'Could not load the saved tracking settings.')); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  const validate = (ga, cl) => {
    const e = {};
    if (ga && !GA4_RE.test(ga)) e.ga4_id = 'Must look like G-XXXXXXXXXX (G- followed by 4–12 capital letters/digits), or be left empty.';
    if (cl && !CLARITY_RE.test(cl)) e.clarity_id = 'Must be 6–20 letters/digits (from Clarity → Settings → Setup), or be left empty.';
    return e;
  };

  const save = async () => {
    const value = { ga4_id: ga4Id.trim().toUpperCase(), clarity_id: clarityId.trim() };
    const e = validate(value.ga4_id, value.clarity_id);
    setErrors(e);
    setStatus(null);
    if (Object.keys(e).length) { setStatus({ type: 'error', text: 'Please fix the highlighted fields.' }); return; }
    setSaving(true);
    try {
      const res = await siteSettingsAPI.update('tracking', value);
      if (res?.data?.success === false) throw Object.assign(new Error('fail'), { response: { data: res.data } });
      setGa4Id(value.ga4_id); setClarityId(value.clarity_id); setSavedIds(value);
      setLegacyNote(false);
      setStatus({ type: 'success', text: 'Saved. The website now loads ' + describe(value) + ' for every visitor.' });
      try { localStorage.removeItem('crm_ga4_id'); localStorage.removeItem('crm_clarity_id'); } catch (err) { /* ignore */ }
    } catch (err) {
      setStatus({ type: 'error', text: serverMsg(err, 'Saving failed.') });
    } finally {
      setSaving(false);
    }
  };

  const gaActive = !!savedIds.ga4_id;
  const clarityActive = !!savedIds.clarity_id;
  const inputCls = (bad) => 'w-full bg-gray-950 border text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] ' + (bad ? 'border-red-500/70' : 'border-white/10');

  return (
    <CRMLayout title="Visitor Tracking">
      <div className="space-y-6 max-w-4xl">
        {loadError && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl p-4">{loadError} Values below may not reflect what is live.</div>
        )}
        {legacyNote && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 text-sm rounded-xl p-4">
            These IDs were found in this browser only (old version) and are <b>not live yet</b>. Click “Save Configuration” to publish them to the website.
          </div>
        )}

        {/* Live status */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <h3 className="text-white font-semibold mb-4">Status on the public website</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <StatusPill label="Google Analytics 4" active={gaActive} value={savedIds.ga4_id} loading={loading} />
            <StatusPill label="Microsoft Clarity" active={clarityActive} value={savedIds.clarity_id} loading={loading} />
          </div>
          <p className="text-gray-500 text-xs mt-3">
            Scripts are loaded automatically on public pages (not on admin, CRM or customer-portal pages) once an ID is saved.
            Visitor numbers, heatmaps and recordings are viewed in the Google Analytics / Clarity dashboards — this CRM does not collect them itself.
          </p>
        </div>

        {/* PRD requirements (reference checklist) */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <h3 className="text-white font-semibold mb-1">📋 PRD Requirements — Visitor Tracking Module</h3>
          <p className="text-gray-500 text-xs mb-4">Reference checklist. “Active” means the tool that covers it is configured and live.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id:'VT-01', label:'Track page views, scroll depth, time on page', tool:'GA4' },
              { id:'VT-02', label:'Capture UTM parameters & traffic source', tool:'GA4' },
              { id:'VT-03', label:'Device type, browser, location (city)', tool:'GA4' },
              { id:'VT-04', label:'Unique anonymous ID per visitor session', tool:'GA4' },
              { id:'VT-05', label:'Identify returning visitors across sessions', tool:'GA4' },
              { id:'VT-06', label:'Track CTA clicks: Get Quote, Contact, Products', tool:'GA4', manual: true },
              { id:'VT-07', label:'Heatmap & scroll data per page', tool:'Clarity' },
              { id:'VT-08', label:'Flag high-intent visitors (visited pricing 2x)', tool:'GA4', manual: true },
            ].map(({ id, label, tool, manual }) => {
              const on = tool === 'GA4' ? gaActive : clarityActive;
              const state = !on ? 'off' : manual ? 'manual' : 'on';
              return (
                <div key={id} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                  <span className={"text-xs px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 " + (state === 'on' ? 'bg-green-500/20 text-green-400' : state === 'manual' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400')}>{id}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-gray-300 text-xs">{label}</p>
                    <span className="text-gray-600 text-xs">via {tool}{manual ? ' (needs setup in ' + tool + ')' : ''}</span>
                  </div>
                  <span className={"text-xs flex-shrink-0 " + (state === 'on' ? 'text-green-500' : state === 'manual' ? 'text-yellow-500' : 'text-gray-500')}>
                    {state === 'on' ? 'Active' : state === 'manual' ? 'Manual' : 'Not set up'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* GA4 Setup */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-2xl">📊</div>
            <div>
              <h3 className="text-white font-semibold">Google Analytics 4</h3>
              <p className="text-gray-500 text-xs">Free, widely supported. IP anonymisation is switched on automatically.</p>
            </div>
            <a href="https://analytics.google.com" target="_blank" rel="noreferrer" className="ml-auto text-xs text-blue-400 hover:underline">Create GA4 Property →</a>
          </div>
          <div>
            <label htmlFor="crm-ga4-id" className="text-xs text-gray-400 font-medium block mb-2">GA4 Measurement ID (e.g. G-XXXXXXXXXX) — leave empty to switch off</label>
            <input id="crm-ga4-id" value={ga4Id} disabled={loading} onChange={e => { setGa4Id(e.target.value); setErrors(p => ({ ...p, ga4_id: undefined })); }}
              placeholder="G-XXXXXXXXXX" autoComplete="off" spellCheck={false}
              className={inputCls(errors.ga4_id)} />
            {errors.ga4_id && <p className="text-red-400 text-xs mt-2">{errors.ga4_id}</p>}
          </div>
          <p className="text-gray-600 text-xs mt-2">Find it in Google Analytics → Admin → Data streams → your web stream.</p>
        </div>

        {/* Clarity Setup */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl">🔥</div>
            <div>
              <h3 className="text-white font-semibold">Microsoft Clarity</h3>
              <p className="text-gray-500 text-xs">Free heatmaps & session recordings</p>
            </div>
            <a href="https://clarity.microsoft.com" target="_blank" rel="noreferrer" className="ml-auto text-xs text-blue-400 hover:underline">Create Clarity Project →</a>
          </div>
          <div>
            <label htmlFor="crm-clarity-id" className="text-xs text-gray-400 font-medium block mb-2">Clarity Project ID — leave empty to switch off</label>
            <input id="crm-clarity-id" value={clarityId} disabled={loading} onChange={e => { setClarityId(e.target.value); setErrors(p => ({ ...p, clarity_id: undefined })); }}
              placeholder="abcdefghij" autoComplete="off" spellCheck={false}
              className={inputCls(errors.clarity_id)} />
            {errors.clarity_id && <p className="text-red-400 text-xs mt-2">{errors.clarity_id}</p>}
          </div>
          <p className="text-gray-600 text-xs mt-2">Find it in Clarity → Settings → Overview (the short “Project ID”).</p>
        </div>

        {/* Privacy notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5">
          <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">⚠️ Privacy / GDPR (PRD Non-Functional Requirement)</h4>
          <ul className="text-yellow-300/70 text-xs space-y-1 list-disc list-inside">
            <li>The website currently has no cookie-consent banner; scripts load as soon as an ID is saved</li>
            <li>Where consent is legally required, add a consent banner before enabling tracking</li>
            <li>Data retention policy: visitor data deleted after 24 months (set in GA4 → Data retention)</li>
            <li>Users must be able to request data deletion (right to erasure)</li>
            <li>Configure the GA4 data region in your Analytics Admin settings</li>
          </ul>
        </div>

        {status && (
          <div role="status" className={"text-sm rounded-xl p-4 border " + (status.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300')}>
            {status.text}
          </div>
        )}

        <button onClick={save} disabled={saving || loading} className="bg-[#006948] text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-60">
          {saving ? 'Saving…' : 'Save Configuration'}
        </button>
      </div>
    </CRMLayout>
  );
}

function describe(v) {
  const parts = [];
  if (v.ga4_id) parts.push('Google Analytics');
  if (v.clarity_id) parts.push('Clarity');
  return parts.length ? parts.join(' and ') : 'no tracking scripts';
}

function StatusPill({ label, active, value, loading }) {
  return (
    <div className="flex items-center gap-3 bg-white/5 rounded-xl p-3">
      <span className={'w-2.5 h-2.5 rounded-full flex-shrink-0 ' + (loading ? 'bg-gray-500' : active ? 'bg-green-400' : 'bg-gray-600')} />
      <div className="min-w-0">
        <p className="text-gray-200 text-sm">{label}</p>
        <p className="text-gray-500 text-xs truncate">{loading ? 'Loading…' : active ? 'Live — ' + value : 'Off (no ID saved)'}</p>
      </div>
    </div>
  );
}
