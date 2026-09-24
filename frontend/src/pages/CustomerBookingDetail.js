import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { BRANDING } from '../utils/branding';
import BrandLogo from '../components/BrandLogo';
import { useT } from '../i18n';
import LanguageToggle from '../i18n/LanguageToggle';

const CustomerBookingDetail = () => {
  const navigate = useNavigate();
  const { t, locale } = useT();
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      navigate('/portal/login');
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        const token = localStorage.getItem('customerToken');
        const response = await axios.get(`${BRANDING.apiUrl}/customer/bookings/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBooking(response.data.data);
      } catch (error) {
        toast.error(t('Failed to fetch booking details'));
        navigate('/portal');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
    // t only translates the error toast; re-fetching on a language switch isn't needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, bookingId]);

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    navigate('/portal/login');
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
      { 
        id: 1, 
        name: 'Booking Confirmed', 
        description: 'Your booking has been confirmed',
        done: ['confirmed', 'completed'].includes(booking.status),
        date: booking.status === 'confirmed' ? booking.updated_at : null
      },
      { 
        id: 2, 
        name: 'Materials Ordered', 
        description: 'Solar panels and equipment ordered',
        done: ['materials_ordered', 'site_preparation', 'installation', 'testing', 'completed'].includes(booking.work_progress),
        date: booking.work_progress === 'materials_ordered' ? booking.updated_at : null
      },
      { 
        id: 3, 
        name: 'Site Preparation', 
        description: 'Preparing installation site',
        done: ['site_preparation', 'installation', 'testing', 'completed'].includes(booking.work_progress),
        date: booking.work_progress === 'site_preparation' ? booking.updated_at : null
      },
      { 
        id: 4, 
        name: 'Installation', 
        description: 'Solar panels being installed',
        done: ['installation', 'testing', 'completed'].includes(booking.work_progress),
        date: booking.work_progress === 'installation' ? booking.updated_at : null
      },
      { 
        id: 5, 
        name: 'Testing & Handover', 
        description: 'System testing and handover',
        done: ['testing', 'completed'].includes(booking.work_progress),
        date: booking.work_progress === 'testing' ? booking.updated_at : null
      },
      { 
        id: 6, 
        name: 'Completed', 
        description: 'Installation completed successfully',
        done: booking.work_progress === 'completed',
        date: booking.work_progress === 'completed' ? booking.updated_at : null
      }
    ];
    return steps;
  };

  const getDeliveryStatusInfo = (status) => {
    const statuses = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending', icon: '⏳' },
      ordered: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Ordered', icon: '📦' },
      shipped: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'In Transit', icon: '🚚' },
      delivered: { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered', icon: '✅' },
      not_applicable: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'N/A', icon: '—' }
    };
    return statuses[status] || statuses.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">{t('Booking not found')}</p>
          <Link to="/portal" className="text-green-600 hover:text-green-700">
            ← {t('Back to Portal')}
          </Link>
        </div>
      </div>
    );
  }

  const progressSteps = getProgressSteps(booking);
  const completedSteps = progressSteps.filter(s => s.done).length;
  const progressPercentage = Math.round((completedSteps / progressSteps.length) * 100);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center gap-2">
            <Link to="/portal" className="flex items-center space-x-3 min-w-0">
              <BrandLogo size="sm" />
              <div className="min-w-0">
                <span className="text-base sm:text-xl font-bold block truncate">{BRANDING.name}</span>
                <span className="text-green-200 text-sm block -mt-1 truncate">{t('Customer Portal')}</span>
              </div>
            </Link>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              <LanguageToggle compact />
              <button onClick={handleLogout} className="bg-green-600 hover:bg-green-500 px-3 sm:px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
                {t('Logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/portal" className="text-green-600 hover:text-green-700 inline-flex items-center mb-6">
          ← {t('Back to Dashboard')}
        </Link>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{t(booking.service_name)}</h1>
              <p className="text-gray-500">{t('Booking ID: {id}', { id: booking.booking_id })}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {t(booking.status.charAt(0).toUpperCase() + booking.status.slice(1))}
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">{t('Installation Progress')}</h2>
            <span className="text-2xl font-bold text-green-600">{progressPercentage}%</span>
          </div>
          
          <div className="relative">
            <div className="h-2 bg-gray-200 rounded-full mb-8">
              <div 
                className="h-2 bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="grid grid-cols-6 gap-2">
              {progressSteps.map((step, index) => (
                <div key={step.id} className="text-center">
                  <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 ${
                    step.done 
                      ? 'bg-green-500 text-white' 
                      : index === completedSteps 
                        ? 'bg-green-100 text-green-600 border-2 border-green-500' 
                        : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step.done ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.id
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-700">{t(step.name)}</p>
                  <p className="text-xs text-gray-500 hidden lg:block">{t(step.description)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📦</span> {t('Delivery Status')}
            </h3>
            
            {booking.delivery_status && booking.delivery_status !== 'not_applicable' ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    getDeliveryStatusInfo(booking.delivery_status).bg
                  } ${getDeliveryStatusInfo(booking.delivery_status).text}`}>
                    {getDeliveryStatusInfo(booking.delivery_status).icon} {t(getDeliveryStatusInfo(booking.delivery_status).label)}
                  </span>
                  {booking.delivery_date && (
                    <span className="text-sm text-gray-600">
                      {new Date(booking.delivery_date).toLocaleDateString(locale, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                </div>
                {booking.delivery_notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {booking.delivery_notes}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">{t('Delivery not applicable for this service')}</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📅</span> {t('Installation Schedule')}
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">{t('Scheduled Date')}</p>
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
                  <p className="text-gray-500">{t('To be scheduled')}</p>
                )}
              </div>
              
              {booking.installation_completed_date && (
                <div>
                  <p className="text-sm text-gray-500">{t('Completed On')}</p>
                  <p className="text-lg font-semibold text-green-600">
                    {new Date(booking.installation_completed_date).toLocaleDateString(locale, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              )}

              {booking.installation_notes && (
                <div>
                  <p className="text-sm text-gray-500">{t('Notes')}</p>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                    {booking.installation_notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('Booking Details')}</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">{t('Service')}</p>
                <p className="font-medium text-gray-800">{t(booking.service_name)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('Initial Appointment')}</p>
                <p className="font-medium text-gray-800">
                  {t('{date} at {time}', {
                    date: new Date(booking.appointment_date).toLocaleDateString(locale, {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    }),
                    time: booking.appointment_time
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('Duration')}</p>
                <p className="font-medium text-gray-800">{t('{n} hours', { n: booking.service_duration || booking.duration_hours })}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">{t('Booking Type')}</p>
                <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                  {t('Free Booking — No Payment Required')}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('Total Amount')}</p>
                <p className="text-2xl font-bold text-green-600">{t('Free')}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">{t('Booking Date')}</p>
                <p className="font-medium text-gray-800">
                  {new Date(booking.created_at).toLocaleDateString(locale)}
                </p>
              </div>
            </div>
          </div>

          {booking.service_description && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-500 mb-2">{t('Service Description')}</p>
              <p className="text-gray-700">{t(booking.service_description)}</p>
            </div>
          )}

          {booking.service_features && (
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-2">{t('Features Included')}</p>
              <div className="flex flex-wrap gap-2">
                {(typeof booking.service_features === 'string' 
                  ? JSON.parse(booking.service_features) 
                  : booking.service_features || []
                ).map((feature, index) => (
                  <span key={index} className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm">
                    {t(feature)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerBookingDetail;
