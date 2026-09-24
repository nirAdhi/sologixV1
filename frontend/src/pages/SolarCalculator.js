import React, { useState } from 'react';
import { useT } from '../i18n';

// Electricity tariffs — FY 2024-25 rates (₹/kWh)
// ✅ Verified states | ~ Approximate average for unverified states
const tariffs = {
  // ── Verified ──
  'Jharkhand':          { residential: 7.40,  commercial: 9.50,  industrial: 8.80  }, // ✅ JBVNL: Urban ₹7.40 | Rural ₹7.20
  'West Bengal':        { residential: 7.50,  commercial: 9.00,  industrial: 8.50  }, // ✅ WBSEDCL: 151-300 ₹7.00 | 300+ ₹8.00
  'Bihar':              { residential: 8.00,  commercial: 9.50,  industrial: 9.00  }, // ✅ BSPHCL: 0-50 ₹7.42 | 50+ ₹7.96-8.21
  'Odisha':             { residential: 5.80,  commercial: 7.50,  industrial: 7.00  }, // ✅ OERC: 201-400 ₹5.70 | 400+ ₹6.10

  // ── North India ──
  'Delhi':              { residential: 5.00,  commercial: 9.50,  industrial: 9.00  }, // ~ BSES/Tata Power
  'Uttar Pradesh':      { residential: 6.50,  commercial: 8.00,  industrial: 7.50  }, // ~ UPPCL
  'Haryana':            { residential: 7.00,  commercial: 8.50,  industrial: 8.00  }, // ~ DHBVN/UHBVN
  'Punjab':             { residential: 5.50,  commercial: 7.50,  industrial: 7.00  }, // ~ PSPCL (agri free)
  'Rajasthan':          { residential: 7.00,  commercial: 8.50,  industrial: 8.00  }, // ~ JVVNL/AVVNL
  'Himachal Pradesh':   { residential: 4.50,  commercial: 6.50,  industrial: 6.00  }, // ~ HPSEBL
  'Uttarakhand':        { residential: 5.50,  commercial: 7.00,  industrial: 6.50  }, // ~ UPCL
  'Madhya Pradesh':     { residential: 6.75,  commercial: 8.40,  industrial: 7.90  }, // ~ MPEZ/MPMKVCL
  'Chhattisgarh':       { residential: 5.50,  commercial: 7.00,  industrial: 6.50  }, // ~ CSPDCL

  // ── West India ──
  'Maharashtra':        { residential: 9.20,  commercial: 11.50, industrial: 10.50 }, // ~ MSEDCL
  'Gujarat':            { residential: 5.45,  commercial: 7.20,  industrial: 6.80  }, // ~ DGVCL/MGVCL
  'Goa':                { residential: 4.50,  commercial: 6.50,  industrial: 6.00  }, // ~ GSIDC

  // ── South India ──
  'Karnataka':          { residential: 6.80,  commercial: 8.80,  industrial: 8.20  }, // ~ BESCOM/MESCOM
  'Tamil Nadu':         { residential: 5.50,  commercial: 8.50,  industrial: 8.00  }, // ~ TNEB (first 100 free)
  'Andhra Pradesh':     { residential: 7.50,  commercial: 9.20,  industrial: 8.80  }, // ~ APSPDCL/APEPDCL
  'Telangana':          { residential: 7.20,  commercial: 9.00,  industrial: 8.50  }, // ~ TSSPDCL/TSNPDCL
  'Kerala':             { residential: 5.80,  commercial: 8.00,  industrial: 7.50  }, // ~ KSEB

  // ── East & North-East ──
  'Assam':              { residential: 7.50,  commercial: 9.00,  industrial: 8.50  }, // ~ APDCL
  'Meghalaya':          { residential: 6.50,  commercial: 8.00,  industrial: 7.50  }, // ~ MePDCL
  'Tripura':            { residential: 6.00,  commercial: 7.50,  industrial: 7.00  }, // ~ TSECL
  'Sikkim':             { residential: 4.00,  commercial: 6.00,  industrial: 5.50  }, // ~ Energy & Power Dept

  // ── UTs ──
  'Andaman & Nicobar':  { residential: 4.00,  commercial: 5.50,  industrial: 5.00  }, // ~ Electricity Dept
  'Chandigarh':         { residential: 5.00,  commercial: 7.00,  industrial: 6.50  }, // ~ UT Electricity Dept
  'Puducherry':         { residential: 3.50,  commercial: 6.00,  industrial: 5.50  }, // ~ PESCO (heavily subsidised)
};

const billRanges = {
  'Rs 500 - 2,000': 1250,
  'Rs 2,001 - 5,000': 3500,
  'Rs 5,001 - 15,000': 10000,
  'Above Rs 15,000': 22000,
};

const PANEL_WATT = 545;
const COST_PER_KW = 56000;
const SUNSHINE_HRS = 4.5;
const EFFICIENCY = 0.85;
const CO2_PER_KWH = 0.82;
const TREE_CO2_KG = 21;
const ROOF_PER_KW = 45;

function calcSubsidy(kw) {
  if (kw <= 1) return 30000;
  if (kw <= 2) return 60000;
  return 78000;
}

function calculate(state, billRange, serviceType) {
  const avgBill = billRanges[billRange] || 3500;
  const tariffObj = tariffs[state] || tariffs['Jharkhand'];
  const tariff = tariffObj[serviceType] || tariffObj.residential;
  const monthlyUnits = avgBill / tariff;
  const dailyUnits = monthlyUnits / 30;
  const rawKw = dailyUnits / (SUNSHINE_HRS * EFFICIENCY);
  const capacityKw = Math.ceil(rawKw * 4) / 4;
  const numPanels = Math.ceil((capacityKw * 1000) / PANEL_WATT);
  const actualKw = (numPanels * PANEL_WATT) / 1000;
  const grossCost = Math.round(actualKw * COST_PER_KW);
  const subsidy = serviceType === 'residential' ? calcSubsidy(actualKw) : 0;
  const landedCost = Math.max(grossCost - subsidy, 0);
  const dailyGen = +(actualKw * SUNSHINE_HRS * EFFICIENCY).toFixed(2);
  const yearlyGen = Math.round(dailyGen * 365);
  const yearlySavings = Math.round(yearlyGen * tariff);
  const roi = +(landedCost / yearlySavings).toFixed(1);
  const co2PerYear = Math.round(yearlyGen * CO2_PER_KWH);
  const treesPlanted = Math.round(co2PerYear / TREE_CO2_KG);
  const savings25yr = Math.round(yearlySavings * 25 * 1.03);
  const roofArea = Math.round(actualKw * ROOF_PER_KW);
  return { capacityKw: actualKw.toFixed(2), numPanels, grossCost, subsidy, landedCost, dailyGen, yearlyGen, yearlySavings, roi, co2PerYear, treesPlanted, savings25yr, roofArea, systemLife: 25 };
}

const fmt = (n) => 'Rs ' + n.toLocaleString('en-IN');

const SolarCalculator = () => {
  const [state, setState] = useState('Jharkhand');
  const [billRange, setBillRange] = useState('Rs 2,001 - 5,000');
  const [serviceType, setServiceType] = useState('residential');
  const [result, setResult] = useState(null);
  const [form, setForm] = useState({ name:'', mobile:'', email:'', pincode:'' });
  const [downloaded, setDownloaded] = useState(false);
  const { t } = useT();

  const handleCalc = () => setResult(calculate(state, billRange, serviceType));

  const ICONS = {
    capacity:    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><circle cx="12" cy="12" r="10" fill="#FEF9C3"/><path d="M13 2L4.5 13.5H12L11 22L19.5 10.5H12L13 2Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1.2" strokeLinejoin="round"/></svg>,
    panels:      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><rect x="2" y="3" width="9" height="8" rx="1" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5"/><rect x="13" y="3" width="9" height="8" rx="1" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5"/><rect x="2" y="13" width="9" height="8" rx="1" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5"/><rect x="13" y="13" width="9" height="8" rx="1" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5"/></svg>,
    cost:        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><circle cx="12" cy="12" r="10" fill="#FEF3C7"/><text x="12" y="16" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#D97706">₹</text></svg>,
    subsidy:     <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><rect x="3" y="6" width="18" height="13" rx="2" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.5"/><path d="M3 10h18" stroke="#16A34A" strokeWidth="1.5"/><circle cx="8" cy="14" r="1.5" fill="#16A34A"/><rect x="11" y="13" width="6" height="2" rx="1" fill="#16A34A"/></svg>,
    landed:      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><circle cx="12" cy="12" r="10" fill="#EDE9FE"/><path d="M8 15l3-8 2 5 2-3 2 6" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    daily:       <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><circle cx="12" cy="12" r="5" fill="#FEF08A" stroke="#EAB308" strokeWidth="1.5"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" stroke="#EAB308" strokeWidth="1.8" strokeLinecap="round"/></svg>,
    yearly:      <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><rect x="3" y="4" width="18" height="17" rx="2" fill="#DBEAFE" stroke="#3B82F6" strokeWidth="1.5"/><path d="M3 9h18" stroke="#3B82F6" strokeWidth="1.5"/><circle cx="8" cy="6.5" r="1" fill="#3B82F6"/><circle cx="16" cy="6.5" r="1" fill="#3B82F6"/><path d="M7 13h2M11 13h2M15 13h2M7 17h2M11 17h2" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    savings:     <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><path d="M12 2C9.8 2 8 3.8 8 6c0 1.7 1 3.2 2.5 3.8L9 20h6l-1.5-10.2C14.9 9.2 16 7.7 16 6c0-2.2-1.8-4-4-4z" fill="#D1FAE5" stroke="#059669" strokeWidth="1.3" strokeLinejoin="round"/><path d="M9 20h6" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    roi:         <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><path d="M3 17l4-5 4 3 4-6 4 4" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 7l-4 4" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"/><circle cx="21" cy="7" r="2" fill="#8B5CF6"/></svg>,
    co2:         <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><circle cx="12" cy="12" r="10" fill="#D1FAE5"/><path d="M8 14c0 2.2 1.8 4 4 4s4-1.8 4-4-1.8-4-4-4c-1.1 0-2.1.4-2.8 1.1" stroke="#059669" strokeWidth="1.5" strokeLinecap="round"/><path d="M12 6v3M10 8l2-2 2 2" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    savings25:   <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><rect x="3" y="10" width="4" height="10" rx="1" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.3"/><rect x="9" y="6" width="4" height="14" rx="1" fill="#FCD34D" stroke="#F59E0B" strokeWidth="1.3"/><rect x="15" y="2" width="4" height="18" rx="1" fill="#F59E0B" stroke="#D97706" strokeWidth="1.3"/></svg>,
    trees:       <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><path d="M12 2L6 10h3.5L5 18h6v4h2v-4h6l-4.5-8H18L12 2z" fill="#DCFCE7" stroke="#16A34A" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
    lifespan:    <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><circle cx="12" cy="12" r="9" fill="#E0E7FF" stroke="#6366F1" strokeWidth="1.5"/><path d="M12 7v5l3 3" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    roof:        <svg viewBox="0 0 24 24" fill="none" className="w-8 h-8"><path d="M3 10L12 3l9 7v11H3V10z" fill="#FEE2E2" stroke="#EF4444" strokeWidth="1.3" strokeLinejoin="round"/><rect x="9" y="14" width="6" height="7" rx="1" fill="#EF4444" opacity="0.4"/></svg>,
  };

  const metrics = result ? [
    { icon: ICONS.capacity,  label:'Capacity',                value: result.capacityKw + ' kW', color:'bg-yellow-50 border-yellow-100' },
    { icon: ICONS.panels,    label:'Number of Panels',        value: result.numPanels,           color:'bg-blue-50 border-blue-100' },
    { icon: ICONS.cost,      label:'Total Project Cost',      value: fmt(result.grossCost),      color:'bg-amber-50 border-amber-100' },
    { icon: ICONS.subsidy,   label:'Government Subsidy',      value: fmt(result.subsidy),        color:'bg-green-50 border-green-100' },
    { icon: ICONS.landed,    label:'Landed Project Cost',     value: fmt(result.landedCost),     color:'bg-purple-50 border-purple-100' },
    { icon: ICONS.daily,     label:'Average Daily Generation',value: t('{n} kWh/Day', { n: result.dailyGen }), color:'bg-yellow-50 border-yellow-100' },
    { icon: ICONS.yearly,    label:'Average Yearly Generation',value: result.yearlyGen.toLocaleString('en-IN') + ' kWh', color:'bg-blue-50 border-blue-100' },
    { icon: ICONS.savings,   label:'Yearly Savings',          value: fmt(result.yearlySavings),  color:'bg-emerald-50 border-emerald-100' },
    { icon: ICONS.roi,       label:'Return on Investment',    value: t('{n} years', { n: result.roi }),      color:'bg-violet-50 border-violet-100' },
    { icon: ICONS.co2,       label:'CO2 Savings per Year',    value: result.co2PerYear.toLocaleString('en-IN') + ' kg', color:'bg-green-50 border-green-100' },
    { icon: ICONS.savings25, label:'Total Savings in 25 Years', value: fmt(result.savings25yr), color:'bg-amber-50 border-amber-100' },
    { icon: ICONS.trees,     label:'Equivalent Trees Planted',value: result.treesPlanted,        color:'bg-lime-50 border-lime-100' },
    { icon: ICONS.lifespan,  label:'System Life Span',        value: t('{n} years', { n: result.systemLife }), color:'bg-indigo-50 border-indigo-100' },
    { icon: ICONS.roof,      label:'Total Roof Area Needed',  value: t('{n} sq ft', { n: result.roofArea }), color:'bg-red-50 border-red-100' },
  ] : [];

  return (
    <div className="min-h-screen">
      <section className="relative min-h-[380px] flex flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=1600&h=600&fit=crop" alt={t('Solar Calculator')} className="w-full h-full object-cover" />
          <div className="absolute inset-0" data-theme-hero="1" style={{background:'linear-gradient(135deg, rgba(0,105,72,0.88) 0%, rgba(0,77,52,0.82) 50%, rgba(0,50,35,0.75) 100%)'}}></div>
        </div>
        <div className="relative z-10 text-center px-6 w-full max-w-4xl mx-auto py-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-10 tracking-wide uppercase">{t('Solar Calculator')}</h1>
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <select value={state} onChange={e => setState(e.target.value)} className="bg-white/95 text-gray-800 px-6 py-3 rounded-full text-sm font-medium outline-none min-w-[160px] shadow">
              {Object.keys(tariffs).map(s => <option key={s} value={s}>{t(s)}</option>)}
            </select>
            <select value={billRange} onChange={e => setBillRange(e.target.value)} className="bg-white/95 text-gray-800 px-6 py-3 rounded-full text-sm font-medium outline-none min-w-[200px] shadow">
              {Object.keys(billRanges).map(b => <option key={b} value={b}>{t(b)}</option>)}
            </select>
            <select value={serviceType} onChange={e => setServiceType(e.target.value)} className="bg-white/95 text-gray-800 px-6 py-3 rounded-full text-sm font-medium outline-none min-w-[160px] shadow">
              <option value="residential">{t('Residential')}</option>
              <option value="commercial">{t('Commercial')}</option>
              <option value="industrial">{t('Industrial')}</option>
            </select>
          </div>
          <button onClick={handleCalc} className="bg-[#006948] text-white px-12 py-3 rounded-full font-semibold text-base hover:bg-[#004d34] transition-all shadow-xl">{t('Calculate')}</button>
        </div>
      </section>

      {result && (
        <>
          <section className="py-12 bg-white border-b border-gray-100">
            <div className="max-w-[1400px] mx-auto px-6">
              <h2 className="text-center text-xl font-bold text-gray-800 mb-6">{t('Your Solar Calculations')} 💡</h2>
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 mb-8 max-w-3xl mx-auto">
                <span className="text-amber-500 text-lg flex-shrink-0 mt-0.5">⚠️</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  <strong>{t('These are approximate estimates only.')}</strong> {t('Actual system size, cost, savings and ROI may vary depending on your roof area, shadow analysis, local electricity tariff slab, equipment brand, installation charges and applicable subsidies at the time of installation. Please contact our team for a free on-site survey and accurate quotation.')}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {metrics.map(({ icon, label, value, color }) => (
                  <div key={label} className={"flex flex-col items-center text-center rounded-2xl p-4 border hover:shadow-md transition-all " + (color || 'bg-gray-50 border-gray-100')}>
                    <div className="mb-2">{icon}</div>
                    <p className="text-xs text-gray-500 mb-1 leading-tight font-medium">{t(label)}</p>
                    <p className="text-sm font-bold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="py-6 bg-[#fffde7] border-b border-yellow-100">
            <div className="max-w-4xl mx-auto px-6">
              <p className="text-xs text-gray-500 mb-2 font-semibold">{t('Other Companies Cost Comparison')}</p>
              <div className="flex items-center gap-6 flex-wrap text-sm">
                <span className="text-green-700 font-bold">{t('Sologix: {amount}', { amount: fmt(result.landedCost) })}</span>
                <span className="text-gray-600">{t('Market Avg: {amount}', { amount: fmt(Math.round(result.landedCost * 1.15)) })}</span>
                <span className="text-red-600">{t('Premium: {amount}', { amount: fmt(Math.round(result.landedCost * 1.25)) })}</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">{t('You save {amount} with Sologix', { amount: fmt(Math.round(result.landedCost * 0.25)) })}</span>
              </div>
            </div>
          </section>

          <section className="py-16 bg-gray-50">
            <div className="max-w-lg mx-auto px-6 text-center">
              <h2 className="text-2xl font-bold mb-2">{t('Download your full Quotation here')}</h2>
              <p className="text-gray-500 text-sm mb-8">{t('Fill in your details to get a detailed PDF quotation.')}</p>
              {downloaded ? (
                <div className="bg-green-50 rounded-2xl p-10 border border-green-200">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-xl font-bold text-green-700 mb-2">{t('Request Received!')}</h3>
                  <p className="text-gray-600 text-sm">{t('Our team will send your quotation within 24 hours.')}</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-4 text-left">
                  {[['Name','name','Your full name','text'],['Mobile','mobile','+91 XXXXX XXXXX','tel'],['Email','email','your@email.com','email'],['Pincode','pincode','834001','text']].map(([label, key, placeholder, type]) => (
                    <div key={key}>
                      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-1">{t(label)}</label>
                      <input type={type} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" placeholder={t(placeholder)} />
                    </div>
                  ))}
                  <button onClick={() => { if (form.name && form.mobile) setDownloaded(true); }} className="w-full bg-[#006948] text-white py-4 rounded-xl font-semibold hover:bg-[#004d34] transition-colors mt-2">{t('Download PDF')}</button>
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {!result && (
        <section className="py-20 bg-white">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold mb-4">{t('How It Works')}</h2>
            <p className="text-gray-500 mb-12">{t('Select your state, bill range and service type above, then click Calculate')}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[['1','🗺️','Select Location','Choose your state for accurate local tariff and sunshine data.'],['2','💡','Enter Bill Range','Select monthly electricity bill to estimate your ideal system size.'],['3','📊','Instant Results','See system size, cost, subsidy, savings, ROI and environmental impact.']].map(([step, icon, title, desc]) => (
                <div key={step} className="text-center">
                  <div className="text-5xl mb-4">{icon}</div>
                  <div className="w-8 h-8 bg-[#006948] text-white rounded-full flex items-center justify-center font-bold text-sm mx-auto mb-3">{step}</div>
                  <h3 className="font-bold text-lg mb-2">{t(title)}</h3>
                  <p className="text-gray-500 text-sm">{t(desc)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default SolarCalculator;
