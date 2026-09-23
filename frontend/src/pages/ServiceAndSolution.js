import React from 'react';

const ServiceAndSolution = () => {
  return (
    <div>
      <section className="relative w-full min-h-[60vh] flex items-center justify-center overflow-hidden bg-[#ffffff]">
        <div className="absolute inset-0 z-0">
          <img alt="Solar farm" className="w-full h-full object-cover object-center" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDE5qN-kU717z022SlQSkxKkAqeVrGvYRzKTHBZYVcaGW8OSJA9pHxGnp4H07a0MAVyLoYnOkE0RScsIEkoizXDyfnIH2Qo7tQN-593ITqsEOamj-PswIv-imc4EcYmspu7I5VlsA66QM2n0ZkOn1K3YPlS_4bbYXAeTfcdPLYcJ6oAv9YQ5Av5F0E4Db6-CBMTRkNJlo7ZSWcexcOeD6XaV2F-QH_S2rpb75TL7Zrsh8q8YtPUTgSuajKekpey0GaZyTSs7hLI-4A" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#293040]/90 via-[#293040]/60 to-transparent mix-blend-multiply"></div>
        </div>
        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-5 md:px-[64px] py-24 flex flex-col items-start justify-center text-white">
          <span className="text-[14px] text-[#34D399] uppercase tracking-widest mb-4 block" style={{ fontFamily: 'Work Sans', fontWeight: 500 }}>Comprehensive Energy Solutions</span>
          <h1 className="text-[32px] md:text-[48px] font-bold mb-4 max-w-2xl leading-tight" style={{ fontFamily: 'Manrope' }}>Powering Tomorrow, <br/>Naturally.</h1>
          <p className="text-[18px] text-[#b7c4ff] max-w-xl mb-6" style={{ fontFamily: 'Work Sans' }}>Discover tailored solar infrastructure for homes, businesses, and industrial campuses. We engineer high-efficiency systems designed for long-term reliability.</p>
          <button className="bg-[#006948] hover:bg-[#00855d] text-white font-medium py-3 px-8 rounded-full shadow-sm transition-all duration-200 inline-flex items-center gap-2" style={{ fontFamily: 'Work Sans', fontSize: '14px', letterSpacing: '0.05em' }}>
            Explore Solutions
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </button>
        </div>
      </section>

      <section className="py-24 bg-[#f9f9ff]" id="solutions">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <div className="text-center mb-16">
            <h2 className="text-[36px] font-bold text-[#141b2b] mb-2" style={{ fontFamily: 'Manrope' }}>Our Core Solutions</h2>
            <p className="text-[18px] text-[#3d4a42] max-w-2xl mx-auto" style={{ fontFamily: 'Work Sans' }}>From residential rooftops to utility-scale plants, our engineering excellence delivers optimized energy generation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                tag: 'Residential', tagColor: 'text-[#006948]',
                title: 'Rooftop Systems for Homes',
                desc: 'Transform your roof into a power asset. Our premium residential installations are designed for maximum curb appeal and optimal energy yield, drastically reducing monthly utility bills.',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBnbLn53i0nQaO2f71P1jkf_7r9CaQCjse5cobBQwM5p0qApSV0rurKrW5nzzKqruwH8z7FhorH92BLeXg-dWnrKNCtKNLy4kWmLxzy1BWCZGNtpXmmvKsqz3jH0drKqvl6GbgCRhn5c9pd26ftRatdfi2OntRMTOoQqxNzh_jN0KiOc8E-yQBcJuJ2y7NlQUX8u4HObr087whtzDWsyf-aRkFkc0AfMO3Fuwgxpo6P7T0zVhxVzpVckDDpt0H-9RHIzQQCUR6KRhE'
              },
              {
                tag: 'Commercial', tagColor: 'text-[#1d4ed8]',
                title: 'Solutions for Offices & Malls',
                desc: 'Empower your business with reliable clean energy. We provide scalable arrays for commercial real estate, showrooms, and retail centers to hedge against rising energy costs.',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5I17fSK3uK8NbS0gY9PnAZlwhAl4bFtxRAX420Wl_30Y_O4-ouIesLsCfEYNo0ltHdOwnvJtD-yC_L0TI2bMyNjDkT28RIXB9W7VBckUu0_1RK6PsebIZorP-isnTVX7A4A4yh2alfmDp4WFOfDmWiH4M2cpJCvlhH362jVKdpoQfcv5MKvwVtLPUcCut4a5BS9dDDBEF3t_LJLFKLaYSv0p7swIDK0LNxFCLHDI5734PW6jlP87EaQkX0q4RERhC_ZlLRD6B6cE'
              },
              {
                tag: 'Industrial', tagColor: 'text-[#cc4900]',
                title: 'Large-Scale Factory Installations',
                desc: 'Robust, high-capacity solar infrastructure engineered for heavy industrial power demands. Maximize your factory\'s unused roof space and achieve ambitious ESG goals.',
                img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBQg4O7_RQo028sXWGkhchE3-tkygqV7rW1BTGcwyftSv-NmJTvAUg9o3xW62cvqLUSearvhHPLQmbipNPL4E0mjqCM6_kaMNrhS4yxirT_FggvQC8ddKBZw0YtBx0DKv7J6lNemIJCjj6uWhS9AmqXoGTKTd9oTvxckpjCzm3qQFzfvRkrnGSXGBIiwnjwL0kX7jyx4C2Kg2I_Dr4fVZi2-U0oBdAmchEMEwtiCf5XXurXjWwNMV_Y0d0Um5npIwP3aDXzA9F_jzw'
              },
            ].map((item, i) => (
              <div key={i} className="group relative overflow-hidden rounded-xl bg-[#ffffff] shadow-sm hover:shadow-md transition-shadow duration-300 border border-[#E5E7EB] flex flex-col h-full">
                <div className="relative h-64 overflow-hidden">
                  <img alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" src={item.img} />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur font-medium px-3 py-1 rounded-full shadow-sm">
                    <span className={`text-[14px] ${item.tagColor}`} style={{ fontFamily: 'Work Sans' }}>{item.tag}</span>
                  </div>
                </div>
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-[28px] font-semibold text-[#141b2b] mb-2" style={{ fontFamily: 'Manrope' }}>{item.title}</h3>
                  <p className="text-[16px] text-[#3d4a42] mb-6 flex-grow" style={{ fontFamily: 'Work Sans' }}>{item.desc}</p>
                  <button className="text-[14px] font-medium text-[#1d4ed8] hover:text-[#006948] flex items-center gap-1 transition-colors w-fit cursor-pointer" style={{ fontFamily: 'Work Sans', letterSpacing: '0.05em' }}>
                    View {item.tag} Details <span className="text-sm">→</span>
                  </button>
                </div>
              </div>
            ))}
            <div className="group relative overflow-hidden rounded-xl bg-[#EFF6FF] shadow-sm hover:shadow-md transition-all duration-300 border border-transparent hover:border-[#34D399] flex flex-col h-full">
              <div className="p-8 flex flex-col flex-grow relative z-10">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                  <svg className="w-6 h-6 text-[#006948]" fill="currentColor" viewBox="0 0 24 24"><path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/></svg>
                </div>
                <h3 className="text-[28px] font-semibold text-[#141b2b] mb-2" style={{ fontFamily: 'Manrope' }}>Turnkey EPC Solutions</h3>
                <p className="text-[16px] text-[#3d4a42] mb-6 flex-grow" style={{ fontFamily: 'Work Sans' }}>Engineering, Procurement, and Construction from end-to-end. We manage the entire lifecycle of your solar project, from initial site survey and financial modeling to grid integration and maintenance.</p>
                <ul className="space-y-3 mb-6">
                  {['Comprehensive Site Analysis', 'Custom System Design & Engineering', 'Regulatory Compliance & Permitting'].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[16px] text-[#141b2b]" style={{ fontFamily: 'Work Sans' }}>
                      <svg className="w-5 h-5 text-[#34D399] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                      {item}
                    </li>
                  ))}
                </ul>
                <button className="text-[14px] font-medium text-[#1d4ed8] hover:text-[#006948] flex items-center gap-1 transition-colors w-fit mt-auto cursor-pointer" style={{ fontFamily: 'Work Sans', letterSpacing: '0.05em' }}>
                  Learn about EPC <span className="text-sm">→</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#f1f3ff] border-y border-[#E5E7EB]">
        <div className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            <div className="w-full md:w-1/3">
              <h2 className="text-[36px] font-bold text-[#141b2b] mb-2" style={{ fontFamily: 'Manrope' }}>Why Choose Sologix Energy?</h2>
              <p className="text-[18px] text-[#3d4a42] mb-6" style={{ fontFamily: 'Work Sans' }}>We combine top-tier technology with precision engineering to ensure your investment yields maximum returns for decades.</p>
              <div className="inline-flex items-center gap-4 bg-[#34D399]/20 px-4 py-2 rounded-full border border-[#34D399]/50">
                <svg className="w-5 h-5 text-[#006948]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                <span className="text-[14px] font-medium text-[#00855d]" style={{ fontFamily: 'Work Sans', letterSpacing: '0.05em' }}>Certified Premium Partner</span>
              </div>
            </div>
            <div className="w-full md:w-2/3 grid grid-cols-1 sm:grid-cols-2 gap-8">
              {[
                { icon: 'bolt', title: 'High Efficiency', desc: 'We source only Tier-1 panels ensuring superior conversion rates and energy yields.', color: 'text-[#006948]' },
                { icon: 'architecture', title: 'Expert Installation', desc: 'Our certified engineering teams guarantee precision mounting and safe electrical integration.', color: 'text-[#1d4ed8]' },
                { icon: 'savings', title: 'Long-term Savings', desc: 'Designed for longevity, our systems drastically reduce overhead and provide excellent ROI.', color: 'text-[#cc4900]' },
                { icon: 'support', title: '24/7 Monitoring & Support', desc: 'Proactive performance tracking and dedicated maintenance to ensure uninterrupted power.', color: 'text-[#006948]' },
              ].map((item, i) => (
                <div key={i} className="bg-[#ffffff] p-6 rounded-xl shadow-sm border border-[#E5E7EB] flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#e9edff] flex items-center justify-center">
                    <svg className={`w-5 h-5 ${item.color}`} fill="currentColor" viewBox="0 0 24 24">
                      {item.icon === 'bolt' && <path d="M13 3h-2v10h2V3zm4.83 2.17l-1.42 1.42C17.99 7.86 19 9.81 19 12c0 3.87-3.13 7-7 7s-7-3.13-7-7c0-2.19 1.01-4.14 2.59-5.42L6.17 5.17C4.23 6.82 3 9.26 3 12c0 4.97 4.03 9 9 9s9-4.03 9-9c0-2.74-1.23-5.18-3.17-6.83zM11 15h2v-2h-2v2z"/>}
                      {item.icon === 'architecture' && <path d="M12 2L2 7v1l10 5 10-5V7L12 2zm0 3.29L4.5 7l7.5 3.75L19.5 7 12 5.29zM2 12v1l10 5 10-5v-1l-10 5-10-5zM2 17v1l10 5 10-5v-1l-10 5-10-5z"/>}
                      {item.icon === 'savings' && <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z"/>}
                      {item.icon === 'support' && <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm6 10.5c0 3.31-2.69 6-6 6s-6-2.69-6-6V7h1.5v5.5c0 2.48 2.02 4.5 4.5 4.5s4.5-2.02 4.5-4.5V7H18v5.5z"/>}
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-[20px] font-semibold text-[#141b2b] mb-1" style={{ fontFamily: 'Manrope' }}>{item.title}</h4>
                    <p className="text-[16px] text-[#3d4a42]" style={{ fontFamily: 'Work Sans' }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-[#293040] relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-5 md:px-[64px] text-center relative z-10">
          <h2 className="text-[36px] font-bold text-[#edf0ff] mb-2" style={{ fontFamily: 'Manrope' }}>Ready to Transition to Solar?</h2>
          <p className="text-[18px] text-[#edf0ff] opacity-80 mb-8" style={{ fontFamily: 'Work Sans' }}>Get in touch for a free consultation and site assessment. Our team is ready to guide you.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-[#006948] text-white px-8 py-3 rounded-full font-medium hover:bg-[#00855d] transition-all" style={{ fontFamily: 'Work Sans', fontSize: '14px', letterSpacing: '0.05em' }}>Book a Free Consultation</button>
            <button className="border border-white/30 text-white px-8 py-3 rounded-full font-medium hover:bg-white/10 transition-all" style={{ fontFamily: 'Work Sans', fontSize: '14px', letterSpacing: '0.05em' }}>Download Brochure</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ServiceAndSolution;
