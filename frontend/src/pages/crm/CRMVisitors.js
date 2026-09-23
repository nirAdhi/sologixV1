import React, { useState } from 'react';
import CRMLayout from '../../components/CRMLayout';

const CodeBlock = ({ code }) => (
  <pre className="bg-gray-950 text-green-400 text-xs p-4 rounded-xl overflow-x-auto border border-white/10 mt-3">{code}</pre>
);

export default function CRMVisitors() {
  const [ga4Id, setGa4Id] = useState(localStorage.getItem('crm_ga4_id') || '');
  const [clarityId, setClarityId] = useState(localStorage.getItem('crm_clarity_id') || '');
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem('crm_ga4_id', ga4Id);
    localStorage.setItem('crm_clarity_id', clarityId);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const ga4Code = ga4Id ? `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${ga4Id}');
  // Track key CTA clicks
  document.addEventListener('click', function(e) {
    if(e.target.matches('[href="/booking"]')) gtag('event','get_quote_click');
    if(e.target.matches('[href="/contact"]')) gtag('event','contact_us_click');
  });
</script>` : '<!-- Enter your GA4 Measurement ID above -->';

  const clarityCode = clarityId ? `<!-- Microsoft Clarity -->
<script type="text/javascript">
  (function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
  })(window,document,"clarity","script","${clarityId}");
</script>` : '<!-- Enter your Clarity Project ID above -->';

  return (
    <CRMLayout title="Visitor Tracking">
      <div className="space-y-6 max-w-4xl">
        {/* PRD requirements */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <h3 className="text-white font-semibold mb-4">📋 PRD Requirements — Visitor Tracking Module</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id:'VT-01', label:'Track page views, scroll depth, time on page', tool:'GA4', status:'ready' },
              { id:'VT-02', label:'Capture UTM parameters & traffic source', tool:'GA4', status:'ready' },
              { id:'VT-03', label:'Device type, browser, location (city)', tool:'GA4', status:'ready' },
              { id:'VT-04', label:'Unique anonymous ID per visitor session', tool:'GA4', status:'ready' },
              { id:'VT-05', label:'Identify returning visitors across sessions', tool:'GA4', status:'ready' },
              { id:'VT-06', label:'Track CTA clicks: Get Quote, Contact, Products', tool:'GA4', status:'ready' },
              { id:'VT-07', label:'Heatmap & scroll data per page', tool:'Clarity', status:'ready' },
              { id:'VT-08', label:'Flag high-intent visitors (visited pricing 2x)', tool:'GA4', status:'manual' },
            ].map(({ id, label, tool, status }) => (
              <div key={id} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                <span className={"text-xs px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 " + (status==='ready' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400')}>{id}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-gray-300 text-xs">{label}</p>
                  <span className="text-gray-600 text-xs">via {tool}</span>
                </div>
                <span className={"text-xs " + (status==='ready' ? 'text-green-500' : 'text-yellow-500')}>
                  {status==='ready' ? '✓' : '~'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* GA4 Setup */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-2xl">📊</div>
            <div>
              <h3 className="text-white font-semibold">Google Analytics 4</h3>
              <p className="text-gray-500 text-xs">Free, widely supported, GDPR-configurable (PRD Recommended)</p>
            </div>
            <a href="https://analytics.google.com" target="_blank" rel="noreferrer" className="ml-auto text-xs text-blue-400 hover:underline">Create GA4 Property →</a>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-2">GA4 Measurement ID (e.g. G-XXXXXXXXXX)</label>
            <input value={ga4Id} onChange={e => setGa4Id(e.target.value)}
              placeholder="G-XXXXXXXXXX"
              className="w-full bg-gray-950 border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
          </div>
          <p className="text-gray-600 text-xs mt-2 mb-1">Add this to your <code className="text-green-400">public/index.html</code> inside the {'<head>'} tag:</p>
          <CodeBlock code={ga4Code} />
        </div>

        {/* Clarity Setup */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-2xl">🔥</div>
            <div>
              <h3 className="text-white font-semibold">Microsoft Clarity</h3>
              <p className="text-gray-500 text-xs">Free heatmaps & session recordings — GDPR compliant (PRD Recommended)</p>
            </div>
            <a href="https://clarity.microsoft.com" target="_blank" rel="noreferrer" className="ml-auto text-xs text-blue-400 hover:underline">Create Clarity Project →</a>
          </div>
          <div>
            <label className="text-xs text-gray-400 font-medium block mb-2">Clarity Project ID</label>
            <input value={clarityId} onChange={e => setClarityId(e.target.value)}
              placeholder="abcdefghij"
              className="w-full bg-gray-950 border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
          </div>
          <p className="text-gray-600 text-xs mt-2 mb-1">Add this to <code className="text-green-400">public/index.html</code> inside {'<head>'}:</p>
          <CodeBlock code={clarityCode} />
        </div>

        {/* GDPR notice */}
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-5">
          <h4 className="text-yellow-400 font-semibold mb-2 flex items-center gap-2">⚠️ GDPR Compliance (PRD Non-Functional Requirement)</h4>
          <ul className="text-yellow-300/70 text-xs space-y-1 list-disc list-inside">
            <li>Cookie consent banner required before any tracking scripts fire</li>
            <li>All visitor data must be stored in EU region (Ireland/EU AWS zone)</li>
            <li>Data retention policy: visitor data deleted after 24 months</li>
            <li>Users must be able to request data deletion (right to erasure)</li>
            <li>Configure GA4 to EU data region in your Analytics Admin settings</li>
          </ul>
        </div>

        <button onClick={save} className="bg-[#006948] text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
          {saved ? '✅ Saved!' : 'Save Configuration'}
        </button>
      </div>
    </CRMLayout>
  );
}
