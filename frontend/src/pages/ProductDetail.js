import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { catalogAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { useT } from '../i18n';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const STATIC = [
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
];

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
  const [allProducts, setAllProducts] = useState(STATIC);
  const [cart, setCart] = useState(() => { try { return JSON.parse(localStorage.getItem('sologix_cart')||'[]'); } catch { return []; } });
  const [showQuote, setShowQuote] = useState(false);
  const [quoteForm, setQuoteForm] = useState({ name:'', phone:'', email:'', notes:'' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showOrder, setShowOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({ name:'', phone:'', email:'', address:'', qty:1, payment:'cod', notes:'' });
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderDone, setOrderDone] = useState(false);

  useEffect(() => {
    catalogAPI.getAll().then(r => { if (r.data.success && r.data.data?.length) setAllProducts(r.data.data); }).catch(()=>{});
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => { localStorage.setItem('sologix_cart', JSON.stringify(cart)); }, [cart]);

  const product = allProducts.find(p => String(p.id) === String(id));

  if (!product) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-5xl mb-4">😕</p>
        <p className="text-gray-500 mb-4">{t('Product not found')}</p>
        <button onClick={() => navigate('/products')} className="bg-[#006948] text-white px-6 py-3 rounded-full font-semibold">{t('Back to Products')}</button>
      </div>
    </div>
  );

  const related = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const inCart = cart.find(i => i.id === product.id);

  const addToCart = () => {
    setCart(prev => {
      const ex = prev.find(i => i.id === product.id);
      if (ex) return prev.map(i => i.id === product.id ? {...i, qty: i.qty+1} : i);
      return [...prev, {...product, qty: 1}];
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
          else { toast.error(t('Payment verification failed. Contact support.')); }
        } catch { toast.error(t('Verification error. Please contact us.')); }
      },
      prefill: { name: customerDetails.name, email: customerDetails.email || '', contact: customerDetails.phone },
      theme: { color: '#006948' },
      modal: { ondismiss: () => toast(t('Payment cancelled')) },
    };
    const rzp = new window.Razorpay(options);
    rzp.on('payment.failed', (r) => toast.error(t('Payment failed: {reason}', { reason: r.error?.description || t('Please try again') })));
    rzp.open();
  };

  const getPrice = (p) => {
    if (p.price && Number(p.price) > 0) return Number(p.price);
    if (p.price_range && !isNaN(Number(p.price_range)) && Number(p.price_range) > 0) return Number(p.price_range);
    return null;
  };

  const submitOrder = async () => {
    if (!orderForm.name || !orderForm.phone || !orderForm.address) { toast.error(t('Name, phone and address required')); return; }
    const items = [{ id: product.id, brand: product.brand, model: product.model, qty: orderForm.qty, unit: product.unit }];
    setOrderSubmitting(true);
    try {
      if (orderForm.payment === 'online') {
        const rpRes = await fetch(API_URL + '/payments/product-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: orderForm.name, phone: orderForm.phone, email: orderForm.email, address: orderForm.address, items, amount_paise: 100, notes: orderForm.notes || '' }),
        });
        const rpData = await rpRes.json();
        if (!rpData.success) { toast.error(t('Payment gateway error. Try COD.')); setOrderSubmitting(false); return; }
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
      else toast.error(t('Order failed. Please call us.'));
    } catch { toast.error(t('Network error.')); }
    finally { setOrderSubmitting(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link to="/" className="hover:text-[#006948]">{t('Home')}</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-[#006948]">{t('Products')}</Link>
          <span>/</span>
          <Link to={'/products?category=' + encodeURIComponent(product.category)} className="hover:text-[#006948]">{t(product.category)}</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">{product.model}</span>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto px-6 lg:px-16 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left: Image */}
          <div>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden aspect-[4/3] shadow-sm">
              <img src={product.image_url || 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=600&fit=crop'}
                alt={product.model} className="w-full h-full object-cover" loading="lazy" />
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
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{product.model}</h1>

            {/* Warranty badge */}
            {product.warranty && (
              <div className="inline-flex items-center gap-2 bg-green-50 border border-green-100 text-[#006948] px-4 py-2 rounded-full text-sm font-semibold mb-6">
                🏆 {t('{warranty} Warranty', { warranty: t(product.warranty) })}
              </div>
            )}

            <p className="text-gray-600 leading-relaxed mb-6">{product.description ? t(product.description) : translateSpecs(product.specs, t)}</p>

            {/* Price section */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{t('Estimated Price ({unit})', { unit: t(product.unit || 'per NOS') })}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-gray-200 select-none" style={{filter:'blur(5px)'}}>Rs 99,999</span>
                    <span className="text-xs text-gray-400">🔒 {t('Contact for price')}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#006948] font-semibold">{product.in_stock ? '✅ ' + t('In Stock') : '❌ ' + t('Out of Stock')}</p>
                  <p className="text-xs text-gray-400">{t('Ships pan India')}</p>
                </div>
              </div>
              <div className="flex gap-3 mb-2">
                <button onClick={() => { setShowOrder(true); setOrderDone(false); }}
                  className="flex-1 bg-[#006948] text-white py-3.5 rounded-xl font-bold hover:bg-[#004d34] transition-colors disabled:opacity-40" disabled={!product.in_stock}>
                  🛒 {t('Buy Now')}
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={addToCart} disabled={!product.in_stock}
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
        {product.specs_table && product.specs_table.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-12 shadow-sm">
            <div className="bg-[#006948] px-6 py-4">
              <h2 className="text-white font-bold text-lg">{t('Technical Specifications')}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <tbody>
                  {product.specs_table.map(([label, value], i) => (
                    <tr key={label} className={i % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="px-6 py-3 text-sm font-semibold text-gray-600 w-1/2">{t(label)}</td>
                      <td className="px-6 py-3 text-sm text-gray-800 font-medium">{t(value)}</td>
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
                    <img src={p.image_url} alt={p.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-[#006948] font-semibold">{p.brand}</p>
                    <p className="text-sm font-bold text-gray-800 truncate">{p.model}</p>
                    <p className="text-xs text-gray-400 mt-1 truncate">{translateSpecs(p.specs, t)}</p>
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
                  <img src={product.image_url} alt={product.model} className="w-12 h-10 object-cover rounded-lg" />
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
                  <img src={product.image_url} alt={product.model} className="w-14 h-12 object-cover rounded-lg" />
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
                  {orderForm.payment === 'online' && <p className="text-xs text-orange-600 mt-2 bg-orange-50 rounded-lg px-3 py-2">⚡ {t('Razorpay coming soon — our team will share a payment link after confirmation.')}</p>}
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
