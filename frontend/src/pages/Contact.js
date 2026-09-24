import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useT } from '../i18n';
import { BRANDING } from '../utils/branding';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const Contact = () => {
  const { t } = useT();
  const [form, setForm] = useState({ name:'', email:'', phone:'', message:'' });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handle = e => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async e => {
    e.preventDefault();
    if (!form.name || !form.phone) { toast.error(t('Name and phone are required')); return; }
    setSending(true);
    try {
      const res = await fetch(API_URL + '/leads/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          message: form.message,
          source: 'contact_us',
          priority: 'medium',
          service_interest: 'General Inquiry',
        }),
      });
      if (res.ok) { setSent(true); toast.success(t("Message sent! We'll contact you within 24 hours.")); }
      else toast.error(t('Failed to send. Please call us directly.'));
    } catch { toast.error(t('Network error. Please call us directly.')); }
    finally { setSending(false); }
  };

  return (
    <div className="min-h-screen">
      <section className="relative py-20 text-white text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&h=500&fit=crop" alt={t('Contact Us')} className="w-full h-full object-cover" />
          <div className="absolute inset-0" data-theme-hero="1" style={{background:'linear-gradient(135deg,rgba(0,105,72,0.90) 0%,rgba(0,77,52,0.85) 100%)'}}></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-4">{t('Contact Us')}</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">{t("We'd love to hear from you. Get in touch for a free solar consultation.")}</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-3xl font-bold mb-8">{t('Get In Touch')}</h2>
              <div className="space-y-6 mb-10">
                {[
                  { icon:'📍', label:'Office Address', value: BRANDING.address },
                  { icon:'📞', label:'Phone', value: [BRANDING.phone, BRANDING.phoneAlt].filter(Boolean).join(' | ') },
                  { icon:'✉️', label:'Email', value: BRANDING.email },
                  { icon:'⏰', label:'Working Hours', value:'Mon – Sat: 9:00 AM – 6:00 PM', translate:true },
                ].map(({ icon, label, value, translate }) => (
                  <div key={label} className="flex gap-4">
                    <div className="w-12 h-12 bg-[#006948]/10 rounded-xl flex items-center justify-center text-xl flex-shrink-0">{icon}</div>
                    <div>
                      <p className="font-semibold text-gray-800">{t(label)}</p>
                      <p className="text-gray-500 text-sm mt-0.5">{translate ? t(value) : value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              {sent ? (
                <div className="bg-green-50 border border-green-200 rounded-2xl p-10 text-center">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-2xl font-bold text-[#006948] mb-2">{t('Message Received!')}</h3>
                  <p className="text-gray-600">{t('Our team will contact you within 24 hours.')}</p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100">
                  <h3 className="text-xl font-bold mb-6">{t('Send Us a Message')}</h3>
                  <form onSubmit={submit} className="space-y-4">
                    {[
                      { name:'name',    placeholder:'Your Full Name *',    type:'text',  required:true },
                      { name:'phone',   placeholder:'Phone Number *',       type:'tel',   required:true },
                      { name:'email',   placeholder:'Email Address',        type:'email', required:false },
                    ].map(({ name, placeholder, type, required }) => (
                      <input key={name} name={name} type={type} placeholder={t(placeholder)} required={required}
                        value={form[name]} onChange={handle}
                        className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
                    ))}
                    <textarea name="message" placeholder={t('Your message or inquiry...')} rows={4}
                      value={form.message} onChange={handle}
                      className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] resize-none" />
                    <button type="submit" disabled={sending}
                      className="w-full bg-[#006948] text-white py-4 rounded-xl font-semibold hover:bg-[#004d34] transition-colors disabled:opacity-60">
                      {sending ? t('Sending...') : t('Send Message →')}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
