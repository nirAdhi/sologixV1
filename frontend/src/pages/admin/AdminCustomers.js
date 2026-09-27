import AdminLayout from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';

const AdminCustomers = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerBookings, setCustomerBookings] = useState([]);
  const [showBookingsModal, setShowBookingsModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchCustomers();
  }, [navigate]);

  const fetchCustomers = async () => {
    try {
      const response = await adminAPI.getCustomers();
      setCustomers(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const viewCustomerBookings = async (customer) => {
    setSelectedCustomer(customer);
    try {
      const response = await adminAPI.getCustomerBookings(customer.id);
      setCustomerBookings(response.data.data);
      setShowBookingsModal(true);
    } catch (error) {
      toast.error('Failed to fetch customer bookings');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <AdminLayout requiredPerm="manage_customers" title="Customers">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Customer Management</h1>
          <span className="text-gray-500">{customers.length} customers</span>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-800">{customer.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{customer.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">{customer.phone}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                        {customer.booking_count || 0} bookings
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                      {new Date(customer.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => viewCustomerBookings(customer)}
                        className="text-primary-600 hover:text-primary-800 font-medium"
                      >
                        View Bookings
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Customer Bookings Modal */}
      {showBookingsModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{selectedCustomer.name}</h2>
                <p className="text-gray-500 text-sm">{selectedCustomer.email} • {selectedCustomer.phone}</p>
              </div>
              <button onClick={() => setShowBookingsModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <h3 className="font-semibold text-gray-800 mb-4">Booking History</h3>
            {customerBookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bookings found for this customer.</p>
            ) : (
              <div className="space-y-4">
                {customerBookings.map((booking) => (
                  <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-800">{booking.service_name}</p>
                        <p className="text-sm text-gray-500">{booking.booking_id}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Appointment</p>
                        <p className="text-gray-800">{new Date(booking.appointment_date).toLocaleDateString('en-IN')} at {booking.appointment_time}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Amount</p>
                        <p className="text-gray-800 font-medium">₹{parseInt(booking.total_amount).toLocaleString('en-IN')}</p>
                      </div>
                      {booking.work_progress && (
                        <>
                          <div>
                            <p className="text-gray-500">Progress</p>
                            <p className="text-gray-800">{booking.work_progress.replace('_', ' ')}</p>
                          </div>
                        </>
                      )}
                      {booking.installation_scheduled_date && (
                        <div>
                          <p className="text-gray-500">Installation Date</p>
                          <p className="text-gray-800">{new Date(booking.installation_scheduled_date).toLocaleDateString('en-IN')}</p>
                        </div>
                      )}
                    </div>
                    <Link
                      to={`/admin/bookings?search=${booking.booking_id}`}
                      className="mt-3 text-primary-600 hover:text-primary-700 text-sm font-medium inline-block"
                      onClick={() => setShowBookingsModal(false)}
                    >
                      Manage Booking →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
    );
};

export default AdminCustomers;
