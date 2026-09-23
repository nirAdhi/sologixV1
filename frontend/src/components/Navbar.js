import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';

const PRODUCT_CATEGORIES = [
  { label: 'All Products',        to: '/products',                                    icon: '☀️', desc: 'Browse full catalog' },
  { label: 'Solar Panels',        to: '/products?category=Solar+Panels',              icon: '🔆', desc: 'Adani, Tata, Rayzon, ZEN' },
  { label: 'On-Grid Inverters',   to: '/products?category=On-Grid+Inverters',         icon: '⚡', desc: 'Deye, Growatt, Microtek' },
  { label: 'Hybrid Inverters',    to: '/products?category=Hybrid+Inverters',          icon: '🔋', desc: 'LuxPower, Deye Hybrid' },
  { label: 'Lithium Batteries',   to: '/products?category=Lithium+Batteries',         icon: '🔌', desc: 'Bi-Tech, Solis — LiFePO4' },
  { label: 'BOS & Accessories',   to: '/products?category=BOS+%26+Accessories',       icon: '🛠️', desc: 'Cables, boxes, mounting' },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const closeTimer = useRef(null);
  const openDropdown = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setProductOpen(true); };
  const closeDropdown = () => { closeTimer.current = setTimeout(() => setProductOpen(false), 300); };
  const location = useLocation();

  const links = [
    { to: '/subsidies', label: 'Subsidies' },
    { to: '/become-partner', label: 'Become Partner' },
    { to: '/solar-calculator', label: 'Calculator' },
    { to: '/about', label: 'About Us' },
    { to: '/faq', label: 'FAQ' },
    { to: '/contact', label: 'Contact Us' },
  ];

  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header className="bg-white/95 backdrop-blur-md top-0 sticky z-[100] border-b border-gray-100 shadow-sm">
      <nav className="flex justify-between items-center max-w-[1280px] mx-auto px-4 lg:px-8 py-2">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0" style={{marginLeft:'-120px'}}>
          <Link to="/" className="outline-none focus:outline-none block">
            <img src="https://res.cloudinary.com/dsiratycd/image/upload/logo_yo5zg9.png" alt="Sologix Energy"
              className="h-16 w-auto select-none"
               />
          </Link>
        </div>

        {/* Desktop links */}
        <div className="hidden xl:flex items-center gap-1">
          {/* Home */}
          <Link to="/" className={`text-sm font-medium px-3 py-2 rounded-md transition-colors whitespace-nowrap ${isActive('/') ? 'text-[#006948] bg-green-50 font-semibold' : 'text-gray-800 hover:text-[#006948] hover:bg-gray-50'}`}>Home</Link>

          <Link to="/services" className={`text-sm font-medium px-3 py-2 rounded-md transition-colors whitespace-nowrap ${isActive('/services') ? 'text-[#006948] bg-green-50 font-semibold' : 'text-gray-800 hover:text-[#006948] hover:bg-gray-50'}`}>Our Services</Link>

          {/* Products dropdown */}
          <div className="relative" onMouseEnter={openDropdown} onMouseLeave={closeDropdown}>
            <Link to="/products"
              className={`flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-md transition-colors whitespace-nowrap ${isActive('/products') ? 'text-[#006948] bg-green-50 font-semibold' : 'text-gray-800 hover:text-[#006948] hover:bg-gray-50'}`}>
              Products
              <svg className={"w-3 h-3 transition-transform " + (productOpen ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>

            {productOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Shop by Category</p>
                </div>
                {PRODUCT_CATEGORIES.map(({ label, to, icon, desc }) => (
                  <Link key={label} to={to} onClick={() => setProductOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-colors group">
                    <span className="text-xl w-8 text-center flex-shrink-0">{icon}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800 group-hover:text-[#006948]">{label}</p>
                      <p className="text-xs text-gray-400">{desc}</p>
                    </div>
                  </Link>
                ))}
                <div className="px-4 py-2 border-t border-gray-50 mt-1">
                  <Link to="/products" onClick={() => setProductOpen(false)}
                    className="block text-center text-xs font-semibold text-[#006948] hover:underline">
                    View All Products →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {links.map(({ to, label }) => (
            <Link key={to} to={to}
              className={`text-sm font-medium px-3 py-2 rounded-md transition-colors whitespace-nowrap ${isActive(to) ? 'text-[#006948] bg-green-50 font-semibold' : 'text-gray-800 hover:text-[#006948] hover:bg-gray-50'}`}>
              {label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link to="/admin/login"
            className="text-xs font-medium text-gray-500 hover:text-[#006948] border border-gray-200 px-3 py-1.5 rounded-full hover:border-[#006948] transition-all whitespace-nowrap hidden sm:block">
            Login
          </Link>
          <Link to="/booking"
            className="bg-[#006948] text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-green-700 transition-all whitespace-nowrap hidden sm:block">
            Free Consultation
          </Link>
          <button className="xl:hidden text-gray-600 ml-1" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
            </svg>
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="xl:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-1">
          <Link to="/" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-[#006948] py-1.5">Home</Link>
          <Link to="/services" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-[#006948] py-1.5">Our Services</Link>
          <div className="py-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Products</p>
            {PRODUCT_CATEGORIES.map(({ label, to, icon }) => (
              <Link key={label} to={to} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#006948] py-1.5 pl-2">
                <span className="text-base">{icon}</span> {label}
              </Link>
            ))}
          </div>
          {links.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-gray-600 hover:text-[#006948] py-1.5">
              {label}
            </Link>
          ))}
          <Link to="/booking" onClick={() => setMobileOpen(false)}
            className="block text-center bg-[#006948] text-white px-5 py-2.5 rounded-full text-sm font-medium mt-3">
            Free Consultation
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;