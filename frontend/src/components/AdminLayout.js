import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import BrandLogo from './BrandLogo';
import { adminAPI } from '../utils/api';

const ADMIN_THEMES = [
  { name:'Emerald',  id:'emerald',  header:'#006948', nav:'#004d34', accent:'#006948', text:'#fff' },
  { name:'Ocean',    id:'ocean',    header:'#1e3a5f', nav:'#152b47', accent:'#2563eb', text:'#fff' },
  { name:'Slate',    id:'slate',    header:'#1e293b', nav:'#0f172a', accent:'#6366f1', text:'#fff' },
  { name:'Rose',     id:'rose',     header:'#9f1239', nav:'#7f1d1d', accent:'#e11d48', text:'#fff' },
  { name:'Amber',    id:'amber',    header:'#92400e', nav:'#78350f', accent:'#d97706', text:'#fff' },
  { name:'Daylight', id:'daylight', header:'#ffffff', nav:'#f1f5f9', accent:'#006948', text:'#1e293b' },
];

const NAV_LINKS = [
  { to: '/admin',               label: 'Dashboard',        perm: null },
  { to: '/admin/leads',         label: 'Leads',            perm: 'manage_leads' },
  { to: '/admin/bookings',      label: 'Bookings',         perm: 'manage_bookings' },
  { to: '/admin/services',      label: 'Services',         perm: 'manage_services' },
  { to: '/admin/customers',     label: 'Customers',        perm: 'manage_customers' },
  { to: '/admin/whatsapp',      label: 'WhatsApp',         perm: 'manage_whatsapp' },
  { to: '/admin/testimonials',  label: 'Testimonials',     perm: 'manage_testimonials' },
  { to: '/admin/projects',      label: 'Projects',         perm: 'manage_services' },
  { to: '/admin/orders',         label: 'Product Orders',   perm: 'manage_bookings' },
  { to: '/admin/catalog',        label: 'Product Catalog',  perm: 'manage_services' },
  { to: '/admin/site-settings', label: 'Site Content',     perm: 'manage_settings' },
  { to: '/admin/subadmins',     label: 'Sub-Admins',       perm: 'manage_subadmins' },
];

export const hasPermission = (admin, perm) => {
  if (!admin) return false;
  if (admin.role === 'super_admin') return true;
  if (!perm) return true;
  const perms = typeof admin.permissions === 'string'
    ? JSON.parse(admin.permissions || '{}')
    : (admin.permissions || {});
  if (perms === '*') return true;
  return !!perms[perm];
};

const AdminLayout = ({ children, title, requiredPerm }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = React.useState(() => {
    const saved = localStorage.getItem('adminTheme');
    return ADMIN_THEMES.find(t => t.id === saved) || ADMIN_THEMES[0];
  });
  const [themeOpen, setThemeOpen] = React.useState(false);
  const applyTheme = (t) => { setTheme(t); localStorage.setItem('adminTheme', t.id); setThemeOpen(false); };

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/admin/login'); return; }
    adminAPI.getMe()
      .then(res => {
        const a = res.data.data;
        setAdmin(a);
        if (requiredPerm && !hasPermission(a, requiredPerm)) {
          navigate('/admin');
        }
      })
      .catch(() => navigate('/admin/login'))
      .finally(() => setLoading(false));
  }, [navigate, requiredPerm]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const isActive = (path) =>
    path === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(path);

  const visibleLinks = NAV_LINKS.filter(({ perm }) => hasPermission(admin, perm));

  const roleLabel = admin?.role === 'super_admin' ? 'Super Admin' : admin?.role === 'admin' ? 'Admin' : 'Staff';

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="shadow" style={{background: theme.header}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center space-x-3">
            <BrandLogo size="md" linkTo="/admin" />
            {title && <span className="hidden sm:block text-lg" style={{color: theme.text, opacity:0.4}}>|</span>}
            {title && <h1 className="hidden sm:block text-lg font-semibold" style={{color: theme.text}}>{title}</h1>}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium">{admin?.name || admin?.email}</span>
              <span className="text-xs" style={{opacity:0.7, color: theme.text}}>{roleLabel}</span>
            </div>
            <Link to="/crm" className="hidden sm:block text-xs px-3 py-1.5 rounded-lg transition-colors" style={{color: theme.text, border: `1px solid ${theme.text}44`}}>
              CRM Portal
            </Link>
            <div className="relative">
            <button onClick={() => setThemeOpen(o => !o)} title="Change theme"
              className="text-sm px-3 py-1.5 rounded-lg transition-colors" style={{color: theme.text, border: `1px solid ${theme.text}44`}}>
              🎨 Theme
            </button>
            {themeOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-50 w-48">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pick Theme</p>
                {ADMIN_THEMES.map(t => (
                  <button key={t.id} onClick={() => applyTheme(t)}
                    className={"flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors " + (theme.id === t.id ? 'font-bold' : '')}>
                    <span className="w-4 h-4 rounded-full flex-shrink-0" style={{background: t.header, border: '2px solid #e5e7eb'}}></span>
                    {t.name} {theme.id === t.id ? '✓' : ''}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button onClick={handleLogout}
              className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors" style={{color: theme.text, border: `1px solid ${theme.text}55`, opacity: 0.85}}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="border-b sticky top-0 z-10 shadow-sm" style={{background: theme.nav}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto whitespace-nowrap scrollbar-hide">
            {visibleLinks.map(({ to, label }) => (
              <Link key={to} to={to}
                className={"py-4 px-3 text-sm font-medium border-b-2 transition-colors " + (isActive(to) ? 'border-white font-semibold' : 'border-transparent hover:border-white/40')} style={{color: theme.text, opacity: isActive(to) ? 1 : 0.75}}>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;
