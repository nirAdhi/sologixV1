import React, { useState } from 'react';
import { useT } from '../i18n';

const faqs = [
  { category:'Solar Basics', items:[
    { q:'What is solar energy?', a:'Solar energy is energy generated from sunlight using solar photovoltaic (PV) panels. It is a clean, renewable, and eco-friendly source of electricity that helps reduce electricity bills and carbon emissions.' },
    { q:'How do solar panels work?', a:'Solar panels absorb sunlight and convert it into electricity through photovoltaic cells. The electricity generated is then used to power your home or business through an inverter system.' },
    { q:'Is solar suitable for homes?', a:'Yes. Solar systems are ideal for residential homes, apartments, villas, and farmhouses. Sologix provides customized on-grid and off-grid solar solutions for small, medium, and large homes.' },
  ]},
  { category:'Pricing & Savings', items:[
    { q:'How much does solar installation cost?', a:'The cost depends on system size, rooftop area, and electricity usage. A typical residential solar system generally starts from around ₹1 lakh onwards after applicable subsidy benefits.' },
    { q:'How much can I save with solar?', a:'A properly designed solar system can reduce electricity bills by up to 90% under net-metering arrangements.' },
    { q:'What is the payback period for solar?', a:'Most rooftop solar systems recover their investment within approximately 3–5 years through electricity bill savings. After that, you continue enjoying low-cost electricity for many years.' },
  ]},
  { category:'Government Subsidy', items:[
    { q:'Is government subsidy available for rooftop solar?', a:'Yes. Government subsidy is available for eligible residential rooftop solar systems under central government schemes such as PM Surya Ghar Yojana.' },
    { q:'How can I apply for subsidy?', a:'Sologix assists customers throughout the subsidy application and approval process, including documentation and DISCOM coordination.' },
    { q:'What is PM Surya Ghar Yojana?', a:'PM Surya Ghar Yojana is a Government of India initiative promoting rooftop solar installations for households with subsidy benefits to help reduce electricity expenses. Subsidies range from ₹30,000 (1 kW) to ₹78,000 (3 kW+).' },
  ]},
  { category:'Installation', items:[
    { q:'How many days does solar installation take?', a:'Installation usually takes around 2–7 days depending on the project size, rooftop condition, and approval process.' },
    { q:'Is rooftop drilling required during installation?', a:'In most cases, limited drilling is required for mounting structures safely and securely. Proper waterproofing and safety measures are followed during installation.' },
    { q:'Will there be a power cut during installation?', a:'Normally, there is minimal or no interruption in power supply. Temporary shutdowns may be required during final electrical connections.' },
  ]},
  { category:'Maintenance', items:[
    { q:'How often should solar panels be cleaned?', a:'Solar panels should ideally be cleaned once every 1–2 weeks, especially during dusty seasons, to maintain maximum efficiency.' },
    { q:'What is the lifespan of solar panels?', a:'High-quality solar panels generally last 25 years or more with proper maintenance and continue generating electricity efficiently over the long term.' },
    { q:'Does Sologix provide AMC and maintenance services?', a:'Yes. Sologix provides comprehensive operation and maintenance (O&M) support for installed systems to ensure smooth performance.' },
  ]},
  { category:'Warranty', items:[
    { q:'What warranty is provided on solar panels?', a:'Solar panels typically come with long-term performance and product warranties provided by the manufacturer.' },
    { q:'Is service warranty included?', a:'Yes. Sologix provides service support and maintenance assistance for installed systems.' },
    { q:'What is the inverter warranty period?', a:'Inverter warranty generally ranges from 5 to 10 years depending on the brand and model selected.' },
  ]},
];

const FAQ = () => {
  const { t } = useT();
  const [open, setOpen] = useState({});
  const toggle = (key) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-r from-[#006948] to-[#059669] py-20 text-white text-center">
        <h1 className="text-5xl font-bold mb-4">{t('Frequently Asked Questions')}</h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">{t('Everything you need to know about solar energy and Sologix services')}</p>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 lg:px-16">
          {faqs.map(({ category, items }) => (
            <div key={category} className="mb-12">
              <h2 className="text-2xl font-bold text-[#006948] mb-6 pb-2 border-b-2 border-green-100">{t(category)}</h2>
              <div className="space-y-3">
                {items.map(({ q, a }, i) => {
                  const key = `${category}-${i}`;
                  return (
                    <div key={key} className="border border-gray-100 rounded-2xl overflow-hidden">
                      <button
                        onClick={() => toggle(key)}
                        className="w-full flex justify-between items-center p-5 text-left bg-gray-50 hover:bg-green-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-800 pr-4">{t(q)}</span>
                        <span className={`text-[#006948] text-xl flex-shrink-0 transition-transform ${open[key] ? 'rotate-45' : ''}`}>+</span>
                      </button>
                      {open[key] && (
                        <div className="p-5 bg-white border-t border-gray-100">
                          <p className="text-gray-600 leading-relaxed">{t(a)}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="text-center mt-12 bg-[#EFF6FF] rounded-3xl p-10">
            <h3 className="text-2xl font-bold mb-4">{t('Still have questions?')}</h3>
            <p className="text-gray-600 mb-6">{t('Our team is happy to help. Get in touch for a free consultation.')}</p>
            <a href="/booking" className="inline-block bg-[#006948] text-white px-10 py-4 rounded-full font-medium hover:bg-green-700 transition-all">{t('Get Free Consultation')}</a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default FAQ;
