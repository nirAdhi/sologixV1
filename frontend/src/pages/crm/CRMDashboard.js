import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CRMLayout from '../../components/CRMLayout';
import { leadsAPI, adminAPI } from '../../utils/api';

const StatCard = ({ icon, label, value, sub, color }) => (
  <div className="bg-[#1a2235] rounded-2xl p-5 border border-white/5">
    <div className="flex items-center justify-between mb-3">
      <span className="text-2xl">{icon}</span>
      <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">{sub}</span>
    </div>
    <p className={"text-3xl font-bold mb-1 " + (color || 'text-white')}>{value}</p>
    <p className="text-gray-500 text-sm">{label}</p>
  </div>
);

const STAGES = [
  { key:'new', label:'New Lead', color:'bg-blue-500', icon:'🆕' },
  { key:'contacted', label:'Contacted', color:'bg-yellow-500', icon:'📞' },
  { key:'qualified', label:'Qualified', color:'bg-purple-500', icon:'✅' },
  { key:'proposal_sent', label:'Proposal Sent', color:'bg-orange-500', icon:'📄' },
  { key:'won', label:'Won', color:'bg-green-500', icon:'🏆' },
  { key:'lost', label:'Lost', color:'bg-red-500', icon:'❌' },
];

export default function CRMDashboard() {
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([leadsAPI.getAll(), adminAPI.getDashboardStats()])
      .then(([lr, sr]) => { setLeads(lr.data.data || []); setStats(sr.data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const byStage = (s) => leads.filter(l => l.stage === s).length;
  const totalLeads = leads.length;
  const newToday = leads.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length;
  const wonLeads = byStage('won');
  const convRate = totalLeads ? Math.round((wonLeads / totalLeads) * 100) : 0;

  if (loading) return <CRMLayout title="Dashboard"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-500"></div></div></CRMLayout>;

  return (
    <CRMLayout title="CRM Dashboard">
      <div className="space-y-6">
        {/* Lead KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="👥" label="Total Leads" value={totalLeads} sub="All time" color="text-blue-400" />
          <StatCard icon="🆕" label="New Today" value={newToday} sub="Today" color="text-yellow-400" />
          <StatCard icon="🏆" label="Won" value={wonLeads} sub="Converted" color="text-green-400" />
          <StatCard icon="📈" label="Conversion" value={convRate + '%'} sub="Won/Total" color="text-purple-400" />
        </div>

        {/* Booking KPIs */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon="📋" label="Total Bookings" value={stats.totalBookings || 0} sub="Bookings" color="text-cyan-400" />
            <StatCard icon="⏳" label="Pending" value={stats.pendingBookings || 0} sub="Action needed" color="text-orange-400" />
            <StatCard icon="✅" label="Confirmed" value={stats.confirmedBookings || 0} sub="Confirmed" color="text-green-400" />
            <StatCard icon="💰" label="Revenue" value={'Rs ' + (stats.totalRevenue || 0).toLocaleString('en-IN')} sub="Total" color="text-emerald-400" />
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Pipeline funnel */}
          <div className="lg:col-span-2 bg-[#1a2235] rounded-2xl border border-white/5 p-6">
            <h3 className="text-white font-semibold mb-6">🎯 Sales Pipeline Funnel</h3>
            <div className="space-y-3">
              {STAGES.map(({ key, label, color, icon }) => {
                const count = byStage(key);
                const pct = totalLeads ? Math.round((count / totalLeads) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-400 text-sm">{icon} {label}</span>
                      <span className="text-white font-bold text-sm">{count} <span className="text-gray-600 font-normal text-xs">({pct}%)</span></span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className={"h-full rounded-full " + color} style={{ width: pct + '%', transition:'width 1s ease' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link to="/crm/leads" className="mt-6 block text-center bg-[#006948] text-white py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition-colors">Open Full Pipeline →</Link>
          </div>

          {/* Recent leads */}
          <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">🆕 Recent Leads</h3>
              <Link to="/crm/leads" className="text-xs text-green-400 hover:underline">All leads</Link>
            </div>
            <div className="space-y-3">
              {leads.slice(0, 6).map(lead => (
                <div key={lead.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                  <div className="w-8 h-8 bg-[#006948]/30 rounded-full flex items-center justify-center text-green-400 font-bold text-xs flex-shrink-0">
                    {lead.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate">{lead.name}</p>
                    <p className="text-gray-500 text-xs">{lead.phone}</p>
                  </div>
                  <span className="text-gray-600 text-xs">{new Date(lead.created_at).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}</span>
                </div>
              ))}
              {leads.length === 0 && <p className="text-gray-600 text-sm text-center py-6">No leads yet</p>}
            </div>
          </div>
        </div>

        {/* PRD Module Status */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <h3 className="text-white font-semibold mb-5">📋 PRD Module Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { module:'Visitor Tracking', status:'setup', desc:'Configure GA4 + Microsoft Clarity tracking scripts', link:'/crm/visitors' },
              { module:'Lead Capture', status:'setup', desc:'Exit-intent popups, timed pop-ups, live chat settings', link:'/crm/capture' },
              { module:'CRM Pipeline', status:'live', desc:'Kanban pipeline with 6 stages — fully functional', link:'/crm/leads' },
              { module:'Lead Inbox', status:'live', desc:'Real-time lead management with notes & activity', link:'/crm/leads' },
              { module:'Communication', status:'setup', desc:'Auto-email templates & sales team notifications', link:'/crm/communication' },
              { module:'HubSpot Integration', status:'config', desc:'Connect HubSpot via Private App Token for real-time sync', link:'/crm/integrations' },
            ].map(({ module, status, desc, link }) => (
              <Link key={module} to={link}
                className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors border border-white/5 hover:border-green-500/30 group">
                <div className="flex items-center gap-2 mb-2">
                  <span className={"w-2 h-2 rounded-full flex-shrink-0 animate-pulse " + (status==='live' ? 'bg-green-500' : status==='setup' ? 'bg-yellow-500' : 'bg-blue-500')}></span>
                  <p className="text-white text-sm font-semibold group-hover:text-green-400 transition-colors">{module}</p>
                  <span className={"ml-auto text-xs px-2 py-0.5 rounded-full font-medium " + (status==='live' ? 'bg-green-500/20 text-green-400' : status==='setup' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-blue-500/20 text-blue-400')}>
                    {status==='live' ? '● Live' : status==='setup' ? '◎ Setup' : '⚙ Config'}
                  </span>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </CRMLayout>
  );
}
