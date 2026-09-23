import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { bookingsAPI } from '../utils/api';

const BookingHistory = () => {
  const [searchType, setSearchType] = useState('email');
  const [searchValue, setSearchValue] = useState('');
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchValue.trim()) {
      toast.error(`Please enter your ${searchType}`);
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      let response;
      if (searchType === 'email') {
        response = await bookingsAPI.getByEmail(searchValue.trim());
      } else {
        response = await bookingsAPI.getByPhone(searchValue.trim());
      }
      setBookings(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch bookings');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Bookings</h1>
          <p className="text-gray-600">View your solar installation bookings — no payment required</p>
        </div>

        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Find Your Bookings</h2>
          
          <form onSubmit={handleSearch}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="md:w-1/3">
                <select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  className="input-field"
                >
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                </select>
              </div>
              <div className="flex-1">
                <input
                  type={searchType === 'email' ? 'email' : 'tel'}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  placeholder={searchType === 'email' ? 'Enter your email' : 'Enter your phone number'}
                  className="input-field"
                />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </form>
        </div>

        {searched && bookings.length === 0 && !loading && (
          <div className="card p-8 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Bookings Found</h3>
            <p className="text-gray-600 mb-4">
              No bookings found for this {searchType}. Please check your input or make a new booking.
            </p>
            <Link to="/booking" className="btn-primary">
              Book Appointment
            </Link>
          </div>
        )}

        {bookings.length > 0 && (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div key={booking.id} className="card p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <span className="text-sm text-gray-500">Booking ID</span>
                    <p className="text-lg font-bold text-primary-600">{booking.booking_id}</p>
                  </div>
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                      Free Booking
                    </span>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Service</p>
                    <p className="font-medium text-gray-800">{booking.service_name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Appointment</p>
                    <p className="font-medium text-gray-800">
                      {new Date(booking.appointment_date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })} at {booking.appointment_time}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Amount</p>
                    <p className="font-medium text-green-600">Free</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Booked On</p>
                    <p className="font-medium text-gray-800">
                      {new Date(booking.created_at).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/booking" className="text-primary-600 hover:text-primary-700 font-medium">
            + Make a New Booking
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingHistory;
