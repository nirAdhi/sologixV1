import React, { useState, useEffect } from 'react';
import CRMLayout from '../../components/CRMLayout';
import { leadsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const SOURCE_ICON = {
  website:'🌐', manual:'✍️', whatsapp:'💬', referral:'👥',
  'exit-intent':'🚪', callback:'📞', contact_us:'📩',
  partner:'🤝', booking_request:'📅', consultation:'💡', calculator:'🧮',
};
const SOURCE_BADGE = {
  partner:          'bg-red-100 text-red-700 border-red-200',
  booking_request:  'bg-orange-100 text-orange-700 border-orange-200',
  contact_us:       'bg-blue-100 text-blue-700 border-blue-200',
  consultation:     'bg-purple-100 text-purple-700 border-purple-200',
  calculator:       'bg-yellow-100 text-yellow-700 border-yellow-200',
  whatsapp:         'bg-green-100 text-green-700 border-green-200',
  referral:         'bg-teal-100 text-teal-700 border-teal-200',
  manual:           'bg-gray-100 text-gray-700 border-gray-200',
  website:          'bg-indigo-100 text-indigo-700 border-indigo-200',
};
const srcBadge = (s) => SOURCE_BADGE[s] || 'bg-gray-100 text-gray-600 border-gray-200';

const STAGES = [
  { key:'new',           label:'New Lead',      color:'bg-blue-500',    light:'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { key:'contacted',     label:'Contacted',     color:'bg-yellow-500',  light:'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
  { key:'qualified',     label:'Qualified',     color:'bg-purple-500',  light:'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  { key:'proposal_sent', label:'Proposal Sent', color:'bg-orange-500',  light:'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  { key:'won',           label:'Won',           color:'bg-green-500',   light:'bg-green-500/10 text-green-400 border-green-500/20' },
  { key:'lost',          label:'Lost',          color:'bg-red-500',     light:'bg-red-500/10 text-red-400 border-red-500/20' },
];

const PRIORITY = { high:'🔴', medium:'🟡', low:'🟢' };
const emptyForm = { name:'', email:'', phone:'', address:'', service_interest:'', message:'', source:'website', priority:'medium', assigned_to:'', follow_up_date:'' };

export default function CRMLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [noteText, setNoteText] = useState('');
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState('all');
  const [dragId, setDragId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const r = await leadsAPI.getAll(); setLeads(r.data.data || []); }
    catch(e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const filtered = leads.filter(l => {
    const matchStage = filterStage === 'all' || l.stage === filterStage;
    const matchSearch = !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search);
    return matchStage && matchSearch;
  });

  const byStage = (s) => filtered.filter(l => l.stage === s);

  const openLead = async (id) => {
    try { const r = await leadsAPI.getById(id); setSelected(r.data.data); }
    catch(e) {}
  };

  const moveStage = async (id, stage) => {
    try {
      await leadsAPI.updateStage(id, stage);
      setLeads(prev => prev.map(l => l.id === id ? { ...l, stage } : l));
      if (selected?.id === id) setSelected(p => ({ ...p, stage }));
      toast.success('Stage updated');
    } catch(e) {}
  };

  const createLead = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return; }
    try {
      const r = await leadsAPI.create(form);
      setLeads(prev => [r.data.data, ...prev]);
      setShowForm(false); setForm(emptyForm);
      toast.success('Lead created');
    } catch(e) {}
  };

  const addNote = async () => {
    if (!noteText.trim() || !selected) return;
    try {
      const r = await leadsAPI.addNote(selected.id, noteText);
      setSelected(p => ({ ...p, notes: r.data.data }));
      setNoteText('');
    } catch(e) {}
  };

  const deleteLead = async (id) => {
    if (!window.confirm('Delete?')) return;
    try {
      await leadsAPI.delete(id);
      setLeads(prev => prev.filter(l => l.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success('Deleted');
    } catch(e) {}
  };

  if (loading) return <CRMLayout title="Leads & Pipeline"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div></div></CRMLayout>;

  return (
    <CRMLayout title="Leads & Pipeline">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search leads..."
          className="bg-[#1a2235] border border-white/10 text-white rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#006948] w-52 placeholder-gray-600" />
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)}
          className="bg-[#1a2235] border border-white/10 text-white rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-[#006948]">
          <option value="all">All Stages</option>
          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
        <button onClick={() => setShowForm(true)} className="ml-auto bg-[#006948] text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">+ New Lead</button>
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STAGES.map(({ key, label, color, light }) => (
          <div key={key} className="flex-shrink-0 w-60"
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); if (dragId) moveStage(dragId, key); setDragId(null); }}>
            <div className={"flex items-center justify-between px-3 py-2 rounded-xl mb-3 border " + light}>
              <span className="text-xs font-bold">{label}</span>
              <span className={"text-xs px-2 py-0.5 rounded-full font-bold " + light}>{byStage(key).length}</span>
            </div>
            <div className="space-y-2 min-h-[180px]">
              {byStage(key).map(lead => (
                <div key={lead.id}
                  draggable onDragStart={() => setDragId(lead.id)}
                  onClick={() => openLead(lead.id)}
                  className="bg-[#1a2235] rounded-xl p-3 border border-white/5 hover:border-green-500/30 cursor-pointer hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <p className="font-semibold text-sm text-white truncate">{lead.name}</p>
                    <span>{PRIORITY[lead.priority] || '🟡'}</span>
                  </div>
                  <p className="text-xs text-gray-400">{lead.phone}</p>
                  {lead.service_interest && <p className="text-xs text-gray-600 truncate mt-1">{lead.service_interest}</p>}
                  <p className="text-xs text-gray-600 mt-2">{new Date(lead.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</p>
                </div>
              ))}
              {byStage(key).length === 0 && (
                <div className="text-center py-8 text-gray-700 text-xs border-2 border-dashed border-white/5 rounded-xl">Drop here</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lead Detail */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="bg-[#0f1623] w-full max-w-md h-full overflow-y-auto border-l border-white/10" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-[#0f1623] border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-lg text-white">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="p-6 space-y-6">
              {/* Stage buttons */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Move Stage</p>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map(s => (
                    <button key={s.key} onClick={() => moveStage(selected.id, s.key)}
                      className={"text-xs px-3 py-1.5 rounded-full font-medium border transition-all " +
                        (selected.stage === s.key ? s.light + ' ring-2 ring-offset-1 ring-offset-[#0f1623] ring-current' : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10')}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
              {/* Info */}
              <div className="bg-white/5 rounded-2xl p-4 space-y-2">
                {[
                  { icon:'📞', label:'Phone', v: selected.phone },
                  { icon:'✉️', label:'Email', v: selected.email || '—' },
                  { icon:'📍', label:'Address', v: selected.address || '—' },
                  { icon:'⚡', label:'Service', v: selected.service_interest || '—' },
                  { icon: SOURCE_ICON[selected.source]||'🌐', label:'Source', v: selected.source?.replace('_',' ') },
                  { icon:'👤', label:'Assigned', v: selected.assigned_to || '—' },
                ].map(({ icon, label, v }) => (
                  <div key={label} className="flex items-start gap-3 text-sm">
                    <span className="w-5">{icon}</span>
                    <span className="text-gray-500 w-20 flex-shrink-0">{label}:</span>
                    <span className="text-gray-200">{v}</span>
                  </div>
                ))}
              </div>
              {/* Notes */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">Notes</p>
                <div className="flex gap-2 mb-3">
                  <input value={noteText} onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addNote()}
                    placeholder="Add note... (Enter)"
                    className="flex-1 bg-gray-950 border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                  <button onClick={addNote} className="bg-[#006948] text-white px-3 py-2 rounded-xl text-sm">+</button>
                </div>
                {selected.notes?.map(n => (
                  <div key={n.id} className="bg-white/5 rounded-xl p-3 mb-2 border border-white/5">
                    <p className="text-sm text-gray-300">{n.note}</p>
                    <p className="text-xs text-gray-600 mt-1">{n.created_by} · {new Date(n.created_at).toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
              {/* Actions */}
              <div className="flex gap-2">
                <a href={'tel:' + selected.phone} className="flex-1 text-center bg-green-500/20 text-green-400 border border-green-500/20 px-3 py-2 rounded-xl text-xs font-medium hover:bg-green-500/30">📞 Call</a>
                <a href={'https://wa.me/91' + selected.phone?.replace(/\D/g,'')} target="_blank" rel="noreferrer" className="flex-1 text-center bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-2 rounded-xl text-xs font-medium hover:bg-emerald-500/30">💬 WhatsApp</a>
                {selected.email && <a href={'mailto:' + selected.email} className="flex-1 text-center bg-blue-500/20 text-blue-400 border border-blue-500/20 px-3 py-2 rounded-xl text-xs font-medium hover:bg-blue-500/30">✉️ Email</a>}
              </div>
              <button onClick={() => deleteLead(selected.id)} className="w-full text-red-500 text-xs hover:underline">Delete lead</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-[#1a2235] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-white/10" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-bold text-white">New Lead</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-500 text-xl">✕</button>
            </div>
            <form onSubmit={createLead} className="p-6 space-y-4">
              {[['Name *','name','text'],['Phone *','phone','tel'],['Email','email','email'],['Address','address','text']].map(([label, key, type]) => (
                <div key={key}>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    className="w-full bg-gray-950 border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Source</label>
                  <select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                    className="w-full bg-gray-950 border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#006948]">
                    {['website','manual','whatsapp','referral','callback','social'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 font-semibold uppercase tracking-wider block mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                    className="w-full bg-gray-950 border border-white/10 text-white rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#006948]">
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full bg-[#006948] text-white py-3 rounded-xl font-semibold hover:bg-green-700">Create Lead</button>
            </form>
          </div>
        </div>
      )}
    </CRMLayout>
  );
}
