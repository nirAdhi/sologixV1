import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/crm',               icon: '📊', label: 'Dashboard' },
  { to: '/crm/leads',         icon: '🎯', label: 'Leads & Pipeline' },
  { to: '/crm/visitors',      icon: '👁️', label: 'Visitor Tracking' },
  { to: '/crm/capture',       icon: '🪤', label: 'Lead Capture' },
  { to: '/crm/communication', icon: '📧', label: 'Communication' },
  { to: '/crm/integrations',  icon: '🔌', label: 'Integrations' },
];

const THEMES = [
  {
    id: 'dark',
    name: 'Midnight',
    preview: ['#0f1623', '#1a2235', '#006948'],
    sidebar: '#0f1623',
    sidebarBorder: 'rgba(255,255,255,0.1)',
    header: '#0f1623',
    headerBorder: 'rgba(255,255,255,0.1)',
    content: '#030712',
    card: '#1a2235',
    cardBorder: 'rgba(255,255,255,0.05)',
    accent: '#006948',
    accentHover: '#059669',
    textPrimary: '#ffffff',
    textSecondary: '#9ca3af',
    textMuted: '#6b7280',
    navActive: '#006948',
    navHover: 'rgba(255,255,255,0.05)',
  },
  {
    id: 'light',
    name: 'Daylight',
    preview: ['#ffffff', '#f1f5f9', '#006948'],
    sidebar: '#ffffff',
    sidebarBorder: 'rgba(0,0,0,0.08)',
    header: '#ffffff',
    headerBorder: 'rgba(0,0,0,0.08)',
    content: '#f1f5f9',
    card: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.08)',
    accent: '#006948',
    accentHover: '#059669',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    navActive: '#006948',
    navHover: 'rgba(0,105,72,0.06)',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    preview: ['#0c1a2e', '#0f2847', '#0ea5e9'],
    sidebar: '#0c1a2e',
    sidebarBorder: 'rgba(14,165,233,0.15)',
    header: '#0c1a2e',
    headerBorder: 'rgba(14,165,233,0.15)',
    content: '#050e1a',
    card: '#0f2847',
    cardBorder: 'rgba(14,165,233,0.1)',
    accent: '#0ea5e9',
    accentHover: '#38bdf8',
    textPrimary: '#e0f2fe',
    textSecondary: '#7dd3fc',
    textMuted: '#475569',
    navActive: '#0ea5e9',
    navHover: 'rgba(14,165,233,0.08)',
  },
  {
    id: 'forest',
    name: 'Forest',
    preview: ['#0a1f0e', '#122b17', '#16a34a'],
    sidebar: '#0a1f0e',
    sidebarBorder: 'rgba(22,163,74,0.15)',
    header: '#0a1f0e',
    headerBorder: 'rgba(22,163,74,0.15)',
    content: '#040d06',
    card: '#122b17',
    cardBorder: 'rgba(22,163,74,0.1)',
    accent: '#16a34a',
    accentHover: '#22c55e',
    textPrimary: '#dcfce7',
    textSecondary: '#86efac',
    textMuted: '#4b7a56',
    navActive: '#16a34a',
    navHover: 'rgba(22,163,74,0.08)',
  },
  {
    id: 'violet',
    name: 'Violet',
    preview: ['#13071e', '#1e0f33', '#8b5cf6'],
    sidebar: '#13071e',
    sidebarBorder: 'rgba(139,92,246,0.15)',
    header: '#13071e',
    headerBorder: 'rgba(139,92,246,0.15)',
    content: '#080310',
    card: '#1e0f33',
    cardBorder: 'rgba(139,92,246,0.1)',
    accent: '#8b5cf6',
    accentHover: '#a78bfa',
    textPrimary: '#ede9fe',
    textSecondary: '#c4b5fd',
    textMuted: '#6d4fa0',
    navActive: '#8b5cf6',
    navHover: 'rgba(139,92,246,0.08)',
  },
  {
    id: 'rose',
    name: 'Rose',
    preview: ['#1a0810', '#2d0f1a', '#e11d48'],
    sidebar: '#1a0810',
    sidebarBorder: 'rgba(225,29,72,0.15)',
    header: '#1a0810',
    headerBorder: 'rgba(225,29,72,0.15)',
    content: '#0a0308',
    card: '#2d0f1a',
    cardBorder: 'rgba(225,29,72,0.1)',
    accent: '#e11d48',
    accentHover: '#fb7185',
    textPrimary: '#ffe4e6',
    textSecondary: '#fda4af',
    textMuted: '#7c2d3a',
    navActive: '#e11d48',
    navHover: 'rgba(225,29,72,0.08)',
  },
];

const CRMLayout = ({ children, title }) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [themeId, setThemeId] = useState(() => localStorage.getItem('crm_theme') || 'dark');

  const theme = THEMES.find(t => t.id === themeId) || THEMES[0];

  const applyTheme = (t) => {
    setThemeId(t.id);
    localStorage.setItem('crm_theme', t.id);
    setShowThemes(false);
  };

  const isActive = (path) =>
    path === '/crm' ? location.pathname === '/crm' : location.pathname.startsWith(path);

  const css = {
    sidebar: { backgroundColor: theme.sidebar, borderRight: `1px solid ${theme.sidebarBorder}`, minHeight: '100vh' },
    header:  { backgroundColor: theme.header, borderBottom: `1px solid ${theme.headerBorder}` },
    content: { backgroundColor: theme.content },
    card:    { backgroundColor: theme.card, borderColor: theme.cardBorder },
    accent:  { backgroundColor: theme.accent },
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: theme.content }}>
      {/* Sidebar */}
      <aside className={"flex flex-col transition-all duration-300 flex-shrink-0 " + (collapsed ? 'w-16' : 'w-60')} style={css.sidebar}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5" style={{ borderBottom: `1px solid ${theme.sidebarBorder}` }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0 text-sm" style={{ backgroundColor: theme.accent }}>CRM</div>
          {!collapsed && (
            <div>
              <p className="font-bold text-sm" style={{ color: theme.textPrimary }}>Sologix CRM</p>
              <p className="text-xs" style={{ color: theme.textMuted }}>Marketing Portal</p>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="ml-auto text-xs transition-colors"
            style={{ color: theme.textMuted }}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV.map(({ to, icon, label }) => (
            <Link key={to} to={to}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm"
              style={{
                backgroundColor: isActive(to) ? theme.navActive : 'transparent',
                color: isActive(to) ? '#ffffff' : theme.textSecondary,
              }}
              onMouseEnter={e => { if (!isActive(to)) e.currentTarget.style.backgroundColor = theme.navHover; }}
              onMouseLeave={e => { if (!isActive(to)) e.currentTarget.style.backgroundColor = 'transparent'; }}>
              <span className="text-base flex-shrink-0">{icon}</span>
              {!collapsed && <span className="font-medium">{label}</span>}
            </Link>
          ))}
        </nav>

        {/* Theme picker */}
        <div className="px-2 pb-2" style={{ borderTop: `1px solid ${theme.sidebarBorder}` }}>
          <div className="relative">
            <button onClick={() => setShowThemes(!showThemes)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-xs mt-2"
              style={{ color: theme.textSecondary }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.navHover}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
              <span>🎨</span>
              {!collapsed && (
                <div className="flex items-center gap-2 flex-1">
                  <span className="font-medium">Theme</span>
                  <div className="flex gap-1 ml-auto">
                    {theme.preview.map((c, i) => (
                      <span key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }}></span>
                    ))}
                  </div>
                </div>
              )}
            </button>

            {/* Theme dropdown */}
            {showThemes && (
              <div className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl shadow-2xl z-50 p-3 space-y-1"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.cardBorder}` }}>
                <p className="text-xs font-semibold mb-2 px-1" style={{ color: theme.textMuted }}>CHOOSE THEME</p>
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => applyTheme(t)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all"
                    style={{
                      backgroundColor: themeId === t.id ? theme.accent + '20' : 'transparent',
                      border: themeId === t.id ? `1px solid ${theme.accent}40` : '1px solid transparent',
                    }}
                    onMouseEnter={e => { if (themeId !== t.id) e.currentTarget.style.backgroundColor = theme.navHover; }}
                    onMouseLeave={e => { if (themeId !== t.id) e.currentTarget.style.backgroundColor = 'transparent'; }}>
                    <div className="flex gap-1">
                      {t.preview.map((c, i) => (
                        <span key={i} className={"rounded-full " + (i === 0 ? 'w-5 h-5' : 'w-3 h-3 mt-1')} style={{ backgroundColor: c }}></span>
                      ))}
                    </div>
                    <span className="text-xs font-medium" style={{ color: themeId === t.id ? theme.accent : theme.textSecondary }}>{t.name}</span>
                    {themeId === t.id && <span className="ml-auto text-xs" style={{ color: theme.accent }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Link to="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs"
            style={{ color: theme.textMuted }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.navHover}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <span>⚙️</span>{!collapsed && 'Back to Admin'}
          </Link>
          <Link to="/"
            className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-xs"
            style={{ color: theme.textMuted }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = theme.navHover}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
            <span>🌐</span>{!collapsed && 'View Website'}
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="px-6 py-4 flex items-center justify-between" style={css.header}>
          <div>
            <h1 className="font-bold text-lg" style={{ color: theme.textPrimary }}>{title || 'CRM Portal'}</h1>
            <p className="text-xs" style={{ color: theme.textMuted }}>
              {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-xs font-medium" style={{ color: theme.accent === '#006948' ? '#34d399' : theme.accent }}>Live</span>
            {/* Theme quick toggle in header */}
            <button onClick={() => setShowThemes(!showThemes)}
              title="Change Theme"
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-all"
              style={{ backgroundColor: theme.navHover || 'rgba(255,255,255,0.05)', color: theme.textSecondary }}>
              🎨
            </button>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: theme.accent }}>SA</div>
          </div>
        </header>

        {/* Content — pass theme via data attribute so child pages can use it */}
        <main className="flex-1 p-6 overflow-y-auto" style={css.content}
          data-theme={themeId}>
          {/* Inject theme CSS vars for child pages */}
          <style>{`
            [data-theme="${themeId}"] .crm-card {
              background-color: ${theme.card} !important;
              border-color: ${theme.cardBorder} !important;
            }
            [data-theme="${themeId}"] .crm-text-primary { color: ${theme.textPrimary} !important; }
            [data-theme="${themeId}"] .crm-text-secondary { color: ${theme.textSecondary} !important; }
            [data-theme="${themeId}"] .crm-text-muted { color: ${theme.textMuted} !important; }
            [data-theme="${themeId}"] .crm-accent { background-color: ${theme.accent} !important; }
            [data-theme="${themeId}"] .crm-accent-text { color: ${theme.accent} !important; }
            [data-theme="${themeId}"] .crm-input {
              background-color: ${theme.content} !important;
              border-color: ${theme.cardBorder} !important;
              color: ${theme.textPrimary} !important;
            }
            [data-theme="${themeId}"] .bg-\\[\\#1a2235\\] { background-color: ${theme.card} !important; }
            [data-theme="${themeId}"] .bg-\\[\\#0f1623\\] { background-color: ${theme.sidebar} !important; }
            [data-theme="${themeId}"] .bg-gray-950 { background-color: ${theme.content} !important; }
            [data-theme="${themeId}"] .text-white { color: ${theme.textPrimary} !important; }
            [data-theme="${themeId}"] .text-gray-400, [data-theme="${themeId}"] .text-gray-500 { color: ${theme.textSecondary} !important; }
            [data-theme="${themeId}"] .text-gray-600 { color: ${theme.textMuted} !important; }
            [data-theme="${themeId}"] .border-white\\/5, [data-theme="${themeId}"] .border-white\\/10 { border-color: ${theme.cardBorder} !important; }
            [data-theme="${themeId}"] .bg-white\\/5 { background-color: ${theme.navHover} !important; }
            [data-theme="${themeId}"] .bg-\\[\\#006948\\] { background-color: ${theme.accent} !important; }
            [data-theme="${themeId}"] .text-green-400 { color: ${theme.accent} !important; }
          `}</style>
          {children}
        </main>
      </div>
    </div>
  );
};

export default CRMLayout;
