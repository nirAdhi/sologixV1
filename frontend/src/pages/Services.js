import React, { useState, useEffect } from 'react';
import { servicesAPI } from '../utils/api';
import ServiceCard from '../components/ServiceCard';

const Services = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await servicesAPI.getAll();
      setServices(response.data.data);
    } catch (err) {
      console.error('Services fetch error:', err);
      // Detect DNS / network connectivity failures
      const isNetworkError = !err.response && (err.code === 'ERR_NETWORK' || err.message === 'Network Error');
      if (isNetworkError) {
        setError('network');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load services');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    const isNetworkError = error === 'network';
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-5xl mb-4">{isNetworkError ? '📡' : '⚠️'}</div>
          <div className="bg-red-50 border border-red-300 text-red-800 px-6 py-5 rounded-xl mb-4 text-left">
            <p className="font-bold text-lg mb-1">
              {isNetworkError ? 'Connection Problem' : 'Error Loading Services'}
            </p>
            {isNetworkError ? (
              <>
                <p className="text-sm mb-2">
                  We couldn't reach our servers. This can happen due to:
                </p>
                <ul className="text-sm list-disc list-inside space-y-1 mb-3">
                  <li>Your internet connection is down</li>
                  <li>Your ISP/network is blocking this site's domain</li>
                  <li>A temporary server outage</li>
                </ul>
                <p className="text-sm font-medium">
                  💡 Try: Switch from mobile data to Wi-Fi (or vice versa), or use a VPN.
                </p>
                <p className="text-sm mt-2">
                  Need help? Call us: <a href="tel:+919876543210" className="underline font-bold">+91 98765 43210</a>
                </p>
              </>
            ) : (
              <p className="text-sm">{error}</p>
            )}
          </div>
          <button onClick={() => { setError(null); setLoading(true); fetchServices(); }} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="relative text-white py-20 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1509391366360-2e959784a276?w=1600&h=500&fit=crop" alt="Solar Services" className="w-full h-full object-cover" />
          <div className="absolute inset-0" data-theme-hero="1" style={{background:'linear-gradient(135deg, rgba(0,105,72,0.90) 0%, rgba(0,77,52,0.85) 50%, rgba(0,50,35,0.80) 100%)'}}></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Our Solar Services</h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Comprehensive solar solutions for residential and commercial properties.
            Choose the service that best fits your needs.
          </p>
        </div>
      </section>

      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>

          {services.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No services available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-4">
                  Why Choose Sologix Energy?
                </h2>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <span className="text-primary-500 text-xl mr-3">✓</span>
                    <div>
                      <strong className="text-gray-800">Expert Technical Team</strong>
                      <p className="text-gray-600 text-sm">Industry veterans with 10+ years of solar expertise</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-500 text-xl mr-3">✓</span>
                    <div>
                      <strong className="text-gray-800">Government Subsidy Assistance</strong>
                      <p className="text-gray-600 text-sm">We help you avail 100% govt. subsidy</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-500 text-xl mr-3">✓</span>
                    <div>
                      <strong className="text-gray-800">5 Years O&M Support</strong>
                      <p className="text-gray-600 text-sm">Comprehensive operation & maintenance included</p>
                    </div>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-500 text-xl mr-3">✓</span>
                    <div>
                      <strong className="text-gray-800">Generation Warranty</strong>
                      <p className="text-gray-600 text-sm">We guarantee performance of your solar plant</p>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="text-center">
                <div className="bg-white rounded-xl p-8 shadow-lg">
                  <p className="text-gray-600 mb-2">Booking</p>
                  <p className="text-4xl font-bold text-primary-600 mb-2">Free</p>
                  <p className="text-sm text-gray-500 mb-6">No payment required</p>
                  <a href="/booking" className="btn-primary block w-full">
                    Book Appointment
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;
