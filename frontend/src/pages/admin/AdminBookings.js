import AdminLayout from '../../components/AdminLayout';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../../utils/api';

// Format a DATE from the API for <input type="date"> using LOCAL date parts.
// (toISOString()/split('T') converts to UTC and shows the previous day in IST.)
const toDateInput = (value) => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) return value.trim();
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Empty date fields must go to the server as null, not '' (MariaDB rejects '').
const emptyToNull = (v) => (v === '' || v === undefined ? null : v);

const AdminBookings = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
    date_from: '',
    date_to: ''
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [formData, setFormData] = useState({
    status: '',
    admin_notes: '',
    appointment_date: '',
    appointment_time: '',
    subject: '',
    message: ''
  });
  const [progressData, setProgressData] = useState({
    delivery_status: '',
    delivery_date: '',
    delivery_notes: '',
    installation_scheduled_date: '',
    installation_notes: '',
    work_progress: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, searchParams]);

  const fetchBookings = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: pagination.limit };
      if (filters.status) params.status = filters.status;
      if (filters.search) params.search = filters.search;
      if (filters.date_from) params.date_from = filters.date_from;
      if (filters.date_to) params.date_to = filters.date_to;

      const response = await adminAPI.getBookings(params);
      setBookings(response.data.data);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    setSearchParams(params);
    fetchBookings(1);
  };

  const openModal = (booking, type) => {
    setSelectedBooking(booking);
    setModalType(type);
    setFormData({
      status: booking.status,
      admin_notes: booking.admin_notes || '',
      appointment_date: toDateInput(booking.appointment_date),
      appointment_time: booking.appointment_time || '',
      subject: '',
      message: ''
    });
    setShowModal(true);
  };

  const openProgressModal = (booking) => {
    setSelectedBooking(booking);
    setProgressData({
      delivery_status: booking.delivery_status || 'not_applicable',
      delivery_date: toDateInput(booking.delivery_date),
      delivery_notes: booking.delivery_notes || '',
      installation_scheduled_date: toDateInput(booking.installation_scheduled_date),
      installation_notes: booking.installation_notes || '',
      work_progress: booking.work_progress || 'not_started'
    });
    setShowProgressModal(true);
  };

  const handleProgressChange = (e) => {
    const { name, value } = e.target;
    setProgressData(prev => ({ ...prev, [name]: value }));
  };

  const handleProgressUpdate = async () => {
    try {
      const payload = {
        ...progressData,
        delivery_date: emptyToNull(progressData.delivery_date),
        installation_scheduled_date: emptyToNull(progressData.installation_scheduled_date),
      };
      await adminAPI.updateBookingProgress(selectedBooking.booking_id || selectedBooking.id, payload);
      toast.success('Booking progress updated');
      setShowProgressModal(false);
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update progress');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStatusUpdate = async () => {
    try {
      await adminAPI.updateBookingStatus(selectedBooking.id, {
        status: formData.status,
        admin_notes: formData.admin_notes
      });
      toast.success('Booking status updated');
      setShowModal(false);
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleReschedule = async () => {
    try {
      await adminAPI.rescheduleBooking(selectedBooking.id, {
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time
      });
      toast.success('Appointment rescheduled');
      setShowModal(false);
      fetchBookings(pagination.page);
    } catch (error) {
      toast.error('Failed to reschedule');
    }
  };

  const handleSendEmail = async () => {
    try {
      await adminAPI.sendEmail(selectedBooking.id, {
        subject: formData.subject,
        message: formData.message
      });
      toast.success('Email sent successfully');
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to send email');
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

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  return (
    <AdminLayout requiredPerm="manage_bookings" title="Bookings">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Filters</h2>
          <div className="grid md:grid-cols-5 gap-4">
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by name, email, phone..."
              className="input-field"
            />
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input
              type="date"
              name="date_from"
              value={filters.date_from}
              onChange={handleFilterChange}
              className="input-field"
              placeholder="From Date"
            />
            <input
              type="date"
              name="date_to"
              value={filters.date_to}
              onChange={handleFilterChange}
              className="input-field"
              placeholder="To Date"
            />
            <button onClick={applyFilters} className="btn-primary">
              Apply Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Appointment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <span className="font-medium text-primary-600">{booking.booking_id}</span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-800">{booking.customer_name}</p>
                          <p className="text-sm text-gray-500">{booking.customer_email}</p>
                          <p className="text-sm text-gray-500">{booking.customer_phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-800">{booking.service_name}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-800">
                            {new Date(booking.appointment_date).toLocaleDateString('en-IN')}
                          </p>
                          <p className="text-sm text-gray-500">{booking.appointment_time}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Free Booking
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openModal(booking, 'status')}
                              className="text-blue-600 hover:text-blue-700 text-sm"
                            >
                              Update
                            </button>
                            <button
                              onClick={() => openProgressModal(booking)}
                              className="text-orange-600 hover:text-orange-700 text-sm font-medium"
                            >
                              Progress
                            </button>
                            <button
                              onClick={() => openModal(booking, 'reschedule')}
                              className="text-green-600 hover:text-green-700 text-sm"
                            >
                              Reschedule
                            </button>
                            <button
                              onClick={() => openModal(booking, 'email')}
                              className="text-purple-600 hover:text-purple-700 text-sm"
                            >
                              Email
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pagination.pages > 1 && (
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-500">
                    Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => fetchBookings(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="px-3 py-1 rounded border disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchBookings(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="px-3 py-1 rounded border disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {bookings.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">No bookings found</p>
              </div>
            )}
          </>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                {modalType === 'status' && 'Update Status'}
                {modalType === 'reschedule' && 'Reschedule Appointment'}
                {modalType === 'email' && 'Send Email'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            {modalType === 'status' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                    className="input-field"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message to customer</label>
                  <p className="text-xs text-gray-500 -mt-1 mb-2">Shown to the customer as "Message from Sologix" in their portal and booking page. Leave empty to show nothing.</p>
                  <textarea
                    name="admin_notes"
                    value={formData.admin_notes}
                    onChange={handleFormChange}
                    rows={3}
                    className="input-field"
                    placeholder="Add notes for the customer..."
                  ></textarea>
                </div>
                <button onClick={handleStatusUpdate} className="btn-primary w-full">
                  Update Status
                </button>
              </div>
            )}

            {modalType === 'reschedule' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Date</label>
                  <input
                    type="date"
                    name="appointment_date"
                    value={formData.appointment_date}
                    onChange={handleFormChange}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Time</label>
                  <select
                    name="appointment_time"
                    value={formData.appointment_time}
                    onChange={handleFormChange}
                    className="input-field"
                  >
                    {timeSlots.map((time) => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
                <button onClick={handleReschedule} className="btn-primary w-full">
                  Reschedule
                </button>
              </div>
            )}

            {modalType === 'email' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleFormChange}
                    className="input-field"
                    placeholder="Email subject..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleFormChange}
                    rows={5}
                    className="input-field"
                    placeholder="Type your message..."
                  ></textarea>
                </div>
                <button onClick={handleSendEmail} className="btn-primary w-full">
                  Send Email
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {showProgressModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Update Progress - {selectedBooking.booking_id}
              </h3>
              <button onClick={() => setShowProgressModal(false)} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Work Progress */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Work Progress</label>
                <select
                  name="work_progress"
                  value={progressData.work_progress}
                  onChange={handleProgressChange}
                  className="input-field"
                >
                  <option value="not_started">Not Started</option>
                  <option value="materials_ordered">Materials Ordered</option>
                  <option value="site_preparation">Site Preparation</option>
                  <option value="installation">Installation</option>
                  <option value="testing">Testing & Handover</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              {/* Delivery Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Status</label>
                <select
                  name="delivery_status"
                  value={progressData.delivery_status}
                  onChange={handleProgressChange}
                  className="input-field"
                >
                  <option value="not_applicable">Not Applicable</option>
                  <option value="pending">Pending</option>
                  <option value="ordered">Ordered</option>
                  <option value="shipped">Shipped (In Transit)</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>

              {/* Delivery Date */}
              {progressData.delivery_status !== 'not_applicable' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Delivery Date</label>
                  <input
                    type="date"
                    name="delivery_date"
                    value={progressData.delivery_date}
                    onChange={handleProgressChange}
                    className="input-field"
                  />
                </div>
              )}

              {/* Delivery Notes */}
              {progressData.delivery_status !== 'not_applicable' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Notes</label>
                  <textarea
                    name="delivery_notes"
                    value={progressData.delivery_notes}
                    onChange={handleProgressChange}
                    rows={2}
                    className="input-field"
                    placeholder="Tracking number, courier info, etc."
                  />
                </div>
              )}

              {/* Installation Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scheduled Installation Date</label>
                <input
                  type="date"
                  name="installation_scheduled_date"
                  value={progressData.installation_scheduled_date}
                  onChange={handleProgressChange}
                  className="input-field"
                />
              </div>

              {/* Installation Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Installation Notes</label>
                <textarea
                  name="installation_notes"
                  value={progressData.installation_notes}
                  onChange={handleProgressChange}
                  rows={2}
                  className="input-field"
                  placeholder="Special instructions, timing, etc."
                />
              </div>

              <button onClick={handleProgressUpdate} className="btn-primary w-full">
                Update Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
    );
};

export default AdminBookings;
