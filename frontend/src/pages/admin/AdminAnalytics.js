// Admin > Analytics — first-party footfall numbers from the site's own
// cookie-consented counter (site_visits table; GET /api/admin/analytics).
// Complements GA4/Clarity (CRM > Visitor Tracking): these numbers live on your
// own server and work even when no external tracker is configured.
import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import { analyticsAPI } from '../../utils/api';

const GREEN = '#059669';           // single data hue (validated for contrast on white)
const RANGES = [7, 30, 90];

const num = (v) => Number(v) || 0;
const fmt = (v) => num(v).toLocaleString('en-IN');
const dayLabel = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? String(iso).slice(5) : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const Tile = ({ label, value, sub }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
    <p className="text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

// Single-series daily bar chart with hover tooltip and a table view.
function DailyChart({ daily, metric }) {
  const [hover, setHover] = useState(null); // index
  const H = 180, PAD = 6;
  const max = Math.max(1, ...daily.map(d => num(d[metric])));
  const n = daily.length;
  const bw = Math.max(3, Math.min(28, Math.floor((760 - PAD * 2) / n) - 2));
  const step = bw + 2;                       // 2px surface gap between bars
  const width = PAD * 2 + step * n;

  return (
    <div>
      <div className="relative overflow-x-auto">
        <svg width="100%" viewBox={`0 0 ${width} ${H + 24}`} role="img" aria-label={`Daily ${metric}`}>
          {/* recessive gridlines at 0/50/100% */}
          {[0, 0.5, 1].map(f => (
            <line key={f} x1={PAD} x2={width - PAD} y1={H - H * f} y2={H - H * f} stroke="#f3f4f6" strokeWidth="1" />
          ))}
          {daily.map((d, i) => {
            const v = num(d[metric]);
            const h = Math.max(v > 0 ? 3 : 0, Math.round((v / max) * (H - 10)));
            const x = PAD + i * step;
            return (
              <g key={d.d}
                onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                {/* hit target bigger than the mark */}
                <rect x={x - 1} y={0} width={step} height={H} fill="transparent" />
                <rect x={x} y={H - h} width={bw} height={h} rx="4" ry="4"
                  fill={hover === i ? '#047857' : GREEN} />
                {/* square off the baseline end so only the data-end is rounded */}
                {h > 4 && <rect x={x} y={H - Math.min(4, h)} width={bw} height={Math.min(4, h)} fill={hover === i ? '#047857' : GREEN} />}
              </g>
            );
          })}
          {daily.map((d, i) => (n <= 14 || i % Math.ceil(n / 12) === 0) && (
            <text key={'l' + d.d} x={PAD + i * step + bw / 2} y={H + 16} textAnchor="middle"
              fontSize="10" fill="#9ca3af">{dayLabel(d.d)}</text>
          ))}
        </svg>
        {hover !== null && daily[hover] && (
          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none shadow-lg">
            <span className="font-semibold">{dayLabel(daily[hover].d)}</span>
            {' · '}{fmt(daily[hover].visitors)} visitors · {fmt(daily[hover].views)} views
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [state, setState] = useState('loading'); // loading | ok | error
  const [metric, setMetric] = useState('visitors');
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    setState('loading');
    analyticsAPI.get(days)
      .then(r => { setData(r.data.data); setState('ok'); })
      .catch(() => setState('error'));
  }, [days]);

  // Fill missing days with zeros so the chart has one bar per day.
  const daily = useMemo(() => {
    if (!data) return [];
    const byDay = new Map((data.daily || []).map(d => [String(d.d).slice(0, 10), d]));
    const out = [];
    for (let i = days - 1; i >= 0; i--) {
      const dt = new Date(); dt.setDate(dt.getDate() - i);
      const key = dt.toISOString().slice(0, 10);
      const row = byDay.get(key);
      out.push({ d: key, visitors: num(row && row.visitors), views: num(row && row.views) });
    }
    return out;
  }, [data, days]);

  const totals = data ? data.totals : null;
  const empty = state === 'ok' && daily.every(d => !d.views);
  const deviceTotal = data ? (data.devices || []).reduce((s, d) => s + num(d.visitors), 0) : 0;
  const DEVICE_META = { mobile: '📱 Mobile', tablet: '💻 Tablet', desktop: '🖥️ Desktop' };

  return (
    <AdminLayout requiredPerm="view_reports" title="Analytics">
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Website Footfall</h2>
          <p className="text-sm text-gray-500 mt-1">
            Counted on your own server for visitors who accept the cookie banner — no external service needed.
            Numbers are an undercount of true traffic (visitors who decline are not tracked).
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          {RANGES.map(r => (
            <button key={r} onClick={() => setDays(r)}
              className={'px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ' +
                (days === r ? 'bg-[#006948] text-white border-[#006948]' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50')}>
              {r} days
            </button>
          ))}
        </div>
      </div>

      {state === 'loading' && <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div></div>}
      {state === 'error' && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">Could not load analytics. Try reloading the page.</p>}

      {state === 'ok' && totals && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
            <Tile label="Visitors today" value={fmt(totals.today.visitors)} sub={fmt(totals.today.views) + ' page views'} />
            <Tile label="Visitors · 7 days" value={fmt(totals.d7.visitors)} sub={fmt(totals.d7.views) + ' page views'} />
            <Tile label={'Visitors · ' + data.days + ' days'} value={fmt(totals.range.visitors)} sub={fmt(totals.range.views) + ' page views'} />
            <Tile label="Views / visitor" value={totals.range.visitors ? (totals.range.views / totals.range.visitors).toFixed(1) : '—'} sub={'last ' + data.days + ' days'} />
            <Tile label="Admin logins" value={fmt(data.logins.admin_login ? data.logins.admin_login.count : 0)}
              sub={(data.logins.admin_login ? data.logins.admin_login.today : 0) + ' today'} />
            <Tile label="Customer logins" value={fmt(data.logins.customer_login ? data.logins.customer_login.count : 0)}
              sub={(data.logins.customer_login ? data.logins.customer_login.today : 0) + ' today'} />
          </div>

          {empty && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-5 py-4 mb-6 text-sm text-amber-800">
              No visits counted yet. Counting starts as soon as visitors open the website and press
              “Accept cookies” on the cookie banner. Open the site in a normal browser window,
              accept the banner and this page will show your visit.
            </div>
          )}

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <h3 className="font-bold text-gray-800">Daily {metric === 'visitors' ? 'visitors' : 'page views'}</h3>
              <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-semibold">
                {['visitors', 'views'].map(m => (
                  <button key={m} onClick={() => setMetric(m)}
                    className={'px-3 py-1.5 ' + (metric === m ? 'bg-[#006948] text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>
                    {m === 'visitors' ? 'Visitors' : 'Page views'}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowTable(s => !s)} className="ml-auto text-xs font-semibold text-gray-500 hover:text-gray-800 underline">
                {showTable ? 'Show chart' : 'Show as table'}
              </button>
            </div>
            {!showTable && <DailyChart daily={daily} metric={metric} />}
            {showTable && (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-xs text-gray-400 uppercase"><th className="py-1.5">Date</th><th>Visitors</th><th>Page views</th></tr></thead>
                  <tbody>
                    {[...daily].reverse().map(d => (
                      <tr key={d.d} className="border-t border-gray-50">
                        <td className="py-1.5 text-gray-700">{dayLabel(d.d)}</td>
                        <td className="text-gray-900 font-medium">{fmt(d.visitors)}</td>
                        <td className="text-gray-900 font-medium">{fmt(d.views)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top pages */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2">
              <h3 className="font-bold text-gray-800 mb-4">Most visited pages <span className="text-gray-400 font-normal text-sm">(last {data.days} days)</span></h3>
              {(data.topPages || []).length === 0 && <p className="text-sm text-gray-400">Nothing yet.</p>}
              <div className="space-y-2.5">
                {(data.topPages || []).map(p => {
                  const maxV = num(data.topPages[0].views) || 1;
                  return (
                    <div key={p.path} className="flex items-center gap-3">
                      <span className="w-40 sm:w-56 truncate text-sm text-gray-700 font-medium" title={p.path}>{p.path === '/' ? '/ (homepage)' : p.path}</span>
                      <span className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                        <span className="block h-full rounded-full" style={{ width: Math.max(3, (num(p.views) / maxV) * 100) + '%', background: GREEN }}></span>
                      </span>
                      <span className="w-24 text-right text-sm text-gray-900 font-semibold">{fmt(p.views)} <span className="text-gray-400 font-normal text-xs">views</span></span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Devices + languages + referrers */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4">Devices</h3>
                {deviceTotal === 0 && <p className="text-sm text-gray-400">Nothing yet.</p>}
                <div className="space-y-2.5">
                  {(data.devices || []).map(d => (
                    <div key={d.device} className="flex items-center gap-3 text-sm">
                      <span className="w-24 text-gray-700">{DEVICE_META[d.device] || d.device}</span>
                      <span className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <span className="block h-full rounded-full" style={{ width: Math.max(3, (num(d.visitors) / deviceTotal) * 100) + '%', background: GREEN }}></span>
                      </span>
                      <span className="w-12 text-right font-semibold text-gray-900">{Math.round((num(d.visitors) / deviceTotal) * 100)}%</span>
                    </div>
                  ))}
                </div>
                {(data.langs || []).length > 0 && (
                  <p className="text-xs text-gray-500 mt-4">
                    Language: {(data.langs || []).map(l => (l.lang === 'hi' ? 'हिन्दी' : 'English') + ' ' + fmt(l.visitors)).join(' · ')}
                  </p>
                )}
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-bold text-gray-800 mb-4">Visitors came from</h3>
                {(data.referrers || []).length === 0 && <p className="text-sm text-gray-400">Direct visits only so far.</p>}
                <ul className="space-y-1.5 text-sm">
                  {(data.referrers || []).map(r => (
                    <li key={r.referrer} className="flex justify-between gap-3">
                      <span className="truncate text-gray-700">{r.referrer}</span>
                      <span className="font-semibold text-gray-900">{fmt(r.visitors)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 mt-6">
            Tip: for session recordings and deeper behaviour data, also set up Google Analytics and Microsoft
            Clarity under CRM Portal → Visitor Tracking — they now load only after a visitor accepts cookies.
          </p>
        </>
      )}
    </AdminLayout>
  );
}
