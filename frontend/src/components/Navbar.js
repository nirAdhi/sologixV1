import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useT } from '../i18n';
import LanguageToggle from '../i18n/LanguageToggle';
import { catalogAPI } from '../utils/api';

// Product categories come from GET /api/catalog/categories (admin-managed).
// Known names keep their icon/description; new categories get the default icon.
const CATEGORY_META = {
  'Solar Panels':      { icon: '🔆', desc: 'Adani, Tata, Rayzon, ZEN' },
  'On-Grid Inverters': { icon: '⚡', desc: 'Deye, Growatt, Microtek' },
  'Hybrid Inverters':  { icon: '🔋', desc: 'LuxPower, Deye Hybrid' },
  'Lithium Batteries': { icon: '🔌', desc: 'Bi-Tech, Solis — LiFePO4' },
  'BOS & Accessories': { icon: '🛠️', desc: 'Cables, boxes, mounting' },
};
const FALLBACK_CATEGORIES = Object.keys(CATEGORY_META); // used if the request fails
const ALL_PRODUCTS_ITEM = { label: 'All Products', to: '/products', icon: '☀️', desc: 'Browse full catalog' };
const categoryItem = (name) => ({
  label: name,
  to: '/products?' + new URLSearchParams({ category: name }).toString(), // e.g. /products?category=BOS+%26+Accessories
  icon: (CATEGORY_META[name] && CATEGORY_META[name].icon) || '☀️',
  desc: (CATEGORY_META[name] && CATEGORY_META[name].desc) || '',
});

// One request per page load, shared by every Navbar mount.
let categoriesPromise = null;
const loadCategories = () => {
  if (!categoriesPromise) {
    categoriesPromise = catalogAPI.getCategories()
      .then(r => {
        const data = r && r.data && r.data.data;
        if (!Array.isArray(data)) throw new Error('bad response');
        const seen = new Set();
        return data.map(c => (typeof c === 'string' ? c.trim() : '')).filter(c => c && c !== 'All Products' && !seen.has(c) && seen.add(c));
      })
      .catch(() => { categoriesPromise = null; return FALLBACK_CATEGORIES; });
  }
  return categoriesPromise;
};

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productOpen, setProductOpen] = useState(false);
  const closeTimer = useRef(null);
  const openDropdown = () => { if (closeTimer.current) clearTimeout(closeTimer.current); setProductOpen(true); };
  const closeDropdown = () => { closeTimer.current = setTimeout(() => setProductOpen(false), 300); };
  const location = useLocation();
  const { t } = useT();
  const [categoryNames, setCategoryNames] = useState(FALLBACK_CATEGORIES);

  useEffect(() => {
    let alive = true;
    loadCategories().then(list => { if (alive) setCategoryNames(list); });
    return () => { alive = false; };
  }, []);

  const PRODUCT_CATEGORIES = [ALL_PRODUCTS_ITEM, ...categoryNames.map(categoryItem)];

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
        {/* was a fixed -120px margin, which pushed the logo off-screen below ~1500px wide (all phones and most laptops) */}
        <div className="flex items-center flex-shrink-0 2xl:-ml-[120px]">
          <Link to="/" className="outline-none focus:outline-none block">
            <img src="https://res.cloudinary.com/dsiratycd/image/upload/logo_yo5zg9.png" alt="Sologix Energy"
              className="h-16 w-auto select-none"
               />
          </Link>
        </div>

        {/* Desktop links */}
        <div className="hidden xl:flex items-center gap-1">
          {/* Home */}
          <Link to="/" className={`text-sm font-medium px-3 py-2 rounded-md transition-colors whitespace-nowrap ${isActive('/') ? 'text-[#006948] bg-green-50 font-semibold' : 'text-gray-800 hover:text-[#006948] hover:bg-gray-50'}`}>{t('Home')}</Link>

          <Link to="/services" className={`text-sm font-medium px-3 py-2 rounded-md transition-colors whitespace-nowrap ${isActive('/services') ? 'text-[#006948] bg-green-50 font-semibold' : 'text-gray-800 hover:text-[#006948] hover:bg-gray-50'}`}>{t('Our Services')}</Link>

          {/* Products dropdown */}
          <div className="relative" onMouseEnter={openDropdown} onMouseLeave={closeDropdown}>
            <Link to="/products"
              className={`flex items-center gap-1 text-sm font-medium px-3 py-2 rounded-md transition-colors whitespace-nowrap ${isActive('/products') ? 'text-[#006948] bg-green-50 font-semibold' : 'text-gray-800 hover:text-[#006948] hover:bg-gray-50'}`}>
              {t('Products')}
              <svg className={"w-3 h-3 transition-transform " + (productOpen ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Link>

            {productOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 max-h-[75vh] overflow-y-auto">
                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{t('Shop by Category')}</p>
                </div>
                {PRODUCT_CATEGORIES.map(({ label, to, icon, desc }) => (
                  <Link key={label} to={to} onClick={() => setProductOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-green-50 transition-colors group">
                    <span className="text-xl w-8 text-center flex-shrink-0">{icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 group-hover:text-[#006948] line-clamp-2">{t(label)}</p>
                      {desc && <p className="text-xs text-gray-400 line-clamp-1">{t(desc)}</p>}
                    </div>
                  </Link>
                ))}
                <div className="px-4 py-2 border-t border-gray-50 mt-1">
                  <Link to="/products" onClick={() => setProductOpen(false)}
                    className="block text-center text-xs font-semibold text-[#006948] hover:underline">
                    {t('View All Products')} →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {links.map(({ to, label }) => (
            <Link key={to} to={to}
              className={`text-sm font-medium px-3 py-2 rounded-md transition-colors whitespace-nowrap ${isActive(to) ? 'text-[#006948] bg-green-50 font-semibold' : 'text-gray-800 hover:text-[#006948] hover:bg-gray-50'}`}>
              {t(label)}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <LanguageToggle compact />
          <Link to="/login"
            className="text-xs font-medium text-gray-500 hover:text-[#006948] border border-gray-200 px-3 py-1.5 rounded-full hover:border-[#006948] transition-all whitespace-nowrap hidden sm:block">
            {t('Login')}
          </Link>
          <Link to="/booking"
            className="bg-[#006948] text-white px-4 py-2 rounded-full text-xs font-semibold hover:bg-green-700 transition-all whitespace-nowrap hidden sm:block">
            {t('Free Consultation')}
          </Link>
          <button className="xl:hidden text-gray-600 ml-1" onClick={() => setMobileOpen(!mobileOpen)} aria-label={t('Toggle menu')}>
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
          <Link to="/" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-[#006948] py-1.5">{t('Home')}</Link>
          <Link to="/services" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-[#006948] py-1.5">{t('Our Services')}</Link>
          <div className="py-1">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{t('Products')}</p>
            {PRODUCT_CATEGORIES.map(({ label, to, icon }) => (
              <Link key={label} to={to} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#006948] py-1.5 pl-2">
                <span className="text-base">{icon}</span> {t(label)}
              </Link>
            ))}
          </div>
          {links.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-gray-600 hover:text-[#006948] py-1.5">
              {t(label)}
            </Link>
          ))}
          <Link to="/login" onClick={() => setMobileOpen(false)} className="block text-sm font-medium text-gray-600 hover:text-[#006948] py-1.5 sm:hidden">{t('Login')}</Link>
          <Link to="/booking" onClick={() => setMobileOpen(false)}
            className="block text-center bg-[#006948] text-white px-5 py-2.5 rounded-full text-sm font-medium mt-3">
            {t('Free Consultation')}
          </Link>
        </div>
      )}
    </header>
  );
};

export default Navbar;