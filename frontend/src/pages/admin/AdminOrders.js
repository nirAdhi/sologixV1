import AdminLayout from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import { productOrdersAPI } from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = { pending:'bg-yellow-100 text-yellow-700', contacted:'bg-blue-100 text-blue-700', confirmed:'bg-purple-100 text-purple-700', completed:'bg-green-100 text-green-700', cancelled:'bg-red-100 text-red-700' };
const STATUSES = ['pending','contacted','confirmed','completed','cancelled'];
const TYPE_COLORS = { customer:'bg-gray-100 text-gray-700', distributor:'bg-orange-100 text-orange-700', installer:'bg-blue-100 text-blue-700', direct_order:'bg-purple-100 text-purple-700', product_quote:'bg-blue-100 text-blue-700' };
const TYPE_LABELS = { customer:'Customer', distributor:'Distributor', installer:'Installer', direct_order:'🛒 Direct Order', product_quote:'📋 Quote Request' };

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { const r = await productOrdersAPI.getAll(); setOrders(r.data.data || []); }
    catch(e) {} finally { setLoading(false); }
  };

  const updateStatus = async (id, status) => {
    try {
      await productOrdersAPI.updateStatus(id, status);
      setOrders(prev => prev.map(o => o.id===id ? {...o,status} : o));
      if (selected?.id===id) setSelected(p => ({...p,status}));
      toast.success('Status updated');
    } catch(e) {}
  };

  const filtered = filter==='all' ? orders : orders.filter(o => o.status===filter);
  const counts = { all: orders.length, ...STATUSES.reduce((a,s) => ({...a,[s]:orders.filter(o=>o.status===s).length}),{}) };

  return (
    <AdminLayout requiredPerm="manage_bookings" title="Product Orders">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Product Quote Requests</h2>
          <p className="text-sm text-gray-500 mt-1">{orders.filter(o=>o.status==='pending').length} pending · {orders.length} total</p>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all',...STATUSES].map(s => (
          <button key={s} onClick={()=>setFilter(s)}
            className={"px-4 py-2 rounded-xl text-sm font-medium transition-all border capitalize " + (filter===s ? 'bg-[#006948] text-white border-[#006948]' : 'bg-white text-gray-600 border-gray-200 hover:border-green-500')}>
            {s} <span className="opacity-60">({counts[s]||0})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div></div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-3">📦</div>
              <p>No orders found</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['#','Customer','Type','Phone','Items','Status','Date','Action'].map(h => (
                    <th key={h} className="text-left text-xs text-gray-400 font-medium px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(order => {
                  let items = [];
                  try { items = typeof order.items==='string' ? JSON.parse(order.items) : order.items; } catch{}
                  return (
                    <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => setSelected({...order,parsedItems:items})}>
                      <td className="px-4 py-3 text-gray-400 text-xs font-mono">#{order.id}</td>
                      <td className="px-4 py-3"><p className="font-semibold text-gray-800">{order.name}</p><p className="text-xs text-gray-400">{order.email}</p></td>
                      <td className="px-4 py-3"><span className={"text-xs px-2 py-1 rounded-full font-medium capitalize " + (TYPE_COLORS[order.customer_type]||'bg-gray-100 text-gray-600')}>{order.customer_type}</span></td>
                      <td className="px-4 py-3 text-gray-600">{order.phone}</td>
                      <td className="px-4 py-3"><span className="text-xs font-bold text-[#006948]">{items.length} item{items.length!==1?'s':''}</span></td>
                      <td className="px-4 py-3">
                        <select value={order.status} onChange={e=>{e.stopPropagation();updateStatus(order.id,e.target.value);}}
                          onClick={e=>e.stopPropagation()}
                          className={"text-xs px-2 py-1 rounded-full font-medium border cursor-pointer outline-none capitalize " + (STATUS_COLORS[order.status]||'bg-gray-100')}>
                          {STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{new Date(order.created_at).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'2-digit'})}</td>
                      <td className="px-4 py-3"><button className="text-xs text-blue-600 font-medium hover:underline">View</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Order Detail Panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto shadow-2xl" onClick={e=>e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="font-bold text-lg">Order #{selected.id}</h2>
              <button onClick={()=>setSelected(null)} className="text-gray-400 text-xl">x</button>
            </div>
            <div className="p-6 space-y-5">
              {/* Status */}
              <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">Status</p>
                <div className="flex flex-wrap gap-2">
                  {STATUSES.map(s => (
                    <button key={s} onClick={()=>updateStatus(selected.id,s)}
                      className={"text-xs px-3 py-1.5 rounded-full font-medium border capitalize transition-all " + (selected.status===s ? (STATUS_COLORS[s]||'bg-gray-100') + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100')}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Customer</p>
                {[['👤','Name',selected.name],['📞','Phone',selected.phone],['✉️','Email',selected.email||'—'],['📍','Address',selected.address||'—'],['🏷️','Type',selected.customer_type]].map(([icon,label,val])=>(
                  <div key={label} className="flex gap-3 text-sm"><span className="w-5">{icon}</span><span className="text-gray-500 w-16">{label}:</span><span className="text-gray-800 font-medium">{val}</span></div>
                ))}
              </div>
              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Requested Items ({selected.parsedItems?.length})</p>
                <div className="space-y-2">
                  {selected.parsedItems?.map((item,i) => (
                    <div key={i} className="flex items-center justify-between bg-white rounded-xl p-3 border border-gray-100">
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{item.brand} {item.model}</p>
                        <p className="text-xs text-gray-500">{item.category}</p>
                      </div>
                      <span className="text-sm font-bold text-[#006948] bg-green-50 px-3 py-1 rounded-full">x{item.qty}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Notes */}
              {selected.notes && (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-600 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{selected.notes}</p>
                </div>
              )}
              {/* Actions */}
              <div className="flex gap-3">
                <a href={'tel:'+selected.phone} className="flex-1 text-center bg-green-50 text-green-700 border border-green-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-green-100">Call</a>
                {selected.email && <a href={'mailto:'+selected.email} className="flex-1 text-center bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-100">Email</a>}
                <a href={'https://wa.me/91'+selected.phone?.replace(/\D/g,'')} target="_blank" rel="noreferrer" className="flex-1 text-center bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-100">WhatsApp</a>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
