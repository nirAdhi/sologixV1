import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { avatarUrl } from '../utils/avatar';

const HomePage = () => {
  useEffect(() => {
    // Counter animation
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

    // Scroll animations
    const scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.transform = 'translateY(0)';
          entry.target.style.opacity = '1';
        }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reason-card, .process-step').forEach(el => scrollObserver.observe(el));

    return () => { counterObserver.disconnect(); scrollObserver.disconnect(); };
  }, []);
  const HERO_VIDEOS = [
    'https://res.cloudinary.com/dsiratycd/video/upload/v1780431091/gemini_generated_video_70213f58_wjemga.mp4',
    'https://res.cloudinary.com/dsiratycd/video/upload/v1780431090/Create_a_second_ultra_re_1_sgawv9.mp4',
    'https://res.cloudinary.com/dsiratycd/video/upload/v1780431090/Create_a_second_ultra_re_ddarqt.mp4',
  ];
  const videoRef = useRef(null);
  const videoIndexRef = useRef(0);

  const playNext = useCallback(() => {
    videoIndexRef.current = (videoIndexRef.current + 1) % HERO_VIDEOS.length;
    const vid = videoRef.current;
    if (!vid) return;
    vid.src = HERO_VIDEOS[videoIndexRef.current];
    vid.load();
    vid.play().catch(() => {});
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
    container.scrollTo({ left: activeItem.offsetLeft - container.clientWidth / 2 + activeItem.clientWidth / 2, behavior: 'smooth' });
  };

  const partners = [
    'sakra','sdsm','startupindia','tata-motors','undp','usaid','windworld','xavier-college',
    'ayana','ces','clean','dbms','dps','dvc','estate','germi','jbvnl','jusco',
    'manipal','metafin','panasonic','prfi','raj','rgc'
  ];

  // Testimonials from API
  const [testimonials, setTestimonials] = useState([]);
  useEffect(() => {
    fetch('/api/testimonials')
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.length) setTestimonials(d.data); })
      .catch(() => {});
  }, []);

  const solarImgs = [
    'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=300&fit=crop',
    'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=600&h=300&fit=crop',
  ];
  const staticTestimonials = [
    { id:'s1', name:'Subhash Jha', role:'Head - Administration', company:'Ranchi Gymkhana Club', location:'Ranchi, Jharkhand', capacity:'40 kW', savings:'Rs 3,36,000/yr', rating:5, photo_url:'', installation_photo: solarImgs[0], review:'Overall experience was pleasing. The company and team were customer focused throughout the installation process. I recommend this company for solar installation.' },
    { id:'s2', name:'Arun K. Singh', role:'IAS - DC - Jharkhand Govt.', company:'', location:'Ranchi, Jharkhand', capacity:'3 kW', savings:'Rs 25,200/yr', rating:5, photo_url:'', installation_photo: solarImgs[1], review:'Team Sologix have done a brilliant job. My solar system is generating perfectly. I would recommend Sologix Energy for solar installation.' },
    { id:'s3', name:'R. C. Nandraj', role:'Trustee', company:'Dayanand Public School', location:'Jamshedpur, Jharkhand', capacity:'40 kW', savings:'Rs 3,36,000/yr', rating:5, photo_url:'', installation_photo: solarImgs[2], review:'These young engineers have provided outstanding service. Generation warranty that no other installer provides. Excellent company!' },
    { id:'s4', name:'H. P. Biyani', role:'Founder', company:'Raj Ceramics', location:'Ranchi, Jharkhand', capacity:'55 kW', savings:'Rs 4,20,000/yr', rating:5, photo_url:'', installation_photo: solarImgs[3], review:'Young, dynamic and well qualified technical team. I would highly recommend Sologix Energy for rooftop solar installation.' },
    { id:'s5', name:'S. Chandrashekar', role:'Chairman', company:'D.B.M.S English School', location:'Jamshedpur, Jharkhand', capacity:'100 kW', savings:'Rs 8,40,000/yr', rating:5, photo_url:'', installation_photo: solarImgs[4], review:'Technically best solar team in Jharkhand. Very professional, courteous, and respectful. I recommend Sologix Energy.' },
    { id:'s6', name:'Sandesh Narvane', role:'Manager', company:'CMS Kerala Bhavan', location:'Pune, Maharashtra', capacity:'30 kW', savings:'Rs 6,30,000/yr', rating:5, photo_url:'', installation_photo: solarImgs[5], review:'Sologix Energy did a marvellous job. We are enjoying almost zero electric bills after solar installation.' },
  ];
  const displayTestimonials = testimonials.length > 0 ? testimonials : staticTestimonials;

  // Mini calculator state
  const [calcBill, setCalcBill] = useState('Rs 2,001 - 5,000');
  const [calcService, setCalcService] = useState('residential');
  const [activeStep, setActiveStep] = useState(null);

  const billMap = { 'Rs 500 - 2,000': 1250, 'Rs 2,001 - 5,000': 3500, 'Rs 5,001 - 15,000': 10000, 'Above Rs 15,000': 22000 };
  const tariffMap = { residential: 6.5, commercial: 8.0, industrial: 7.5 };
  const quickCalc = () => {
    const bill = billMap[calcBill] || 3500;
    const tariff = tariffMap[calcService] || 6.5;
    const units = bill / tariff;
    const kw = Math.max(1, Math.ceil((units / 30 / (4.5 * 0.85)) * 4) / 4);
    const panels = Math.ceil((kw * 1000) / 545);
    const cost = Math.round(kw * 56000);
    const subsidy = calcService === 'residential' ? (kw >= 3 ? 78000 : kw >= 2 ? 60000 : 30000) : 0;
    const landed = Math.max(cost - subsidy, 0);
    const savings = Math.round(units * 0.95 * tariff * 12); // Annual savings
    const roi = (landed / savings).toFixed(1);
    return { kw: kw.toFixed(1), panels, savings: savings.toLocaleString('en-IN'), roi, subsidy: subsidy.toLocaleString('en-IN') };
  };
  const preview = quickCalc();

  return (
    <>
      <style>{`
        .carousel-item{transition:all 0.5s cubic-bezier(0.4,0,0.2,1);flex-shrink:0;width:300px;opacity:0.6;transform:scale(0.85)}
        .carousel-item.active{opacity:1;transform:scale(1.1);width:450px;z-index:10}
        .focused-carousel-container{display:flex;align-items:center;justify-content:center;gap:2rem;overflow-x:hidden;padding:2rem 0}
        @media(max-width:768px){.carousel-item{width:240px}.carousel-item.active{width:300px}}
        .reason-card,.process-step{transition:transform 0.6s ease,opacity 0.6s ease}
        .social-float a{transition:transform 0.2s ease}
        .social-float a:hover{transform:scale(1.15)}
        .partners-track{display:flex;gap:0.75rem;animation:scrollX 30s linear infinite;width:max-content}
        .partners-track:hover{animation-play-state:paused}
        @keyframes scrollX{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        .testimonial-track{display:flex;animation:slideTestimonials 40s linear infinite;width:max-content;padding:1rem 0}
        .testimonial-track:hover{animation-play-state:paused}
        @keyframes slideTestimonials{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
      `}</style>

      {/* ── Floating Social Icons (links from Admin → Site Content) ── */}
      {(() => {
        const sl = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('sologix_social_links') || 'null') || {
              youtube:'https://youtube.com/@amitranjan77?si=vUV44DvPrmbHTZwz',
              facebook:'https://www.facebook.com/profile.php?id=61590621923412',
              instagram:'https://www.instagram.com/sologix_energy_ranchi?igsh=czdqcXI1dGMycHly',
            }
          : {};
        return (
          <div className="social-float fixed right-4 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
            {sl.youtube && (
              <a href={sl.youtube} target="_blank" rel="noreferrer" title="YouTube"
                className="w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg"
                style={{background:'#FF0000'}}>
                <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
                  <path d="M44 12.7a5.5 5.5 0 0 0-3.9-3.9C36.6 8 24 8 24 8S11.4 8 7.9 8.8A5.5 5.5 0 0 0 4 12.7C3.2 16.2 3.2 24 3.2 24s0 7.8.8 11.3A5.5 5.5 0 0 0 7.9 39.2C11.4 40 24 40 24 40s12.6 0 16.1-.8a5.5 5.5 0 0 0 3.9-3.9c.8-3.5.8-11.3.8-11.3s0-7.8-.8-11.3zM19.6 30.5v-13L31.2 24l-11.6 6.5z" fill="white"/>
                </svg>
              </a>
            )}
            {sl.facebook && (
              <a href={sl.facebook} target="_blank" rel="noreferrer" title="Facebook"
                className="w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg"
                style={{background:'#1877F2'}}>
                <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
                  <path d="M30 8h-4a10 10 0 0 0-10 10v3h-4v6h4v13h7V27h5l1-6h-6v-3a2 2 0 0 1 2-2h4V8z" fill="white"/>
                </svg>
              </a>
            )}
            {sl.instagram && (
              <a href={sl.instagram} target="_blank" rel="noreferrer" title="Instagram"
                className="w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg"
                style={{background:'linear-gradient(135deg,#F58529 0%,#DD2A7B 50%,#8134AF 100%)'}}>
                <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
                  <rect x="8" y="8" width="32" height="32" rx="10" stroke="white" strokeWidth="3" fill="none"/>
                  <circle cx="24" cy="24" r="8" stroke="white" strokeWidth="3" fill="none"/>
                  <circle cx="34.5" cy="13.5" r="2.5" fill="white"/>
                </svg>
              </a>
            )}
            {sl.linkedin && (
              <a href={sl.linkedin} target="_blank" rel="noreferrer" title="LinkedIn"
                className="w-14 h-14 rounded-2xl flex items-center justify-center hover:scale-110 transition-all duration-200 shadow-lg"
                style={{background:'#0A66C2'}}>
                <svg viewBox="0 0 48 48" className="w-10 h-10" fill="none">
                  <path d="M14 20H9v19h5V20zm-2.5-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM39 39h-5v-9.5c0-2.5-1-4.5-3.5-4.5S27 27 27 29.5V39h-5V20h5v2.5c.8-1.5 2.8-3 5.5-3C37 19.5 39 22.5 39 27v12z" fill="white"/>
                </svg>
              </a>
            )}
          </div>
        );
      })()}

      {/* ── Hero ── */}
      <section className="relative h-[85vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            preload="metadata"
            onEnded={playNext}
            className="w-full h-full object-cover"
            src={HERO_VIDEOS[0]}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent"></div>
        </div>
        <div className="container mx-auto px-6 lg:px-16 relative z-10 text-center lg:text-left">
          <div className="max-w-3xl">
            <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-md rounded-full border border-white/20 mb-6">
              <span className="text-white font-medium uppercase tracking-widest text-xs">Jharkhand's Leading Solar Panel Installation Company</span>
            </div>
            <h1 className="text-[44px] md:text-6xl font-bold text-white mb-4 leading-tight">Powering Jharkhand Through Solar, Renewable Energy & Energy Storage Solutions</h1>
            <p className="text-base text-white/80 mb-2 italic">Energizing Naturally</p>
            <p className="text-lg text-white/90 mb-10 max-w-xl">Solar installation, maintenance & our products — making clean energy accessible, reliable and affordable for everyone.</p>
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link to="/booking" className="bg-[#006948] text-white px-8 py-4 rounded-full font-medium flex items-center gap-2 hover:bg-green-700 transition-all">Get a Quote →</Link>
              <Link to="/services" className="bg-white/10 backdrop-blur-md border border-white/30 text-white px-8 py-4 rounded-full font-medium hover:bg-white/20 transition-all">Our Services</Link>
            </div>
          </div>
        </div>

      </section>

      {/* ── Stats Badges ── */}
      <section className="py-12 bg-white border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { target:'7', suffix:'+', label:'Years of Experience' },
              { target:'100', suffix:'+', label:'Satisfied Customers' },
              { target:'50', suffix:'+', label:'Projects Completed' },
              { target:'300', suffix:' MWh', label:'Power Generated' },
            ].map(({ target, suffix, decimals, label }) => (
              <div key={label} className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 hover:border-green-300 hover:shadow-md transition-all">
                <div className="text-3xl md:text-4xl font-bold text-[#006948]" data-target={target} data-suffix={suffix} data-decimals={decimals}>0{suffix}</div>
                <div className="text-sm text-gray-500 mt-2 font-medium">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Offerings ── */}
      <section className="py-24 bg-gray-50 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16 text-center mb-4">
          <p className="text-gray-500 text-sm mb-2">Jharkhand's Leading Solar Panel Installation Company</p>
          <span className="text-[#006948] font-semibold uppercase tracking-[0.2em] block mb-2 text-base">Our Offerings</span>
          <p className="text-gray-400 text-xs italic">Click to explore details about each offering</p>
        </div>
        <div className="focused-carousel-container" id="offerings-carousel">
          {[
            { label:'Residential', desc:'Smart solar solutions for homes & villas.', img:'https://res.cloudinary.com/dsiratycd/image/upload/v1775250334/Gemini_Generated_Image_gqdagugqdagugqda_pbwa73.png', link:'/solutions', active:false },
            { label:'Commercial', desc:'Powering offices, malls & businesses.', img:'https://res.cloudinary.com/dsiratycd/image/upload/v1774797121/comercial_fie2wd.png', link:'/solutions', active:true },
            { label:'Industrial', desc:'High-capacity solar for factories & industries.', img:'https://res.cloudinary.com/dsiratycd/image/upload/v1774797121/Maintanance_mdwhei.png', link:'/solutions', active:false },
          ].map(({ label, desc, img, link, active }) => (
            <Link key={label} to={link} className={`carousel-item${active ? ' active' : ''}`}>
              <div className="relative rounded-[2rem] overflow-hidden aspect-[4/3]">
                <img src={img} alt={label} className="w-full h-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-8 text-left">
                  <h3 className="text-white text-3xl font-bold mb-3">{label}</h3>
                  <p className="text-white/80 text-base">{desc}</p>
                  <span className="text-[#68dba9] text-sm mt-3 font-semibold">Click to learn more →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-4">
          <button onClick={() => moveCarousel('offerings-carousel','prev')} className="w-12 h-12 rounded-full border border-[#006948] text-[#006948] flex items-center justify-center hover:bg-[#006948] hover:text-white transition-all text-2xl">‹</button>
          <button onClick={() => moveCarousel('offerings-carousel','next')} className="w-12 h-12 rounded-full border border-[#006948] text-[#006948] flex items-center justify-center hover:bg-[#006948] hover:text-white transition-all text-2xl">›</button>
        </div>
      </section>


      {/* ── Our Projects ── */}
      <section className="py-24 bg-gray-50">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
          <div className="text-center mb-12">
            <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-4 text-sm">Portfolio</span>
            <h2 className="text-4xl font-bold">Our Projects</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title:'Ranchi Gymkhana Club', location:'Ranchi, Jharkhand', capacity:'40 kW', type:'Commercial', savings:'Rs 3,36,000/yr', img:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=600&h=400&fit=crop' },
              { title:'DBMS English School', location:'Jamshedpur, Jharkhand', capacity:'100 kW', type:'Institutional', savings:'Rs 8,40,000/yr', img:'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=600&h=400&fit=crop' },
              { title:'Raj Ceramics', location:'Hardag, Ranchi', capacity:'55 kW', type:'Industrial', savings:'Rs 4,20,000/yr', img:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=600&h=400&fit=crop' },
              { title:'CMS Kerala Bhavan', location:'Pune, Maharashtra', capacity:'30 kW', type:'Commercial', savings:'Rs 6,30,000/yr', img:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=600&h=400&fit=crop' },
              { title:'Dayanand Public School', location:'Jamshedpur, Jharkhand', capacity:'40 kW', type:'Institutional', savings:'Rs 3,36,000/yr', img:'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=600&h=400&fit=crop' },
              { title:'Solar Mini Grid', location:'Chatra, Jharkhand', capacity:'25 kW', type:'Industrial', savings:'Rs 2,10,000/yr', img:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=600&h=400&fit=crop' },
            ].map(({ title, location, capacity, type, savings, img }) => (
              <div key={title} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-gray-100 group">
                <div className="relative h-52 overflow-hidden">
                  <img src={img} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full border border-gray-100">
                    <span className="text-xs font-medium text-[#006948]">{type}</span>
                  </div>
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
                  <p className="text-gray-500 text-sm mb-3">📍 {location}</p>
                  <div className="flex justify-between items-center border-t border-gray-100 pt-3">
                    <span className="text-xs font-semibold text-[#006948]">{capacity}</span>
                    <span className="text-xs text-green-600 font-medium">{savings}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link to="/projects-gallery" className="inline-flex items-center gap-2 bg-[#006948] text-white px-8 py-3 rounded-full font-medium hover:bg-green-700 transition-all">View All Projects</Link>
          </div>
        </div>
      </section>

      {/* ── Our Products ── */}
      <section className="py-20 bg-white overflow-hidden border-y border-gray-100">
        <div className="text-center mb-10">
          <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-2 text-sm">What We Offer</span>
          <h2 className="text-3xl font-bold">Our Products</h2>
          <p className="text-gray-400 text-xs mt-2 italic">Click any product to view full details</p>
        </div>
        <div className="relative flex overflow-x-hidden">
          <div className="partners-track">
            {[
              { name:'Deye Inverters', spec:'3 kW – 200 kW | On-Grid', img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop' },
              { name:'Growatt Inverters', spec:'Residential & Commercial', img:'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=300&h=200&fit=crop' },
              { name:'LuxPower Hybrid', spec:'3–30 kW | Battery Ready', img:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=300&h=200&fit=crop' },
              { name:'Adani Solar Panels', spec:'580 W – 620 W | DCR', img:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=300&h=200&fit=crop' },
              { name:'Tata Power Solar', spec:'570 W – 600 W', img:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=300&h=200&fit=crop' },
              { name:'Rayzon Solar', spec:'545 W – 550 W', img:'https://images.unsplash.com/photo-1559302504-64aae6ca6b6d?w=300&h=200&fit=crop' },
              { name:'ZEN Energy Panels', spec:'580 W – 600 W', img:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=300&h=200&fit=crop' },
              { name:'Bi-Tech Li-Ion Battery', spec:'5 kWh | Long Cycle Life', img:'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?w=300&h=200&fit=crop' },
              { name:'Solis Storage', spec:'5 kWh | Smart BMS', img:'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=300&h=200&fit=crop' },
              { name:'Microtek Solar', spec:'Home & Small Business', img:'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=300&h=200&fit=crop' },
              // Duplicate for seamless loop
              { name:'Deye Inverters', spec:'3 kW – 200 kW | On-Grid', img:'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop' },
              { name:'Growatt Inverters', spec:'Residential & Commercial', img:'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=300&h=200&fit=crop' },
              { name:'LuxPower Hybrid', spec:'3–30 kW | Battery Ready', img:'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=300&h=200&fit=crop' },
              { name:'Adani Solar Panels', spec:'580 W – 620 W | DCR', img:'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?w=300&h=200&fit=crop' },
              { name:'Tata Power Solar', spec:'570 W – 600 W', img:'https://images.unsplash.com/photo-1497440001374-f26997328c1b?w=300&h=200&fit=crop' },
            ].map(({ name, spec, img }, i) => (
              <Link to="/products" key={i} className="inline-flex flex-col items-center bg-white border border-gray-100 rounded-2xl shadow-sm min-w-[240px] overflow-hidden hover:shadow-md transition-all hover:border-green-200">
                <img src={img} alt={name} className="w-full h-36 object-cover" loading="lazy" />
                <div className="p-4 text-center">
                  <h4 className="font-bold text-sm text-gray-800">{name}</h4>
                  <p className="text-xs text-gray-500 mt-1">{spec}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── PM Surya Yojana ── */}
      <section className="py-24 bg-[#EFF6FF] relative overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="relative">
              <div className="absolute -inset-4 bg-[#006948]/10 rounded-[3rem] blur-2xl"></div>
              <img src="https://res.cloudinary.com/dsiratycd/image/upload/v1780332120/Gemini_Generated_Image_3t00r93t00r93t00_jkpvx2.png" alt="PM Surya Ghar Yojana"
                className="rounded-[2.5rem] shadow-2xl relative z-10 border-8 border-white w-full object-cover"
                onError={e => { e.target.src='https://res.cloudinary.com/dsiratycd/image/upload/v1774797121/comercial_fie2wd.png'; }} />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#006948]/10 rounded-full text-[#006948] font-medium text-sm mb-6">✅ Government Initiative</div>
              <h2 className="text-4xl font-bold mb-6">PM Surya Ghar: Muft Bijli Yojana</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">India's flagship rooftop solar scheme — eligible households receive up to <strong>300 units of free electricity</strong> every month with direct government subsidy support.</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {[
                  { icon:'₹', label:'₹30,000 subsidy for 1 kW' },
                  { icon:'₹', label:'₹60,000 subsidy for 2 kW' },
                  { icon:'₹', label:'Up to ₹78,000 for 3 kW+' },
                  { icon:'⚡', label:'300 Units Free Electricity' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex items-center gap-3 p-4 bg-white rounded-xl shadow-sm">
                    <span className="w-8 h-8 bg-[#006948] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{icon}</span>
                    <span className="text-sm font-semibold text-gray-700">{label}</span>
                  </div>
                ))}
              </div>
              <Link to="/subsidies" className="inline-block bg-[#006948] text-white px-10 py-4 rounded-full font-medium shadow-xl hover:scale-105 transition-all hover:bg-green-700">
                Apply Subsidy Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-24 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16 text-center">
          <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-4 text-sm">The Sologix Advantage</span>
          <h2 className="text-4xl font-bold mb-16">Why Customers Choose Us?</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon:'🏅', title:'Certification', desc:'ISO certified operations meeting global standards of quality and safety.' },
              { icon:'💳', title:'Easy Finance / EMI', desc:'Flexible EMI options from as low as ₹1,000/month. No heavy upfront cost.' },
              { icon:'🏛️', title:'Assistance in Availing Subsidy', desc:'Empanelled with JBVNL & TSUISL. We handle the entire subsidy process for you.' },
              { icon:'💰', title:'Value for Money', desc:'Best ROI with payback in 3–5 years and 20+ years of savings thereafter.' },
              { icon:'🏢', title:'Brand Identity Since 2018', desc:'Jharkhand\'s trusted solar brand founded by IIT, NIT & DTU engineers.' },
              { icon:'🔧', title:'Operation & Maintenance', desc:'5-year comprehensive O&M. Issues resolved within 24 working hours.' },
              { icon:'⭐', title:'Best Quality Equipment', desc:'Premium panels and inverters sourced directly from top manufacturers.' },
              { icon:'📋', title:'Government Subsidy', desc:'PM Surya Ghar Yojana — get up to ₹78,000 subsidy with our guidance.' },
            ].map(({ icon, title, desc }, i) => (
              <div key={title} className="reason-card p-6 rounded-3xl bg-gray-50 border border-gray-100 hover:border-[#006948] transition-all opacity-0 translate-y-10 text-left" style={{ transitionDelay:`${i*80}ms` }}>
                <div className="text-3xl mb-4">{icon}</div>
                <h3 className="font-semibold text-base mb-2">{title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Work Process ── */}
      <section className="py-24 bg-gray-50 overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16 text-center mb-12">
          <h2 className="text-4xl font-bold">Our Work Process</h2>
          <p className="text-gray-500 mt-3">From first survey to final installation</p>
        </div>
        <div className="max-w-4xl mx-auto px-6 mb-12">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200 z-0"></div>
            {[
              { num:'1', label:'On Site Survey', icon:'🔍' },
              { num:'2', label:'Financial Modeling', icon:'📊' },
              { num:'3', label:'System Design', icon:'📐' },
              { num:'4', label:'Project Installation', icon:'🔧' },
              { num:'5', label:'Operations & Maintenance', icon:'📡' },
            ].map(({ num, label, icon }, i) => (
              <div key={num}
                className="process-step flex flex-col items-center z-10 opacity-0 translate-y-10 cursor-pointer group"
                style={{ transitionDelay:`${i*150}ms` }}
                onClick={() => setActiveStep(activeStep === num ? null : num)}
              >
                <div className={"w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold mb-3 shadow-lg transition-all duration-300 " + (activeStep === num ? "bg-white text-[#006948] scale-125 ring-4 ring-[#006948]" : "bg-[#006948] text-white group-hover:scale-110 group-hover:ring-4 group-hover:ring-[#006948]/30")}>
                  {activeStep === num ? icon : num}
                </div>
                <p className={"text-xs font-semibold text-center max-w-[80px] transition-colors " + (activeStep === num ? "text-[#006948]" : "text-gray-600")}>{label}</p>
              </div>
            ))}
          </div>
          {activeStep && (
            <div className="mt-8 bg-white rounded-2xl p-6 shadow-md border border-green-100 animate-fade-in text-center max-w-xl mx-auto">
              {[
                { num:'1', title:'On-Site Survey', desc:'Our experts visit your rooftop to assess space, sunlight, shadow patterns, and energy consumption to design the perfect system.' },
                { num:'2', title:'Financial Modeling', desc:'We calculate your ROI, payback period, savings projections, and applicable PM Surya Ghar subsidies to give you the complete financial picture.' },
                { num:'3', title:'System Design', desc:'Custom engineering of your solar system including panel layout, inverter sizing, cable routing, and structural mounting requirements.' },
                { num:'4', title:'Project Installation', desc:'Our certified technicians install your system safely and efficiently, typically completing the job within 2–7 working days.' },
                { num:'5', title:'Operations & Maintenance', desc:'5-year comprehensive O&M support with IoT monitoring, periodic cleaning, and 24-hour issue resolution guarantee.' },
              ].find(s => s.num === activeStep) && (() => {
                const s = [
                  { num:'1', title:'On-Site Survey', desc:'Our experts visit your rooftop to assess space, sunlight, shadow patterns, and energy consumption to design the perfect system.' },
                  { num:'2', title:'Financial Modeling', desc:'We calculate your ROI, payback period, savings projections, and applicable PM Surya Ghar subsidies to give you the complete financial picture.' },
                  { num:'3', title:'System Design', desc:'Custom engineering of your solar system including panel layout, inverter sizing, cable routing, and structural mounting requirements.' },
                  { num:'4', title:'Project Installation', desc:'Our certified technicians install your system safely and efficiently, typically completing the job within 2–7 working days.' },
                  { num:'5', title:'Operations & Maintenance', desc:'5-year comprehensive O&M support with IoT monitoring, periodic cleaning, and 24-hour issue resolution guarantee.' },
                ].find(x => x.num === activeStep);
                return (<><h4 className="font-bold text-lg text-[#006948] mb-2">Step {s.num}: {s.title}</h4><p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p></>);
              })()}
            </div>
          )}
        </div>
        <div className="focused-carousel-container" id="process-carousel">
          {[
            { num:'01', title:'On-Site Survey', desc:'Our experts visit your rooftop to assess space, sunlight, shadow patterns, and energy consumption to design the perfect system.', icon:'🔍' },
            { num:'02', title:'Financial Modeling', desc:'We calculate your ROI, payback period, savings projections, and applicable subsidies to give you a complete financial picture.', icon:'📊' },
            { num:'03', title:'System Design', desc:'Custom engineering of your solar system including panel layout, inverter sizing, cable routing, and structural requirements.', icon:'📐' },
            { num:'04', title:'Project Installation', desc:'Our certified technicians install your system safely and efficiently, typically completing the job in 2–7 days.', icon:'🔧' },
            { num:'05', title:'Operations & Maintenance', desc:'5-year comprehensive O&M support with IoT monitoring, periodic cleaning, and 24-hour issue resolution.', icon:'📡' },
          ].map(({ num, title, desc, icon }, i) => (
            <div key={num} className={`carousel-item${i === 0 ? ' active' : ''}`}>
              <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-gray-100 h-[320px] flex flex-col justify-center text-center">
                <div className="text-5xl mb-4">{icon}</div>
                <div className="text-sm text-[#006948] font-bold mb-2">{num}</div>
                <h4 className="text-xl font-bold mb-3">{title}</h4>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={() => moveCarousel('process-carousel','prev')} className="w-12 h-12 rounded-full border border-[#006948] text-[#006948] flex items-center justify-center hover:bg-[#006948] hover:text-white transition-all text-2xl">&#8249;</button>
          <button onClick={() => moveCarousel('process-carousel','next')} className="w-12 h-12 rounded-full border border-[#006948] text-[#006948] flex items-center justify-center hover:bg-[#006948] hover:text-white transition-all text-2xl">&#8250;</button>
        </div>
      </section>

      {/* ── Mini Calculator ── */}
      <section className="py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
          <div className="text-center mb-10">
            <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-2 text-sm">Instant Estimate</span>
            <h2 className="text-4xl font-bold">Solar Calculator</h2>
            <p className="text-gray-500 mt-3">Get a quick glimpse of your solar potential — select your bill and service type</p>
          </div>
          <div className="bg-gradient-to-br from-[#e9edff] to-[#d1fae5] rounded-[2.5rem] p-8 lg:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Inputs */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Monthly Bill Range</label>
                    <select value={calcBill} onChange={e => setCalcBill(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] shadow-sm">
                      {['Rs 500 - 2,000','Rs 2,001 - 5,000','Rs 5,001 - 15,000','Above Rs 15,000'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Service Type</label>
                    <select value={calcService} onChange={e => setCalcService(e.target.value)} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] shadow-sm">
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                    </select>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mb-6">* Live estimate based on <strong>Jharkhand tariff (₹6.5/unit residential)</strong>. Tariff varies by state — visit the full calculator to select your state for accurate results.</p>
                <Link to="/solar-calculator" className="inline-flex items-center gap-2 bg-[#006948] text-white px-8 py-4 rounded-full font-semibold hover:bg-green-700 shadow-lg transition-all">
                  Calculate My Savings in Detail →
                </Link>
              </div>
              {/* Live preview */}
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon:'⚡', label:'System Size', value: preview.kw + ' kW', color:'bg-blue-50 border-blue-100' },
                  { icon:'🔲', label:'Solar Panels', value: preview.panels + ' panels', color:'bg-purple-50 border-purple-100' },
                  { icon:'💰', label:'Yearly Savings', value: 'Rs ' + preview.savings, color:'bg-green-50 border-green-100' },
                  { icon:'📈', label:'ROI Period', value: preview.roi + ' years', color:'bg-yellow-50 border-yellow-100' },
                  { icon:'🏛️', label:'Govt Subsidy', value: 'Rs ' + preview.subsidy, color:'bg-red-50 border-red-100', span: true },
                ].map(({ icon, label, value, color, span }) => (
                  <div key={label} className={"bg-white rounded-2xl p-5 border shadow-sm text-center transition-all hover:shadow-md hover:scale-105 " + color + (span ? " col-span-2" : "")}>
                    <div className="text-3xl mb-2">{icon}</div>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <p className="text-lg font-bold text-gray-800">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* ── Testimonials — auto-sliding carousel ── */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-16">
          <div className="text-center mb-12">
            <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-4 text-sm">What Our Customers Say</span>
            <h2 className="text-4xl font-bold">Client Testimonials</h2>
            <p className="text-gray-500 mt-3 text-sm">Real reviews from our satisfied customers across Jharkhand & India</p>
          </div>
        </div>
        {/* Infinite sliding track */}
        <div className="relative">
          <div className="testimonial-track">
            {[...displayTestimonials, ...displayTestimonials].map((t, idx) => {
              const fallbackImg = solarImgs[idx % solarImgs.length];
              const installImg = t.installation_photo || fallbackImg;
              return (
                <div key={idx} className="testimonial-card bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm flex flex-col flex-shrink-0" style={{width:'340px', margin:'0 12px'}}>
                  <div className="relative h-44 overflow-hidden">
                    <img src={installImg} alt="Solar installation" className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                    <div className="absolute bottom-3 left-4 flex gap-0.5">
                      {[1,2,3,4,5].map(s => <span key={s} className={"text-base drop-shadow " + (s <= (t.rating||5) ? 'text-yellow-400' : 'text-white/30')}>★</span>)}
                    </div>
                    {t.capacity && (
                      <div className="absolute top-3 right-3 bg-[#006948] text-white text-xs px-2.5 py-1 rounded-full font-semibold shadow">{t.capacity}</div>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-4 -mt-10 relative z-10">
                      {/* BUGFIX: photo_url was never rendered, so no testimonial photo ever showed. */}
                      {t.photo_url ? (
                        <img
                          src={avatarUrl(t.photo_url)}
                          alt={t.name}
                          loading="lazy"
                          className="w-14 h-14 rounded-full object-cover flex-shrink-0 shadow-lg bg-white"
                          style={{border:'3px solid white'}}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fb = e.currentTarget.nextElementSibling;
                            if (fb) fb.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="w-14 h-14 bg-gradient-to-br from-[#006948] to-green-400 rounded-full items-center justify-center text-white font-bold text-xl flex-shrink-0 shadow-lg" style={{border:'3px solid white', display: t.photo_url ? 'none' : 'flex'}}>
                        {t.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 pt-8">
                        <p className="font-bold text-gray-800 text-sm leading-tight">{t.name}</p>
                        <p className="text-xs text-gray-500 truncate">{[t.role, t.company].filter(Boolean).join(', ')}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed italic flex-1">"{t.review}"</p>
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                      {t.location && <p className="text-xs text-gray-400 flex items-center gap-1"><span>📍</span>{t.location}</p>}
                      {t.savings && <span className="text-xs bg-green-50 text-[#006948] px-2.5 py-1 rounded-full font-semibold">{t.savings}</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Partners & Clients ── */}
      <section className="py-20 bg-gray-50 overflow-hidden border-t border-gray-100">
        <div className="text-center mb-10">
          <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-4 text-sm">Trusted By</span>
          <h2 className="text-3xl font-bold">Our Partners &amp; Clients</h2>
        </div>
        <div className="relative flex overflow-x-hidden">
          <div className="partners-track">
            {[...partners, ...partners].map((p, i) => (
              <div key={i} className="inline-flex items-center justify-center bg-white border border-gray-200 rounded-2xl shadow-sm min-w-[180px] h-32 px-4 hover:shadow-md hover:border-green-300 transition-all">
                <img
                  src={/* served from frontend/public/partners/ (the old sologixenergy.in site no longer exists) */ "/partners/" + p + ".jpg"}
                  alt={p}
                  className="max-h-28 max-w-[160px] object-contain" loading="lazy"
                  onError={e => {
                    e.target.style.display = 'none';
                    if (e.target.parentElement) {
                      const span = document.createElement('span');
                      span.textContent = p;
                      span.style.cssText = 'font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em';
                      e.target.parentElement.replaceChildren(span);
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HomePage;
