import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { BRANDING } from '../utils/branding';
import BrandLogo from '../components/BrandLogo';
import { useT } from '../i18n';
import LanguageToggle from '../i18n/LanguageToggle';

const CustomerPortal = () => {
  const navigate = useNavigate();
  const { t, locale } = useT();
  const [customer, setCustomer] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [editProfile, setEditProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const customerData = localStorage.getItem('customerData');
    
    if (!token || !customerData) {
      navigate('/portal/login');
      return;
    }

    setCustomer(JSON.parse(customerData));
    fetchBookings();
    // t only translates the error toast; re-fetching on a language switch isn't needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const fetchBookings = async () => {
    try {
      const token = localStorage.getItem('customerToken');
      const response = await axios.get(`${BRANDING.apiUrl}/customer/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data.data || []);
    } catch (error) {
      toast.error(t('Failed to fetch bookings'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    navigate('/portal/login');
  };

  const handleEditProfile = () => {
    setProfileData({
      name: customer?.name || '',
      phone: customer?.phone || '',
      address: customer?.address || '',
      email: customer?.email || ''
    });
    setEditProfile(true);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('customerToken');
      await axios.put(`${BRANDING.apiUrl}/customer/profile`, profileData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const updatedCustomer = { ...customer, ...profileData };
      setCustomer(updatedCustomer);
      localStorage.setItem('customerData', JSON.stringify(updatedCustomer));
      toast.success(t('Profile updated successfully!'));
      setEditProfile(false);
    } catch (error) {
      toast.error(t(error.response?.data?.message || 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('Passwords do not match'));
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error(t('Password must be at least 6 characters'));
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('customerToken');
      await axios.put(`${BRANDING.apiUrl}/customer/change-password`, passwordData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t('Password changed successfully!'));
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(t(error.response?.data?.message || 'Failed to change password'));
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getProgressSteps = (booking) => {
    const steps = [
      { id: 1, name: 'Booking Confirmed', done: ['confirmed', 'completed'].includes(booking.status) },
      { id: 2, name: 'Materials Ordered', done: ['materials_ordered', 'site_preparation', 'installation', 'testing', 'completed'].includes(booking.work_progress) },
      { id: 3, name: 'Site Preparation', done: ['site_preparation', 'installation', 'testing', 'completed'].includes(booking.work_progress) },
      { id: 4, name: 'Installation', done: ['installation', 'testing', 'completed'].includes(booking.work_progress) },
      { id: 5, name: 'Testing & Handover', done: ['testing', 'completed'].includes(booking.work_progress) },
      { id: 6, name: 'Completed', done: booking.work_progress === 'completed' }
    ];
    return steps;
  };

  const getDeliveryStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending' },
      ordered: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Ordered' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Transit' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
      not_applicable: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'N/A' }
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  const activeBookings = bookings.filter(b => ['pending', 'confirmed'].includes(b.status));
  const completedBookings = bookings.filter(b => b.status === 'completed');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center space-x-3 min-w-0">
              <BrandLogo size="sm" />
              <div className="min-w-0">
                <span className="text-base sm:text-xl font-bold block truncate">{BRANDING.name}</span>
                <span className="text-green-200 text-sm block -mt-1 truncate">{t('Customer Portal')}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <span className="text-green-100 hidden md:inline">{t('Welcome, {name}', { name: customer?.name || '' })}</span>
              <LanguageToggle compact />
              <button onClick={handleLogout} className="bg-green-600 hover:bg-green-500 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
                {t('Logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`py-4 px-1 font-medium border-b-2 transition-colors ${
                activeTab === 'dashboard'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('Dashboard')}
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`py-4 px-1 font-medium border-b-2 transition-colors ${
                activeTab === 'bookings'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('My Bookings')}
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 font-medium border-b-2 transition-colors ${
                activeTab === 'profile'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t('Profile')}
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <>
            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{t('Active Bookings')}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{activeBookings.length}</p>
                  </div>
                  <div className="bg-blue-100 rounded-full p-3">
                    <span className="text-2xl">📋</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{t('Completed')}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{completedBookings.length}</p>
                  </div>
                  <div className="bg-green-100 rounded-full p-3">
                    <span className="text-2xl">✅</span>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{t('Total Bookings')}</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{bookings.length}</p>
                  </div>
                  <div className="bg-purple-100 rounded-full p-3">
                    <span className="text-2xl">📊</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Bookings with Progress */}
            <h2 className="text-xl font-bold text-gray-800 mb-4">{t('Active Projects')}</h2>
            {activeBookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <span className="text-4xl mb-4 block">☀️</span>
                <p className="text-gray-500 mb-4">{t('No active bookings')}</p>
                <Link to="/booking" className="btn-primary inline-block">
                  {t('Book a Service')}
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {activeBookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-xl shadow overflow-hidden">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{t(booking.service_name)}</h3>
                          <p className="text-gray-500 text-sm">{t('Booking ID: {id}', { id: booking.booking_id })}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                          {t(booking.status.charAt(0).toUpperCase() + booking.status.slice(1))}
                        </span>
                      </div>

                      {/* Progress Steps */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center">
                          {getProgressSteps(booking).map((step, index) => (
                            <div key={step.id} className="flex flex-col items-center flex-1">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                step.done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'
                              }`}>
                                {step.done ? '✓' : step.id}
                              </div>
                              <span className="text-xs text-center mt-2 text-gray-600 hidden md:block">
                                {t(step.name)}
                              </span>
                              {index < getProgressSteps(booking).length - 1 && (
                                <div className={`absolute h-1 w-full top-4 -z-10 ${
                                  getProgressSteps(booking)[index + 1]?.done ? 'bg-green-500' : 'bg-gray-200'
                                }`} style={{ left: '50%' }} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Delivery Info */}
                      {booking.delivery_status && booking.delivery_status !== 'not_applicable' && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-700">{t('Delivery Status')}</p>
                              <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${
                                getDeliveryStatusBadge(booking.delivery_status).bg
                              } ${getDeliveryStatusBadge(booking.delivery_status).text}`}>
                                {t(getDeliveryStatusBadge(booking.delivery_status).label)}
                              </span>
                            </div>
                            {booking.delivery_date && (
                              <div className="text-right">
                                <p className="text-sm font-medium text-gray-700">{t('Expected Delivery')}</p>
                                <p className="text-sm text-gray-600">
                                  {new Date(booking.delivery_date).toLocaleDateString(locale, {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric'
                                  })}
                                </p>
                              </div>
                            )}
                          </div>
                          {booking.delivery_notes && (
                            <p className="text-sm text-gray-600 mt-2">{booking.delivery_notes}</p>
                          )}
                        </div>
                      )}

                      {/* Installation Info */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{t('Installation Date')}</p>
                            {booking.installation_scheduled_date ? (
                              <p className="text-lg font-semibold text-green-600">
                                {new Date(booking.installation_scheduled_date).toLocaleDateString(locale, {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </p>
                            ) : (
                              <p className="text-sm text-gray-500">{t('To be scheduled')}</p>
                            )}
                          </div>
                          {booking.appointment_date && (
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-700">{t('Initial Appointment')}</p>
                              <p className="text-sm text-gray-600">
                                {t('{date} at {time}', { date: new Date(booking.appointment_date).toLocaleDateString(locale), time: booking.appointment_time })}
                              </p>
                            </div>
                          )}
                        </div>
                        {booking.installation_notes && (
                          <p className="text-sm text-gray-600 mt-2">{booking.installation_notes}</p>
                        )}
                      </div>

                      <Link
                        to={`/portal/booking/${booking.booking_id}`}
                        className="mt-4 text-green-600 hover:text-green-700 font-medium text-sm inline-block"
                      >
                        {t('View Full Details')} →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'bookings' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">{t('All Bookings')}</h2>
              <Link to="/booking" className="btn-primary">
                {t('New Booking')}
              </Link>
            </div>

            {bookings.length === 0 ? (
              <div className="bg-white rounded-xl shadow p-8 text-center">
                <span className="text-4xl mb-4 block">📋</span>
                <p className="text-gray-500">{t('No bookings found')}</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Booking ID')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Service')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Date')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Status')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Progress')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('Status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <Link to={`/portal/booking/${booking.booking_id}`} className="text-green-600 hover:text-green-700 font-medium">
                            {booking.booking_id}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-gray-800">{t(booking.service_name)}</td>
                        <td className="px-6 py-4 text-gray-600">
                          {new Date(booking.appointment_date).toLocaleDateString(locale)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                            {t(booking.status.charAt(0).toUpperCase() + booking.status.slice(1))}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ 
                                  width: `${(getProgressSteps(booking).filter(s => s.done).length / 6) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500">
                              {Math.round((getProgressSteps(booking).filter(s => s.done).length / 6) * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-800">
                          <span className="text-green-600 font-semibold">{t('Free')}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {activeTab === 'profile' && (
          <div className="max-w-2xl space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">{t('My Profile')}</h2>
            
            {/* Profile Information */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{t('Profile Information')}</h3>
                {!editProfile && (
                  <button 
                    onClick={handleEditProfile}
                    className="text-sm px-4 py-2 rounded-lg"
                    style={{ backgroundColor: BRANDING.colors.primary[600], color: 'white' }}
                  >
                    {t('Edit Profile')}
                  </button>
                )}
              </div>
              
              {editProfile ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Full Name')}</label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Phone Number')}</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Email Address')}</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                      className="input-field"
                      disabled
                    />
                    <p className="text-xs text-gray-500 mt-1">{t('Email cannot be changed')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{t('Address')}</label>
                    <textarea
                      value={profileData.address}
                      onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                      className="input-field"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleSaveProfile}
                      disabled={saving}
                      className="px-4 py-2 rounded-lg text-white"
                      style={{ backgroundColor: BRANDING.colors.primary[600] }}
                    >
                      {saving ? t('Saving...') : t('Save Changes')}
                    </button>
                    <button
                      onClick={() => setEditProfile(false)}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700"
                    >
                      {t('Cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500">{t('Name')}</label>
                    <p className="text-lg text-gray-800">{customer?.name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">{t('Email')}</label>
                    <p className="text-lg text-gray-800">{customer?.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">{t('Phone')}</label>
                    <p className="text-lg text-gray-800">{customer?.phone || t('Not provided')}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500">{t('Address')}</label>
                    <p className="text-lg text-gray-800">{customer?.address || t('Not provided')}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-xl shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('Change Password')}</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Current Password')}</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="input-field"
                    placeholder={t('Enter current password')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('New Password')}</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="input-field"
                    placeholder={t('Min 6 characters')}
                    minLength={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('Confirm New Password')}</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="input-field"
                    placeholder={t('Confirm new password')}
                  />
                </div>
                <button
                  onClick={handleChangePassword}
                  disabled={saving || !passwordData.currentPassword || !passwordData.newPassword}
                  className="px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: BRANDING.colors.primary[600] }}
                >
                  {saving ? t('Changing...') : t('Change Password')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerPortal;
