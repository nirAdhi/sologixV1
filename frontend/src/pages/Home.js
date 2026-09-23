import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  useEffect(() => {
    const animateCounter = (el) => {
      const target = parseFloat(el.getAttribute('data-target'));
      const suffix = el.getAttribute('data-suffix') || '';
      const decimals = parseInt(el.getAttribute('data-decimals')) || 0;
      const duration = 2000;
      const startTime = performance.now();
      const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * target;
        el.textContent = decimals > 0 ? current.toFixed(decimals) + suffix : Math.floor(current).toLocaleString('en-IN') + suffix;
        if (progress < 1) requestAnimationFrame(update);
      };
      requestAnimationFrame(update);
    };

    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.classList.contains('counted')) {
          entry.target.classList.add('counted');
          animateCounter(entry.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));

    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.transform = 'translateY(0) translateX(0)';
          entry.target.style.opacity = '1';
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reason-card, #subsidy-img-l').forEach(el => scrollObserver.observe(el));

    return () => { counterObserver.disconnect(); scrollObserver.disconnect(); };
  }, []);

  const moveCarousel = (id, direction) => {
    const container = document.getElementById(id);
    if (!container) return;
    const items = container.querySelectorAll('.carousel-item');
    let activeIndex = Array.from(items).findIndex(item => item.classList.contains('active'));
    items[activeIndex].classList.remove('active');
    activeIndex = direction === 'next' ? (activeIndex + 1) % items.length : (activeIndex - 1 + items.length) % items.length;
    items[activeIndex].classList.add('active');
    const activeItem = items[activeIndex];
    const scrollOffset = activeItem.offsetLeft - (container.clientWidth / 2) + (activeItem.clientWidth / 2);
    container.scrollTo({ left: scrollOffset, behavior: 'smooth' });
  };

  return (
    <>
      <style>{`
        .carousel-item { transition: all 0.5s cubic-bezier(0.4,0,0.2,1); flex-shrink:0; width:300px; opacity:0.6; transform:scale(0.85); }
        .carousel-item.active { opacity:1; transform:scale(1.1); width:450px; z-index:10; }
        .focused-carousel-container { display:flex; align-items:center; justify-content:center; gap:2rem; overflow-x:hidden; padding:2rem 0; }
        @media(max-width:768px){ .carousel-item{width:240px} .carousel-item.active{width:300px} }
        .animate-marquee { animation: marquee 25s linear infinite; }
        @keyframes marquee { 0%{transform:translateX(0%)} 100%{transform:translateX(-50%)} }
        .reason-card { transition: transform 0.6s ease, opacity 0.6s ease; }
      `}</style>

      <main>
        {/* ── Hero ── */}
        <section className="relative h-[85vh] flex items-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <video autoPlay loop muted playsInline className="w-full h-full object-cover"
              poster="https://lh3.googleusercontent.com/aida-public/AB6AXuBtdoLQ0IYVRwCKeTUJKMPEr1hiBlM3VZMMm4VWth-9t1APauL0GbLCcQw49whSrc-wrtatIh6qzQ4hiNvrIyaGiNAi7TY5MRWuypnnse8I6_xxN-TxPEYF05WuNAJXxifYOv-3NGMMyDLNNDCBTfguaMG623nKIxweqXGQl2l2G4sReudqTJMuBCsjCeJ-BaincrNteLzNH3dD4EsFQUeUgFEhap-0OY9WZnOQq4OEu99tPh_3F_1izsG0V0QyWhejKnXWAl0noYY">
              <source src="https://static.videezy.com/system/resources/previews/000/039/075/original/Sun_Panels.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
          </div>
          <div className="container mx-auto px-6 lg:px-16 relative z-10 text-center lg:text-left">
            <div className="max-w-3xl">
              <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/20 mb-6">
                <span className="text-white font-medium uppercase tracking-widest text-xs">Jharkhand's #1 Solar Partner</span>
              </div>
              <h1 className="text-[44px] md:text-6xl font-bold text-white mb-6 leading-tight">Turning Sunlight into Savings</h1>
              <p className="text-lg text-white/90 mb-10 max-w-xl">Empowering homes and industries across Jharkhand with reliable, earth-centric energy solutions. Start your green journey today.</p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <Link to="/booking" className="bg-[#006948] text-white px-8 py-4 rounded-full font-medium flex items-center gap-2 hover:bg-green-700 transition-all">
                  Start Saving Now →
                </Link>
                <button className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-full font-medium hover:bg-white/20 transition-all">
                  Watch Process
                </button>
              </div>
            </div>
          </div>
          <div className="absolute right-10 bottom-10 hidden md:block">
            <div className="bg-white/70 backdrop-blur-md p-6 rounded-2xl border border-white/30 shadow-2xl animate-bounce">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#006948] rounded-full flex items-center justify-center text-white text-xl">📞</div>
                <div>
                  <p className="text-xs text-[#006948] font-bold uppercase tracking-wider">Free Consultation</p>
                  <p className="text-sm text-gray-800 font-semibold">Book a call today</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust Badges ── */}
        <section className="py-12 bg-white border-y border-gray-100">
          <div className="max-w-5xl mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { target: '47', suffix: '+', label: 'Years of Experience' },
                { target: '15000', suffix: '+', label: 'Enterprise Clients' },
                { target: '1', suffix: ' GW+', label: 'Installed Capacity' },
                { target: '99.9', suffix: '%', decimals: '1', label: 'System Uptime' },
              ].map(({ target, suffix, decimals, label }) => (
                <div key={label} className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 hover:border-green-300 hover:shadow-md transition-all">
                  <div className="text-3xl md:text-4xl font-bold text-[#006948]" data-target={target} data-suffix={suffix} data-decimals={decimals}>0{suffix}</div>
                  <div className="text-sm text-gray-500 mt-2 font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Offerings Carousel ── */}
        <section className="py-24 bg-gray-50 overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-16 text-center mb-12">
            <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-4 text-sm">What we do</span>
            <h2 className="text-4xl font-bold">Our Offerings</h2>
          </div>
          <div className="focused-carousel-container" id="offerings-carousel">
            {[
              { label: 'Residential', desc: 'Efficient solar solutions for modern homes.', img: 'https://lh3.googleusercontent.com/aida/ADBb0ugC7phNDgbHP7SLNKWgAnkMSuwJrUaTZigi37mSxUNObCqk5tCVHML7_EbXQXf4rGkp0-VyubUZtkuivTAfSXgVNm8diT4N0i8Nv-x8Q4tTz_b32Ov71kwqplUcfInfbMKW9qioYERpBiNo4I2sj2Zo5gVbVj6EDPA8Y7ZFYhHWrh1Tdxq7QeqQAEoYHTPibi5OTdJ602QCjHManAZyRwIKDWfLBJsgerplXS23T5pg1KnyuFBYbx0t_yE', active: false },
              { label: 'Commercial', desc: 'Powering businesses with renewable energy.', img: 'https://lh3.googleusercontent.com/aida/ADBb0ug2ft3tCKYvp2pYsjeiaCBZ22HqLK5Gn3xUX1R4iekt8fu-P6kihESpFVkVrMUNhPs-RugcPYYObeJq2yxWmtJNDN1uGKel12of0bQBiBHXvv0aTe96n_cbFHLMyTRd-icdjUy1XH681LhDqHRuYv8U6jJreWoe2TjmloEj3wjii1Meou0tyDDCy5Q574MR0018g3IlOccWIjCu2Apd8_tOCzB5mSottxkCS8iMCMLnrsF2kOqZcsd26oI', active: true },
              { label: 'Industrial', desc: 'Large scale infrastructure solar projects.', img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBtdoLQ0IYVRwCKeTUJKMPEr1hiBlM3VZMMm4VWth-9t1APauL0GbLCcQw49whSrc-wrtatIh6qzQ4hiNvrIyaGiNAi7TY5MRWuypnnse8I6_xxN-TxPEYF05WuNAJXxifYOv-3NGMMyDLNNDCBTfguaMG623nKIxweqXGQl2l2G4sReudqTJMuBCsjCeJ-BaincrNteLzNH3dD4EsFQUeUgFEhap-0OY9WZnOQq4OEu99tPh_3F_1izsG0V0QyWhejKnXWAl0noYY', active: false },
            ].map(({ label, desc, img, active }) => (
              <div key={label} className={`carousel-item${active ? ' active' : ''}`}>
                <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3]">
                  <img src={img} alt={label} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 text-left">
                    <h3 className="text-white text-2xl font-bold mb-2">{label}</h3>
                    <p className="text-white/70 text-sm">{desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 mt-8">
            <button onClick={() => moveCarousel('offerings-carousel', 'prev')} className="w-12 h-12 rounded-full border border-[#006948] text-[#006948] flex items-center justify-center hover:bg-[#006948] hover:text-white transition-all text-2xl">‹</button>
            <button onClick={() => moveCarousel('offerings-carousel', 'next')} className="w-12 h-12 rounded-full border border-[#006948] text-[#006948] flex items-center justify-center hover:bg-[#006948] hover:text-white transition-all text-2xl">›</button>
          </div>
        </section>

        {/* ── Why Choose Us ── */}
        <section className="py-24 bg-white">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-16 text-center">
            <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-4 text-sm">The Sologix Advantage</span>
            <h2 className="text-4xl font-bold mb-16">Why Customers Trust Us</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: '✅', title: 'ISO Certified', desc: 'Global standards of safety and efficiency in every panel.' },
                { icon: '💳', title: 'Easy EMI', desc: 'Flexible financing with low-interest rates for all.' },
                { icon: '🏛️', title: 'Subsidy Aid', desc: 'Hassle-free documentation and application support.' },
                { icon: '💰', title: 'Value for Money', desc: 'Optimal ROI with long-term savings guaranteed.' },
              ].map(({ icon, title, desc }, i) => (
                <div key={title} className="reason-card p-8 rounded-3xl bg-gray-50 border border-gray-100 hover:border-[#006948] transition-all opacity-0 translate-y-10" style={{ transitionDelay: `${i * 100}ms` }}>
                  <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl mb-6 mx-auto">{icon}</div>
                  <h3 className="font-semibold text-lg mb-3">{title}</h3>
                  <p className="text-gray-500 text-sm">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Featured Projects ── */}
        <section className="py-24 bg-gray-50">
          <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
            <div className="text-center mb-12">
              <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-4 text-sm">Portfolio</span>
              <h2 className="text-4xl font-bold">Our Featured Projects</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: '5MW Commercial Rooftop', location: 'Ranchi, Jharkhand', capacity: '50 kWp', type: 'Commercial', img: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop' },
                { title: '3kW Residential Solar', location: 'Bengaluru, Karnataka', capacity: '5 kWp', type: 'Residential', img: 'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600&h=400&fit=crop' },
                { title: '250kW Industrial Project', location: 'Bokaro, Jharkhand', capacity: '250 kWp', type: 'Industrial', img: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=400&fit=crop' },
                { title: '5kW Shadowless Install', location: 'Kolkata, West Bengal', capacity: '15 kWp', type: 'Residential', img: 'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=400&fit=crop' },
                { title: '10kW Hybrid System', location: 'Mumbai, Maharashtra', capacity: '10 kWp', type: 'Residential', img: 'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=600&h=400&fit=crop' },
                { title: '150kW Manufacturing Unit', location: 'Nagpur, Maharashtra', capacity: '150 kWp', type: 'Commercial', img: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=400&fit=crop' },
              ].map(({ title, location, capacity, type, img }) => (
                <div key={title} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 group">
                  <div className="relative h-56 overflow-hidden">
                    <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-100">
                      <span className="text-xs font-medium text-[#006948]">{type}</span>
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
                    <p className="text-gray-500 text-sm mb-3">📍 {location}</p>
                    <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                      <span className="text-xs text-gray-400 uppercase tracking-wider">Capacity</span>
                      <span className="text-sm font-semibold text-[#006948]">{capacity}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-10">
              <Link to="/gallery" className="inline-flex items-center gap-2 bg-[#006948] text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-all">
                View All Projects →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default Home;
