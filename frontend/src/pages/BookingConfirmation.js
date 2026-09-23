import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { bookingsAPI } from '../utils/api';

const BookingConfirmation = () => {
  const { bookingId } = useParams();
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
          <p className="text-red-500 mb-4">{error || 'Booking not found'}</p>
          <Link to="/" className="btn-primary">
            Go Home
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
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600">
            Your solar installation appointment has been successfully booked.
          </p>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b">
            <span className="text-gray-600">Booking ID</span>
            <span className="text-xl font-bold text-primary-600">{booking.booking_id}</span>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Service</h3>
              <p className="text-gray-800">{booking.service_name}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Appointment</h3>
              <p className="text-gray-800">
                {new Date(booking.appointment_date).toLocaleDateString('en-IN', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className="text-gray-600">Time: {booking.appointment_time}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Contact Details</h3>
              <p className="text-gray-800">{booking.customer_name}</p>
              <p className="text-gray-600">{booking.customer_email}</p>
              <p className="text-gray-600">{booking.customer_phone}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Status</h3>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                ✓ Confirmed — Free Booking
              </span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-blue-800 mb-2">What's Next?</h3>
          <ul className="text-blue-700 text-sm space-y-2">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>A confirmation email has been sent to {booking.customer_email}</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>Our team will contact you within 24 hours to confirm the details</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>We'll discuss your requirements and provide a detailed quote</span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>Installation will be scheduled at your convenience</span>
            </li>
          </ul>
        </div>

        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Need Help?</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📞</span>
              <div>
                <p className="font-medium">Call Us</p>
                <p className="text-gray-600">+91 9876543210</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-2xl">📧</span>
              <div>
                <p className="font-medium">Email Us</p>
                <p className="text-gray-600">support@solarcompany.com</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-x-4">
          <Link to="/booking-history" className="btn-secondary">
            View My Bookings
          </Link>
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
