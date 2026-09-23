import AdminLayout from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { adminAPI } from '../../utils/api';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) { navigate('/admin/login'); return; }
    loadAll();
  }, [navigate]);

  const loadAll = async () => {
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        adminAPI.getDashboardStats(),
        adminAPI.getBookings({ limit: 5, page: 1 })
      ]);
      setStats(statsRes.data.data);
      setBookings(bookingsRes.data.data?.bookings || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const refresh = () => { setRefreshing(true); loadAll(); };

  const statusColor = (s) => ({
    pending: 'bg-yellow-100 text-yellow-700',
    confirmed: 'bg-green-100 text-green-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-600');

  const paymentColor = (s) => ({
    completed: 'bg-green-100 text-green-700',
    pending: 'bg-orange-100 text-orange-700',
    failed: 'bg-red-100 text-red-700',
    pending_verification: 'bg-blue-100 text-blue-700',
  }[s] || 'bg-gray-100 text-gray-600');

  if (loading) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
    </div>
  );

  const statCards = [
    { title:'Total Bookings', value: stats?.totalBookings || 0, icon:'📋', bg:'bg-blue-500', light:'bg-blue-50', text:'text-blue-700', link:'/admin/bookings' },
    { title:'Pending', value: stats?.pendingBookings || 0, icon:'⏳', bg:'bg-yellow-500', light:'bg-yellow-50', text:'text-yellow-700', link:'/admin/bookings?status=pending' },
    { title:'Confirmed', value: stats?.confirmedBookings || 0, icon:'✅', bg:'bg-green-500', light:'bg-green-50', text:'text-green-700', link:'/admin/bookings?status=confirmed' },
    { title:'Completed', value: stats?.completedBookings || 0, icon:'🎉', bg:'bg-purple-500', light:'bg-purple-50', text:'text-purple-700', link:'/admin/bookings?status=completed' },
    { title:"Today's Appointments", value: stats?.todayBookings || 0, icon:'📅', bg:'bg-indigo-500', light:'bg-indigo-50', text:'text-indigo-700', link:'/admin/bookings' },
    { title:'Total Revenue', value:`₹${(stats?.totalRevenue||0).toLocaleString('en-IN')}`, icon:'💰', bg:'bg-emerald-500', light:'bg-emerald-50', text:'text-emerald-700', link:'/admin/transactions' },
  ];

  const quickActions = [
    { to:'/admin/bookings', icon:'📋', label:'All Bookings', bg:'bg-blue-50', text:'text-blue-700', hover:'hover:bg-blue-100' },
    { to:'/admin/bookings?status=pending', icon:'⏳', label:'Pending', bg:'bg-yellow-50', text:'text-yellow-700', hover:'hover:bg-yellow-100' },
    { to:'/admin/services', icon:'⚙️', label:'Services', bg:'bg-green-50', text:'text-green-700', hover:'hover:bg-green-100' },
    { to:'/admin/customers', icon:'👥', label:'Customers', bg:'bg-purple-50', text:'text-purple-700', hover:'hover:bg-purple-100' },
    { to:'/admin/transactions', icon:'💳', label:'Transactions', bg:'bg-indigo-50', text:'text-indigo-700', hover:'hover:bg-indigo-100' },
    { to:'/admin/subadmins', icon:'🔐', label:'Sub-Admins', bg:'bg-gray-50', text:'text-gray-700', hover:'hover:bg-gray-100' },
    { to:'/admin/whatsapp', icon:'💬', label:'WhatsApp', bg:'bg-emerald-50', text:'text-emerald-700', hover:'hover:bg-emerald-100' },
    { to:'/', icon:'🌐', label:'View Website', bg:'bg-orange-50', text:'text-orange-700', hover:'hover:bg-orange-100' },
    { to:'/crm', icon:'🎯', label:'CRM Portal', bg:'bg-[#006948]/10', text:'text-[#006948]', hover:'hover:bg-[#006948]/20', highlight: true },
  ];

  return (
    <AdminLayout title="Dashboard">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome back 👋</h2>
          <p className="text-sm text-gray-500 mt-1">{new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <button onClick={refresh} disabled={refreshing}
          className="flex items-center gap-2 bg-white border border-gray-200 px-4 py-2 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">
          <span className={refreshing ? 'animate-spin' : ''}>🔄</span> Refresh
        </button>
      </div>

      {/* CRM Portal Banner */}
      <div className="bg-gradient-to-r from-[#0f1623] to-[#1a2235] rounded-2xl border border-[#006948]/30 p-5 flex items-center gap-5 mb-2">
        <div className="w-14 h-14 bg-[#006948] rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">🎯</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-bold text-base">Marketing & Sales CRM Portal</h3>
          <p className="text-gray-400 text-sm mt-0.5">Full lead pipeline, visitor tracking, HubSpot integration, email automation & more</p>
        </div>
        <Link to="/crm" className="flex-shrink-0 bg-[#006948] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors whitespace-nowrap">
          Open CRM →
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map(({ title, value, icon, bg, light, text, link }) => (
          <Link key={title} to={link}
            className={"bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all group"}>
            <div className={"w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-3 " + light}>
              {icon}
            </div>
            <p className="text-xs text-gray-500 font-medium">{title}</p>
            <p className={"text-2xl font-bold mt-1 " + text}>{value}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        {/* Recent Bookings */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-800">Recent Bookings</h3>
            <Link to="/admin/bookings" className="text-xs text-green-700 font-medium hover:underline">View All →</Link>
          </div>
          {bookings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs text-gray-400 font-medium pb-3">Booking ID</th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-3">Customer</th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-3">Service</th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-3">Date</th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-3">Status</th>
                    <th className="text-left text-xs text-gray-400 font-medium pb-3">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {bookings.map(b => (
                    <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 font-mono text-xs text-gray-600">{b.booking_id}</td>
                      <td className="py-3 font-medium text-gray-800">{b.customer_name || '—'}</td>
                      <td className="py-3 text-gray-600 max-w-[120px] truncate">{b.service_name}</td>
                      <td className="py-3 text-gray-600 whitespace-nowrap">
                        {new Date(b.appointment_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short' })}
                      </td>
                      <td className="py-3">
                        <span className={"text-xs px-2 py-1 rounded-full font-medium capitalize " + statusColor(b.status)}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className={"text-xs px-2 py-1 rounded-full font-medium capitalize " + paymentColor(b.payment_status)}>
                          {b.payment_status?.replace('_', ' ') || '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <p className="text-sm">No bookings yet</p>
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-semibold text-gray-800">Upcoming</h3>
            <Link to="/admin/bookings" className="text-xs text-green-700 font-medium hover:underline">View All →</Link>
          </div>
          {stats?.upcomingBookings?.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingBookings.slice(0, 6).map(b => (
                <div key={b.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">📅</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 text-sm truncate">{b.customer_name || 'Customer'}</p>
                    <p className="text-xs text-gray-500 truncate">{b.service_name}</p>
                    <p className="text-xs text-green-700 font-medium mt-1">
                      {new Date(b.appointment_date).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })} · {b.appointment_time?.slice(0,5)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">🗓️</div>
              <p className="text-sm">No upcoming appointments</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-base font-semibold text-gray-800 mb-5">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickActions.map(({ to, icon, label, bg, text, hover }) => (
            <Link key={label} to={to}
              className={"flex flex-col items-center gap-2 p-4 rounded-2xl transition-all text-center " + bg + " " + hover}>
              <span className="text-2xl">{icon}</span>
              <span className={"text-xs font-semibold " + text}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
