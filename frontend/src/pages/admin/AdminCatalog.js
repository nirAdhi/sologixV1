import AdminLayout from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import { catalogAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Solar Panels','On-Grid Inverters','Hybrid Inverters','Lithium Batteries','BOS & Accessories'];
const empty = { category:'Solar Panels', brand:'', model:'', specs:'', price_range:'Contact for pricing', price:'', unit:'per NOS', discount_price:'', show_price:false, image_url:'', badge:'', in_stock:true, sort_order:0 };
const UNITS = ['per NOS','per Wp','per metre','per KGS','per set','per kit'];

export default function AdminCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('All');

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await catalogAPI.getAll(); setProducts(r.data.data || []); }
    catch(e) { toast.error('Failed to load'); } finally { setLoading(false); }
  };

  const filtered = filterCat === 'All' ? products : products.filter(p => p.category === filterCat);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 3*1024*1024) { toast.error('Max 3MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => setForm(f => ({...f, image_url: ev.target.result}));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.brand || !form.model) { toast.error('Brand and model required'); return; }
    setSaving(true);
    try {
      if (editing) {
        const r = await catalogAPI.update(editing, form);
        setProducts(prev => prev.map(p => p.id===editing ? r.data.data : p));
        toast.success('Updated!');
      } else {
        const r = await catalogAPI.create(form);
        setProducts(prev => [...prev, r.data.data]);
        toast.success('Product added!');
      }
      setShowForm(false);
    } catch(e) { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await catalogAPI.delete(id); setProducts(prev => prev.filter(p => p.id!==id)); toast.success('Deleted'); }
    catch(e) { toast.error('Failed'); }
  };

  const toggleStock = async (p) => {
    try {
      const r = await catalogAPI.update(p.id, { in_stock: !p.in_stock });
      setProducts(prev => prev.map(x => x.id===p.id ? r.data.data : x));
    } catch(e) {}
  };

  const openAdd = () => { setEditing(null); setForm({...empty, sort_order: products.length+1}); setShowForm(true); };
  const openEdit = (p) => { setEditing(p.id); setForm({...p, in_stock: p.in_stock===1||p.in_stock===true}); setShowForm(true); };

  return (
    <AdminLayout requiredPerm="manage_services" title="Product Catalog">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Product Catalog</h2>
          <p className="text-sm text-gray-500 mt-1">{products.filter(p=>p.in_stock).length} in stock · {products.length} total products</p>
        </div>
        <button onClick={openAdd} className="bg-[#006948] text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-green-700 text-sm">+ Add Product</button>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['All',...CATEGORIES].map(c => (
          <button key={c} onClick={()=>setFilterCat(c)}
            className={"px-4 py-2 rounded-xl text-sm font-medium border transition-all " + (filterCat===c ? 'bg-[#006948] text-white border-[#006948]' : 'bg-white text-gray-600 border-gray-200 hover:border-green-500')}>
            {c} <span className="opacity-50">({c==='All' ? products.length : products.filter(p=>p.category===c).length})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div key={p.id} className={"bg-white rounded-2xl border shadow-sm overflow-hidden transition-all " + (!p.in_stock ? 'opacity-60' : '')}>
              <div className="relative h-36 overflow-hidden">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.model} className="w-full h-full object-cover" onError={e=>e.target.style.display='none'} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center text-4xl">☀️</div>
                )}
                {p.badge && <span className="absolute top-2 left-2 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-semibold">{p.badge}</span>}
                <button onClick={() => toggleStock(p)}
                  className={"absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full font-medium transition-colors " + (p.in_stock ? 'bg-green-100 text-green-700 hover:bg-red-50 hover:text-red-600' : 'bg-red-100 text-red-600 hover:bg-green-50 hover:text-green-700')}>
                  {p.in_stock ? 'In Stock' : 'Out of Stock'}
                </button>
              </div>
              <div className="p-4">
                <p className="text-xs text-gray-400 mb-0.5">{p.category}</p>
                <p className="text-xs text-[#006948] font-semibold mb-0.5">{p.brand}</p>
                <h3 className="font-bold text-gray-800 text-sm mb-1 truncate">{p.model}</h3>
                <p className="text-xs text-gray-500 line-clamp-2 mb-3">{p.specs}</p>
                <div className="flex gap-2 border-t border-gray-50 pt-3">
                  <button onClick={() => openEdit(p)} className="flex-1 text-xs text-blue-600 font-medium hover:bg-blue-50 py-1.5 rounded-lg transition-colors">Edit</button>
                  <button onClick={() => handleDelete(p.id)} className="flex-1 text-xs text-red-500 font-medium hover:bg-red-50 py-1.5 rounded-lg transition-colors">Delete</button>
                </div>
              </div>
            </div>
          ))}

          {/* Add card */}
          <button onClick={openAdd}
            className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 p-8 hover:border-[#006948] hover:bg-green-50 transition-all group min-h-[200px]">
            <div className="w-12 h-12 bg-gray-100 group-hover:bg-[#006948] rounded-full flex items-center justify-center text-2xl transition-colors">
              <span className="group-hover:text-white">+</span>
            </div>
            <p className="text-sm font-medium text-gray-500 group-hover:text-[#006948]">Add Product</p>
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="font-bold text-lg">{editing ? 'Edit Product' : 'Add New Product'}</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 text-xl hover:text-gray-600">x</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Image */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Product Image</label>
                {form.image_url && <img src={form.image_url} alt="preview" className="w-full h-36 object-cover rounded-xl mb-2 border" onError={e=>e.target.style.display='none'} />}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Upload file</p>
                    <input type="file" accept="image/*" onChange={handleFileUpload}
                      className="w-full border border-dashed border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-500 cursor-pointer" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Or paste URL</p>
                    <input value={form.image_url} onChange={e=>setForm(f=>({...f,image_url:e.target.value}))}
                      placeholder="https://..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Category *</label>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500">
                  {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                </select>
              </div>

              {/* Brand + Model */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Brand *</label>
                  <input value={form.brand} onChange={e=>setForm(f=>({...f,brand:e.target.value}))} required
                    placeholder="e.g. Adani Solar" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Model *</label>
                  <input value={form.model} onChange={e=>setForm(f=>({...f,model:e.target.value}))} required
                    placeholder="e.g. 580W Mono PERC" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              </div>

              {/* Specs */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Specifications</label>
                <textarea value={form.specs} onChange={e=>setForm(f=>({...f,specs:e.target.value}))} rows={2}
                  placeholder="e.g. 580W · 21.5% efficiency · 25yr warranty · DCR certified"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              </div>

              {/* Price + Badge */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Price Range</label>
                  <input value={form.price_range} onChange={e=>setForm(f=>({...f,price_range:e.target.value}))}
                    placeholder="Contact for pricing" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Badge</label>
                  <select value={form.badge} onChange={e=>setForm(f=>({...f,badge:e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500">
                    <option value="">None</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="Popular">Popular</option>
                    <option value="New">New</option>
                  </select>
                </div>
              </div>

              {/* Sort + In Stock */}
              <div className="flex items-center gap-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Display Order</label>
                  <input type="number" value={form.sort_order} onChange={e=>setForm(f=>({...f,sort_order:parseInt(e.target.value)||0}))} min="0"
                    className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <label className="flex items-center gap-3 cursor-pointer mt-4">
                  <div className="relative">
                    <input type="checkbox" checked={form.in_stock} onChange={e=>setForm(f=>({...f,in_stock:e.target.checked}))} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-checked:bg-[#006948] rounded-full transition-colors relative after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:w-5 after:h-5 after:bg-white after:rounded-full after:transition-transform peer-checked:after:translate-x-5"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">In Stock (visible to customers)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 bg-[#006948] text-white py-3 rounded-xl font-semibold hover:bg-green-700">
                  {saving ? 'Saving...' : editing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
