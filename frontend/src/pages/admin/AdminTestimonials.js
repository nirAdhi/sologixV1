import AdminLayout from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import { testimonialsAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const empty = { name:'', role:'', company:'', location:'', review:'', capacity:'', savings:'', rating:5, photo_url:'', installation_photo:'', is_active:true, sort_order:0 };

const Stars = ({ rating, onChange }) => (
  <div className="flex gap-1">
    {[1,2,3,4,5].map(s => (
      <button key={s} type="button" onClick={() => onChange && onChange(s)}
        className={"text-xl transition-transform " + (s <= rating ? 'text-yellow-400' : 'text-gray-300') + (onChange ? ' hover:scale-125 cursor-pointer' : '')}>
        ★
      </button>
    ))}
  </div>
);

export default function AdminTestimonials() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [photoMode, setPhotoMode] = useState('url'); // url | upload

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const r = await testimonialsAPI.getAll(true); setItems(r.data.data || []); }
    catch(e) { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setEditing(null); setForm(empty); setShowForm(true); };
  const openEdit = (t) => { setEditing(t.id); setForm({ ...t, is_active: t.is_active === 1 || t.is_active === true }); setShowForm(true); };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setForm(f => ({ ...f, photo_url: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.review) { toast.error('Name and review are required'); return; }
    setSaving(true);
    try {
      if (editing) {
        const r = await testimonialsAPI.update(editing, form);
        setItems(prev => prev.map(t => t.id === editing ? r.data.data : t));
        toast.success('Updated!');
      } else {
        const r = await testimonialsAPI.create(form);
        setItems(prev => [r.data.data, ...prev]);
        toast.success('Testimonial added!');
      }
      setShowForm(false);
    } catch(e) { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (t) => {
    try {
      const r = await testimonialsAPI.update(t.id, { is_active: !t.is_active });
      setItems(prev => prev.map(x => x.id === t.id ? r.data.data : x));
      toast.success(r.data.data.is_active ? 'Shown on site' : 'Hidden from site');
    } catch(e) {}
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await testimonialsAPI.delete(id);
      setItems(prev => prev.filter(t => t.id !== id));
      toast.success('Deleted');
    } catch(e) { toast.error('Failed'); }
  };

  return (
    <AdminLayout requiredPerm="manage_testimonials" title="Testimonials">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Customer Testimonials</h2>
          <p className="text-sm text-gray-500 mt-1">{items.filter(t => t.is_active).length} shown on website · {items.length} total</p>
        </div>
        <button onClick={openAdd} className="bg-[#006948] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors text-sm">
          + Add Testimonial
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map(t => (
            <div key={t.id} className={"bg-white rounded-2xl border shadow-sm transition-all overflow-hidden " + (t.is_active ? 'border-gray-100' : 'border-gray-100 opacity-60')}>
              {/* Installation photo banner */}
              {t.installation_photo && (
                <div className="relative h-28 overflow-hidden">
                  <img src={t.installation_photo} alt="Installation" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  <span className="absolute bottom-2 left-3 text-white text-xs font-medium opacity-80">📸 Installation</span>
                </div>
              )}
              {/* Card header */}
              <div className="p-5 pb-3">
                <div className="flex items-start gap-3 mb-3">
                  {/* Photo */}
                  <div className="flex-shrink-0">
                    {t.photo_url ? (
                      <img src={t.photo_url} alt={t.name}
                        className={"w-14 h-14 rounded-full object-cover border-2 border-white shadow-md " + (t.installation_photo ? '-mt-8 relative z-10' : '')}
                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }} />
                    ) : null}
                    <div className={"w-14 h-14 bg-gradient-to-br from-[#006948] to-green-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md border-2 border-white " + (t.photo_url ? 'hidden' : 'flex') + (t.installation_photo ? ' -mt-8 relative z-10' : '')}>
                      {t.name?.charAt(0).toUpperCase()}
                    </div>
                  </div>
                  <div className={"flex-1 min-w-0 " + (t.installation_photo ? 'pt-1' : '')}>
                    <h3 className="font-bold text-gray-800 text-sm truncate">{t.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{[t.role, t.company].filter(Boolean).join(' — ')}</p>
                    <p className="text-xs text-gray-400">{t.location}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <button onClick={() => toggleActive(t)}
                      className={"text-xs px-2 py-1 rounded-full font-medium transition-colors " + (t.is_active ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600' : 'bg-gray-100 text-gray-500 hover:bg-green-50 hover:text-green-600')}>
                      {t.is_active ? '● Live' : '○ Hidden'}
                    </button>
                  </div>
                </div>
                <Stars rating={t.rating} />
                <p className="text-gray-600 text-sm mt-3 leading-relaxed line-clamp-3 italic">"{t.review}"</p>
              </div>
              {/* Stats */}
              {(t.capacity || t.savings) && (
                <div className="px-5 py-3 border-t border-gray-50 flex gap-2">
                  {t.capacity && <span className="text-xs bg-green-50 text-[#006948] px-2.5 py-1 rounded-full font-medium">{t.capacity}</span>}
                  {t.savings && <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">{t.savings}</span>}
                </div>
              )}
              {/* Actions */}
              <div className="px-5 py-3 border-t border-gray-50 flex gap-2">
                <button onClick={() => openEdit(t)} className="flex-1 text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1.5 rounded-lg hover:bg-blue-50 transition-colors">✏️ Edit</button>
                <button onClick={() => handleDelete(t.id)} className="flex-1 text-center text-xs text-red-500 hover:text-red-600 font-medium py-1.5 rounded-lg hover:bg-red-50 transition-colors">🗑 Delete</button>
              </div>
            </div>
          ))}

          {/* Add new card */}
          <button onClick={openAdd}
            className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 p-8 hover:border-[#006948] hover:bg-green-50 transition-all group min-h-[200px]">
            <div className="w-12 h-12 bg-gray-100 group-hover:bg-[#006948] rounded-full flex items-center justify-center text-2xl transition-colors">
              <span className="group-hover:text-white">+</span>
            </div>
            <p className="text-sm font-medium text-gray-500 group-hover:text-[#006948]">Add Testimonial</p>
          </button>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg text-gray-800">{editing ? 'Edit Testimonial' : 'Add New Testimonial'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Photo */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-3">Customer Photo</label>
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    {form.photo_url ? (
                      <img src={form.photo_url} alt="preview" className="w-20 h-20 rounded-full object-cover border-2 border-green-100" />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-[#006948] to-green-400 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                        {form.name?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex gap-2 mb-3">
                      <button type="button" onClick={() => setPhotoMode('url')}
                        className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (photoMode==='url' ? 'bg-[#006948] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                        🔗 URL
                      </button>
                      <button type="button" onClick={() => setPhotoMode('upload')}
                        className={"px-3 py-1.5 rounded-lg text-xs font-medium transition-colors " + (photoMode==='upload' ? 'bg-[#006948] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200')}>
                        📁 Upload
                      </button>
                    </div>
                    {photoMode === 'url' ? (
                      <input value={form.photo_url} onChange={e => setForm(f => ({...f, photo_url: e.target.value}))}
                        placeholder="https://example.com/photo.jpg"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                    ) : (
                      <div>
                        <input type="file" accept="image/*" onChange={handleFileUpload}
                          className="w-full border border-dashed border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-500 cursor-pointer" />
                        <p className="text-xs text-gray-400 mt-1">Max 2MB. JPG, PNG, WebP</p>
                      </div>
                    )}
                    {form.photo_url && (
                      <button type="button" onClick={() => setForm(f => ({...f, photo_url:''}))} className="text-xs text-red-500 mt-2 hover:underline">Remove photo</button>
                    )}
                  </div>
                </div>
              </div>

              {/* Name + Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))} required
                    placeholder="e.g. Subhash Jha"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Designation / Role</label>
                  <input value={form.role} onChange={e => setForm(f => ({...f, role:e.target.value}))}
                    placeholder="e.g. Head - Administration"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              {/* Company + Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Company / Organisation</label>
                  <input value={form.company} onChange={e => setForm(f => ({...f, company:e.target.value}))}
                    placeholder="e.g. Ranchi Gymkhana Club"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Location</label>
                  <input value={form.location} onChange={e => setForm(f => ({...f, location:e.target.value}))}
                    placeholder="e.g. Ranchi, Jharkhand"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              {/* Installation Photo */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Installation Photo URL <span className="text-gray-400 font-normal normal-case">(photo of their solar system)</span></label>
                <input value={form.installation_photo || ''} onChange={e => setForm(f => ({...f, installation_photo: e.target.value}))}
                  placeholder="https://example.com/installation.jpg (shown as card background)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                {form.installation_photo && (
                  <img src={form.installation_photo} alt="preview" className="mt-2 w-full h-28 object-cover rounded-xl border border-gray-100" onError={e => e.target.style.display='none'} />
                )}
              </div>

              {/* Review */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Review / Testimonial *</label>
                <textarea value={form.review} onChange={e => setForm(f => ({...f, review:e.target.value}))} required rows={4} maxLength={500}
                  placeholder="What did the customer say about Sologix Energy?"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none" />
                <p className="text-xs text-gray-400 mt-1 text-right">{form.review.length}/500</p>
              </div>

              {/* Rating */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Star Rating</label>
                <Stars rating={form.rating} onChange={r => setForm(f => ({...f, rating:r}))} />
              </div>

              {/* Capacity + Savings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">System Capacity</label>
                  <input value={form.capacity} onChange={e => setForm(f => ({...f, capacity:e.target.value}))}
                    placeholder="e.g. 40 kW"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Annual Savings</label>
                  <input value={form.savings} onChange={e => setForm(f => ({...f, savings:e.target.value}))}
                    placeholder="e.g. Rs 3,36,000/yr"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              {/* Sort + Active */}
              <div className="flex items-center gap-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Display Order</label>
                  <input type="number" value={form.sort_order} onChange={e => setForm(f => ({...f, sort_order: parseInt(e.target.value)||0}))} min="0"
                    className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer mt-4">
                  <div className="relative">
                    <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({...f, is_active: e.target.checked}))} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#006948] rounded-full transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">Show on website</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#006948] text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
                  {saving ? 'Saving...' : editing ? 'Update Testimonial' : 'Add Testimonial'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
