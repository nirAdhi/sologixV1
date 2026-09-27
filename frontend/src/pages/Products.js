import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import ChannelPartners from '../components/ChannelPartners';
import { catalogAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { useT } from '../i18n';
import { BRANDING } from '../utils/branding';
import { whatsappHref, telHref } from '../utils/siteConfig';

const API_URL = process.env.REACT_APP_API_URL || '/api';
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=300&fit=crop';
const ALL = 'All Products';

// OFFLINE FALLBACK ONLY: shown when the catalog request fails, so the page is
// never blank. These ids do not exist in the database, so ordering and the
// quote cart are disabled for them (_fallback).
const FALLBACK_PRODUCTS = [
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
].map(p => ({ ...p, _fallback: true }));

// Used only when GET /api/catalog/categories fails and no live products are known.
const FALLBACK_CATEGORIES = ['Solar Panels','On-Grid Inverters','Hybrid Inverters','Lithium Batteries','BOS & Accessories'];
// Optional icons for known category names; new admin categories get the default.
const CAT_ICONS = { 'All Products':'☀️','Solar Panels':'🔆','On-Grid Inverters':'⚡','Hybrid Inverters':'🔋','Lithium Batteries':'🔌','BOS & Accessories':'🛠️' };
const catIcon = (c) => CAT_ICONS[c] || '☀️';
const BADGE_STYLE = { 'Best Seller':'bg-[#006948] text-white','Popular':'bg-orange-500 text-white','New':'bg-purple-600 text-white' };

// ── Catalog helpers ─────────────────────────────────────────────────────────
const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const isOn = (v) => v === true || toNum(v) > 0;
const inStock = (p) => (p && (p.in_stock === undefined || p.in_stock === null)) ? true : isOn(p && p.in_stock);
const BARE_NUMBER = /^\s*(?:₹|rs\.?)?\s*[\d,]+(?:\.\d+)?\s*$/i;
const fmtINR = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const uniq = (list) => {
  const seen = new Set();
  const out = [];
  list.forEach(c => { const k = typeof c === 'string' ? c.trim() : ''; if (k && !seen.has(k)) { seen.add(k); out.push(k); } });
  return out;
};

// Public pricing rule: a price is shown only when show_price is on AND price > 0.
// Selling price = discount_price when 0 < discount_price < price.
const getPriceInfo = (p) => {
  const price = toNum(p && p.price);
  if (p && isOn(p.show_price) && price > 0) {
    const d = toNum(p.discount_price);
    const discounted = d > 0 && d < price;
    const pct = discounted ? Math.round((1 - d / price) * 100) : 0;
    return { show: true, selling: discounted ? d : price, original: discounted ? price : null, pct };
  }
  const range = p && p.price_range !== undefined && p.price_range !== null ? String(p.price_range).trim() : '';
  return { show: false, text: range && !BARE_NUMBER.test(range) ? range : 'Contact for pricing' };
};

function PriceTag({ p, t, size = 'md' }) {
  const info = getPriceInfo(p);
  const big = size === 'md' ? 'text-lg' : 'text-sm';
  if (!info.show) return <p className={(size === 'md' ? 'text-sm' : 'text-xs') + ' text-gray-500 line-clamp-2'}>{t(info.text)}</p>;
  return (
    <div className="flex items-baseline gap-x-2 gap-y-0.5 flex-wrap">
      <span className={big + ' font-bold text-[#006948]'}>{fmtINR(info.selling)}</span>
      <span className="text-xs text-gray-500">{t(p.unit || 'per NOS')}</span>
      {info.original && <span className="text-xs text-gray-400 line-through">{fmtINR(info.original)}</span>}
      {info.pct > 0 && <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded-full font-bold">{t('{pct}% OFF', { pct: info.pct })}</span>}
    </div>
  );
}

const normalizeProducts = (rows) => rows
  .filter(r => r && typeof r === 'object' && r.id !== undefined && r.id !== null)
  .map(r => ({
    ...r,
    category: r.category ? String(r.category).trim() : '',
    brand: r.brand ? String(r.brand) : '',
    model: r.model ? String(r.model) : '',
    specs: r.specs ? String(r.specs) : '',
    unit: r.unit ? String(r.unit) : 'per NOS',
  }));

// Cart items are kept small: uploaded images are data URLs (up to ~1 MB) and
// would quickly fill localStorage, so those are looked up from the catalog.
const safeImg = (u) => (typeof u === 'string' && u && !u.startsWith('data:')) ? u : '';
const toCartItem = (p, qty) => ({
  id: p.id, category: p.category, brand: p.brand, model: p.model, unit: p.unit,
  price: p.price ?? null, discount_price: p.discount_price ?? null, show_price: p.show_price ?? 0,
  price_range: p.price_range ?? '', in_stock: p.in_stock, image_url: safeImg(p.image_url),
  qty: Math.max(1, parseInt(qty, 10) || 1),
});
const readCart = () => {
  try {
    const v = JSON.parse(localStorage.getItem('sologix_cart') || '[]');
    return Array.isArray(v) ? v.filter(i => i && typeof i === 'object' && i.id !== undefined && i.id !== null) : [];
  } catch { return []; }
};
const writeCart = (cart) => { try { localStorage.setItem('sologix_cart', JSON.stringify(cart)); } catch { /* storage full or blocked */ } };
// Refresh names/prices/stock from the live catalog and drop items that no longer exist.
const syncCart = (cart, fresh) => {
  const byId = new Map(fresh.map(p => [String(p.id), p]));
  const next = [];
  let removed = 0;
  cart.forEach(item => {
    const f = byId.get(String(item.id));
    if (!f) { removed++; return; }
    next.push(toCartItem(f, item.qty));
  });
  return { next, removed };
};

// Server replies are English; known ones have Hindi in the dictionary.
const NO_PRICE_SUFFIX = ' has no listed price. Please choose Pay on Delivery or request a quote.';
const serverMessage = (t, msg, fallback) => {
  if (typeof msg !== 'string' || !msg.trim()) return t(fallback);
  if (msg.endsWith(NO_PRICE_SUFFIX)) return t('{product} has no listed price. Please choose Pay on Delivery or request a quote.', { product: msg.slice(0, -NO_PRICE_SUFFIX.length) });
  return t(msg);
};

function ContactButtons({ t, text }) {
  const wa = whatsappHref(text);
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {BRANDING.phone && (
        <a href={telHref(BRANDING.phone)} className="bg-[#006948] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-[#004d34] transition-colors">
          📞 {t('Call {phone}', { phone: BRANDING.phone })}
        </a>
      )}
      {wa && (
        <a href={wa} target="_blank" rel="noopener noreferrer" className="bg-[#25D366] text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:opacity-90 transition-opacity">
          💬 {t('Chat on WhatsApp')}
        </a>
      )}
    </div>
  );
}

// Short spec lines ("580W · 21.5% efficiency · 25yr warranty" or the DB's comma form)
// are translated piece by piece; numbers/models without a Hindi entry stay as they are.
const SPEC_PATTERNS = [
  [/^([\d.]+%) efficiency$/i, '{value} efficiency'],
  [/^(\d+)\s?yrs? warranty$/i, '{value} year warranty'],
  [/^([\d,]+\+?) cycles$/i, '{value} cycles'],
];
const translateSpecs = (specs, t) => {
  if (!specs) return specs;
  return String(specs).split(/(\s·\s|,\s)/).map(part => {
    if (/^(\s·\s|,\s)$/.test(part)) return part;
    for (const [re, key] of SPEC_PATTERNS) { const m = part.match(re); if (m) return t(key, { value: m[1] }); }
    return t(part);
  }).join('');
};

export default function Products() {
  const { t } = useT();
  const [products, setProducts] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | ok | error
  const [apiCategories, setApiCategories] = useState(undefined); // undefined = loading, null = failed
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || ALL);
  const [brandFilter, setBrandFilter] = useState('');
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState(readCart);
  const [showCart, setShowCart] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ name:'', phone:'', email:'', company:'', notes:'' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderProduct, setOrderProduct] = useState(null);
  const [orderCartMode, setOrderCartMode] = useState(false); // true = ordering the whole cart
  const [orderForm, setOrderForm] = useState({ name:'', phone:'', email:'', address:'', qty:1, payment:'cod', notes:'' });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState(null);
  const cartSynced = useRef(false);

  useEffect(() => {
    const cat = searchParams.get('category') || ALL;
    setActiveCategory(cat);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchParams]);

  useEffect(() => { writeCart(cart); }, [cart]);

  const loadCatalog = useCallback(() => {
    setLoadState('loading');
    catalogAPI.getAll()
      .then(r => {
        const body = r && r.data;
        if (!body || !body.success || !Array.isArray(body.data)) throw new Error('bad response');
        const list = normalizeProducts(body.data);
        if (body.fallback) {
          // Server could not reach the database and sent its seed list: show it, but don't allow orders.
          setProducts(list.map(p => ({ ...p, _fallback: true })));
          setLoadState('error');
          return;
        }
        setProducts(list);
        setLoadState('ok');
      })
      .catch(() => { setProducts(FALLBACK_PRODUCTS); setLoadState('error'); });
    catalogAPI.getCategories()
      .then(r => {
        const data = r && r.data && r.data.data;
        setApiCategories(Array.isArray(data) ? uniq(data) : null);
      })
      .catch(() => setApiCategories(null));
  }, []);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  // Once the live catalog is in, refresh the saved cart against it.
  useEffect(() => {
    if (loadState !== 'ok' || cartSynced.current) return;
    cartSynced.current = true;
    const { next, removed } = syncCart(cart, products);
    setCart(next);
    if (removed === 1) toast(t('An item in your cart is no longer available and was removed.'));
    else if (removed > 1) toast(t('{count} items in your cart are no longer available and were removed.', { count: removed }));
  }, [loadState, products, cart, t]);

  const productsById = useMemo(() => new Map(products.map(p => [String(p.id), p])), [products]);

  // Categories: admin list from the API (display order) + any category a product uses.
  const categories = useMemo(() => {
    let base = [];
    if (Array.isArray(apiCategories)) base = apiCategories;
    else if (apiCategories === null && loadState !== 'ok') base = FALLBACK_CATEGORIES;
    return [ALL, ...uniq([...base, ...products.map(p => p.category)]).filter(c => c !== ALL)];
  }, [apiCategories, loadState, products]);

  const setCategory = useCallback((cat) => {
    if (cat === ALL) setSearchParams({});
    else setSearchParams({ category: cat });
    setBrandFilter('');
  }, [setSearchParams]);

  const filtered = products.filter(p => {
    const matchCat = activeCategory === ALL || p.category === activeCategory;
    const matchBrand = !brandFilter || p.brand === brandFilter;
    const matchSearch = !search || (p.brand+' '+p.model+' '+p.category+' '+(p.specs||'')).toLowerCase().includes(search.toLowerCase());
    return matchCat && matchBrand && matchSearch;
  });

  const uniqueBrands = uniq(
    products.filter(p => activeCategory === ALL || p.category === activeCategory).map(p => p.brand)
  );

  const canOrder = (p) => !!p && !p._fallback && inStock(p);

  const addToCart = (product) => {
    if (!canOrder(product)) return;
    setCart(prev => {
      const ex = prev.find(i => String(i.id) === String(product.id));
      if (ex) return prev.map(i => String(i.id) === String(product.id) ? { ...i, qty: (parseInt(i.qty, 10) || 0) + 1 } : i);
      return [...prev, toCartItem(product, 1)];
    });
    toast.success(t('{model} added to quote cart', { model: product.model }));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));
  const updateQty = (id, qty) => {
    if (qty < 1) { removeFromCart(id); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty } : i));
  };

  const submitQuote = async () => {
    if (!quoteForm.name || !quoteForm.phone) { toast.error(t('Name and phone required')); return; }
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
      writeCart([]);
    } catch { toast.error(t('Failed to submit. Please call us directly.')); }
    finally { setSubmitting(false); }
  };

  const totalItems = cart.reduce((s, i) => s + (parseInt(i.qty, 10) || 0), 0);

  const openOrder = (product) => {
    if (!canOrder(product)) return;
    setOrderProduct(product);
    setOrderCartMode(false);
    setOrderForm({ name:'', phone:'', email:'', address:'', qty:1, payment:'cod', notes:'' });
    setOrderDone(false);
    setPlacedOrderId(null);
    setShowOrderModal(true);
  };

  // Order everything in the cart in one go (checkout).
  const cartOrderable = cart.length > 0 && cart.every(i => canOrder(productsById.get(String(i.id))));
  // Total for the items that have a listed price; null when none do.
  const cartTotal = useMemo(() => {
    let sum = 0, priced = 0;
    cart.forEach(i => {
      const info = getPriceInfo(productsById.get(String(i.id)) || i);
      if (info.show) { sum += info.selling * (parseInt(i.qty, 10) || 0); priced += 1; }
    });
    return { sum, priced, unpriced: cart.length - priced };
  }, [cart, productsById]);
  const openCartOrder = () => {
    if (!cartOrderable) { toast.error(t('An item in your cart cannot be ordered right now. Remove it or request a quote instead.')); return; }
    setOrderProduct(null);
    setOrderCartMode(true);
    setOrderForm({ name:'', phone:'', email:'', address:'', qty:1, payment:'cod', notes:'' });
    setOrderDone(false);
    setPlacedOrderId(null);
    setShowCart(false);
    setShowOrderModal(true);
  };


  const launchRazorpay = async (orderData, customerDetails, items, onSuccess) => {
    // The key comes from the server (never hard-coded here).
    if (!orderData || !orderData.key_id || !orderData.order_id || typeof window.Razorpay !== 'function') {
      toast.error(t('Online payment is not available right now. Please choose Pay on Delivery or call us.'));
      return;
    }
    const options = {
      key: orderData.key_id,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
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
          if (result.success) { onSuccess(response.razorpay_payment_id, result.order_id); }
          else { toast.error(serverMessage(t, result.message, 'Payment verification failed. Contact support.')); }
        } catch { toast.error(t('Verification error. Please contact us.')); }
      },
      prefill: { name: customerDetails.name, email: customerDetails.email || '', contact: customerDetails.phone },
      theme: { color: '#006948' },
      modal: { ondismiss: () => toast(t('Payment cancelled')) },
    };
    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (r) => toast.error(t('Payment failed: {reason}', { reason: r.error?.description || t('Please try again') })));
      rzp.open();
    } catch { toast.error(t('Payment gateway error. Try COD or call us.')); }
  };

  const submitOrder = async () => {
    if (orderCartMode ? !cartOrderable : !canOrder(orderProduct)) return;
    if (!orderForm.name || !orderForm.phone || !orderForm.address) { toast.error(t('Name, phone and address required')); return; }
    const items = orderCartMode
      ? cart.map(i => ({ id: i.id, brand: i.brand, model: i.model, qty: parseInt(i.qty, 10) || 1, unit: i.unit }))
      : [{ id: orderProduct.id, brand: orderProduct.brand, model: orderProduct.model, qty: orderForm.qty, unit: orderProduct.unit }];
    const onPlaced = (id) => {
      setPlacedOrderId(id || null);
      setOrderDone(true);
      if (orderCartMode) setCart([]);      // the cart has become an order
    };
    setOrderSubmitting(true);
    try {
      if (orderForm.payment === 'online') {
        // The server prices the basket from the catalog; it replies with a
        // message (e.g. online payment disabled) when it can't take payment.
        const rpRes = await fetch(API_URL + '/payments/product-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: orderForm.name, phone: orderForm.phone, email: orderForm.email,
            address: orderForm.address, items,
            notes: orderForm.notes || '',
          }),
        });
        const rpData = await rpRes.json().catch(() => ({}));
        if (!rpRes.ok || !rpData.success || !rpData.data) { toast.error(serverMessage(t, rpData.message, 'Payment gateway error. Try COD or call us.')); setOrderSubmitting(false); return; }
        setOrderSubmitting(false);
        launchRazorpay(rpData.data, { name: orderForm.name, phone: orderForm.phone, email: orderForm.email }, items,
          (paymentId, orderId) => { onPlaced(orderId); toast.success(t('Payment successful! Order confirmed. Payment ID: {id}', { id: paymentId })); }
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
      const data = await res.json().catch(() => ({}));
      if (res.ok) { onPlaced(data && data.data && data.data.id); toast.success(t('Order placed! Team will confirm within 2 hours.')); }
      else {
        toast.error(serverMessage(t, data.message, 'Order failed. Please call us.'));
      }
    } catch { toast.error(t('Network error. Please call us.')); }
    finally { setOrderSubmitting(false); }
  };

  const clearFilters = () => { setCategory(ALL); setBrandFilter(''); setSearch(''); };

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="relative py-14 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600&h=400&fit=crop" alt={t('Products')} className="w-full h-full object-cover" loading="lazy" />
          <div className="absolute inset-0" data-theme-hero="1" style={{background:'linear-gradient(135deg,rgba(0,105,72,0.92) 0%,rgba(0,77,52,0.85) 100%)'}}></div>
        </div>
        <div className="relative z-10 max-w-[1280px] mx-auto px-6 lg:px-16">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
            <div>
              <p className="text-white/70 text-sm mb-1 uppercase tracking-widest">Sologix Energy</p>
              <h1 className="text-4xl font-bold mb-2">{t('Solar Product Catalog')}</h1>
              <p className="text-white/80">{t('Add to cart, request a quote, get the best price within 24 hours')}</p>
            </div>
            <button onClick={() => setShowCart(true)}
              className="relative bg-white/20 border border-white/40 text-white px-6 py-3 rounded-full font-semibold transition-all flex items-center gap-2 hover:bg-white/30">
              🛒 {t('Quote Cart')}
              {totalItems > 0 && <span className="bg-orange-500 text-xs px-2 py-0.5 rounded-full font-bold ml-1">{totalItems}</span>}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[['01','Browse Products','🔍'],['02','Add to Quote Cart','🛒'],['03','Get Best Price in 24h','💰'],['04','Confirm and Pay','✅']].map(([n,label,i]) => (
              <div key={n} className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center gap-3">
                <span className="text-2xl">{i}</span>
                <div><p className="text-white/50 text-xs">{t('Step {n}', { n })}</p><p className="text-white text-sm font-medium">{t(label)}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Authorised channel partner brands (Admin > Site Content) */}
      <ChannelPartners />

      {/* Sticky search bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16 py-3 flex items-center gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder={t('Search products, brands, specifications...')}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
          </div>
          <button onClick={() => setShowCart(true)}
            className="relative bg-[#006948] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#004d34] transition-colors">
            🛒 {totalItems > 0 ? <span className="bg-orange-500 text-xs px-1.5 py-0.5 rounded-full">{totalItems}</span> : t('Cart')}
          </button>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-16 py-8 flex gap-8">

        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 sticky top-20">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{t('Categories')}</p>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={"w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all mb-1 " +
                  (activeCategory === cat ? 'bg-[#006948] text-white' : 'text-gray-600 hover:bg-gray-50')}>
                <span className="flex-shrink-0">{catIcon(cat)}</span><span className="min-w-0 break-words">{t(cat)}</span>
              </button>
            ))}
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-5">{t('Filter by Brand')}</p>
            <button onClick={() => setBrandFilter('')}
              className={"w-full text-left px-3 py-1.5 rounded-lg text-sm mb-1 " + (!brandFilter ? 'bg-gray-100 font-semibold text-gray-800' : 'text-gray-500 hover:bg-gray-50')}>
              {t('All Brands')}
            </button>
            {uniqueBrands.map(b => (
              <button key={b} onClick={() => setBrandFilter(brandFilter === b ? '' : b)}
                className={"w-full text-left px-3 py-1.5 rounded-lg text-sm mb-1 transition-colors " +
                  (brandFilter === b ? 'bg-[#006948]/10 text-[#006948] font-semibold' : 'text-gray-500 hover:bg-gray-50')}>
                <span className="line-clamp-1">{b}</span>
              </button>
            ))}
            <div className="mt-5 bg-[#006948]/5 border border-[#006948]/20 rounded-xl p-3">
              <p className="text-xs font-bold text-[#006948] mb-1">{t('Can not find what you need?')}</p>
              <p className="text-xs text-gray-500 mb-2">{t('We can source any solar equipment for you.')}</p>
              <button onClick={() => { setShowQuoteModal(true); setSubmitted(false); }}
                className="w-full bg-[#006948] text-white text-xs py-2 rounded-lg font-semibold hover:bg-[#004d34] transition-colors">
                {t('Request Item')}
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Mobile category pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 lg:hidden scrollbar-hide">
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategory(cat)}
                className={"flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all " +
                  (activeCategory === cat ? 'bg-[#006948] text-white border-[#006948]' : 'bg-white border-gray-200 text-gray-600')}>
                {catIcon(cat)} {t(cat)}
              </button>
            ))}
          </div>

          {/* Brand carousel */}
          {uniqueBrands.length > 0 && <div className="flex gap-2 overflow-x-auto pb-2 mb-5 scrollbar-hide">
            {['All',...uniqueBrands].map(b => (
              <button key={b} onClick={() => setBrandFilter(b === 'All' ? '' : b)}
                className={"flex-shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-all " +
                  ((b === 'All' && !brandFilter) || brandFilter === b
                    ? 'bg-[#006948] text-white border-[#006948]'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-[#006948] hover:text-[#006948]')}>
                {b === 'All' ? t('All') : b}
              </button>
            ))}
          </div>}

          {/* Catalog could not be loaded: friendly message + direct contact */}
          {loadState === 'error' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-5 text-center">
              <p className="font-semibold text-gray-800 mb-1">{t('We could not load the latest products right now.')}</p>
              <p className="text-sm text-gray-600 mb-4">{t('Call or WhatsApp us and we will help you choose and order. Sample products are shown below; online ordering is paused until the catalog loads.')}</p>
              <ContactButtons t={t} text={t('Hi Sologix, I would like to know about your solar products.')} />
              <button onClick={loadCatalog} className="mt-3 text-xs text-[#006948] font-semibold hover:underline">↻ {t('Try again')}</button>
            </div>
          )}

          {loadState !== 'loading' && products.length > 0 && (
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-500"><span className="font-semibold text-gray-800">{filtered.length}</span> {t('products')}</p>
              {(activeCategory !== ALL || brandFilter || search) && (
                <button onClick={clearFilters}
                  className="text-xs text-[#006948] hover:underline">{t('Clear all filters')}</button>
              )}
            </div>
          )}

          {loadState === 'loading' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5" aria-busy="true" aria-label={t('Loading products...')}>
              {[0,1,2,3,4,5].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-100"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-3 w-1/3 bg-gray-100 rounded"></div>
                    <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                    <div className="h-3 w-full bg-gray-100 rounded"></div>
                    <div className="h-8 w-full bg-gray-100 rounded-xl mt-4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white rounded-2xl border border-gray-100">
              <p className="text-5xl mb-4">☀️</p>
              <p className="text-xl font-bold text-gray-800 mb-2">{t('Products coming soon')}</p>
              <p className="text-gray-500 text-sm mb-6">{t('We are updating our catalog. Call or WhatsApp us for prices and availability of any solar product.')}</p>
              <ContactButtons t={t} text={t('Hi Sologix, I would like to know about your solar products.')} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
              <p className="text-5xl mb-4">🔍</p>
              <p className="text-gray-500 mb-4">{t('No products match your filters.')}</p>
              <button onClick={clearFilters}
                className="bg-[#006948] text-white px-6 py-2.5 rounded-full text-sm font-semibold">{t('Show All Products')}</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(p => (
                <div key={p.id} className="bg-white rounded-2xl border border-gray-100 hover:border-[#006948]/40 hover:shadow-lg transition-all group flex flex-col overflow-hidden">
                  <div className="relative h-48 overflow-hidden bg-gray-50 cursor-pointer" onClick={() => navigate('/products/'+p.id)}>
                    <img src={p.image_url || DEFAULT_IMG}
                      alt={p.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy"
                      onError={e => { if (!e.currentTarget.src.endsWith(DEFAULT_IMG)) e.currentTarget.src = DEFAULT_IMG; }} />
                    {p.badge && <span className={"absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full font-bold shadow " + (BADGE_STYLE[p.badge] || 'bg-gray-100 text-gray-600')}>{t(p.badge)}</span>}
                    {!inStock(p) && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-bold text-sm bg-red-600 px-3 py-1 rounded-full">{t('Out of Stock')}</span></div>}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur text-xs px-2 py-1 rounded-full text-gray-600 font-medium border border-gray-100">{t(p.unit || 'per NOS')}</div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <p className="text-xs text-[#006948] font-semibold uppercase tracking-wider mb-1 line-clamp-1">{p.brand}</p>
                    <h3 className="font-bold text-gray-800 text-sm mb-1 cursor-pointer hover:text-[#006948] line-clamp-2" onClick={() => navigate('/products/'+p.id)}>{p.model}</h3>
                    <div className="flex-1 mb-3"><p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{translateSpecs(p.specs, t)}</p></div>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {['Authorised Seller','Pan India Delivery','Quality Assured'].map(b => (
                        <span key={b} className="text-xs bg-green-50 text-[#006948] border border-green-100 px-2 py-0.5 rounded-full">{t(b)}</span>
                      ))}
                    </div>
                    <div className="border-t border-gray-50 pt-3">
                      <div className="mb-3 min-h-[1.75rem]">
                        <PriceTag p={p} t={t} />
                      </div>
                      <div className="flex gap-2" title={p._fallback ? t('Online ordering is paused right now. Please call or WhatsApp us.') : undefined}>
                        <button onClick={() => addToCart(p)} disabled={!canOrder(p)}
                          className="flex-1 border border-[#006948] text-[#006948] py-2 rounded-xl text-xs font-semibold hover:bg-[#006948]/5 transition-colors disabled:opacity-40">
                          + {t('Quote')}
                        </button>
                        <button onClick={() => openOrder(p)} disabled={!canOrder(p)}
                          className="flex-1 bg-[#006948] text-white py-2 rounded-xl text-xs font-bold hover:bg-[#004d34] transition-colors disabled:opacity-40">
                          {t('Buy Now')}
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
          🛒 {t(totalItems > 1 ? 'View Quote Cart — {count} items' : 'View Quote Cart — {count} item', { count: totalItems })}
        </button>
      )}

      {/* Cart Drawer */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setShowCart(false)}></div>
          <div className="w-full max-w-md bg-white h-full overflow-y-auto flex flex-col shadow-2xl">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold">{t('Quote Cart ({count} items)', { count: totalItems })}</h2>
              <button onClick={() => setShowCart(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <p className="text-5xl mb-4">🛒</p>
                <p className="text-gray-500 mb-4">{t('Your quote cart is empty')}</p>
                <button onClick={() => setShowCart(false)} className="text-[#006948] font-semibold text-sm hover:underline">{t('Browse Products')}</button>
              </div>
            ) : (
              <>
                <div className="flex-1 p-4 space-y-3">
                  {cart.map(item => { const live = productsById.get(String(item.id)); return (
                    <div key={item.id} className="bg-gray-50 rounded-xl p-3 flex gap-3 items-start border border-gray-100">
                      <img src={(live && live.image_url) || item.image_url || DEFAULT_IMG} alt={item.model} className="w-16 h-14 object-cover rounded-lg flex-shrink-0"
                        onError={e => { if (!e.currentTarget.src.endsWith(DEFAULT_IMG)) e.currentTarget.src = DEFAULT_IMG; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[#006948] font-semibold truncate">{item.brand}</p>
                        <p className="text-sm font-bold text-gray-800 truncate">{item.model}</p>
                        <div className="mt-1"><PriceTag p={live || item} t={t} size="sm" /></div>
                        {!inStock(live || item) && <p className="text-xs text-red-600 font-semibold mt-1">{t('Out of Stock')}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => updateQty(item.id, item.qty-1)} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100">-</button>
                          <span className="text-sm font-semibold w-8 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item.id, item.qty+1)} className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center text-sm hover:bg-gray-100">+</button>
                          <span className="text-xs text-gray-400 ml-1">{t(item.unit)}</span>
                        </div>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-red-500 text-lg">x</button>
                    </div>
                  ); })}
                </div>
                <div className="p-4 border-t border-gray-100 sticky bottom-0 bg-white">
                  {cartTotal.priced > 0 && (
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-sm text-gray-500">{t('Total')}{cartTotal.unpriced > 0 ? ' (' + t('{count} items priced on request', { count: cartTotal.unpriced }) + ')' : ''}</span>
                      <span className="text-xl font-extrabold text-[#006948]">{fmtINR(cartTotal.sum)}</span>
                    </div>
                  )}
                  <button onClick={openCartOrder} disabled={!cartOrderable}
                    className="w-full bg-[#006948] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#004d34] transition-colors disabled:opacity-50">
                    🛒 {t('Place Order (Pay on Delivery / Online)')}
                  </button>
                  <button onClick={() => { setShowCart(false); setShowQuoteModal(true); setSubmitted(false); }}
                    className="w-full border-2 border-[#006948] text-[#006948] py-3 rounded-xl font-bold text-sm hover:bg-green-50 transition-colors mt-2">
                    {t('Request Best Price Instead')}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">{t('Best price guaranteed within 24 hours')}</p>
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
                <h2 className="text-xl font-bold mb-1">{cart.length > 0 ? t('Submit Quote Request') : t('Request an Item')}</h2>
                <p className="text-white/80 text-sm">{t('We respond with the best price within 24 hours')}</p>
              </div>
              <button onClick={() => setShowQuoteModal(false)} className="text-white/70 hover:text-white text-xl ml-4">x</button>
            </div>
            {submitted ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-[#006948] mb-2">{t('Quote Request Sent!')}</h3>
                <p className="text-gray-500 text-sm mb-6">{t('Our team will contact you within 24 hours with the best pricing for your requirements.')}</p>
                <button onClick={() => setShowQuoteModal(false)} className="bg-[#006948] text-white px-8 py-3 rounded-xl font-semibold">{t('Done')}</button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {cart.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-700 mb-2">{t('Items in your quote:')}</p>
                    {cart.map(i => <p key={i.id} className="text-xs text-gray-600">• {i.qty} x {i.brand} {i.model}</p>)}
                  </div>
                )}
                <input type="text" placeholder={t('Your Full Name *')} required value={quoteForm.name}
                  onChange={e => setQuoteForm(f => ({...f, name: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <input type="tel" placeholder={t('Phone / WhatsApp Number *')} required value={quoteForm.phone}
                  onChange={e => setQuoteForm(f => ({...f, phone: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <input type="email" placeholder={t('Email Address (optional)')} value={quoteForm.email}
                  onChange={e => setQuoteForm(f => ({...f, email: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <input type="text" placeholder={t('Company / Organisation (optional)')} value={quoteForm.company}
                  onChange={e => setQuoteForm(f => ({...f, company: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <textarea placeholder={t('Specific requirements, quantities, or any message...')} rows={3}
                  value={quoteForm.notes} onChange={e => setQuoteForm(f => ({...f, notes: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] resize-none" />
                <div className="flex gap-3">
                  <button onClick={() => setShowQuoteModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">{t('Cancel')}</button>
                  <button onClick={submitQuote} disabled={submitting}
                    className="flex-1 bg-[#006948] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#004d34] transition-colors disabled:opacity-60">
                    {submitting ? t('Sending...') : t('Submit Quote')}
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center">{t('Want to buy right away? Use "Place Order" in the cart — Pay on Delivery or secure online payment.')}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Direct Order Modal (one product, or the whole cart) ── */}
      {showOrderModal && (orderProduct || orderCartMode) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-[#006948] px-6 py-4 text-white flex justify-between items-center sticky top-0">
              <div>
                <h2 className="text-lg font-bold">{t('Place Order')}</h2>
                <p className="text-white/80 text-xs">
                  {orderCartMode
                    ? t('{count} items from your cart', { count: totalItems })
                    : orderProduct.brand + ' — ' + orderProduct.model}
                </p>
              </div>
              <button onClick={() => setShowOrderModal(false)} className="text-white/70 hover:text-white text-xl">✕</button>
            </div>
            {orderDone ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-[#006948] mb-2">{t('Order Placed!')}</h3>
                <p className="text-gray-500 text-sm mb-2">{t('Thank you! Our team will call you within 2 hours to confirm your order and delivery details.')}</p>
                {placedOrderId && (
                  <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 mb-4">
                    <p className="text-sm text-gray-700">{t('Your order number')}: <span className="font-extrabold text-[#006948]">#{placedOrderId}</span></p>
                    <p className="text-xs text-gray-500 mt-1">{t('Note it down — with it and your phone number you can check the order status any time.')}</p>
                    <Link to={'/track-order?id=' + placedOrderId} onClick={() => setShowOrderModal(false)}
                      className="inline-block mt-2 text-sm font-bold text-[#006948] hover:underline">
                      {t('Track your order')} →
                    </Link>
                  </div>
                )}
                <button onClick={() => setShowOrderModal(false)} className="bg-[#006948] text-white px-8 py-3 rounded-xl font-semibold">{t('Done')}</button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                {/* Order summary */}
                {orderCartMode ? (
                  <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-xs font-semibold text-gray-700 mb-2">{t('Items in your order:')}</p>
                    {cart.map(i => {
                      const info = getPriceInfo(productsById.get(String(i.id)) || i);
                      return (
                        <div key={i.id} className="flex justify-between gap-3 text-xs text-gray-600 py-0.5">
                          <span className="truncate">• {i.qty} × {i.brand} {i.model}</span>
                          {info.show && <span className="font-semibold text-gray-800 flex-shrink-0">{fmtINR(info.selling * (parseInt(i.qty, 10) || 0))}</span>}
                        </div>
                      );
                    })}
                    {cartTotal.priced > 0 && (
                      <div className="flex justify-between border-t border-gray-200 mt-2 pt-2 text-sm">
                        <span className="font-semibold text-gray-700">{t('Total')}{cartTotal.unpriced > 0 ? ' *' : ''}</span>
                        <span className="font-extrabold text-[#006948]">{fmtINR(cartTotal.sum)}</span>
                      </div>
                    )}
                    {cartTotal.unpriced > 0 && <p className="text-[11px] text-gray-400 mt-1">* {t('{count} items priced on request', { count: cartTotal.unpriced })} — {t('our team confirms the final amount by phone.')}</p>}
                  </div>
                ) : (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                  <img src={orderProduct.image_url || DEFAULT_IMG} alt={orderProduct.model} className="w-14 h-12 object-cover rounded-lg flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-[#006948] font-semibold">{orderProduct.brand}</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{orderProduct.model}</p>
                    <PriceTag p={orderProduct} t={t} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => setOrderForm(f => ({...f, qty: Math.max(1, f.qty-1)}))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold">-</button>
                    <span className="font-bold w-6 text-center">{orderForm.qty}</span>
                    <button onClick={() => setOrderForm(f => ({...f, qty: f.qty+1}))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold">+</button>
                  </div>
                </div>
                )}

                <input type="text" placeholder={t('Your Full Name *')} required value={orderForm.name}
                  onChange={e => setOrderForm(f => ({...f, name: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <input type="tel" placeholder={t('Phone / WhatsApp Number *')} required value={orderForm.phone}
                  onChange={e => setOrderForm(f => ({...f, phone: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <input type="email" placeholder={t('Email Address (for order confirmation)')} value={orderForm.email}
                  onChange={e => setOrderForm(f => ({...f, email: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <textarea placeholder={t('Delivery Address (full address with PIN code) *')} rows={3} required
                  value={orderForm.address} onChange={e => setOrderForm(f => ({...f, address: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] resize-none" />

                {/* Payment method */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">{t('Payment Method')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[['cod','💵', 'Pay on Delivery'],['online','💳', 'Online Payment']].map(([val,icon,label]) => (
                      <button key={val} onClick={() => setOrderForm(f => ({...f, payment: val}))}
                        className={"py-3 rounded-xl border-2 text-sm font-semibold transition-all " +
                          (orderForm.payment === val ? 'border-[#006948] bg-[#006948]/5 text-[#006948]' : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                        {icon} {t(label)}
                      </button>
                    ))}
                  </div>
                  {orderForm.payment === 'online' && (
                    <p className="text-xs text-orange-600 mt-2 bg-orange-50 rounded-lg px-3 py-2">
                      ⚡ {t('Online payment opens secure Razorpay checkout. If it is not available, choose Pay on Delivery and our team will confirm by phone.')}
                    </p>
                  )}
                </div>

                <textarea placeholder={t('Any special instructions or notes (optional)')} rows={2}
                  value={orderForm.notes} onChange={e => setOrderForm(f => ({...f, notes: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] resize-none" />

                <div className="flex gap-3">
                  <button onClick={() => setShowOrderModal(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50">{t('Cancel')}</button>
                  <button onClick={submitOrder} disabled={orderSubmitting}
                    className="flex-1 bg-[#006948] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#004d34] disabled:opacity-60 transition-colors">
                    {orderSubmitting ? t('Placing Order...') : t('Place Order') + ' →'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center">{t('Our team will call you within 2 hours to confirm.')}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
