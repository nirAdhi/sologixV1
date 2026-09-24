import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingsAPI } from '../utils/api';
import { useT } from '../i18n';
import { BRANDING } from '../utils/branding';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
  const { t, locale } = useT();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const response = await bookingsAPI.getById(bookingId);
        setBooking(response.data.data);
      } catch (err) {
        setError('Booking not found');
      } finally {
        setLoading(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{t(error || 'Booking not found')}</p>
          <Link to="/" className="btn-primary">
            {t('Go Home')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="card p-8 text-center mb-6">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('Booking Confirmed!')}</h1>
          <p className="text-gray-600">
            {t('Your solar installation appointment has been successfully booked.')}
          </p>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <span className="text-gray-600">{t('Booking ID')}</span>
            <span className="text-xl font-bold text-primary-600">{booking.booking_id}</span>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">{t('Service')}</h3>
              <p className="text-gray-800">{t(booking.service_name)}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">{t('Appointment')}</h3>
              <p className="text-gray-800">
                {new Date(booking.appointment_date).toLocaleDateString(locale, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-gray-600">{t('Time: {time}', { time: booking.appointment_time })}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">{t('Contact Details')}</h3>
              <p className="text-gray-800">{booking.customer_name}</p>
              <p className="text-gray-600">{booking.customer_email}</p>
              <p className="text-gray-600">{booking.customer_phone}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">{t('Status')}</h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ {t('Confirmed — Free Booking')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">{t("What's Next?")}</h3>
          <ul className="text-blue-700 text-sm space-y-2">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>{t('A confirmation email has been sent to {email}', { email: booking.customer_email })}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>{t('Our team will contact you within 24 hours to confirm the details')}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>{t("We'll discuss your requirements and provide a detailed quote")}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>{t('Installation will be scheduled at your convenience')}</span>
            </li>
          </ul>
        </div>

        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">{t('Need Help?')}</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📞</span>
              <div>
                <p className="font-medium">{t('Call Us')}</p>
                <p className="text-gray-600"><a href={`tel:${BRANDING.phone.replace(/\s/g, '')}`} className="hover:underline">{BRANDING.phone}</a></p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📧</span>
              <div>
                <p className="font-medium">{t('Email Us')}</p>
                <p className="text-gray-600"><a href={`mailto:${BRANDING.email}`} className="hover:underline">{BRANDING.email}</a></p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-x-4">
          <Link to="/booking-history" className="btn-secondary">
            {t('View My Bookings')}
          </Link>
          <Link to="/" className="btn-primary">
            {t('Back to Home')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
