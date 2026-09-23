import AdminLayout from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import { projectsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const empty = { title:'', location:'', capacity:'', type:'Residential', description:'', image_url:'', savings:'', is_featured:true, sort_order:0 };
const TYPES = ['Residential','Commercial','Industrial','Institutional'];

export default function AdminProjects() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await projectsAPI.getAll(); setItems(r.data.data || []); }
    catch(e) { toast.error('Failed'); } finally { setLoading(false); }
  };

  const openAdd = () => { setEditing(null); setForm({...empty, sort_order: items.length+1}); setShowForm(true); };
  const openEdit = (p) => { setEditing(p.id); setForm({...p, is_featured: p.is_featured===1||p.is_featured===true}); setShowForm(true); };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3*1024*1024) { toast.error('Image must be under 3MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({...f, image_url: ev.target.result}));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title) { toast.error('Title required'); return; }
    setSaving(true);
    try {
      if (editing) {
        const r = await projectsAPI.update(editing, form);
        setItems(prev => prev.map(p => p.id===editing ? r.data.data : p));
        toast.success('Updated!');
      } else {
        const r = await projectsAPI.create(form);
        setItems(prev => [...prev, r.data.data]);
        toast.success('Project added!');
      }
      setShowForm(false);
    } catch(e) { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try { await projectsAPI.delete(id); setItems(prev => prev.filter(p => p.id!==id)); toast.success('Deleted'); }
    catch(e) { toast.error('Failed'); }
  };

  const toggleFeatured = async (p) => {
    try {
      const r = await projectsAPI.update(p.id, { is_featured: !p.is_featured });
      setItems(prev => prev.map(x => x.id===p.id ? r.data.data : x));
      toast.success(r.data.data.is_featured ? 'Added to homepage' : 'Removed from homepage');
    } catch(e) {}
  };

  const typeColor = (t) => ({ Residential:'bg-blue-100 text-blue-700', Commercial:'bg-green-100 text-green-700', Industrial:'bg-orange-100 text-orange-700', Institutional:'bg-purple-100 text-purple-700' }[t] || 'bg-gray-100 text-gray-700');

  return (
    <AdminLayout requiredPerm="manage_services" title="Projects">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Project Portfolio</h2>
          <p className="text-sm text-gray-500 mt-1">{items.filter(p=>p.is_featured).length} on homepage · {items.length} total</p>
        </div>
        <button onClick={openAdd} className="bg-[#006948] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 text-sm">+ Add Project</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative h-44 overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#006948] to-green-300 flex items-center justify-center text-white text-4xl">☀️</div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={"text-xs px-2 py-1 rounded-full font-medium " + typeColor(p.type)}>{p.type}</span>
                </div>
                <div className="absolute top-3 right-3">
                  <button onClick={() => toggleFeatured(p)}
                    className={"text-xs px-2 py-1 rounded-full font-medium transition-colors " + (p.is_featured ? 'bg-yellow-400 text-yellow-900 hover:bg-gray-100 hover:text-gray-600' : 'bg-white/80 text-gray-600 hover:bg-yellow-400 hover:text-yellow-900')}>
                    {p.is_featured ? '⭐ Featured' : '○ Hidden'}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 mb-1">{p.title}</h3>
                <p className="text-xs text-gray-500 mb-2">📍 {p.location}</p>
                {p.description && <p className="text-xs text-gray-600 line-clamp-2 mb-3">{p.description}</p>}
                <div className="flex gap-2 flex-wrap mb-3">
                  {p.capacity && <span className="text-xs bg-green-50 text-[#006948] px-2 py-1 rounded-full font-medium">{p.capacity}</span>}
                  {p.savings && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">{p.savings}</span>}
                </div>
                <div className="flex gap-2 border-t border-gray-50 pt-3">
                  <button onClick={() => openEdit(p)} className="flex-1 text-xs text-blue-600 font-medium hover:bg-blue-50 py-1.5 rounded-lg transition-colors">✏️ Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="flex-1 text-xs text-red-500 font-medium hover:bg-red-50 py-1.5 rounded-lg transition-colors">🗑 Delete</button>
                </div>
              </div>
            </div>
          ))}
          <button onClick={openAdd}
            className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 p-8 hover:border-[#006948] hover:bg-green-50 transition-all group min-h-[200px]">
            <div className="w-12 h-12 bg-gray-100 group-hover:bg-[#006948] rounded-full flex items-center justify-center text-2xl transition-colors">
              <span className="group-hover:text-white">+</span>
            </div>
            <p className="text-sm font-medium text-gray-500 group-hover:text-[#006948]">Add Project</p>
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg">{editing ? 'Edit Project' : 'Add New Project'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Project Image</label>
                {form.image_url && <img src={form.image_url} alt="preview" className="w-full h-40 object-cover rounded-xl mb-3 border" onError={e=>e.target.style.display='none'} />}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Upload from device</p>
                    <input type="file" accept="image/*" onChange={handleFileUpload}
                      className="w-full border border-dashed border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-500 cursor-pointer" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Or paste URL</p>
                    <input value={form.image_url} onChange={e => setForm(f=>({...f,image_url:e.target.value}))}
                      placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
              </div>
              {/* Title + Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Project Title *</label>
                  <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required
                    placeholder="e.g. Ranchi Gymkhana Club" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Type</label>
                  <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500">
                    {TYPES.map(t=><option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              {/* Location + Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Location</label>
                  <input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))}
                    placeholder="Ranchi, Jharkhand" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">System Capacity</label>
                  <input value={form.capacity} onChange={e=>setForm(f=>({...f,capacity:e.target.value}))}
                    placeholder="40 kW" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              {/* Savings + Order */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Annual Savings</label>
                  <input value={form.savings} onChange={e=>setForm(f=>({...f,savings:e.target.value}))}
                    placeholder="Rs 3,36,000/yr" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Display Order</label>
                  <input type="number" value={form.sort_order} onChange={e=>setForm(f=>({...f,sort_order:parseInt(e.target.value)||0}))} min="0"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>
              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Description</label>
                <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3}
                  placeholder="Brief description of the project..." className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>
              {/* Featured toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={form.is_featured} onChange={e=>setForm(f=>({...f,is_featured:e.target.checked}))} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#006948] rounded-full transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                </div>
                <span className="text-sm font-medium text-gray-700">⭐ Show on homepage (featured)</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#006948] text-white py-3 rounded-xl font-semibold hover:bg-green-700">
                  {saving ? 'Saving...' : editing ? 'Update Project' : 'Add Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
