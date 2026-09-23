import React, { useState } from 'react';
import CRMLayout from '../../components/CRMLayout';
import toast from 'react-hot-toast';

const API = process.env.REACT_APP_API_URL || '/api';
const authHeader = () => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + localStorage.getItem('adminToken') });

export default function CRMIntegrations() {
  const [hubspotToken, setHubspotToken] = useState(localStorage.getItem('crm_hubspot_token') || '');
  const [hubspotPortal, setHubspotPortal] = useState(localStorage.getItem('crm_hubspot_portal') || '');
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!hubspotToken) { toast.error('Enter your HubSpot Private App Token first'); return; }
    try {
      const res = await fetch(API + '/admin/hubspot/save', {
        method: 'POST', headers: authHeader(),
        body: JSON.stringify({ token: hubspotToken, portal_id: hubspotPortal }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('crm_hubspot_token', hubspotToken);
        localStorage.setItem('crm_hubspot_portal', hubspotPortal);
        setSaved(true);
        toast.success('HubSpot credentials saved to server!');
        setTimeout(() => setSaved(false), 3000);
      } else toast.error(data.message || 'Save failed');
    } catch(e) { toast.error('Network error — check server connection'); }
  };

  const testConnection = async () => {
    if (!hubspotToken) { toast.error('Save your token first, then test'); return; }
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(API + '/admin/hubspot/test', { headers: authHeader() });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.success ? '✅ Connected to HubSpot successfully! API is live.' : ('❌ ' + (data.message || 'Connection failed')) });
    } catch(e) { setTestResult({ success: false, message: '❌ Network error — server may be down' }); }
    setTesting(false);
  };

  const testSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch(API + '/admin/hubspot/sync-test', { method: 'POST', headers: authHeader() });
      const data = await res.json();
      if (data.success) toast.success('Test lead synced to HubSpot! Check your HubSpot contacts.');
      else toast.error('Sync failed: ' + (data.message || 'Unknown error'));
    } catch(e) { toast.error('Network error'); }
    setSyncing(false);
  };

  return (
    <CRMLayout title="Integrations & API">
      <div className="space-y-6 max-w-4xl">

        {/* HubSpot */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-3xl">🔶</div>
            <div>
              <h3 className="text-white text-xl font-bold">HubSpot CRM</h3>
              <p className="text-gray-500 text-sm">PRD Recommended — Free tier includes Contacts, Deals & Pipeline</p>
              <a href="https://app.hubspot.com" target="_blank" rel="noreferrer" className="text-xs text-orange-400 hover:underline">Open HubSpot Dashboard →</a>
            </div>
            <div className="ml-auto text-center">
              <div className={"w-3 h-3 rounded-full mx-auto mb-1 " + (hubspotToken ? 'bg-green-500 animate-pulse' : 'bg-gray-600')}></div>
              <span className="text-xs text-gray-500">{hubspotToken ? 'Configured' : 'Not connected'}</span>
            </div>
          </div>

          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-6 text-xs text-blue-300 space-y-1">
            <p className="font-semibold text-blue-400 mb-2">📋 PRD Architecture — Data Flow:</p>
            <p>1. Lead submits form on SolarWeb</p>
            <p>2. Backend validates and calls HubSpot Contacts API v3</p>
            <p>3. HubSpot creates Contact + Deal in pipeline automatically</p>
            <p>4. Webhook fires back to SolarWeb admin dashboard</p>
            <p>5. Admin dashboard shows new lead in real time</p>
            <p>6. Auto-email sent to lead; sales team notified</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-2">HubSpot Portal ID</label>
              <input value={hubspotPortal} onChange={e => setHubspotPortal(e.target.value)}
                placeholder="e.g. 12345678"
                className="w-full bg-gray-950 border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500" />
              <p className="text-xs text-gray-600 mt-1">Found in HubSpot → Settings → Account Information</p>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium block mb-2">Private App Token (OAuth 2.0)</label>
              <input type="password" value={hubspotToken} onChange={e => setHubspotToken(e.target.value)}
                placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="w-full bg-gray-950 border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 font-mono" />
              <p className="text-xs text-gray-600 mt-1">Create in HubSpot → Settings → Integrations → Private Apps → Create App</p>
            </div>
          </div>

          <div className="flex gap-3 mt-5 flex-wrap">
            <button onClick={testConnection} disabled={testing}
              className="px-5 py-2.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-sm font-medium hover:bg-orange-500/30 transition-colors">
              {testing ? '⏳ Testing...' : '🔗 Test Connection'}
            </button>
          <button onClick={testSync} disabled={syncing}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
              {syncing ? 'Syncing...' : '🔄 Test Lead Sync'}
            </button>
          </div>

          {testResult && (
            <div className={"mt-4 p-4 rounded-xl text-sm " + (testResult.success ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
              {testResult.success ? '✅ ' : '❌ '}{testResult.message}
            </div>
          )}

          {/* Backend .env instructions */}
          <div className="mt-6 bg-gray-950 rounded-xl p-4 border border-white/5">
            <p className="text-xs text-gray-500 mb-2 font-semibold">Add to your backend <code className="text-green-400">.env</code> file:</p>
            <pre className="text-green-400 text-xs">
{`HUBSPOT_TOKEN=${hubspotToken || 'pat-na1-your-token-here'}
HUBSPOT_PORTAL_ID=${hubspotPortal || '12345678'}`}
            </pre>
          </div>
        </div>

        {/* Other integrations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name:'Zapier', icon:'⚡', color:'bg-orange-500', desc:'No-code fallback connector for edge cases', link:'https://zapier.com', status:'Optional' },
            { name:'Twilio SMS', icon:'📱', color:'bg-red-500', desc:'SMS alerts to sales team for high-intent leads', link:'https://www.twilio.com', status:'PRD: CA-04' },
            { name:'Brevo Email', icon:'📧', color:'bg-blue-500', desc:'Email sequences with open rate tracking', link:'https://www.brevo.com', status:'PRD: CA-07' },
          ].map(({ name, icon, color, desc, link, status }) => (
            <div key={name} className="bg-[#1a2235] rounded-2xl border border-white/5 p-5">
              <div className={"w-10 h-10 " + color + " rounded-xl flex items-center justify-center text-xl mb-3"}>{icon}</div>
              <h4 className="text-white font-semibold mb-1">{name}</h4>
              <p className="text-gray-500 text-xs mb-3 leading-relaxed">{desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs bg-white/5 text-gray-400 px-2 py-1 rounded-full">{status}</span>
                <a href={link} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:underline">Setup →</a>
              </div>
            </div>
          ))}
        </div>

        <button onClick={save} className="bg-[#006948] text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
          {saved ? '✅ Saved!' : 'Save Integration Settings'}
        </button>
      </div>
    </CRMLayout>
  );
}
