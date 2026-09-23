import React, { useState } from 'react';
import CRMLayout from '../../components/CRMLayout';

export default function CRMCapture() {
  const [settings, setSettings] = useState({
    exitIntent: localStorage.getItem('crm_exit_intent') !== 'false',
    timedPopup: localStorage.getItem('crm_timed_popup') !== 'false',
    timedDelay: localStorage.getItem('crm_timed_delay') || '30',
    liveChat: localStorage.getItem('crm_live_chat') || 'tidio',
    tidioKey: localStorage.getItem('crm_tidio_key') || '',
    popupHeading: localStorage.getItem('crm_popup_heading') || 'Get a FREE Solar Quote!',
    popupSubtext: localStorage.getItem('crm_popup_subtext') || 'Find out how much you can save on electricity bills.',
  });
  const [saved, setSaved] = useState(false);

  const update = (key, val) => setSettings(prev => ({ ...prev, [key]: val }));

  const save = () => {
    Object.entries(settings).forEach(([k, v]) => localStorage.setItem('crm_' + k.replace(/([A-Z])/g, '_$1').toLowerCase(), String(v)));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <CRMLayout title="Lead Capture Settings">
      <div className="space-y-6 max-w-4xl">

        {/* PRD requirements */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <h3 className="text-white font-semibold mb-4">📋 PRD Requirements — Lead Capture Module</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id:'LC-01', label:'Quote form: Name, Email, Phone, Address, Energy usage', status:'live' },
              { id:'LC-02', label:'Exit-intent pop-up on cursor move to close tab', status:'configure' },
              { id:'LC-03', label:'Timed pop-up after 30 seconds on site', status:'configure' },
              { id:'LC-04', label:'Live chat widget on all pages (Tidio/Intercom)', status:'configure' },
              { id:'LC-05', label:'Form submissions create lead record in CRM instantly', status:'live' },
              { id:'LC-06', label:'Chat linked to CRM contact records', status:'manual' },
              { id:'LC-07', label:"Pop-up leads tagged with source='exit-intent'", status:'configure' },
              { id:'LC-08', label:'Multi-step quote form (3 steps max)', status:'live' },
            ].map(({ id, label, status }) => (
              <div key={id} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                <span className={"text-xs px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 " + (status==='live' ? 'bg-green-500/20 text-green-400' : status==='configure' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-500/20 text-gray-400')}>{id}</span>
                <p className="text-gray-300 text-xs flex-1">{label}</p>
                <span className="text-xs flex-shrink-0">{status==='live' ? '✅' : status==='configure' ? '⚙️' : '📌'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Exit-intent popup */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🚪</span>
              <div>
                <h3 className="text-white font-semibold">Exit-Intent Pop-up</h3>
                <p className="text-gray-500 text-xs">Triggered when cursor moves to close/back button (PRD: LC-02)</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.exitIntent} onChange={e => update('exitIntent', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-700 peer-checked:bg-[#006948] rounded-full transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-2">Popup Heading</label>
              <input value={settings.popupHeading} onChange={e => update('popupHeading', e.target.value)}
                className="w-full bg-gray-950 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-2">Popup Sub-text</label>
              <input value={settings.popupSubtext} onChange={e => update('popupSubtext', e.target.value)}
                className="w-full bg-gray-950 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
            </div>
          </div>
          <div className="mt-4 p-4 bg-gray-950 rounded-xl border border-white/5">
            <p className="text-xs text-gray-500 mb-2">Preview:</p>
            <div className="bg-white rounded-xl p-4 max-w-xs">
              <p className="font-bold text-gray-900 text-sm mb-1">{settings.popupHeading}</p>
              <p className="text-gray-500 text-xs mb-3">{settings.popupSubtext}</p>
              <button className="w-full bg-[#006948] text-white py-2 rounded-lg text-xs font-semibold">Get Free Quote →</button>
            </div>
          </div>
        </div>

        {/* Timed popup */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏱️</span>
              <div>
                <h3 className="text-white font-semibold">Timed Pop-up</h3>
                <p className="text-gray-500 text-xs">Show pop-up after N seconds on site (PRD: LC-03)</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={settings.timedPopup} onChange={e => update('timedPopup', e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-700 peer-checked:bg-[#006948] rounded-full transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
            </label>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-xs text-gray-400">Show after</label>
            <input type="number" value={settings.timedDelay} onChange={e => update('timedDelay', e.target.value)} min="5" max="120"
              className="w-24 bg-gray-950 border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
            <label className="text-xs text-gray-400">seconds</label>
          </div>
        </div>

        {/* Live chat */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-2xl">💬</span>
            <div>
              <h3 className="text-white font-semibold">Live Chat Widget</h3>
              <p className="text-gray-500 text-xs">Embedded on all pages (PRD: LC-04) — Tidio recommended (free tier)</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-5">
            {['tidio','crisp','intercom'].map(tool => (
              <button key={tool} onClick={() => update('liveChat', tool)}
                className={"py-3 rounded-xl border text-sm font-medium capitalize transition-all " + (settings.liveChat === tool ? 'bg-[#006948] border-[#006948] text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10')}>
                {tool}
              </button>
            ))}
          </div>
          {settings.liveChat === 'tidio' && (
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-2">Tidio Public Key</label>
              <input value={settings.tidioKey} onChange={e => update('tidioKey', e.target.value)}
                placeholder="Get from Tidio Dashboard → Settings → Installation"
                className="w-full bg-gray-950 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
              <a href="https://www.tidio.com" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline mt-2 inline-block">Create free Tidio account →</a>
            </div>
          )}
          {settings.liveChat === 'crisp' && (
            <a href="https://crisp.chat" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">Set up Crisp free account →</a>
          )}
          {settings.liveChat === 'intercom' && (
            <a href="https://www.intercom.com" target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">Set up Intercom →</a>
          )}
        </div>

        <button onClick={save} className="bg-[#006948] text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
          {saved ? '✅ Settings Saved!' : 'Save Settings'}
        </button>
      </div>
    </CRMLayout>
  );
}
