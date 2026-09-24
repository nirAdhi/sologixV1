import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n';

// Known project types, in the order the filter tabs have always used. Any new
// type an admin types in is appended after these (see buildTypes).
export const KNOWN_PROJECT_TYPES = ['Residential', 'Commercial', 'Industrial', 'Institutional'];
export const FALLBACK_PROJECT_IMAGE = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop';

// Built-in projects: shown ONLY when the API request fails (network/server error).
export const staticProjects = [
  { id:1, title:'Ranchi Gymkhana Club', location:'Ranchi, Jharkhand', capacity:'40 kW', type:'Commercial', description:'On-grid solar installation for Ranchi\'s premier gymkhana club. Achieved 56,000 units annual generation.', image_url:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop', savings:'Rs 3,36,000/yr' },
  { id:2, title:'DBMS English School', location:'Jamshedpur, Jharkhand', capacity:'100 kW', type:'Institutional', description:'Large-scale rooftop solar for a leading English medium school, reducing operational electricity costs significantly.', image_url:'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600&h=400&fit=crop', savings:'Rs 8,40,000/yr' },
  { id:3, title:'Raj Ceramics', location:'Hardag, Ranchi', capacity:'55 kW', type:'Industrial', description:'Industrial rooftop solar for ceramics manufacturing unit. Significant reduction in production costs.', image_url:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=400&fit=crop', savings:'Rs 4,20,000/yr' },
  { id:4, title:'CMS Kerala Bhavan', location:'Pune, Maharashtra', capacity:'30 kW', type:'Commercial', description:'Commercial solar installation achieving near-zero electricity bills for the Kerala Bhavan community centre.', image_url:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=400&fit=crop', savings:'Rs 6,30,000/yr' },
  { id:5, title:'Dayanand Public School', location:'Jamshedpur, Jharkhand', capacity:'40 kW', type:'Institutional', description:'Complete solar EPC solution providing clean energy and significant savings for this prominent public school.', image_url:'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=600&h=400&fit=crop', savings:'Rs 3,36,000/yr' },
  { id:6, title:'Solar Mini Grid — Chatra', location:'Chatra, Jharkhand', capacity:'25 kW', type:'Industrial', description:'Off-grid solar mini grid providing reliable clean power to a rural industrial area in Chatra.', image_url:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=400&fit=crop', savings:'Rs 2,10,000/yr' },
  { id:7, title:'Arun Refractory', location:'Chirkunda, Jharkhand', capacity:'3 kW', type:'Industrial', description:'Rooftop solar for refractory manufacturing business, reducing dependency on grid power.', image_url:'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=600&h=400&fit=crop', savings:'Rs 25,000/yr' },
  { id:8, title:'SDSM School', location:'Ranchi, Jharkhand', capacity:'20 kW', type:'Institutional', description:'Solar installation for SDSM school, contributing to green campus initiative and reduced operating costs.', image_url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop', savings:'Rs 1,50,000/yr' },
  { id:9, title:'Tajna Shellac', location:'Jharkhand', capacity:'15 kW', type:'Industrial', description:'Industrial solar solution for shellac processing unit, improving energy independence.', image_url:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=400&fit=crop', savings:'Rs 90,000/yr' },
];

const str = (v) => (v === null || v === undefined ? '' : String(v).trim());

// Clean up whatever the API returned so the UI never trips over bad values.
export function normalizeProjects(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter(p => p && typeof p === 'object')
    .map((p, i) => ({
      ...p,
      id: p.id ?? `p${i}`,
      title: str(p.title),
      location: str(p.location),
      capacity: str(p.capacity),
      type: str(p.type),
      image_url: str(p.image_url),
      savings: str(p.savings),
      description: str(p.description),
    }))
    .filter(p => p.title || p.image_url);
}

// Filter tabs: "All" + known types that are present (known order) + any new types (first-seen order).
export function buildTypes(projects) {
  const present = [];
  projects.forEach(p => { if (p.type && !present.includes(p.type)) present.push(p.type); });
  const known = KNOWN_PROJECT_TYPES.filter(k => present.includes(k));
  const extra = present.filter(k => !KNOWN_PROJECT_TYPES.includes(k));
  return ['All', ...known, ...extra];
}

// Fetch all projects. Resolves to { projects, failed }:
//  - request OK  → the admin's list (may be empty → caller shows "coming soon")
//  - request failed → the built-in list
export function fetchProjects() {
  return fetch('/api/projects')
    .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(d => {
      if (!d || !d.success || !Array.isArray(d.data)) throw new Error('bad response');
      return { projects: normalizeProjects(d.data), failed: false };
    })
    .catch(() => ({ projects: staticProjects, failed: true }));
}

const typeColor = (t) => ({ Residential:'bg-blue-100 text-blue-700', Commercial:'bg-green-100 text-green-700', Industrial:'bg-orange-100 text-orange-700', Institutional:'bg-purple-100 text-purple-700' }[t] || 'bg-gray-100 text-gray-700');

export default function ProjectsPage() {
  const { t } = useT();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let alive = true;
    fetchProjects().then(({ projects: list }) => {
      if (!alive) return;
      setProjects(list);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  // Esc closes the detail modal
  useEffect(() => {
    if (!selected) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  const TYPES = buildTypes(projects);
  const activeFilter = TYPES.includes(filter) ? filter : 'All';
  const filtered = activeFilter === 'All' ? projects : projects.filter(p => p.type === activeFilter);
  const counts = TYPES.reduce((acc, type) => { acc[type] = type === 'All' ? projects.length : projects.filter(p=>p.type===type).length; return acc; }, {});
  const empty = !loading && projects.length === 0;
  const heroStats = [
    ...(projects.length ? [{ v:`${projects.length}+`, l:'Projects' }] : []),
    { v:'300 MWh', l:'Power Generated' }, { v:'270 tons', l:'CO₂ Abated' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-r from-[#006948] to-[#059669] py-20 text-white text-center">
        <h1 className="text-5xl font-bold mb-4">{t('Our Projects')}</h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">{t('Successful solar installations across Jharkhand and India — from homes to industries')}</p>
        <div className="flex justify-center gap-6 mt-8">
          {heroStats.map(({v,l}) => (
            <div key={l} className="text-center">
              <p className="text-3xl font-bold">{t(v)}</p>
              <p className="text-white/70 text-sm">{t(l)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-12 bg-white border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
          {loading && (
            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#006948]"></div></div>
          )}

          {empty && (
            <div className="text-center py-16 max-w-md mx-auto">
              <div className="text-5xl mb-4">☀️</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">{t('Projects coming soon')}</h2>
              <p className="text-gray-500">{t('We are adding photos of our latest solar installations. Please check back soon.')}</p>
            </div>
          )}

          {!loading && !empty && (<>
          {/* Filter tabs */}
          <div className="flex flex-wrap gap-3 mb-10 justify-center">
            {TYPES.map(type => (
              <button key={type} onClick={() => setFilter(type)}
                className={"px-5 py-2 rounded-full text-sm font-medium transition-all border " +
                  (activeFilter === type ? 'bg-[#006948] text-white border-[#006948]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#006948] hover:text-[#006948]')}>
                {t(type)} <span className="ml-1 opacity-60">({counts[type]})</span>
              </button>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(p => (
              <div key={p.id} onClick={() => setSelected(p)}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 group cursor-pointer transition-all hover:-translate-y-1">
                <div className="relative h-52 overflow-hidden">
                  <img src={p.image_url || FALLBACK_PROJECT_IMAGE} alt={p.title} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" onError={e=>{ if (e.target.src !== FALLBACK_PROJECT_IMAGE) e.target.src = FALLBACK_PROJECT_IMAGE; }} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  {p.type && <div className="absolute top-4 left-4 max-w-[60%]">
                    <span className={"text-xs px-2.5 py-1 rounded-full font-medium inline-block truncate max-w-full " + typeColor(p.type)}>{t(p.type)}</span>
                  </div>}
                  {p.capacity && <div className="absolute top-4 right-4 max-w-[35%] truncate bg-[#006948] text-white text-xs px-2.5 py-1 rounded-full font-semibold">{t(p.capacity)}</div>}
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-gray-800 mb-1 group-hover:text-[#006948] transition-colors line-clamp-2 break-words">{t(p.title)}</h3>
                  {p.location && <p className="text-sm text-gray-500 mb-3 line-clamp-1 break-words">📍 {t(p.location)}</p>}
                  {p.description && <p className="text-xs text-gray-600 line-clamp-2 mb-3">{t(p.description)}</p>}
                  {p.savings && (
                    <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">{t('Annual Savings')}</span>
                      <span className="text-sm font-bold text-[#006948] truncate ml-2">{t(p.savings)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">🔍</div>
              <p>{t('No {type} projects found', { type: t(activeFilter) })}</p>
            </div>
          )}
          </>)}

          <div className="text-center mt-12">
            <Link to="/booking" className="inline-flex items-center gap-2 bg-[#006948] text-white px-10 py-4 rounded-full font-semibold hover:bg-green-700 transition-all shadow-lg text-lg">
              {t('Start Your Solar Journey →')}
            </Link>
          </div>
        </div>
      </section>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="relative h-64 overflow-hidden rounded-t-2xl">
              <img src={selected.image_url || FALLBACK_PROJECT_IMAGE} alt={selected.title} className="w-full h-full object-cover" onError={e=>{ if (e.target.src !== FALLBACK_PROJECT_IMAGE) e.target.src = FALLBACK_PROJECT_IMAGE; }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <div>
                  {selected.type && <span className={"text-xs px-2 py-1 rounded-full font-medium mb-2 inline-block " + typeColor(selected.type)}>{t(selected.type)}</span>}
                  <h2 className="text-2xl font-bold text-white line-clamp-2 break-words">{t(selected.title)}</h2>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="absolute top-4 right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full text-white flex items-center justify-center hover:bg-white/40" aria-label={t('Close')}>✕</button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[{ label:'Location', value: selected.location && t(selected.location) }, { label:'Capacity', value: selected.capacity && t(selected.capacity) }, { label:'Annual Savings', value: selected.savings && t(selected.savings) }, { label:'System Type', value: selected.type && t('{type} Solar', { type: t(selected.type) }) }].filter(i=>i.value).map(({label,value}) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-400 font-medium mb-1">{t(label)}</p>
                    <p className="font-bold text-gray-800 break-words">{value}</p>
                  </div>
                ))}
              </div>
              {selected.description && <p className="text-gray-600 leading-relaxed mb-6 whitespace-pre-line break-words">{t(selected.description)}</p>}
              <Link to="/booking" onClick={() => setSelected(null)}
                className="w-full block text-center bg-[#006948] text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
                {t('Get a Similar System →')}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
