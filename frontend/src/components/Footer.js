import React from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n';

const Footer = () => {
  const { t } = useT();
  return (
  <footer className="bg-[#141b2b] text-gray-400 pt-20 pb-8">
    <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-16">

        {/* Brand — spans 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          <Link to="/" className="inline-block hover:opacity-90 transition-opacity">
            <img src="https://res.cloudinary.com/dsiratycd/image/upload/logo_yo5zg9.png" alt="Sologix Energy" className="h-20 w-auto rounded-full"
              onError={e => { e.target.src='https://res.cloudinary.com/dsiratycd/image/upload/logo_yo5zg9.png'; }} />
          </Link>
          <p className="text-sm font-semibold text-[#34d399]">{t('Energizing Naturally')}</p>
          <p className="text-sm leading-relaxed">{t('We are on a mission to make this planet a better place to live and we are committed to make clean energy available to all which is, Renewable, Reliable, and Affordable.')}</p>
          <div>
            <p className="text-xs text-gray-500 mb-1">📍 STPI Building, Plot-8, Namkum Industrial Area, Ranchi, Jharkhand - 834010</p>
            <p className="text-xs text-gray-500"><a href="mailto:info@sologixenergy.in" className="hover:text-white">✉️ info@sologixenergy.in</a></p>
          </div>
          <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{t('Follow Us On')}</p>
          <div className="flex gap-3 flex-wrap">
            {[
              { name:'Instagram', link:'https://www.instagram.com/sologixenergy/' },
              { name:'Facebook', link:'https://www.facebook.com/sologix/' },
              { name:'YouTube', link:'https://www.youtube.com/@sologixenergy' },
              { name:'LinkedIn', link:'https://www.linkedin.com/company/m-s-sologix-energy/' },
              { name:'WhatsApp', link:'https://wa.me/918287766474' },
            ].map(({ name, link }) => (
              <a key={name} href={link} target="_blank" rel="noreferrer" className="text-xs bg-white/10 hover:bg-[#006948] px-3 py-1 rounded-full transition-colors">{name}</a>
            ))}
          </div>
        </div>

        {/* Company */}
        <div>
          <h5 className="text-white font-semibold mb-5 text-sm">{t('Company')}</h5>
          <ul className="space-y-2 text-sm">
            {[
              { to:'/about', label:'About Us' },
              { to:'/gallery', label:'Our Projects' },
              { to:'/gallery', label:'Gallery' },
              { to:'/become-partner', label:'Careers' },
            ].map(({ to, label }) => (
              <li key={label}><Link to={to} className="hover:text-white transition-colors">{t(label)}</Link></li>
            ))}
          </ul>
        </div>

        {/* Products */}
        <div>
          <h5 className="text-white font-semibold mb-5 text-sm">{t('Products Offered')}</h5>
          <ul className="space-y-2 text-sm">
            {[
              { to:'/solutions', label:'Residential Solar Solutions' },
              { to:'/solutions', label:'Commercial Solar Solutions' },
              { to:'/solutions', label:'Industrial Solar Solutions' },
              { to:'/products', label:'Solar Panels' },
              { to:'/products', label:'Solar Inverterters' },
              { to:'/products', label:'Solar Batteries' },
            ].map(({ to, label }) => (
              <li key={label}><Link to={to} className="hover:text-white transition-colors">{t(label)}</Link></li>
            ))}
          </ul>
        </div>

        {/* Services */}
        <div>
          <h5 className="text-white font-semibold mb-5 text-sm">{t('Services')}</h5>
          <ul className="space-y-2 text-sm">
            {[
              { to:'/services', label:'Solar Rooftop Installation' },
              { to:'/solutions', label:'Turnkey EPC Solutions' },
              { to:'/services', label:'Solar Maintenance' },
              { to:'/booking', label:'Site Survey' },
              { to:'/solutions', label:'System Design' },
              { to:'/booking', label:'Project Installation' },
            ].map(({ to, label }) => (
              <li key={label}><Link to={to} className="hover:text-white transition-colors">{t(label)}</Link></li>
            ))}
          </ul>
        </div>

        {/* Resources + Get In Touch */}
        <div>
          <h5 className="text-white font-semibold mb-5 text-sm">{t('Resources')}</h5>
          <ul className="space-y-2 text-sm mb-6">
            {[
              { to:'/faq', label:'FAQs' },
              { to:'/faq', label:'Customer Reviews' },
              { to:'/subsidies', label:'Government Subsidy' },
              { to:'/faq', label:'Solar News & Updates' },
            ].map(({ to, label }) => (
              <li key={label}><Link to={to} className="hover:text-white transition-colors">{t(label)}</Link></li>
            ))}
          </ul>
          <h5 className="text-white font-semibold mb-5 text-sm">{t('Get In Touch')}</h5>
          <ul className="space-y-2 text-sm">
            {[
              { to:'/contact', label:'Contact Us' },
              { to:'/booking', label:'Customer Support' },
              { to:'/become-partner', label:'Become a Partner' },
              { to:'/booking', label:'Get Free Consultation' },
              { to:'/booking', label:'Request a Quote' },
            ].map(({ to, label }) => (
              <li key={label}><Link to={to} className="hover:text-white transition-colors">{t(label)}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
        <p>{t('Copyright 2023 Sologix. All Rights Reserved.')}</p>
        <div className="flex gap-6">
          <a href="#" className="hover:text-white">{t('Privacy Policy')}</a>
          <a href="#" className="hover:text-white">{t('Terms & Conditions')}</a>
          <a href="https://www.sologixenergy.in" target="_blank" rel="noreferrer" className="hover:text-white">{t('Official Website')}</a>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
