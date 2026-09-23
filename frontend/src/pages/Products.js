import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { catalogAPI } from '../utils/api';
import toast from 'react-hot-toast';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const STATIC = [
  { id:1,  category:'Solar Panels',      brand:'Adani Solar',     model:'Mono PERC 580W',       unit:'per Wp',    specs:'580W · 21.5% efficiency · 25yr warranty · DCR', badge:'Best Seller', in_stock:1, image_url:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop' },
  { id:2,  category:'Solar Panels',      brand:'Tata Power Solar', model:'575W Mono',            unit:'per Wp',    specs:'575W · 21.8% efficiency · Tier-1 manufacturer', badge:'',           in_stock:1, image_url:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop' },
  { id:3,  category:'Solar Panels',      brand:'Rayzon Solar',    model:'545W PERC',             unit:'per Wp',    specs:'545W · high-efficiency · strong build quality',  badge:'',           in_stock:1, image_url:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&h=300&fit=crop' },
  { id:4,  category:'Solar Panels',      brand:'ZEN Energy',      model:'590W TOPCon',           unit:'per Wp',    specs:'590W · TOPCon · better temp performance',        badge:'New',        in_stock:1, image_url:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&h=300&fit=crop' },
  { id:5,  category:'On-Grid Inverters', brand:'Deye',            model:'10kW On-Grid',          unit:'per NOS',   specs:'10kW · dual MPPT · WiFi monitoring',             badge:'Best Seller', in_stock:1, image_url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' },
  { id:6,  category:'On-Grid Inverters', brand:'Growatt',         model:'5kW On-Grid',           unit:'per NOS',   specs:'5kW · reliable · cost-effective',                badge:'',           in_stock:1, image_url:'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&h=300&fit=crop' },
  { id:7,  category:'On-Grid Inverters', brand:'Microtek',        model:'3kW Solar Inverter',    unit:'per NOS',   specs:'3kW · user-friendly · homes and small business', badge:'',           in_stock:1, image_url:'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=400&h=300&fit=crop' },
  { id:8,  category:'Hybrid Inverters',  brand:'LuxPower',        model:'6kW Hybrid',            unit:'per NOS',   specs:'6kW · battery ready · UPS-level backup',         badge:'Popular',    in_stock:1, image_url:'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=400&h=300&fit=crop' },
  { id:9,  category:'Hybrid Inverters',  brand:'LuxPower',        model:'12kW Hybrid',           unit:'per NOS',   specs:'12kW · commercial · remote monitoring',          badge:'',           in_stock:1, image_url:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop' },
  { id:10, category:'Hybrid Inverters',  brand:'Deye',            model:'8kW Hybrid',            unit:'per NOS',   specs:'8kW · dual battery bank · generator support',    badge:'',           in_stock:1, image_url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop' },
  { id:11, category:'Lithium Batteries', brand:'Bi-Tech',         model:'5 kWh LiFePO4',         unit:'per NOS',   specs:'5 kWh · 6000+ cycles · compact · low maintenance',badge:'Best Seller',in_stock:1, image_url:'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=400&h=300&fit=crop' },
  { id:12, category:'Lithium Batteries', brand:'Solis',           model:'5 kWh Storage',         unit:'per NOS',   specs:'5 kWh · smart BMS · hybrid compatible',          badge:'',           in_stock:1, image_url:'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=400&h=300&fit=crop' },
  { id:13, category:'Lithium Batteries', brand:'Bi-Tech',         model:'10 kWh LiFePO4',        unit:'per NOS',   specs:'10 kWh · high capacity · residential and commercial',badge:'',       in_stock:1, image_url:'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=400&h=300&fit=crop' },
  { id:14, category:'BOS & Accessories', brand:'Sologix',         model:'AC Distribution Box',   unit:'per NOS',   specs:'4-way · IP65 · surge protection · 32A MCB',      badge:'',           in_stock:1, image_url:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=400&h=300&fit=crop' },
  { id:15, category:'BOS & Accessories', brand:'Sologix',         model:'DC Junction Box',       unit:'per NOS',   specs:'IP67 · 6-string · anti-reverse protection',      badge:'',           in_stock:1, image_url:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=400&h=300&fit=crop' },
  { id:16, category:'BOS & Accessories', brand:'Sologix',         model:'Mounting Structure RCC', unit:'per NOS',  specs:'GI hot-dip galvanised · adjustable tilt · RCC',  badge:'',           in_stock:1, image_url:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop' },
  { id:17, category:'BOS & Accessories', brand:'Sologix',         model:'Solar DC Cable 4mm',    unit:'per metre', specs:'TUV certified · UV resistant · sold per metre',   badge:'',           in_stock:1, image_url:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=400&h=300&fit=crop' },
];

const CATEGORIES = ['All Products','Solar Panels','On-Grid Inverters','Hybrid Inverters','Lithium Batteries','BOS & Accessories'];
const CAT_ICONS = { 'All Products':'☀️','Solar Panels':'🔆','On-Grid Inverters':'⚡','Hybrid Inverters':'🔋','Lithium Batteries':'🔌','BOS & Accessories':'🛠️' };
const BADGE_STYLE = { 'Best Seller':'bg-[#006948] text-white','Popular':'bg-orange-500 text-white','New':'bg-purple-600 text-white' };

export default function Products() {
  const [products, setProducts] = useState(STATIC);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'All Products');
  const [brandFilter, setBrandFilter] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem('sologix_cart')||'[]'); } catch { return []; } });
  const [showCart, setShowCart] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ name:'', phone:'', email:'', company:'', notes:'' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderProduct, setOrderProduct] = useState(null);
  const [orderForm, setOrderForm] = useState({ name:'', phone:'', email:'', address:'', qty:1, payment:'cod', notes:'' });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderDone, setOrderDone] = useState(false);

  useEffect(() => {
    const cat = searchParams.get('category') || 'All Products';
    setActiveCategory(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  useEffect(() => { localStorage.setItem('sologix_cart', JSON.stringify(cart)); }, [cart]);

  useEffect(() => {
    catalogAPI.getAll()
      .then(r => { if (r.data.success && r.data.data?.length) setProducts(r.data.data); })
      .catch(() => {});
  }, []);

  const setCategory = useCallback((cat) => {
    if (cat === 'All Products') setSearchParams({});
    else setSearchParams({ category: cat });
    setBrandFilter('');
  }, [setSearchParams]);

  const filtered = products.filter(p => {
    const matchCat = activeCategory === 'All Products' || p.category === activeCategory;
    const matchBrand = !brandFilter || p.brand === brandFilter;
    const matchSearch = !search || (p.brand+p.model+p.category+(p.specs||'')).toLowerCase().includes(search.toLowerCase());
    return matchCat && matchBrand && matchSearch;
  });

  const uniqueBrands = [...new Set(
    products.filter(p => activeCategory === 'All Products' || p.category === activeCategory).map(p => p.brand)
  )];

  const addToCart = (product) => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty+1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    toast.success(product.model + ' added to quote cart');
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const submitQuote = async () => {
    if (!quoteForm.name || !quoteForm.phone) { toast.error('Name and phone required'); return; }
    setSubmitting(true);
    const items = cart.length > 0 ? cart.map(i => i.qty+'x '+i.brand+' '+i.model).join(', ') : 'General inquiry';
    try {
      await fetch(API_URL + '/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quoteForm.name, phone: quoteForm.phone,
          email: quoteForm.email, address: quoteForm.company,
          service_interest: 'Product Quote Request',
          message: 'Quote for: ' + items + (quoteForm.notes ? '. Notes: ' + quoteForm.notes : ''),
          source: 'product_quote', priority: 'high',
        }),
      });
      setSubmitted(true);
      setCart([]);
      localStorage.removeItem('sologix_cart');
    } catch { toast.error('Failed to submit. Please call us directly.'); }
    finally { setSubmitting(false); }
  };


  // Get actual price from either the price column or price_range (works with old and new DB schema)
  const getPrice = (p) => {
    if (p.price && Number(p.price) > 0) return Number(p.price);
    if (p.price_range && !isNaN(Number(p.price_range)) && Number(p.price_range) > 0) return Number(p.price_range);
    return null;
  };

  const totalItems = cart.reduce((s, i) => s + i.qty, 0);

  const openOrder = (product) => {
    setOrderProduct(product);
    setOrderForm({ name:'', phone:'', email:'', address:'', qty:1, payment:'cod', notes:'' });
    setOrderDone(false);
    setShowOrderModal(true);
  };


  const launchRazorpay = async (orderData, customerDetails, items, onSuccess) => {
    const options = {
      key: 'rzp_live_SfOIUbCXX39HyD',
      amount: orderData.amount,
      currency: 'INR',
      name: 'Sologix Energy',
      description: items.map(i => i.brand + ' ' + i.model).join(', '),
      image: 'https://res.cloudinary.com/dsiratycd/image/upload/logo_yo5zg9.png',
      order_id: orderData.order_id,
      handler: async (response) => {
        try {
          const verify = await fetch(API_URL + '/payments/product-order/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });
          const result = await verify.json();
          if (result.success) { onSuccess(response.razorpay_payment_id); }
          else { toast.error('Payment verification failed. Contact support.'); }
        } catch { toast.error('Verification error. Please contact us.'); }
      },
      prefill: { name: customerDetails.name, email: customerDetails.email || '', contact: customerDetails.phone },
      theme: { color: '#006948' },
      modal: { ondismiss: () => toast('Payment cancelled') },
    };
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (r) => toast.error('Payment failed: ' + (r.error?.description || 'Please try again')));
    rzp.open();
  };

  const submitOrder = async () => {
    if (!orderForm.name || !orderForm.phone || !orderForm.address) { toast.error('Name, phone and address required'); return; }
    const items = [{ id: orderProduct.id, brand: orderProduct.brand, model: orderProduct.model, qty: orderForm.qty, unit: orderProduct.unit }];
    setOrderSubmitting(true);
    try {
      if (orderForm.payment === 'online') {
        // Razorpay flow - amount is ₹1 placeholder; admin confirms actual amount
        const rpRes = await fetch(API_URL + '/payments/product-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: orderForm.name, phone: orderForm.phone, email: orderForm.email,
            address: orderForm.address, items,
            amount_paise: 100, // ₹1 placeholder - admin sets actual price
            notes: orderForm.notes || '',
          }),
        });
        const rpData = await rpRes.json();
        if (!rpData.success) { toast.error('Payment gateway error. Try COD or call us.'); setOrderSubmitting(false); return; }
        setOrderSubmitting(false);
        launchRazorpay(rpData.data, { name: orderForm.name, phone: orderForm.phone, email: orderForm.email }, items,
          (paymentId) => { setOrderDone(true); toast.success('Payment successful! Order confirmed. Payment ID: ' + paymentId); }
        );
        return;
      }
      // COD flow
      const res = await fetch(API_URL + '/product-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orderForm.name, phone: orderForm.phone, email: orderForm.email,
          address: orderForm.address, items,
          notes: 'Pay on Delivery. ' + (orderForm.notes || ''),
          customer_type: 'direct_order', status: 'pending',
        }),
      });
      if (res.ok) { setOrderDone(true); toast.success('Order placed! Team will confirm within 2 hours.'); }
      else toast.error('Order failed. Please call us.');
    } catch { toast.error('Network error. Please call us.'); }
    finally { setOrderSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="relative py-14 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600&h=400&fit=crop" alt="Products" className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0" data-theme-hero="1" style={{background:'linear-gradient(135deg,rgba(0,105,72,0.92) 0%,rgba(0,77,52,0.85) 100%)'}}></div>
        </div>
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-16">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="text-white/70 text-sm mb-1 uppercase tracking-widest">Sologix Energy</p>
              <h1 className="text-4xl font-bold mb-2">Solar Product Catalog</h1>
              <p className="text-white/80">Add to cart, request a quote, get the best price within 24 hours</p>
            </div>
            <button onClick={() => setShowCart(true)}
              className="relative bg-white/20 border border-white/40 text-white px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2 hover:bg-white/30">
              🛒 Quote Cart
              {totalItems > 0 && <span className="bg-orange-500 text-xs px-2 py-0.5 rounded-full font-bold ml-1">{totalItems}</span>}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[['01','Browse Products','🔍'],['02','Add to Quote Cart','🛒'],['03','Get Best Price in 24h','💰'],['04','Confirm and Pay','✅']].map(([n,t,i]) => (
              <div key={n} className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">{i}</span>
                <div><p className="text-white/50 text-xs">Step {n}</p><p className="text-white text-sm font-medium">{t}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sticky search bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16 py-3 flex items-center gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search products, brands, specifications..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
          </div>
          <button onClick={() => setShowCart(true)}
            className="relative bg-[#006948] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#004d34] transition-colors">
            🛒 {totalItems > 0 ? <span className="bg-orange-500 text-xs px-1.5 py-0.5 rounded-full">{totalItems}</span> : 'Cart'}
          </button>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-16 py-8 flex gap-8">

        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-20">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Categories</p>
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={"w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all mb-1 " +
                  (activeCategory === cat ? 'bg-[#006948] text-white' : 'text-gray-600 hover:bg-gray-50')}>
                <span>{CAT_ICONS[cat]}</span>{cat}
              </button>
            ))}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-5">Filter by Brand</p>
            <button onClick={() => setBrandFilter('')}
              className={"w-full text-left px-3 py-1.5 rounded-lg text-sm mb-1 " + (!brandFilter ? 'bg-gray-100 font-semibold text-gray-800' : 'text-gray-500 hover:bg-gray-50')}>
              All Brands
            </button>
            {uniqueBrands.map(b => (
              <button key={b} onClick={() => setBrandFilter(brandFilter === b ? '' : b)}
                className={"w-full text-left px-3 py-1.5 rounded-lg text-sm mb-1 transition-colors " +
                  (brandFilter === b ? 'bg-[#006948]/10 text-[#006948] font-semibold' : 'text-gray-500 hover:bg-gray-50')}>
                {b}
              </button>
            ))}
            <div className="mt-5 bg-[#006948]/5 border border-[#006948]/20 rounded-xl p-3">
              <p className="text-xs font-bold text-[#006948] mb-1">Can not find what you need?</p>
              <p className="text-xs text-gray-500 mb-2">We can source any solar equipment for you.</p>
              <button onClick={() => { setShowQuoteModal(true); setSubmitted(false); }}
                className="w-full bg-[#006948] text-white text-xs py-2 rounded-lg font-semibold hover:bg-[#004d34] transition-colors">
                Request Item
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Mobile category pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 lg:hidden scrollbar-hide">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={"flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all " +
                  (activeCategory === cat ? 'bg-[#006948] text-white border-[#006948]' : 'bg-white border-gray-200 text-gray-600')}>
                {CAT_ICONS[cat]} {cat}
              </button>
            ))}
          </div>

          {/* Brand carousel */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
            {['All',...uniqueBrands].map(b => (
              <button key={b} onClick={() => setBrandFilter(b === 'All' ? '' : b)}
                className={"flex-shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-all " +
                  ((b === 'All' && !brandFilter) || brandFilter === b
                    ? 'bg-[#006948] text-white border-[#006948]'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-[#006948] hover:text-[#006948]')}>
                {b}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500"><span className="font-semibold text-gray-800">{filtered.length}</span> products</p>
            {(activeCategory !== 'All Products' || brandFilter || search) && (
              <button onClick={() => { setCategory('All Products'); setBrandFilter(''); setSearch(''); }}
                className="text-xs text-[#006948] hover:underline">Clear all filters</button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-gray-500 mb-4">No products match your filters.</p>
              <button onClick={() => { setCategory('All Products'); setBrandFilter(''); setSearch(''); }}
                className="bg-[#006948] text-white px-6 py-2.5 rounded-full text-sm font-semibold">Show All Products</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 hover:border-[#006948]/40 hover:shadow-lg transition-all group flex flex-col overflow-hidden">
                  <div className="relative h-48 overflow-hidden bg-gray-50 cursor-pointer" onClick={() => navigate('/products/'+p.id)}>
                    <img src={p.image_url || 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop'}
                      alt={p.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    {p.badge && <span className={"absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full font-bold shadow " + (BADGE_STYLE[p.badge] || 'bg-gray-100 text-gray-600')}>{p.badge}</span>}
                    {!p.in_stock && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-bold text-sm bg-red-600 px-3 py-1 rounded-full">Out of Stock</span></div>}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs px-2 py-1 rounded-full text-gray-600 font-medium border border-gray-100">{p.unit || 'per NOS'}</div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-xs text-[#006948] font-semibold uppercase tracking-wider mb-1">{p.brand}</p>
                    <h3 className="font-bold text-gray-800 text-sm mb-1 cursor-pointer hover:text-[#006948]" onClick={() => navigate('/products/'+p.id)}>{p.model}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1">{p.specs}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {['Authorised Seller','Pan India Delivery','Quality Assured'].map(b => (
                        <span key={b} className="text-xs bg-green-50 text-[#006948] border border-green-100 px-2 py-0.5 rounded-full">{b}</span>
                      ))}
                    </div>
                    <div className="border-t border-gray-50 pt-3">
                      <div className="flex items-center justify-between mb-3">
                        {(() => { const pr = getPrice(p); return pr ? (
                          <div className="flex-1">
                            <p className="text-xs text-gray-400">{p.unit || 'per NOS'}</p>
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <p className="text-lg font-bold text-[#006948]">₹{pr.toLocaleString('en-IN')}</p>
                              {p.discount_price && Number(p.discount_price) > 0 && <p className="text-xs text-gray-400 line-through">₹{Number(p.discount_price).toLocaleString('en-IN')}</p>}
                              {p.discount_price && Number(p.discount_price) > 0 && <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{Math.round((1-pr/p.discount_price)*100)}% OFF</span>}
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <p className="text-xs text-gray-500 text-sm">Contact for pricing</p>
                          </div>
                        ); })()}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => addToCart(p)} disabled={!p.in_stock}
                          className="flex-1 border border-[#006948] text-[#006948] py-2 rounded-xl text-xs font-semibold hover:bg-[#006948]/5 transition-colors disabled:opacity-40">
                          + Quote
                        </button>
                        <button onClick={() => openOrder(p)} disabled={!p.in_stock}
                          className="flex-1 bg-[#006948] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#004d34] transition-colors disabled:opacity-40">
                          Buy Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating cart pill */}
      {totalItems > 0 && !showCart && (
        <button onClick={() => setShowCart(true)}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 bg-[#006948] text-white px-8 py-3 rounded-full shadow-2xl font-semibold text-sm z-50 flex items-center gap-2 hover:bg-[#004d34] transition-all"
          style={{animation:'floatBounce 2s ease-in-out infinite'}}>
          <style>{'@keyframes floatBounce{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-6px)}}'}</style>
          🛒 View Quote Cart — {totalItems} item{totalItems > 1 ? 's' : ''}
        </button>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setShowCart(false)}></div>
          <div className="w-full max-w-md bg-white h-full overflow-y-auto flex flex-col shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold">Quote Cart ({totalItems} items)</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <p className="text-5xl mb-4">🛒</p>
                <p className="text-gray-500 mb-4">Your quote cart is empty</p>
                <button onClick={() => setShowCart(false)} className="text-[#006948] font-semibold text-sm hover:underline">Browse Products</button>
              </div>
            ) : (
              <>
                <div className="flex-1 p-4 space-y-3">
                  {cart.map(item => (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-3 flex gap-3 items-start border border-gray-100">
                      <img src={item.image_url} alt={item.model} className="w-16 h-14 object-cover rounded-lg flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#006948] font-semibold">{item.brand}</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{item.model}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQty(item.id, item.qty-1)} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100">-</button>
                          <span className="text-sm font-semibold w-8 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, item.qty+1)} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100">+</button>
                          <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 text-lg">x</button>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-100 sticky bottom-0 bg-white">
                  <button onClick={() => { setShowCart(false); setShowQuoteModal(true); setSubmitted(false); }}
                    className="w-full bg-[#006948] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#004d34] transition-colors">
                    Submit Quote Request
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">Best price guaranteed within 24 hours</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Quote Modal */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-[#006948] px-6 py-5 text-white flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold mb-1">{cart.length > 0 ? 'Submit Quote Request' : 'Request an Item'}</h2>
                <p className="text-white/80 text-sm">We respond with the best price within 24 hours</p>
              </div>
              <button onClick={() => setShowQuoteModal(false)} className="text-white/70 hover:text-white text-xl ml-4">x</button>
            </div>
            {submitted ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-[#006948] mb-2">Quote Request Sent!</h3>
                <p className="text-gray-500 text-sm mb-6">Our team will contact you within 24 hours with the best pricing for your requirements.</p>
                <button onClick={() => setShowQuoteModal(false)} className="bg-[#006948] text-white px-8 py-3 rounded-xl font-semibold">Done</button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {cart.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Items in your quote:</p>
                    {cart.map(i => <p key={i.id} className="text-xs text-gray-600">• {i.qty} x {i.brand} {i.model}</p>)}
                  </div>
                )}
                <input type="text" placeholder="Your Full Name *" required value={quoteForm.name}
                  onChange={e => setQuoteForm(f => ({...f, name: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <input type="tel" placeholder="Phone / WhatsApp Number *" required value={quoteForm.phone}
                  onChange={e => setQuoteForm(f => ({...f, phone: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <input type="email" placeholder="Email Address (optional)" value={quoteForm.email}
                  onChange={e => setQuoteForm(f => ({...f, email: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <input type="text" placeholder="Company / Organisation (optional)" value={quoteForm.company}
                  onChange={e => setQuoteForm(f => ({...f, company: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <textarea placeholder="Specific requirements, quantities, or any message..." rows={3}
                  value={quoteForm.notes} onChange={e => setQuoteForm(f => ({...f, notes: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] resize-none" />
                <div className="flex gap-3">
                  <button onClick={() => setShowQuoteModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                  <button onClick={submitQuote} disabled={submitting}
                    className="flex-1 bg-[#006948] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#004d34] transition-colors disabled:opacity-60">
                    {submitting ? 'Sending...' : 'Submit Quote'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center">Razorpay payment integration — coming soon</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Direct Order Modal ── */}
      {showOrderModal && orderProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-[#006948] px-6 py-4 text-white flex justify-between items-center sticky top-0">
              <div>
                <h2 className="text-lg font-bold">Place Order</h2>
                <p className="text-white/80 text-xs">{orderProduct.brand} — {orderProduct.model}</p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="text-white/70 hover:text-white text-xl">✕</button>
            </div>
            {orderDone ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-[#006948] mb-2">Order Placed!</h3>
                <p className="text-gray-500 text-sm mb-2">Thank you! Our team will call you within 2 hours to confirm your order and delivery details.</p>
                <p className="text-xs text-gray-400 mb-6">Order reference: #{Date.now().toString().slice(-6)}</p>
                <button onClick={() => setShowOrderModal(false)} className="bg-[#006948] text-white px-8 py-3 rounded-xl font-semibold">Done</button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {/* Product summary */}
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                  <img src={orderProduct.image_url} alt={orderProduct.model} className="w-14 h-12 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#006948] font-semibold">{orderProduct.brand}</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{orderProduct.model}</p>
                    <p className="text-xs text-gray-400">{orderProduct.unit}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setOrderForm(f => ({...f, qty: Math.max(1, f.qty-1)}))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold">-</button>
                    <span className="font-bold w-6 text-center">{orderForm.qty}</span>
                    <button onClick={() => setOrderForm(f => ({...f, qty: f.qty+1}))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold">+</button>
                  </div>
                </div>

                <input type="text" placeholder="Your Full Name *" required value={orderForm.name}
                  onChange={e => setOrderForm(f => ({...f, name: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <input type="tel" placeholder="Phone / WhatsApp Number *" required value={orderForm.phone}
                  onChange={e => setOrderForm(f => ({...f, phone: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <input type="email" placeholder="Email Address (for order confirmation)" value={orderForm.email}
                  onChange={e => setOrderForm(f => ({...f, email: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <textarea placeholder="Delivery Address (full address with PIN code) *" rows={3} required
                  value={orderForm.address} onChange={e => setOrderForm(f => ({...f, address: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] resize-none" />

                {/* Payment method */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Payment Method</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[['cod','💵 Pay on Delivery'],['online','💳 Online Payment']].map(([val,label]) => (
                      <button key={val} onClick={() => setOrderForm(f => ({...f, payment: val}))}
                        className={"py-3 rounded-xl border-2 text-sm font-semibold transition-all " +
                          (orderForm.payment === val ? 'border-[#006948] bg-[#006948]/5 text-[#006948]' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                        {label}
                      </button>
                    ))}
                  </div>
                  {orderForm.payment === 'online' && (
                    <p className="text-xs text-orange-600 mt-2 bg-orange-50 rounded-lg px-3 py-2">
                      ⚡ Razorpay online payment coming soon. Our team will share a payment link after confirming your order.
                    </p>
                  )}
                </div>

                <textarea placeholder="Any special instructions or notes (optional)" rows={2}
                  value={orderForm.notes} onChange={e => setOrderForm(f => ({...f, notes: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] resize-none" />

                <div className="flex gap-3">
                  <button onClick={() => setShowOrderModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">Cancel</button>
                  <button onClick={submitOrder} disabled={orderSubmitting}
                    className="flex-1 bg-[#006948] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#004d34] disabled:opacity-60 transition-colors">
                    {orderSubmitting ? 'Placing Order...' : 'Place Order →'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center">Our team will call you within 2 hours to confirm.</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
