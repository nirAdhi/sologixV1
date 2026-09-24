import React, { useState, useEffect } from 'react';
import { servicesAPI, bookingsAPI } from '../utils/api';
import toast from 'react-hot-toast';
import { useT } from '../i18n';

const MobileBookingPopup = () => {
  const { t } = useT();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    service_id: ''
  });

  // Check if mobile and not dismissed before
  useEffect(() => {
    const checkMobileAndShow = () => {
      const isMobile = window.innerWidth < 768;
      const dismissed = localStorage.getItem('mobileBookingPopupDismissed');
      
      if (isMobile && !dismissed) {
        // Show popup after a short delay
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 3000); // 3 seconds delay
        return () => clearTimeout(timer);
      }
    };

    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      if (!isMobile) {
        setIsOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    checkMobileAndShow();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch services for dropdown (optional)
  useEffect(() => {
    if (isOpen) {
      const fetchServices = async () => {
        try {
          const response = await servicesAPI.getAll();
          if (response.data.success) {
            setServices(response.data.data.filter(s => s.is_active));
          }
        } catch (error) {
          console.error('Failed to fetch services:', error);
        }
      };
      fetchServices();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await bookingsAPI.quick(formData);
      
      if (response.data.success) {
        toast.success(t('Booking request submitted! We will contact you shortly.'));
        handleClose();
        // Optionally redirect to booking confirmation
        // window.location.href = `/booking-confirmation/${response.data.data.booking_id}`;
      } else {
        toast.error(t(response.data.message || 'Failed to submit booking'));
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg || 
                          'Failed to submit booking';
      toast.error(t(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('mobileBookingPopupDismissed', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity" 
          aria-hidden="true"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {t('Book Your Solar Now!')}
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-4">
                    {t('Fill out this quick form and our team will call you back within 24 hours to confirm your appointment.')}
                  </p>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('Full Name *')}
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder={t('Your name')}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('Phone Number *')}
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder={t('Your phone number')}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="service_id" className="block text-sm font-medium text-gray-700 mb-1">
                        {t('Service (Optional)')}
                      </label>
                      <select
                        id="service_id"
                        name="service_id"
                        value={formData.service_id}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      >
                        <option value="">{t('Select a service')}</option>
                        {services.map(service => (
                          <option key={service.id} value={service.id}>
                            {t(service.name)} - ₹{parseInt(service.price).toLocaleString('en-IN')}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <button
                        type="button"
                        onClick={handleClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        {t('Later')}
                      </button>
                      <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                      >
                        {loading ? t('Submitting...') : t('Book Now')}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileBookingPopup;