import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { BRANDING } from '../utils/branding';
import BrandLogo from '../components/BrandLogo';
import { useT } from '../i18n';

const Callback = () => {
  const navigate = useNavigate();
  const { t } = useT();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);

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
      const response = await axios.post(`${BRANDING.apiUrl}/callback`, formData);
      
      if (response.data.success) {
        toast.success(t('Callback request submitted! We will call you back soon.'));
        setFormData({ name: '', phone: '', message: '' });
        // Optionally redirect after a delay
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        toast.error(t(response.data.message || 'Failed to submit request'));
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg || 
                          'Failed to submit request';
      toast.error(t(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center mb-6">
            <BrandLogo size="md" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('Request a Callback')}</h1>
          <p className="text-gray-600">{t('Fill out the form below and our team will call you back within 24 hours.')}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder={t('Enter your full name')}
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder={t('Enter your phone number')}
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                {t('Message (Optional)')}
              </label>
              <textarea
                id="message"
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                placeholder={t('Any specific questions or requirements?')}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('Submitting...') : t('Request Callback')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 text-sm">
              {t('Want to book immediately?')}{' '}
              <Link to="/booking" className="text-primary-600 hover:text-primary-700 font-medium">
                {t('Book Solar Online')}
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            {t('Or call us directly at')}{' '}
            <a href={`tel:${BRANDING.phone}`} className="text-primary-600 hover:text-primary-700 font-medium">
              {BRANDING.phone}
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Callback;