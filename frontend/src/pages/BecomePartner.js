import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useT } from '../i18n';
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PartnerForm = () => {
  const { t } = useT();
  const [form, setForm] = useState({ name:'', email:'', phone:'', address:'', aadhar:'', pan:'', interest:'' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handle = e => setForm(f => ({...f, [e.target.name]: e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error(t('Name and phone are required')); return; }
    setSubmitting(true);
    try {
      const resp = await fetch(API_URL + '/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          service_interest: form.interest,
          source: 'partner',
          priority: 'high',
          message: 'Partner Application | Aadhar: ' + (form.aadhar || 'N/A') + ' | PAN: ' + (form.pan || 'N/A') + ' | Interest: ' + form.interest,
        }),
      });
      if (!resp.ok) throw new Error('Failed');
      setSubmitted(true);
      toast.success(t('Application submitted! Our team will contact you within 24 hours.'));
    } catch(e) {
      toast.error(t('Failed to submit. Please try again or call us directly.'));
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "w-full border border-[#E5E7EB] rounded px-4 py-2 text-[16px] focus:border-[#006948] focus:ring-1 focus:ring-[#006948] outline-none transition-colors";
  const labelClass = "block text-[14px] font-medium text-[#3d4a42] mb-1";

  if (submitted) return (
    <div className="md:w-7/12 p-8 md:p-12 flex flex-col items-center justify-center text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h3 className="text-2xl font-bold text-[#006948] mb-3">{t('Application Received!')}</h3>
      <p className="text-gray-600 mb-2">{t('Thank you for your interest in partnering with Sologix Energy.')}</p>
      <p className="text-gray-600 mb-4">{(() => {
        // Keep the bold part; Hindi places it at a different spot in the sentence.
        const [before, after = ''] = t('Our channel manager will reach out within {time}.').split('{time}');
        return <>{before}<strong>{t('24 hours')}</strong>{after}</>;
      })()}</p>

    </div>
  );

  return (
    <div className="md:w-7/12 p-8 md:p-12">
      <h3 className="text-[28px] font-semibold text-[#141b2b] mb-6" style={{ fontFamily: 'Manrope' }}>{t('Get in Touch')}</h3>
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2">
          <label className={labelClass}>{t('Full Name')} <span className="text-[#cc4900]">*</span></label>
          <input name="name" value={form.name} onChange={handle} className={inputClass} placeholder={t('John Doe')} required type="text" />
        </div>
        <div>
          <label className={labelClass}>{t('Email Address')} <span className="text-[#cc4900]">*</span></label>
          <input name="email" value={form.email} onChange={handle} className={inputClass} placeholder="john@example.com" required type="email" />
        </div>
        <div>
          <label className={labelClass}>{t('Phone Number')} <span className="text-[#cc4900]">*</span></label>
          <input name="phone" value={form.phone} onChange={handle} className={inputClass} placeholder="+91 98765 43210" required type="tel" />
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className={labelClass}>{t('Address')} <span className="text-[#cc4900]">*</span></label>
          <textarea name="address" value={form.address} onChange={handle} className={inputClass + " resize-none"} placeholder={t('Your business or residential address')} required rows="2"></textarea>
        </div>
        <div>
          <label className={labelClass}>{t('Aadhar Number')}</label>
          <input name="aadhar" value={form.aadhar} onChange={handle} className={inputClass} placeholder="XXXX XXXX XXXX" type="text" />
        </div>
        <div>
          <label className={labelClass}>{t('PAN Number')}</label>
          <input name="pan" value={form.pan} onChange={handle} className={inputClass} placeholder="ABCDE1234F" type="text" />
        </div>
        <div className="col-span-1 md:col-span-2">
          <label className={labelClass}>{t('Interested In')} <span className="text-[#cc4900]">*</span></label>
          <select name="interest" value={form.interest} onChange={handle} className={inputClass + " bg-[#f9f9ff]"} required>
            <option value="">{t('Select an option')}</option>
            <option value="Residential Solar Partner">{t('Residential Solar Partner')}</option>
            <option value="Commercial & Industrial Partner">{t('Commercial & Industrial Partner')}</option>
            <option value="Referral Agent">{t('Referral Agent')}</option>
            <option value="Regional Distributor">{t('Regional Distributor')}</option>
          </select>
        </div>
        <div className="col-span-1 md:col-span-2 mt-2">
          <button disabled={submitting} className="w-full bg-[#006948] text-white px-6 py-3 rounded hover:bg-[#00855d] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-70" type="submit">
            {submitting ? t('Submitting...') : t('Send Message')}
            {!submitting && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>}
          </button>
        </div>
      </form>
    </div>
  );
};

const BecomePartner = () => {
  const { t } = useT();
  return (
    <div>
      <section className="relative bg-[#e9edff] py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#006c4a]/10 to-transparent"></div>
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px] relative z-10 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h1 className="text-[32px] md:text-[48px] font-bold text-[#141b2b] mb-4 md:mb-6 leading-tight" style={{ fontFamily: 'Manrope' }}>{t('Partner with the Future of Energy')}</h1>
            <p className="text-[18px] text-[#3d4a42] mb-6 leading-relaxed" style={{ fontFamily: 'Work Sans' }}>{t('Join the Sologix Energy network and build a sustainable business with zero upfront investment. Empower your community with reliable solar solutions.')}</p>
            <a href="#partner-form" className="inline-block bg-[#006948] text-white px-8 py-3 rounded-full hover:bg-[#00855d] transition-colors shadow-sm" style={{ fontFamily: 'Work Sans', fontSize: '14px', fontWeight: 500, letterSpacing: '0.05em' }}>{t('Start Your Journey')}</a>
          </div>
          <div className="hidden md:block rounded-xl overflow-hidden shadow-sm">
            <img alt={t('Solar professionals installing panels')} className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA0gvSZGuA1m1yI4UiIa1QmJgLnMTOqRI1WijmV8iZmVHAxAgN9JNfNipufoOn4wzADkS3VfFCtFKbaWQZF81Jw3vHJpAfWdxL3V8DNusqw5SVM3C3Tuxfhp34kHZj6dGeU8177a4ONWuyEoA5oo13pBGroem6AMxFpmJhnOHb_j9sL4Zh2-BvGsrFoDxZc9T9_9tzzoxIE_q7_Ypeb7s5-jnLR5iAworUveuVXBVeNjmK9_RpIcMgG-j1c1sj_w5YEx9-cV4ibPLE"/>
          </div>
        </div>
      </section>

      <section className="py-24 max-w-[1280px] mx-auto px-5 md:px-[64px]">
        <div className="text-center mb-12 md:mb-24">
          <h2 className="text-[36px] font-bold text-[#141b2b] mb-2" style={{ fontFamily: 'Manrope' }}>{t('Partnership Advantage')}</h2>
          <p className="text-[18px] text-[#3d4a42] max-w-2xl mx-auto" style={{ fontFamily: 'Work Sans' }}>{t('Why choose Sologix Energy as your reliable growth partner.')}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-[#f9f9ff] p-8 rounded-xl border border-[#E5E7EB] shadow-sm hover:-translate-y-1 transition-transform duration-300">
            <div className="w-16 h-16 rounded-full bg-[#34D399]/20 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#006948]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
            </div>
            <h3 className="text-[20px] font-semibold text-[#141b2b] mb-2" style={{ fontFamily: 'Manrope' }}>{t('Infinite Earning Opportunity')}</h3>
            <p className="text-[16px] text-[#3d4a42]" style={{ fontFamily: 'Work Sans' }}>{t('Tap into a growing market with highly competitive commissions and ongoing revenue streams.')}</p>
          </div>
          <div className="bg-[#f9f9ff] p-8 rounded-xl border border-[#E5E7EB] shadow-sm hover:-translate-y-1 transition-transform duration-300">
            <div className="w-16 h-16 rounded-full bg-[#EFF6FF] flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#006948]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"/></svg>
            </div>
            <h3 className="text-[20px] font-semibold text-[#141b2b] mb-2" style={{ fontFamily: 'Manrope' }}>{t('Technical Support')}</h3>
            <p className="text-[16px] text-[#3d4a42]" style={{ fontFamily: 'Work Sans' }}>{t('Access to our dedicated engineering team for seamless installations and ongoing maintenance.')}</p>
          </div>
          <div className="bg-[#f9f9ff] p-8 rounded-xl border border-[#E5E7EB] shadow-sm hover:-translate-y-1 transition-transform duration-300">
            <div className="w-16 h-16 rounded-full bg-[#ffdbce]/30 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-[#a33900]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 className="text-[20px] font-semibold text-[#141b2b] mb-2" style={{ fontFamily: 'Manrope' }}>{t('No Upfront Investment')}</h3>
            <p className="text-[16px] text-[#3d4a42]" style={{ fontFamily: 'Work Sans' }}>{t('Start your business without heavy capital constraints. We provide the essential resources.')}</p>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#F9FAFB]" id="partner-form">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <div className="bg-[#f9f9ff] rounded-xl shadow-lg overflow-hidden flex flex-col md:flex-row">
            <div className="md:w-5/12 bg-[#006c4a] p-8 text-white flex flex-col justify-center relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-[36px] font-bold mb-6" style={{ fontFamily: 'Manrope' }}>{t('Ready to Scale?')}</h2>
                <p className="text-[18px] opacity-90 mb-6" style={{ fontFamily: 'Work Sans' }}>{t('Fill out the form to express your interest in partnering with Sologix Energy. Our channel managers will reach out within 24 hours.')}</p>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3"><svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg><span>{t('Fast on-boarding process')}</span></li>
                  <li className="flex items-center gap-3"><svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg><span>{t('Comprehensive training')}</span></li>
                  <li className="flex items-center gap-3"><svg className="w-6 h-6 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg><span>{t('Marketing material support')}</span></li>
                </ul>
              </div>
            </div>
            <PartnerForm />
          </div>
        </div>
      </section>
    </div>
  );
};

export default BecomePartner;
