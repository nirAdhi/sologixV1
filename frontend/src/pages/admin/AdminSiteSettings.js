import AdminLayout from '../../components/AdminLayout';
import { SITE_THEMES, applyTheme, getTheme } from '../../components/ThemeProvider';
import React, { useState, useEffect } from 'react';
import { siteSettingsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const DEFAULT_STATS = [
  { target:'7', suffix:'+', label:'Years of Experience' },
  { target:'100', suffix:'+', label:'Satisfied Customers' },
  { target:'50', suffix:'+', label:'Projects Completed' },
  { target:'300', suffix:' MWh', label:'Power Generated' },
];

const DEFAULT_OFFERINGS = [
  { label:'Residential', desc:'Efficient solar solutions for modern homes.', img:'https://res.cloudinary.com/dsiratycd/image/upload/v1775250334/Gemini_Generated_Image_gqdagugqdagugqda_pbwa73.png' },
  { label:'Commercial', desc:'Powering businesses with renewable energy.', img:'https://res.cloudinary.com/dsiratycd/image/upload/v1774797121/comercial_fie2wd.png' },
  { label:'Industrial', desc:'High-capacity solar for factories & industries.', img:'https://res.cloudinary.com/dsiratycd/image/upload/v1774797121/Maintanance_mdwhei.png' },
];

const DEFAULT_WHY = [
  { icon:'🏅', title:'Certification', desc:'ISO certified operations meeting global standards of quality and safety.' },
  { icon:'💳', title:'Easy Finance / EMI', desc:'Flexible EMI options from as low as ₹1,000/month. No heavy upfront cost.' },
  { icon:'🏛️', title:'Assistance in Availing Subsidy', desc:'Empanelled with JBVNL & TSUISL. We handle the entire subsidy process for you.' },
  { icon:'💰', title:'Value for Money', desc:'Best ROI with payback in 3–5 years and 20+ years of savings thereafter.' },
  { icon:'🏢', title:'Brand Identity Since 2018', desc:"Jharkhand's trusted solar brand founded by IIT, NIT & DTU engineers." },
  { icon:'🔧', title:'Operation & Maintenance', desc:'5-year comprehensive O&M. Issues resolved within 24 working hours.' },
  { icon:'⭐', title:'Best Quality Equipment', desc:'Premium panels and inverters sourced directly from top manufacturers.' },
  { icon:'📋', title:'Government Subsidy', desc:'PM Surya Ghar Yojana — get up to ₹78,000 subsidy with our guidance.' },
];

const DEFAULT_PROCESS = [
  { num:'01', title:'On-Site Survey', desc:'Our experts visit your rooftop to assess space, sunlight, shadow patterns, and energy consumption to design the perfect system.', icon:'🔍' },
  { num:'02', title:'Financial Modeling', desc:'We calculate your ROI, payback period, savings projections, and applicable PM Surya Ghar subsidies to give you the complete financial picture.', icon:'📊' },
  { num:'03', title:'System Design', desc:'Custom engineering of your solar system including panel layout, inverter sizing, cable routing, and structural mounting requirements.', icon:'📐' },
  { num:'04', title:'Project Installation', desc:'Our certified technicians install your system safely and efficiently, typically completing the job within 2–7 working days.', icon:'🔧' },
  { num:'05', title:'Operations & Maintenance', desc:'5-year comprehensive O&M support with IoT monitoring, periodic cleaning, and 24-hour issue resolution guarantee.', icon:'📡' },
];

const DEFAULT_SOCIAL = {
  youtube: 'https://www.youtube.com/@sologixenergy',
  whatsapp: 'https://wa.me/918287766474',
  facebook: 'https://www.facebook.com/sologix/',
  instagram: 'https://www.instagram.com/sologixenergy/',
  linkedin: 'https://www.linkedin.com/company/m-s-sologix-energy/',
};

const Section = ({ title, children, icon }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
    <div className="px-6 py-4 border-b border-gray-50 flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <h3 className="font-bold text-gray-800">{title}</h3>
    </div>
    <div className="p-6">{children}</div>
  </div>
);

export default function AdminSiteSettings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [activeTheme, setActiveTheme] = React.useState(() => getTheme().id);

  useEffect(() => {
    siteSettingsAPI.getAll()
      .then(r => setSettings(r.data.data || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const get = (key, def) => settings[key] !== undefined ? settings[key] : def;

  const save = async (key, value) => {
    setSaving(s => ({ ...s, [key]: true }));
    try {
      await siteSettingsAPI.update(key, value);
      setSettings(s => ({ ...s, [key]: value }));
      // Cache social links in localStorage for immediate homepage effect
      if (key === 'social_links') {
        localStorage.setItem('sologix_social_links', JSON.stringify(value));
      }
      toast.success('Saved!');
    } catch(e) { toast.error('Failed to save'); }
    finally { setSaving(s => ({ ...s, [key]: false })); }
  };

  if (loading) return <AdminLayout title="Site Settings"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div></div></AdminLayout>;

  const stats = get('stats', DEFAULT_STATS);
  const offerings = get('offerings', DEFAULT_OFFERINGS);
  const why = get('why_us', DEFAULT_WHY);
  const process = get('work_process', DEFAULT_PROCESS);

  return (
    <AdminLayout requiredPerm="manage_settings" title="Site Settings">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Homepage Content Manager</h2>
        <p className="text-sm text-gray-500 mt-1">Edit stats, offerings, why-choose-us cards, work process steps — changes appear on the website immediately.</p>
      </div>

      {/* Stats */}
      <Section icon="📊" title="Statistics Badges (Years, Customers, Projects, Power)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Number</label>
                  <input value={stat.target} onChange={e => { const n=[...stats]; n[i]={...n[i],target:e.target.value}; setSettings(s=>({...s,stats:n})); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Suffix</label>
                  <input value={stat.suffix} onChange={e => { const n=[...stats]; n[i]={...n[i],suffix:e.target.value}; setSettings(s=>({...s,stats:n})); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Label</label>
                  <input value={stat.label} onChange={e => { const n=[...stats]; n[i]={...n[i],label:e.target.value}; setSettings(s=>({...s,stats:n})); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div className="text-center bg-white rounded-lg p-2 border border-gray-100">
                <span className="text-2xl font-bold text-[#006948]">{stat.target}{stat.suffix}</span>
                <span className="text-sm text-gray-500 ml-2">{stat.label}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => save('stats', stats)} disabled={saving.stats}
          className="mt-4 bg-[#006948] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
          {saving.stats ? 'Saving...' : 'Save Stats'}
        </button>
      </Section>

      {/* Offerings */}
      <Section icon="🏠" title="Our Offerings (Residential / Commercial / Industrial)">
        <div className="space-y-4">
          {offerings.map((o, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Label</label>
                  <input value={o.label} onChange={e => { const n=[...offerings]; n[i]={...n[i],label:e.target.value}; setSettings(s=>({...s,offerings:n})); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 font-medium block mb-1">Description</label>
                  <input value={o.desc} onChange={e => { const n=[...offerings]; n[i]={...n[i],desc:e.target.value}; setSettings(s=>({...s,offerings:n})); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Image URL</label>
                <div className="flex gap-3 items-center">
                  <input value={o.img} onChange={e => { const n=[...offerings]; n[i]={...n[i],img:e.target.value}; setSettings(s=>({...s,offerings:n})); }}
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" placeholder="https://..." />
                  {o.img && <img src={o.img} alt="preview" className="w-16 h-12 object-cover rounded-lg border" onError={e=>e.target.style.display='none'} />}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => save('offerings', offerings)} disabled={saving.offerings}
          className="mt-4 bg-[#006948] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
          {saving.offerings ? 'Saving...' : 'Save Offerings'}
        </button>
      </Section>

      {/* Why Choose Us */}
      <Section icon="⭐" title="Why Customers Choose Us (8 cards)">
        <div className="space-y-3">
          {why.map((w, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Icon (emoji)</label>
                  <input value={w.icon} onChange={e => { const n=[...why]; n[i]={...n[i],icon:e.target.value}; setSettings(s=>({...s,why_us:n})); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Title</label>
                  <input value={w.title} onChange={e => { const n=[...why]; n[i]={...n[i],title:e.target.value}; setSettings(s=>({...s,why_us:n})); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 font-medium block mb-1">Description</label>
                  <input value={w.desc} onChange={e => { const n=[...why]; n[i]={...n[i],desc:e.target.value}; setSettings(s=>({...s,why_us:n})); }}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => save('why_us', why)} disabled={saving.why_us}
          className="mt-4 bg-[#006948] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
          {saving.why_us ? 'Saving...' : 'Save Why Choose Us'}
        </button>
      </Section>

      {/* Work Process */}
      <Section icon="🔧" title="Work Process Steps">
        <div className="space-y-3">
          {process.map((p, i) => (
            <div key={i} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500 font-medium block mb-1">Icon + Step No</label>
                  <div className="flex gap-2">
                    <input value={p.icon} onChange={e => { const n=[...process]; n[i]={...n[i],icon:e.target.value}; setSettings(s=>({...s,work_process:n})); }}
                      className="w-16 border border-gray-200 rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                    <input value={p.title} onChange={e => { const n=[...process]; n[i]={...n[i],title:e.target.value}; setSettings(s=>({...s,work_process:n})); }}
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" placeholder="Step title" />
                  </div>
                </div>
                <div className="md:col-span-3">
                  <label className="text-xs text-gray-500 font-medium block mb-1">Description</label>
                  <textarea value={p.desc} onChange={e => { const n=[...process]; n[i]={...n[i],desc:e.target.value}; setSettings(s=>({...s,work_process:n})); }} rows={2}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => save('work_process', process)} disabled={saving.work_process}
          className="mt-4 bg-[#006948] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
          {saving.work_process ? 'Saving...' : 'Save Work Process'}
        </button>
      </Section>
      {/* Social Media Links */}
      <Section icon="📱" title="Social Media Links (Floating Icons on Homepage)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key:'youtube',   label:'YouTube', icon:'▶️', placeholder:'https://www.youtube.com/@sologixenergy' },
            { key:'whatsapp',  label:'WhatsApp', icon:'💬', placeholder:'https://wa.me/918287766474' },
            { key:'facebook',  label:'Facebook', icon:'📘', placeholder:'https://www.facebook.com/sologix/' },
            { key:'instagram', label:'Instagram', icon:'📸', placeholder:'https://www.instagram.com/sologixenergy/' },
            { key:'linkedin',  label:'LinkedIn',  icon:'💼', placeholder:'https://www.linkedin.com/company/m-s-sologix-energy/' },
          ].map(({ key, label, icon, placeholder }) => {
            const socialLinks = get('social_links', DEFAULT_SOCIAL);
            return (
              <div key={key}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                  {icon} {label}
                </label>
                <input
                  value={socialLinks[key] || ''}
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
        <p className="text-xs text-gray-400 mt-3">Leave a field empty to hide that social icon from the website.</p>
        <button onClick={() => save('social_links', get('social_links', DEFAULT_SOCIAL))} disabled={saving.social_links}
          className="mt-4 bg-[#006948] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
          {saving.social_links ? 'Saving...' : 'Save Social Links'}
        </button>
      </Section>

      {/* Website Theme */}
      <Section icon="🎨" title="Website Colour Theme">
        <p className="text-sm text-gray-500 mb-4">Choose a colour theme that applies consistently across ALL pages of the public website — buttons, links, headings, highlights and section backgrounds will all update instantly.</p>
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
          <span>💡</span> Theme is applied live — no rebuild needed. Changes are visible to all website visitors immediately.
        </p>
      </Section>
    </AdminLayout>
  );
}
