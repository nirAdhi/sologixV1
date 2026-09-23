import AdminLayout from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import { leadsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const STAGES = [
  { key:'new',           label:'New Lead',      color:'bg-blue-100 text-blue-700',    border:'border-blue-200' },
  { key:'contacted',     label:'Contacted',     color:'bg-yellow-100 text-yellow-700', border:'border-yellow-200' },
  { key:'qualified',     label:'Qualified',     color:'bg-purple-100 text-purple-700', border:'border-purple-200' },
  { key:'proposal_sent', label:'Proposal Sent', color:'bg-orange-100 text-orange-700', border:'border-orange-200' },
  { key:'won',           label:'Won',           color:'bg-green-100 text-green-700',  border:'border-green-200' },
  { key:'lost',          label:'Lost',          color:'bg-red-100 text-red-700',      border:'border-red-200' },
];

const PRIORITY = { high:'🔴', medium:'🟡', low:'🟢' };
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
const sourceBadge = (src) => SOURCE_BADGE[src] || 'bg-gray-100 text-gray-600 border-gray-200';

const emptyForm = { name:'', email:'', phone:'', address:'', service_interest:'', message:'', source:'website', priority:'medium', assigned_to:'', follow_up_date:'' };

export default function AdminLeads() {
  const [leads, setLeads]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [view, setView]           = useState('kanban'); // kanban | list
  const [selected, setSelected]   = useState(null);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [noteText, setNoteText]   = useState('');
  const [search, setSearch]       = useState('');
  const [dragId, setDragId]       = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await leadsAPI.getAll();
      setLeads(res.data.data || []);
    } catch(e) { toast.error('Failed to load leads'); }
    finally { setLoading(false); }
  };

  const byStage = (stage) => leads.filter(l => l.stage === stage && (
    !search || l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.phone?.includes(search) || l.email?.toLowerCase().includes(search.toLowerCase())
  ));

  const openLead = async (id) => {
    try {
      const res = await leadsAPI.getById(id);
      setSelected(res.data.data);
    } catch(e) { toast.error('Failed to load lead'); }
  };

  const handleStageChange = async (leadId, newStage) => {
    try {
      await leadsAPI.updateStage(leadId, newStage);
      setLeads(prev => prev.map(l => l.id === leadId ? {...l, stage: newStage} : l));
      if (selected?.id === leadId) setSelected(prev => ({...prev, stage: newStage}));
      toast.success('Stage updated');
    } catch(e) { toast.error('Failed to update stage'); }
  };

  const handleDrop = (e, stage) => {
    e.preventDefault();
    if (dragId) handleStageChange(dragId, stage);
    setDragId(null);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error('Name and phone required'); return; }
    try {
      const res = await leadsAPI.create(form);
      setLeads(prev => [res.data.data, ...prev]);
      setShowForm(false);
      setForm(emptyForm);
      toast.success('Lead created');
    } catch(e) { toast.error('Failed to create lead'); }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selected) return;
    try {
      const res = await leadsAPI.addNote(selected.id, noteText);
      setSelected(prev => ({...prev, notes: res.data.data}));
      setLeads(prev => prev.map(l => l.id === selected.id ? {...l, notes: res.data.data} : l));
      setNoteText('');
      toast.success('Note added');
    } catch(e) { toast.error('Failed'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this lead?')) return;
    try {
      await leadsAPI.delete(id);
      setLeads(prev => prev.filter(l => l.id !== id));
      if (selected?.id === id) setSelected(null);
      toast.success('Lead deleted');
    } catch(e) { toast.error('Failed'); }
  };

  const totalWon = leads.filter(l => l.stage === 'won').length;
  const totalNew = leads.filter(l => l.stage === 'new').length;
  const convRate = leads.length ? Math.round((totalWon / leads.length) * 100) : 0;

  if (loading) return <AdminLayout requiredPerm="manage_leads" title="Leads"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div></div></AdminLayout>;

  return (
    <AdminLayout title="Leads CRM">
      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label:'Total Leads', value: leads.length, icon:'👥', color:'text-blue-600' },
          { label:'New Leads', value: totalNew, icon:'🆕', color:'text-yellow-600' },
          { label:'Won', value: totalWon, icon:'🏆', color:'text-green-600' },
          { label:'Conversion Rate', value: convRate + '%', icon:'📈', color:'text-purple-600' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="text-2xl mb-1">{icon}</div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className={"text-2xl font-bold " + color}>{value}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search leads..." className="border border-gray-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 w-56" />
        <div className="flex border border-gray-200 rounded-xl overflow-hidden">
          <button onClick={() => setView('kanban')} className={"px-4 py-2 text-sm font-medium " + (view==='kanban' ? 'bg-[#006948] text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>🗂 Kanban</button>
          <button onClick={() => setView('list')} className={"px-4 py-2 text-sm font-medium " + (view==='list' ? 'bg-[#006948] text-white' : 'bg-white text-gray-600 hover:bg-gray-50')}>☰ List</button>
        </div>
        <button onClick={() => setShowForm(true)} className="ml-auto bg-[#006948] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">+ Add Lead</button>
      </div>

      {/* KANBAN VIEW */}
      {view === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(({ key, label, color, border }) => (
            <div key={key} className="flex-shrink-0 w-64"
              onDragOver={e => e.preventDefault()}
              onDrop={e => handleDrop(e, key)}>
              <div className={"flex items-center justify-between px-3 py-2 rounded-xl mb-3 border " + border}>
                <span className={"text-xs font-bold " + color.split(' ')[1]}>{label}</span>
                <span className={"text-xs px-2 py-0.5 rounded-full font-bold " + color}>{byStage(key).length}</span>
              </div>
              <div className="space-y-2 min-h-[200px]">
                {byStage(key).map(lead => (
                  <div key={lead.id}
                    draggable
                    onDragStart={() => setDragId(lead.id)}
                    onClick={() => openLead(lead.id)}
                    className="bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md cursor-pointer hover:border-green-200 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <p className="font-semibold text-sm text-gray-800 truncate">{lead.name}</p>
                      <span title={lead.priority}>{PRIORITY[lead.priority] || '🟡'}</span>
                    </div>
                    <p className="text-xs text-gray-500">{lead.phone}</p>
                    {lead.service_interest && <p className="text-xs text-gray-400 truncate mt-1">{lead.service_interest}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className={"text-xs px-2 py-0.5 rounded-full border font-medium " + sourceBadge(lead.source)}>{SOURCE_ICON[lead.source] || '🌐'} {lead.source?.replace('_','  ')}</span>
                      <span className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</span>
                    </div>
                  </div>
                ))}
                {byStage(key).length === 0 && (
                  <div className="text-center py-8 text-gray-300 text-xs border-2 border-dashed border-gray-100 rounded-xl">Drop here</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {view === 'list' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>{['Name','Phone','Source','Service Interest','Stage','Priority','Date','Actions'].map(h => (
                <th key={h} className="text-left text-xs text-gray-400 font-medium px-4 py-3">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {leads.filter(l => !search || l.name?.toLowerCase().includes(search.toLowerCase()) || l.phone?.includes(search)).map(lead => {
                const stg = STAGES.find(s => s.key === lead.stage);
                return (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 cursor-pointer hover:text-[#006948]" onClick={() => openLead(lead.id)}>{lead.name}</td>
                    <td className="px-4 py-3 text-gray-600">{lead.phone}</td>
                    <td className="px-4 py-3"><span className={"text-xs px-2 py-1 rounded-full border font-medium " + sourceBadge(lead.source)}>{SOURCE_ICON[lead.source] || '🌐'} {lead.source?.replace('_',' ')}</span></td>
                    <td className="px-4 py-3 text-gray-500 max-w-[120px] truncate">{lead.service_interest || '—'}</td>
                    <td className="px-4 py-3">
                      <select value={lead.stage} onChange={e => handleStageChange(lead.id, e.target.value)}
                        className={"text-xs px-2 py-1 rounded-full font-medium border cursor-pointer outline-none " + (stg?.color || '') + " " + (stg?.border || '')}>
                        {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">{PRIORITY[lead.priority]}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{new Date(lead.created_at).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openLead(lead.id)} className="text-xs text-blue-600 hover:underline">View</button>
                        <button onClick={() => handleDelete(lead.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {leads.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">No leads yet — click "+ Add Lead" to create your first one</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* LEAD DETAIL PANEL */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-lg text-gray-800">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-6">
              {/* Stage selector */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Pipeline Stage</p>
                <div className="flex flex-wrap gap-2">
                  {STAGES.map(s => (
                    <button key={s.key} onClick={() => handleStageChange(selected.id, s.key)}
                      className={"text-xs px-3 py-1.5 rounded-full font-medium border transition-all " + (selected.stage === s.key ? s.color + ' ' + s.border + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100')}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact info */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Contact Details</p>
                {[
                  { icon:'📞', label:'Phone', value: selected.phone },
                  { icon:'✉️', label:'Email', value: selected.email || '—' },
                  { icon:'📍', label:'Address', value: selected.address || '—' },
                  { icon:'⚡', label:'Service Interest', value: selected.service_interest || '—' },
                  { icon: SOURCE_ICON[selected.source] || '🌐', label:'Source', value: selected.source?.replace('_',' ') },
                  { icon:PRIORITY[selected.priority], label:'Priority', value: selected.priority },
                  { icon:'📅', label:'Follow-up Date', value: selected.follow_up_date ? new Date(selected.follow_up_date).toLocaleDateString('en-IN') : '—' },
                  { icon:'👤', label:'Assigned To', value: selected.assigned_to || '—' },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 text-sm">
                    <span className="text-base w-5">{icon}</span>
                    <span className="text-gray-500 w-28 flex-shrink-0">{label}:</span>
                    <span className="text-gray-800 font-medium">{value}</span>
                  </div>
                ))}
              </div>

              {/* Message */}
              {selected.message && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-600 mb-1">Message</p>
                  <p className="text-sm text-gray-700">{selected.message}</p>
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Notes & Activity</p>
                <div className="flex gap-2 mb-4">
                  <input value={noteText} onChange={e => setNoteText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                    placeholder="Add a note... (Enter to save)"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                  <button onClick={handleAddNote} className="bg-[#006948] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-700">Save</button>
                </div>
                {selected.notes?.length > 0 ? (
                  <div className="space-y-2">
                    {selected.notes.map(n => (
                      <div key={n.id} className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <p className="text-sm text-gray-700">{n.note}</p>
                        <p className="text-xs text-gray-400 mt-1">{n.created_by} · {new Date(n.created_at).toLocaleString('en-IN')}</p>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-xs text-gray-400 text-center py-4">No notes yet</p>}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <a href={`tel:${selected.phone}`} className="flex-1 text-center bg-green-50 text-green-700 border border-green-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-green-100">📞 Call</a>
                <a href={`https://wa.me/91${selected.phone?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="flex-1 text-center bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-100">💬 WhatsApp</a>
                {selected.email && <a href={`mailto:${selected.email}`} className="flex-1 text-center bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-100">✉️ Email</a>}
              </div>
              <button
                onClick={async () => {
                  if (!window.confirm('Convert this lead to a booking? This will create a booking record.')) return;
                  try {
                    const token = localStorage.getItem('adminToken');
                    await fetch('/api/bookings', {
                      method:'POST',
                      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
                      body: JSON.stringify({
                        customer_name: selected.name,
                        customer_email: selected.email || '',
                        customer_phone: selected.phone,
                        service_id: 1,
                        appointment_date: new Date(Date.now()+86400000).toISOString().split('T')[0],
                        appointment_time: '10:00',
                        address: selected.address || '',
                        notes: 'Converted from lead. ' + (selected.message || ''),
                        status: 'pending',
                      }),
                    });
                    await leadsAPI.updateStage(selected.id, 'won');
                    setLeads(ls => ls.map(l => l.id===selected.id ? {...l, stage:'won'} : l));
                    setSelected(s => ({...s, stage:'won'}));
                    toast.success('Lead converted to booking! ✅');
                  } catch { toast.error('Conversion failed'); }
                }}
                className="w-full bg-[#006948] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
                📅 Convert to Booking
              </button>
              <button onClick={() => handleDelete(selected.id)} className="w-full text-red-600 text-sm hover:underline">Delete this lead</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD LEAD MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-bold text-lg">New Lead</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {[['Name *','name','text'],['Phone *','phone','tel'],['Email','email','email'],['Address','address','text'],['Assigned To','assigned_to','text']].map(([label, key, type]) => (
                <div key={key}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{label}</label>
                  <input type={type} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Service Interest</label>
                <select value={form.service_interest} onChange={e => setForm({...form, service_interest: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Select...</option>
                  {['Residential Solar','Commercial Solar','Industrial Solar','Solar Water Heater','Solar Inverter','O&M Service'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Source</label>
                  <select value={form.source} onChange={e => setForm({...form, source: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500">
                    {['website','manual','whatsapp','referral','callback','social'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Priority</label>
                  <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Follow-up Date</label>
                <input type="date" value={form.follow_up_date} onChange={e => setForm({...form, follow_up_date: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Message / Notes</label>
                <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
              <button type="submit" className="w-full bg-[#006948] text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">Create Lead</button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
