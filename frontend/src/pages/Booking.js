import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { servicesAPI, bookingsAPI } from '../utils/api';

const Booking = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_address: '',
    service_id: serviceId || '',
    appointment_date: '',
    appointment_time: '',
    notes: '',
    create_account: false,
    password: '',
    confirm_password: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (serviceId && services.length > 0) {
      const service = services.find(s => s.id === parseInt(serviceId));
      if (service) {
        setSelectedService(service);
        setBookingData(prev => ({ ...prev, service_id: serviceId }));
      }
    }
  }, [serviceId, services]);

  useEffect(() => {
    if (bookingData.appointment_date) {
      fetchAvailableSlots(bookingData.appointment_date);
    }
  }, [bookingData.appointment_date]);

  const fetchAvailableSlots = async (date) => {
    setLoadingSlots(true);
    try {
      const response = await bookingsAPI.getAvailableSlots(date);
      setAvailableSlots(response.data.data);
    } catch (error) {
      setAvailableSlots(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00']);
    } finally {
      setLoadingSlots(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await servicesAPI.getAll();
      setServices(response.data.data);
    } catch {
      toast.error('Failed to load services');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'service_id') {
      const service = services.find(s => s.id === parseInt(value));
      setSelectedService(service);
    }
  };

  const validateStep1 = () => {
    if (!bookingData.service_id) {
      toast.error('Please select a service');
      return false;
    }
    if (!bookingData.appointment_date) {
      toast.error('Please select an appointment date');
      return false;
    }
    if (!bookingData.appointment_time) {
      toast.error('Please select an appointment time');
      return false;
    }
    const selectedDate = new Date(bookingData.appointment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      toast.error('Please select a future date');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!bookingData.customer_name.trim()) {
      toast.error('Please enter your name');
      return false;
    }
    if (!bookingData.customer_email.trim()) {
      toast.error('Please enter your email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookingData.customer_email)) {
      toast.error('Please enter a valid email');
      return false;
    }
    if (!bookingData.customer_phone.trim()) {
      toast.error('Please enter your phone number');
      return false;
    }
    if (!/^(\+91|91)?[6-9][0-9]{9}$/.test(bookingData.customer_phone.replace(/\s/g, ''))) {
      toast.error('Please enter a valid 10-digit Indian phone number');
      return false;
    }
    if (bookingData.create_account) {
      if (!bookingData.password || bookingData.password.length < 6) {
        toast.error('Please create a password (min 6 characters)');
        return false;
      }
      if (bookingData.password !== bookingData.confirm_password) {
        toast.error('Passwords do not match');
        return false;
      }
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handleCreateBooking = async () => {
    setLoading(true);
    try {
      const response = await bookingsAPI.create(bookingData);
      // Also capture as a lead so admin sees it in the pipeline
      const apiBase = process.env.REACT_APP_API_URL || '/api';
      fetch(apiBase + '/leads/public', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          name: bookingData.customer_name,
          email: bookingData.customer_email,
          phone: bookingData.customer_phone,
          address: bookingData.address || '',
          service_interest: selectedService?.name || 'Solar Installation',
          message: 'Booking request for ' + (bookingData.appointment_date || '') + ' at ' + (bookingData.appointment_time || ''),
          source: 'booking_request',
          priority: 'high',
        }),
      }).catch(()=>{});
      toast.success('Booking confirmed successfully!');
      navigate(`/booking-confirmation/${response.data.data.booking_id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Book Your Solar</h1>
          <p className="text-gray-600">Complete your booking in a few easy steps — no payment required</p>
        </div>

        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`flex items-center ${s < 3 ? 'flex-1' : ''}`}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm
                ${step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                {s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`}></div>
              )}
            </div>
          ))}
        </div>

        <div className="card p-6 md:p-8">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Select Service & Schedule</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service *</label>
                <select
                  name="service_id"
                  value={bookingData.service_id}
                  onChange={handleInputChange}
                  className="input-field"
                >
                  <option value="">Select a service</option>
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedService && (
                <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                  <h3 className="font-semibold text-gray-800">{selectedService.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{selectedService.description}</p>
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Date *</label>
                  <input
                    type="date"
                    name="appointment_date"
                    value={bookingData.appointment_date}
                    onChange={handleInputChange}
                    min={getMinDate()}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Time *</label>
                  <select
                    name="appointment_time"
                    value={bookingData.appointment_time}
                    onChange={handleInputChange}
                    className="input-field"
                    disabled={!bookingData.appointment_date || loadingSlots}
                  >
                    <option value="">
                      {loadingSlots ? 'Loading slots...' : bookingData.appointment_date ? (availableSlots.length === 0 ? 'No slots available' : 'Select a time slot') : 'Select date first'}
                    </option>
                    {availableSlots.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  {!loadingSlots && availableSlots.length === 0 && bookingData.appointment_date && (
                    <p className="text-xs text-red-500 mt-1">No slots available for this date</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
                <textarea
                  name="notes"
                  value={bookingData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-field"
                  placeholder="Any specific requirements or questions..."
                ></textarea>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Your Contact Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="customer_name"
                  value={bookingData.customer_name}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  name="customer_email"
                  value={bookingData.customer_email}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter your email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={bookingData.customer_phone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter your 10-digit phone number"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea
                  name="customer_address"
                  value={bookingData.customer_address}
                  onChange={handleInputChange}
                  rows={3}
                  className="input-field"
                  placeholder="Enter your complete address"
                ></textarea>
              </div>

              <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="create_account"
                    name="create_account"
                    checked={bookingData.create_account}
                    onChange={(e) => setBookingData(prev => ({ ...prev, create_account: e.target.checked }))}
                    className="mt-1 w-5 h-5 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <label htmlFor="create_account" className="block font-medium text-gray-800 cursor-pointer">
                      Create an account to track your booking
                    </label>
                    <p className="text-sm text-gray-600 mt-1">
                      Check this box to create a free account. After booking, you can login to track your solar installation progress.
                    </p>
                  </div>
                </div>

                {bookingData.create_account && (
                  <div className="mt-4 grid md:grid-cols-2 gap-4 pl-8">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Create Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={bookingData.password}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="Min 6 characters"
                        minLength={6}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                      <input
                        type="password"
                        name="confirm_password"
                        value={bookingData.confirm_password}
                        onChange={handleInputChange}
                        className="input-field"
                        placeholder="Confirm password"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-800">Review Your Booking</h2>
              
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Service Details</h3>
                  <p className="text-gray-800">{selectedService?.name}</p>
                  <p className="text-sm text-gray-500">{selectedService?.description}</p>
                </div>
                
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Appointment Schedule</h3>
                  <p className="text-gray-800">
                    {new Date(bookingData.appointment_date).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-gray-600">Time: {bookingData.appointment_time}</p>
                </div>
                
                <div className="border-b pb-4">
                  <h3 className="font-semibold text-gray-700 mb-2">Contact Information</h3>
                  <p className="text-gray-800">{bookingData.customer_name}</p>
                  <p className="text-gray-600">{bookingData.customer_email}</p>
                  <p className="text-gray-600">{bookingData.customer_phone}</p>
                  {bookingData.customer_address && (
                    <p className="text-gray-600">{bookingData.customer_address}</p>
                  )}
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Free Booking</h3>
                  <p className="text-sm text-green-600">No payment required — booking is completely free!</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="btn-secondary"
              >
                Back
              </button>
            )}
            
            {step < 3 && (
              <button
                onClick={handleNextStep}
                className="btn-primary ml-auto"
              >
                Continue
              </button>
            )}
            
            {step === 3 && (
              <button
                onClick={handleCreateBooking}
                disabled={loading}
                className="btn-primary ml-auto"
              >
                {loading ? 'Confirming...' : 'Confirm Booking — Free'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
