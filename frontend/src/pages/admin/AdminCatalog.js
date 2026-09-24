import AdminLayout from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import { catalogAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Solar Panels','On-Grid Inverters','Hybrid Inverters','Lithium Batteries','BOS & Accessories'];
const empty = { category:'Solar Panels', brand:'', model:'', specs:'', price_range:'Contact for pricing', price:'', unit:'per NOS', discount_price:'', show_price:false, image_url:'', badge:'', in_stock:true, sort_order:0 };
const UNITS = ['per NOS','per Wp','per metre','per KGS','per set','per kit'];
const NEW_CAT = '__new__';
const MAX_DATA_URL = 1000000; // server rejects image_url longer than ~1.5M chars; stay well under

const uniq = (list) => {
  const seen = new Set();
  return list.filter(c => {
    const k = typeof c === 'string' ? c.trim() : '';
    if (!k || seen.has(k)) return false;
    seen.add(k); return true;
  }).map(c => c.trim());
};
const toMoney = (v) => (v === '' || v === null || v === undefined || !Number.isFinite(Number(v))) ? null : Number(v);
const isOn = (v) => v === true || Number(v) === 1;
const fmtINR = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });

export default function AdminCatalog() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [filterCat, setFilterCat] = useState('All');
  const [apiCats, setApiCats] = useState([]);
  const [newCat, setNewCat] = useState('');
  const [processingImg, setProcessingImg] = useState(false);

  useEffect(() => { load(); loadCats(); }, []);
  const load = async () => {
    try {
      const r = await catalogAPI.getAll();
      setProducts(Array.isArray(r.data.data) ? r.data.data : []);
      if (r.data.fallback) toast.error('Database unavailable: showing the built-in list. Changes will not save until it is back.');
    }
    catch(e) { toast.error('Failed to load'); } finally { setLoading(false); }
  };
  const loadCats = async () => {
    try { const r = await catalogAPI.getCategories(); if (Array.isArray(r.data?.data)) setApiCats(r.data.data); }
    catch(e) { /* built-in list is enough */ }
  };

  // Server categories first (display order), then the built-in ones, then any
  // category only present on a product (e.g. just created in this session).
  const categories = uniq([...apiCats, ...CATEGORIES, ...products.map(p => p.category)]);

  const filtered = filterCat === 'All' ? products : products.filter(p => p.category === filterCat);

  // Resize in the browser (max 1200px, JPEG) so the data URL stays under ~1 MB.
  const handleFileUpload = (e) => {
    const input = e.target;
    const file = input.files && input.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image file'); input.value = ''; return; }
    if (file.size > 15 * 1024 * 1024) { toast.error('Image must be under 15MB'); input.value = ''; return; }
    setProcessingImg(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let max = 1200, quality = 0.82, dataUrl = '';
        for (let i = 0; i < 6; i++) {
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          if (dataUrl.length <= MAX_DATA_URL) break;
          max = Math.round(max * 0.8); quality = Math.max(0.6, quality - 0.06);
        }
        setProcessingImg(false);
        if (!dataUrl || dataUrl.length > MAX_DATA_URL) { toast.error('Image is too large even after resizing. Try a smaller image or paste a URL.'); return; }
        setForm(f => ({ ...f, image_url: dataUrl }));
      };
      img.onerror = () => { setProcessingImg(false); toast.error('Could not read that image'); };
      img.src = ev.target.result;
    };
    reader.onerror = () => { setProcessingImg(false); toast.error('Could not read that file'); };
    reader.readAsDataURL(file);
    input.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.brand || !form.model) { toast.error('Brand and model required'); return; }
    const category = (form.category === NEW_CAT ? newCat : form.category || '').trim();
    if (!category) { toast.error('Please choose or type a category'); return; }
    if (category.length > 100) { toast.error('Category name is too long (max 100 characters)'); return; }
    const price = toMoney(form.price);
    const discount = toMoney(form.discount_price);
    if ((form.price !== '' && form.price !== null && price === null) || (price !== null && price < 0)) { toast.error('Price must be a positive number'); return; }
    if ((form.discount_price !== '' && form.discount_price !== null && discount === null) || (discount !== null && discount < 0)) { toast.error('Sale price must be a positive number'); return; }
    if (discount !== null && discount > 0 && !(price > 0)) { toast.error('Enter the regular price before a sale price'); return; }
    if (discount !== null && price !== null && discount > price) { toast.error('Sale price cannot be more than the price'); return; }
    if (form.image_url && form.image_url.length > 1500000) { toast.error('Image is too large. Please upload it again or use a URL.'); return; }
    const payload = {
      category, brand: form.brand.trim(), model: form.model.trim(), specs: form.specs || '',
      price_range: form.price_range || '', price, discount_price: discount,
      unit: form.unit || 'per NOS', show_price: form.show_price ? 1 : 0,
      image_url: form.image_url || '', badge: form.badge || '',
      in_stock: form.in_stock ? 1 : 0, sort_order: parseInt(form.sort_order, 10) || 0,
    };
    setSaving(true);
    try {
      if (editing) {
        const r = await catalogAPI.update(editing, payload);
        setProducts(prev => prev.map(p => p.id===editing ? r.data.data : p));
        toast.success('Updated!');
      } else {
        const r = await catalogAPI.create(payload);
        setProducts(prev => [...prev, r.data.data]);
        toast.success('Product added!');
      }
      if (!categories.includes(category)) setApiCats(prev => [...prev, category]);
      setShowForm(false);
    } catch(e) { toast.error(e.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try { await catalogAPI.delete(id); setProducts(prev => prev.filter(p => p.id!==id)); toast.success('Deleted'); }
    catch(e) { toast.error('Failed'); }
  };

  const toggleStock = async (p) => {
    try {
      const r = await catalogAPI.update(p.id, { in_stock: isOn(p.in_stock) ? 0 : 1 });
      setProducts(prev => prev.map(x => x.id===p.id ? r.data.data : x));
    } catch(e) { toast.error(e.response?.data?.message || 'Failed to update stock'); }
  };

  const openAdd = () => { setEditing(null); setNewCat(''); setForm({...empty, sort_order: products.length+1}); setShowForm(true); };
  const openEdit = (p) => {
    setEditing(p.id); setNewCat('');
    setForm({
      ...empty, ...p,
      category: p.category || 'Solar Panels',
      brand: p.brand || '', model: p.model || '', specs: p.specs || '',
      price_range: p.price_range || '', image_url: p.image_url || '', badge: p.badge || '',
      price: p.price === null || p.price === undefined ? '' : String(p.price),
      discount_price: p.discount_price === null || p.discount_price === undefined ? '' : String(p.discount_price),
      unit: p.unit || 'per NOS',
      show_price: isOn(p.show_price),
      in_stock: isOn(p.in_stock),
      sort_order: p.sort_order || 0,
    });
    setShowForm(true);
  };

  const unitOptions = uniq([...UNITS, form.unit]);
  const priceNum = toMoney(form.price);
  const discNum = toMoney(form.discount_price);
  const discountError = discNum !== null && discNum > 0 && (priceNum === null || discNum > priceNum);

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
        {['All',...categories].map(c => (
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
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{p.specs}</p>
                <p className="text-xs mb-3">
                  {Number(p.price) > 0 ? (
                    <>
                      <span className="font-semibold text-gray-800">{fmtINR(Number(p.discount_price) > 0 && Number(p.discount_price) < Number(p.price) ? p.discount_price : p.price)}</span>
                      {Number(p.discount_price) > 0 && Number(p.discount_price) < Number(p.price) && <span className="text-gray-400 line-through ml-1">{fmtINR(p.price)}</span>}
                      <span className="text-gray-400"> {p.unit || 'per NOS'}</span>
                      <span className={'ml-1 ' + (isOn(p.show_price) ? 'text-green-600' : 'text-orange-500')}>· {isOn(p.show_price) ? 'shown' : 'hidden'}</span>
                    </>
                  ) : <span className="text-gray-400">{p.price_range || 'Contact for pricing'}</span>}
                </p>
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
                {form.image_url && <img key={form.image_url.slice(0, 64) + form.image_url.length} src={form.image_url} alt="preview" className="w-full h-36 object-cover rounded-xl mb-2 border" onError={e=>e.target.style.display='none'} />}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Upload file</p>
                    <input type="file" accept="image/*" onChange={handleFileUpload} disabled={processingImg}
                      className="w-full border border-dashed border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-500 cursor-pointer" />
                    <p className="text-[11px] text-gray-400 mt-1">{processingImg ? 'Resizing image...' : 'Large photos are resized automatically.'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Or paste URL</p>
                    <input value={form.image_url && form.image_url.startsWith('data:') ? '' : form.image_url} onChange={e=>setForm(f=>({...f,image_url:e.target.value}))}
                      placeholder={form.image_url && form.image_url.startsWith('data:') ? '(uploaded image)' : 'https://...'} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
                {form.image_url && (
                  <button type="button" onClick={() => setForm(f => ({...f, image_url:''}))} className="text-xs text-red-500 mt-2 hover:underline">Remove image</button>
                )}
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Category *</label>
                <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500">
                  {uniq([...categories, form.category === NEW_CAT ? '' : form.category]).map(c=><option key={c} value={c}>{c}</option>)}
                  <option value={NEW_CAT}>+ New category</option>
                </select>
                {form.category === NEW_CAT && (
                  <input value={newCat} onChange={e=>setNewCat(e.target.value)} maxLength={100} autoFocus
                    placeholder="Type the new category name, e.g. Solar Water Heaters"
                    className="w-full mt-2 border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                )}
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

              {/* Price, sale price, unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Price (₹)</label>
                  <input type="number" min="0" step="0.01" inputMode="decimal" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}
                    placeholder="Optional" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Sale price (₹)</label>
                  <input type="number" min="0" step="0.01" inputMode="decimal" value={form.discount_price} onChange={e=>setForm(f=>({...f,discount_price:e.target.value}))}
                    placeholder="Optional" className={"w-full border rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500 " + (discountError ? 'border-red-400' : 'border-gray-200')} />
                  {discountError && <p className="text-[11px] text-red-500 mt-1">{priceNum === null ? 'Enter the price first' : 'Must not be more than the price'}</p>}
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Unit</label>
                  <select value={form.unit} onChange={e=>setForm(f=>({...f,unit:e.target.value}))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-500">
                    {unitOptions.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={!!form.show_price} onChange={e=>setForm(f=>({...f,show_price:e.target.checked}))} className="mt-0.5 w-4 h-4 accent-[#006948]" />
                <span className="text-sm text-gray-700">
                  <span className="font-medium">Show price to customers</span>
                  <span className="block text-xs text-gray-400">
                    {form.show_price && !(priceNum > 0) ? 'Enter a price above — without one, customers see the Price Range text instead.' : 'When off (or no price), customers see the Price Range text below, or "Contact for pricing".'}
                  </span>
                </span>
              </label>

              {/* Price range text + Badge */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Price Range text</label>
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
                  <span className="text-sm font-medium text-gray-700">In stock (out-of-stock items stay visible but can't be ordered)</span>
                </label>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={()=>setShowForm(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving || processingImg} className="flex-1 bg-[#006948] text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-60">
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
