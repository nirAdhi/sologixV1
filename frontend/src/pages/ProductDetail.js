import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { catalogAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { useT } from '../i18n';
import { BRANDING } from '../utils/branding';
import { whatsappHref, telHref } from '../utils/siteConfig';

const API_URL = process.env.REACT_APP_API_URL || '/api';
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop';
const onImgError = (e) => { if (!e.currentTarget.src.endsWith(DEFAULT_IMG)) e.currentTarget.src = DEFAULT_IMG; };

// OFFLINE FALLBACK ONLY: used when the catalog request fails. These ids do not
// exist in the database, so ordering and the quote cart are disabled for them.
const FALLBACK_PRODUCTS = [
  { id:1,  category:'Solar Panels',      brand:'Adani Solar',     model:'Mono PERC 580W',       unit:'per Wp',    specs:'580W · 21.5% efficiency · 25yr warranty · DCR certified', badge:'Best Seller', in_stock:1, image_url:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop', warranty:'25 Years', description:'The Adani Solar Mono PERC 580W is a premium DCR-certified solar panel designed for maximum energy yield in Indian conditions. Manufactured at Adani\'s Mundra facility, this panel features advanced PERC cell technology for superior performance even in low-light conditions.', specs_table:[['Power Output','580 Wp'],['Cell Type','Mono PERC'],['Efficiency','21.5%'],['Open Circuit Voltage (Voc)','49.5V'],['Short Circuit Current (Isc)','14.7A'],['Temperature Coefficient','−0.35%/°C'],['Dimensions','2278 × 1134 × 35mm'],['Weight','28.5 kg'],['Frame','Anodised Aluminium'],['Junction Box','IP68'],['Origin','DCR (India)'],['Warranty','25 Years Linear Output']] },
  { id:2,  category:'Solar Panels',      brand:'Tata Power Solar', model:'575W Mono',            unit:'per Wp',    specs:'575W · 21.8% efficiency · Tier-1', badge:'', in_stock:1, image_url:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=600&fit=crop', warranty:'25 Years', description:'Tata Power Solar 575W Mono panel — Tier-1 manufacturer with world-class quality control. Suitable for residential and commercial rooftop installations across India.', specs_table:[['Power Output','575 Wp'],['Cell Type','Mono PERC'],['Efficiency','21.8%'],['Warranty','25 Years']] },
  { id:3,  category:'Solar Panels',      brand:'Rayzon Solar',    model:'545W PERC',             unit:'per Wp',    specs:'545W · high-efficiency', badge:'', in_stock:1, image_url:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&h=600&fit=crop', warranty:'25 Years', description:'Rayzon Solar 545W PERC panels with high efficiency and strong build quality. Ideal for space-constrained installations.', specs_table:[['Power Output','545 Wp'],['Cell Type','Mono PERC'],['Warranty','25 Years']] },
  { id:4,  category:'Solar Panels',      brand:'ZEN Energy',      model:'590W TOPCon',           unit:'per Wp',    specs:'590W · TOPCon · better temp performance', badge:'New', in_stock:1, image_url:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=600&fit=crop', warranty:'30 Years', description:'ZEN Energy 590W TOPCon solar panel with next-generation cell technology for superior performance and lower degradation over time.', specs_table:[['Power Output','590 Wp'],['Cell Type','TOPCon'],['Efficiency','22.3%'],['Warranty','30 Years']] },
  { id:5,  category:'On-Grid Inverters', brand:'Deye',            model:'10kW On-Grid',          unit:'per NOS',   specs:'10kW · dual MPPT · WiFi monitoring', badge:'Best Seller', in_stock:1, image_url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', warranty:'5 Years', description:'Deye 10kW On-Grid Inverter — ideal for commercial and industrial rooftop installations. Features dual MPPT for maximum energy harvest and built-in WiFi monitoring.', specs_table:[['Rated Power','10 kW'],['Phase','Three Phase'],['MPPT Trackers','2'],['Max DC Voltage','1000V'],['Efficiency','98.4%'],['Communication','WiFi / RS485'],['Protection','IP65'],['Warranty','5 Years']] },
  { id:6,  category:'On-Grid Inverters', brand:'Growatt',         model:'5kW On-Grid',           unit:'per NOS',   specs:'5kW · reliable · cost-effective', badge:'', in_stock:1, image_url:'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=600&fit=crop', warranty:'5 Years', description:'Growatt 5kW On-Grid inverter — trusted globally with millions of units installed. Reliable, cost-effective, and easy to install.', specs_table:[['Rated Power','5 kW'],['Phase','Single Phase'],['Warranty','5 Years']] },
  { id:7,  category:'On-Grid Inverters', brand:'Microtek',        model:'3kW Solar Inverter',    unit:'per NOS',   specs:'3kW · user-friendly · homes', badge:'', in_stock:1, image_url:'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=800&h=600&fit=crop', warranty:'5 Years', description:'Microtek 3kW Solar Inverter — perfect for residential homes and small businesses. User-friendly interface with local after-sales support.', specs_table:[['Rated Power','3 kW'],['Phase','Single Phase'],['Warranty','5 Years']] },
  { id:8,  category:'Hybrid Inverters',  brand:'LuxPower',        model:'6kW Hybrid',            unit:'per NOS',   specs:'6kW · battery ready · UPS backup', badge:'Popular', in_stock:1, image_url:'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=800&h=600&fit=crop', warranty:'5 Years', description:'LuxPower 6kW Hybrid Inverter — combine solar, battery, and grid in one unit. UPS-level backup switching for uninterrupted power.', specs_table:[['Rated Power','6 kW'],['Type','Hybrid (Solar + Battery + Grid)'],['Battery Voltage','48V'],['Switch Time','< 20ms'],['Warranty','5 Years']] },
  { id:9,  category:'Hybrid Inverters',  brand:'LuxPower',        model:'12kW Hybrid',           unit:'per NOS',   specs:'12kW · commercial · remote monitoring', badge:'', in_stock:1, image_url:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=600&fit=crop', warranty:'5 Years', description:'LuxPower 12kW Hybrid Inverter for commercial applications. Three-phase output with remote monitoring capability.', specs_table:[['Rated Power','12 kW'],['Phase','Three Phase'],['Warranty','5 Years']] },
  { id:10, category:'Hybrid Inverters',  brand:'Deye',            model:'8kW Hybrid',            unit:'per NOS',   specs:'8kW · dual battery bank · generator support', badge:'', in_stock:1, image_url:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop', warranty:'5 Years', description:'Deye 8kW Hybrid with dual battery bank support and generator backup. Ideal for areas with frequent power cuts.', specs_table:[['Rated Power','8 kW'],['Battery Banks','2 (parallel)'],['Generator Input','Yes'],['Warranty','5 Years']] },
  { id:11, category:'Lithium Batteries', brand:'Bi-Tech',         model:'5 kWh LiFePO4',         unit:'per NOS',   specs:'5 kWh · 6000+ cycles · compact', badge:'Best Seller', in_stock:1, image_url:'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&h=600&fit=crop', warranty:'10 Years', description:'Bi-Tech 5 kWh LiFePO4 battery — 6000+ charge cycles with built-in BMS. Safe, reliable, and compact for residential energy storage.', specs_table:[['Capacity','5 kWh'],['Chemistry','LiFePO4'],['Cycle Life','6000+ cycles'],['Depth of Discharge','95%'],['Communication','CAN / RS485'],['Warranty','10 Years']] },
  { id:12, category:'Lithium Batteries', brand:'Solis',           model:'5 kWh Storage',         unit:'per NOS',   specs:'5 kWh · smart BMS · hybrid compatible', badge:'', in_stock:1, image_url:'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=600&fit=crop', warranty:'10 Years', description:'Solis 5kWh storage battery with smart BMS. Compatible with most hybrid inverters.', specs_table:[['Capacity','5 kWh'],['Warranty','10 Years']] },
  { id:13, category:'Lithium Batteries', brand:'Bi-Tech',         model:'10 kWh LiFePO4',        unit:'per NOS',   specs:'10 kWh · high capacity', badge:'', in_stock:1, image_url:'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=800&h=600&fit=crop', warranty:'10 Years', description:'Bi-Tech 10 kWh LiFePO4 for larger residential or commercial energy storage needs.', specs_table:[['Capacity','10 kWh'],['Warranty','10 Years']] },
  { id:14, category:'BOS & Accessories', brand:'Sologix',         model:'AC Distribution Box',   unit:'per NOS',   specs:'4-way · IP65 · 32A MCB', badge:'', in_stock:1, image_url:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=800&h=600&fit=crop', warranty:'1 Year', description:'Sologix AC Distribution Box — 4-way IP65 rated with 32A MCB. Suitable for on-grid and hybrid installations.', specs_table:[['Ways','4'],['Protection','IP65'],['MCB Rating','32A'],['Warranty','1 Year']] },
  { id:15, category:'BOS & Accessories', brand:'Sologix',         model:'DC Junction Box',       unit:'per NOS',   specs:'IP67 · 6-string · anti-reverse', badge:'', in_stock:1, image_url:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=800&h=600&fit=crop', warranty:'1 Year', description:'Sologix DC Junction Box — IP67 with 6-string input and anti-reverse diodes.', specs_table:[['Strings','6'],['Protection','IP67'],['Warranty','1 Year']] },
  { id:16, category:'BOS & Accessories', brand:'Sologix',         model:'Mounting Structure RCC', unit:'per NOS',  specs:'GI hot-dip galvanised · adjustable tilt', badge:'', in_stock:1, image_url:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop', warranty:'5 Years', description:'Sologix RCC rooftop mounting structure — GI hot-dip galvanised with adjustable tilt for optimal solar angle.', specs_table:[['Material','GI Hot-Dip Galvanised'],['Roof Type','RCC Flat Roof'],['Warranty','5 Years']] },
  { id:17, category:'BOS & Accessories', brand:'Sologix',         model:'Solar DC Cable 4mm',    unit:'per metre', specs:'TUV certified · UV resistant', badge:'', in_stock:1, image_url:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&h=600&fit=crop', warranty:'1 Year', description:'Sologix 4mm2 TUV certified DC cable — UV resistant and double insulated for outdoor solar installations.', specs_table:[['Cross Section','4 mm2'],['Rating','TUV Certified'],['Insulation','Double (UV resistant)'],['Warranty','1 Year']] },
].map(p => ({ ...p, _fallback: true }));

// ── Catalog helpers (same rules as pages/Products.js) ───────────────────────
const toNum = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
const isOn = (v) => v === true || toNum(v) > 0;
const inStock = (p) => (p && (p.in_stock === undefined || p.in_stock === null)) ? true : isOn(p && p.in_stock);
const BARE_NUMBER = /^\s*(?:₹|rs\.?)?\s*[\d,]+(?:\.\d+)?\s*$/i;
const fmtINR = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });

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

// Cart items stay small (uploaded images are ~1 MB data URLs and would fill localStorage).
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

export default function ProductDetail() {
  const { t } = useT();
  const { id } = useParams();
  const navigate = useNavigate();
  const [allProducts, setAllProducts] = useState([]);
  const [loadState, setLoadState] = useState('loading'); // loading | ok | error
  const [cart, setCart] = useState(readCart);
  const [showQuote, setShowQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ name:'', phone:'', email:'', notes:'' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({ name:'', phone:'', email:'', address:'', qty:1, payment:'cod', notes:'' });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderDone, setOrderDone] = useState(false);
  const cartSynced = useRef(false);

  const loadCatalog = useCallback(() => {
    setLoadState('loading');
    catalogAPI.getAll()
      .then(r => {
        const body = r && r.data;
        if (!body || !body.success || !Array.isArray(body.data)) throw new Error('bad response');
        const list = normalizeProducts(body.data);
        if (body.fallback) { setAllProducts(list.map(p => ({ ...p, _fallback: true }))); setLoadState('error'); return; }
        setAllProducts(list);
        setLoadState('ok');
      })
      .catch(() => { setAllProducts(FALLBACK_PRODUCTS); setLoadState('error'); });
  }, []);

  useEffect(() => { loadCatalog(); }, [loadCatalog]);

  useEffect(() => {
    window.scrollTo(0, 0);
    setShowOrder(false); setShowQuote(false);
    setOrderForm(f => ({ ...f, qty: 1 }));
  }, [id]);

  useEffect(() => { writeCart(cart); }, [cart]);

  // Once the live catalog is in, refresh the saved cart against it.
  useEffect(() => {
    if (loadState !== 'ok' || cartSynced.current) return;
    cartSynced.current = true;
    const { next, removed } = syncCart(cart, allProducts);
    setCart(next);
    if (removed === 1) toast(t('An item in your cart is no longer available and was removed.'));
    else if (removed > 1) toast(t('{count} items in your cart are no longer available and were removed.', { count: removed }));
  }, [loadState, allProducts, cart, t]);

  const product = allProducts.find(p => String(p.id) === String(id));

  if (loadState === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" aria-busy="true">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#006948] mx-auto mb-4"></div>
        <p className="text-sm text-gray-500">{t('Loading product...')}</p>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="text-center max-w-md">
        <p className="text-5xl mb-4">{loadState === 'error' ? '📡' : '😕'}</p>
        {loadState === 'error' ? (
          <>
            <p className="text-gray-800 font-semibold mb-2">{t('We could not load this product right now.')}</p>
            <p className="text-gray-500 text-sm mb-5">{t('Call or WhatsApp us and we will help you choose and order.')}</p>
            <ContactButtons t={t} text={t('Hi Sologix, I would like to know about your solar products.')} />
            <button onClick={loadCatalog} className="block mx-auto mt-4 text-sm text-[#006948] font-semibold hover:underline">↻ {t('Try again')}</button>
          </>
        ) : (
          <p className="text-gray-500 mb-4">{t('Product not found')}</p>
        )}
        <Link to="/products" className="inline-block mt-4 bg-[#006948] text-white px-6 py-3 rounded-full font-semibold">{t('Back to Products')}</Link>
      </div>
    </div>
  );

  const related = allProducts.filter(p => p.category === product.category && String(p.id) !== String(product.id)).slice(0, 4);
  const inCart = cart.find(i => String(i.id) === String(product.id));
  const canOrder = !product._fallback && inStock(product);
  const priceInfo = getPriceInfo(product);
  const specsTable = Array.isArray(product.specs_table)
    ? product.specs_table.filter(row => Array.isArray(row) && row.length >= 2 && row[0] !== undefined && row[0] !== null && row[0] !== '')
    : [];

  const addToCart = () => {
    if (!canOrder) return;
    setCart(prev => {
      const ex = prev.find(i => String(i.id) === String(product.id));
      if (ex) return prev.map(i => String(i.id) === String(product.id) ? {...i, qty: (parseInt(i.qty, 10) || 0) + 1} : i);
      return [...prev, toCartItem(product, 1)];
    });
    toast.success(t('{model} added to quote cart', { model: product.model }));
  };

  const submitQuote = async () => {
    if (!quoteForm.name || !quoteForm.phone) { toast.error(t('Name and phone required')); return; }
    setSubmitting(true);
    try {
      await fetch(API_URL + '/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: quoteForm.name, phone: quoteForm.phone, email: quoteForm.email,
          service_interest: 'Product Enquiry: ' + product.brand + ' ' + product.model,
          message: 'Direct product enquiry for ' + product.brand + ' ' + product.model + (quoteForm.notes ? '. Notes: ' + quoteForm.notes : ''),
          source: 'product_quote', priority: 'high',
        }),
      });
      setSubmitted(true);
      toast.success(t('Enquiry submitted! We will contact you within 24 hours.'));
    } catch { toast.error(t('Failed to submit. Please call us.')); }
    finally { setSubmitting(false); }
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
          if (result.success) { onSuccess(response.razorpay_payment_id); }
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
    } catch { toast.error(t('Payment gateway error. Try COD.')); }
  };

  const submitOrder = async () => {
    if (!canOrder) return;
    if (!orderForm.name || !orderForm.phone || !orderForm.address) { toast.error(t('Name, phone and address required')); return; }
    const items = [{ id: product.id, brand: product.brand, model: product.model, qty: orderForm.qty, unit: product.unit }];
    setOrderSubmitting(true);
    try {
      if (orderForm.payment === 'online') {
        const rpRes = await fetch(API_URL + '/payments/product-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: orderForm.name, phone: orderForm.phone, email: orderForm.email, address: orderForm.address, items, notes: orderForm.notes || '' }),
        });
        const rpData = await rpRes.json().catch(() => ({}));
        if (!rpRes.ok || !rpData.success || !rpData.data) { toast.error(serverMessage(t, rpData.message, 'Payment gateway error. Try COD.')); setOrderSubmitting(false); return; }
        setOrderSubmitting(false);
        launchRazorpay(rpData.data, { name: orderForm.name, phone: orderForm.phone, email: orderForm.email }, items,
          (paymentId) => { setOrderDone(true); toast.success(t('Payment confirmed! ID: {id}', { id: paymentId })); }
        );
        return;
      }
      const res = await fetch(API_URL + '/product-orders', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: orderForm.name, phone: orderForm.phone, email: orderForm.email, address: orderForm.address, items, notes: 'Pay on Delivery. ' + (orderForm.notes||''), customer_type: 'direct_order', status: 'pending' }),
      });
      if (res.ok) { setOrderDone(true); toast.success(t('Order placed! Team confirms within 2 hours.')); }
      else {
        const data = await res.json().catch(() => ({}));
        toast.error(serverMessage(t, data.message, 'Order failed. Please call us.'));
      }
    } catch { toast.error(t('Network error.')); }
    finally { setOrderSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16 py-3 flex items-center gap-2 text-sm text-gray-500 overflow-hidden whitespace-nowrap">
          <Link to="/" className="hover:text-[#006948]">{t('Home')}</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-[#006948]">{t('Products')}</Link>
          <span>/</span>
          <Link to={'/products?category=' + encodeURIComponent(product.category)} className="hover:text-[#006948]">{t(product.category)}</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium truncate min-w-0">{product.model}</span>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-16 py-10">
        {loadState === 'error' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 text-center">
            <p className="font-semibold text-gray-800 mb-1">{t('We could not load the latest product details right now.')}</p>
            <p className="text-sm text-gray-600 mb-4">{t('Details below may be out of date and online ordering is paused. Call or WhatsApp us to order.')}</p>
            <ContactButtons t={t} text={t('Hi Sologix, I would like to know about {product}.', { product: product.brand + ' ' + product.model })} />
            <button onClick={loadCatalog} className="mt-3 text-xs text-[#006948] font-semibold hover:underline">↻ {t('Try again')}</button>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left: Image */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden aspect-[4/3] shadow-sm">
              <img src={product.image_url || DEFAULT_IMG}
                alt={product.model} className="w-full h-full object-cover" loading="lazy" onError={onImgError} />
            </div>
            {/* Trust badges */}
            <div className="flex gap-3 mt-4 flex-wrap">
              {[['🏅','Authorised Seller'],['🚚','Pan India Delivery'],['✅','Quality Assured'],['📋','Datasheet Available']].map(([i,label]) => (
                <div key={label} className="flex items-center gap-1.5 bg-white border border-gray-100 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm">
                  <span>{i}</span>{t(label)}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Info */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold text-[#006948] uppercase tracking-widest">{product.brand}</span>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-400">{t(product.category)}</span>
              {product.badge && <span className="ml-auto bg-[#006948] text-white text-xs px-2.5 py-1 rounded-full font-bold">{t(product.badge)}</span>}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4 break-words">{product.model}</h1>

            {/* Warranty badge */}
            {product.warranty && (
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-[#006948] px-4 py-2 rounded-full text-sm font-semibold mb-6">
                🏆 {t('{warranty} Warranty', { warranty: t(product.warranty) })}
              </div>
            )}

            {(product.description || product.specs) && (
              <p className="text-gray-600 leading-relaxed mb-6 whitespace-pre-line break-words">{product.description ? t(product.description) : translateSpecs(product.specs, t)}</p>
            )}

            {/* Price section */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="min-w-0">
                  {priceInfo.show ? (
                    <>
                      <p className="text-xs text-gray-400 mb-1">{t('Price')}</p>
                      <div className="flex items-baseline gap-x-2 gap-y-1 flex-wrap">
                        <span className="text-3xl font-bold text-[#006948]">{fmtINR(priceInfo.selling)}</span>
                        <span className="text-sm text-gray-500">{t(product.unit || 'per NOS')}</span>
                        {priceInfo.original && <span className="text-sm text-gray-400 line-through">{fmtINR(priceInfo.original)}</span>}
                        {priceInfo.pct > 0 && <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full font-bold">{t('{pct}% OFF', { pct: priceInfo.pct })}</span>}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-gray-400 mb-1">{t('Estimated Price ({unit})', { unit: t(product.unit || 'per NOS') })}</p>
                      <p className="text-lg font-semibold text-gray-700 break-words">{t(priceInfo.text)}</p>
                    </>
                  )}
                </div>
                <div className="text-right flex-shrink-0 pl-3">
                  <p className={'text-xs font-semibold ' + (inStock(product) ? 'text-[#006948]' : 'text-red-600')}>{inStock(product) ? '✅ ' + t('In Stock') : '❌ ' + t('Out of Stock')}</p>
                  <p className="text-xs text-gray-400">{t('Ships pan India')}</p>
                </div>
              </div>
              <div className="flex gap-3 mb-2">
                <button onClick={() => { setShowOrder(true); setOrderDone(false); }}
                  className="flex-1 bg-[#006948] text-white py-3.5 rounded-xl font-bold hover:bg-[#004d34] transition-colors disabled:opacity-40" disabled={!canOrder}>
                  🛒 {t('Buy Now')}
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={addToCart} disabled={!canOrder}
                  className="flex-1 border-2 border-[#006948] text-[#006948] py-3.5 rounded-xl font-bold hover:bg-[#006948]/5 transition-colors disabled:opacity-40">
                  {inCart ? '✓ ' + t('In Quote Cart') : '+ ' + t('Add to Quote Cart')}
                </button>
                <button onClick={() => { setShowQuote(true); setSubmitted(false); }}
                  className="flex-1 border-2 border-gray-200 text-gray-600 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition-colors">
                  {t('Get Best Price')}
                </button>
              </div>
            </div>

            {/* 4-step journey */}
            <div className="grid grid-cols-2 gap-2">
              {[['1','Add to Cart','🛒'],['2','Submit Quote','📋'],['3','Get Price 24h','💰'],['4','Pay & Deliver','🚚']].map(([n,label,i]) => (
                <div key={n} className="bg-white border border-gray-100 rounded-xl p-3 flex items-center gap-2">
                  <span className="text-lg">{i}</span>
                  <div><p className="text-xs text-gray-400">{t('Step {n}', { n })}</p><p className="text-xs font-semibold text-gray-700">{t(label)}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Specs table */}
        {specsTable.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-12 shadow-sm">
            <div className="bg-[#006948] px-6 py-4">
              <h2 className="text-white font-bold text-lg">{t('Technical Specifications')}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {specsTable.map(([label, value], i) => (
                    <tr key={String(label) + i} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-600 w-1/2">{t(String(label))}</td>
                      <td className="px-6 py-3 text-sm text-gray-800 font-medium">{t(String(value ?? ''))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Related products */}
        {related.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{t('More from {category}', { category: t(product.category) })}</h2>
              <Link to={'/products?category=' + encodeURIComponent(product.category)} className="text-[#006948] text-sm font-semibold hover:underline">{t('View All')} →</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map(p => (
                <div key={p.id} onClick={() => navigate('/products/'+p.id)}
                  className="bg-white rounded-xl border border-gray-100 hover:border-[#006948]/30 hover:shadow-md transition-all cursor-pointer overflow-hidden group">
                  <div className="h-36 overflow-hidden">
                    <img src={p.image_url || DEFAULT_IMG} alt={p.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onError={onImgError} />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-[#006948] font-semibold truncate">{p.brand}</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{p.model}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{translateSpecs(p.specs, t)}</p>
                    {(() => { const pi = getPriceInfo(p); return pi.show ? (
                      <div className="flex items-baseline gap-1.5 flex-wrap mt-2">
                        <span className="text-sm font-bold text-[#006948]">{fmtINR(pi.selling)}</span>
                        <span className="text-xs text-gray-500">{t(p.unit || 'per NOS')}</span>
                        {pi.original && <span className="text-xs text-gray-400 line-through">{fmtINR(pi.original)}</span>}
                        {pi.pct > 0 && <span className="text-xs text-red-600 font-bold">{t('{pct}% OFF', { pct: pi.pct })}</span>}
                      </div>
                    ) : <p className="text-xs text-gray-500 mt-2 truncate">{t(pi.text)}</p>; })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quote enquiry modal */}
      {showQuote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="bg-[#006948] px-6 py-5 text-white flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold mb-1">{t('Get Best Price')}</h2>
                <p className="text-white/80 text-sm">{product.brand} {product.model}</p>
              </div>
              <button onClick={() => setShowQuote(false)} className="text-white/70 hover:text-white text-xl">x</button>
            </div>
            {submitted ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-[#006948] mb-2">{t('Enquiry Sent!')}</h3>
                <p className="text-gray-500 text-sm mb-6">{t('Our team will call you within 24 hours with the best price.')}</p>
                <button onClick={() => setShowQuote(false)} className="bg-[#006948] text-white px-8 py-3 rounded-xl font-semibold">{t('Done')}</button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                  <img src={product.image_url || DEFAULT_IMG} alt={product.model} className="w-12 h-10 object-cover rounded-lg" onError={onImgError} />
                  <div><p className="text-xs text-[#006948] font-semibold">{product.brand}</p><p className="text-sm font-bold">{product.model}</p></div>
                </div>
                <input type="text" placeholder={t('Your Full Name *')} required value={quoteForm.name}
                  onChange={e => setQuoteForm(f => ({...f, name: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <input type="tel" placeholder={t('Phone / WhatsApp *')} required value={quoteForm.phone}
                  onChange={e => setQuoteForm(f => ({...f, phone: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <input type="email" placeholder={t('Email (optional)')} value={quoteForm.email}
                  onChange={e => setQuoteForm(f => ({...f, email: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <textarea placeholder={t('Quantity needed, installation location, or any other requirements...')} rows={3}
                  value={quoteForm.notes} onChange={e => setQuoteForm(f => ({...f, notes: e.target.value}))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] resize-none" />
                <div className="flex gap-3">
                  <button onClick={() => setShowQuote(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium">{t('Cancel')}</button>
                  <button onClick={submitQuote} disabled={submitting}
                    className="flex-1 bg-[#006948] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#004d34] transition-colors disabled:opacity-60">
                    {submitting ? t('Sending...') : t('Get Best Price')}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Direct Order Modal */}
      {showOrder && product && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="bg-[#006948] px-6 py-4 text-white flex justify-between items-center sticky top-0">
              <div>
                <h2 className="text-lg font-bold">{t('Place Order')}</h2>
                <p className="text-white/80 text-xs">{product.brand} — {product.model}</p>
              </div>
              <button onClick={() => setShowOrder(false)} className="text-white/70 hover:text-white text-xl">✕</button>
            </div>
            {orderDone ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-xl font-bold text-[#006948] mb-2">{t('Order Placed!')}</h3>
                <p className="text-gray-500 text-sm mb-6">{t('Our team will call you within 2 hours to confirm delivery details.')}</p>
                <button onClick={() => setShowOrder(false)} className="bg-[#006948] text-white px-8 py-3 rounded-xl font-semibold">{t('Done')}</button>
              </div>
            ) : (
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 flex items-center gap-3">
                  <img src={product.image_url || DEFAULT_IMG} alt={product.model} className="w-14 h-12 object-cover rounded-lg" onError={onImgError} />
                  <div className="flex-1">
                    <p className="text-xs text-[#006948] font-semibold">{product.brand}</p>
                    <p className="text-sm font-bold">{product.model}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setOrderForm(f => ({...f, qty: Math.max(1, f.qty-1)}))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100">-</button>
                    <span className="font-bold w-6 text-center">{orderForm.qty}</span>
                    <button onClick={() => setOrderForm(f => ({...f, qty: f.qty+1}))} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100">+</button>
                  </div>
                </div>
                <input type="text" placeholder={t('Full Name *')} required value={orderForm.name} onChange={e => setOrderForm(f => ({...f, name: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <input type="tel" placeholder={t('Phone / WhatsApp *')} required value={orderForm.phone} onChange={e => setOrderForm(f => ({...f, phone: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <input type="email" placeholder={t('Email (for confirmation)')} value={orderForm.email} onChange={e => setOrderForm(f => ({...f, email: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                <textarea placeholder={t('Delivery Address with PIN code *')} rows={3} required value={orderForm.address} onChange={e => setOrderForm(f => ({...f, address: e.target.value}))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] resize-none" />
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">{t('Payment')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[['cod','💵', 'Pay on Delivery'],['online','💳', 'Online Payment']].map(([val,icon,label]) => (
                      <button key={val} onClick={() => setOrderForm(f => ({...f, payment: val}))}
                        className={"py-3 rounded-xl border-2 text-sm font-semibold transition-all " + (orderForm.payment === val ? 'border-[#006948] bg-[#006948]/5 text-[#006948]' : 'border-gray-200 text-gray-600')}>
                        {icon} {t(label)}
                      </button>
                    ))}
                  </div>
                  {orderForm.payment === 'online' && <p className="text-xs text-orange-600 mt-2 bg-orange-50 rounded-lg px-3 py-2">⚡ {t('Online payment opens secure Razorpay checkout. If it is not available, choose Pay on Delivery and our team will confirm by phone.')}</p>}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setShowOrder(false)} className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium">{t('Cancel')}</button>
                  <button onClick={submitOrder} disabled={orderSubmitting} className="flex-1 bg-[#006948] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#004d34] disabled:opacity-60 transition-colors">
                    {orderSubmitting ? t('Placing...') : t('Place Order') + ' →'}
                  </button>
                </div>
                <p className="text-xs text-gray-400 text-center">{t('We will call you within 2 hours to confirm.')}</p>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
