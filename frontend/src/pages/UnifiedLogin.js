import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI, customerAPI } from '../utils/api';
import { BRANDING } from '../utils/branding';
import BrandLogo from '../components/BrandLogo';

const UnifiedLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin/login';
  const [userType, setUserType] = useState(isAdminRoute ? 'admin' : 'customer');
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);

  // Login form
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  // Register form (for customers)
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    phone: '',
    alternate_phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    service_interest: '',
    how_heard: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const adminToken = localStorage.getItem('adminToken');
    const customerToken = localStorage.getItem('customerToken');
    if (adminToken) {
      navigate('/admin');
    } else if (customerToken && !isAdminRoute) {
      navigate('/portal');
    }
  }, [navigate, isAdminRoute]);

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast.error('Please enter your email and password');
      return;
    }
    // Trim whitespace to avoid accidental spaces/question marks
    const trimmedData = {
      email: loginData.email.trim(),
      password: loginData.password.trim()
    };

    setLoading(true);
    try {
      if (userType === 'admin') {
        const response = await adminAPI.login(trimmedData);
        localStorage.setItem('adminToken', response.data.data.token);
        toast.success('Login successful!');
        navigate('/admin');
      } else {
        const response = await customerAPI.login(trimmedData);
        localStorage.setItem('customerToken', response.data.data.token);
        localStorage.setItem('customerData', JSON.stringify(response.data.data.customer));
        toast.success('Login successful!');
        navigate('/portal');
      }
    } catch (error) {
      // Detect DNS / network failure (ERR_NAME_NOT_RESOLVED, ERR_NETWORK)
      const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error');
      if (isNetworkError) {
        toast.error(
          '⚠️ Cannot reach server — check your internet connection. If the problem persists, try a different network or VPN.',
          { duration: 6000 }
        );
      } else {
        toast.error(error.response?.data?.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerData.name || !registerData.email || !registerData.phone || !registerData.password) {
      toast.error('Please fill all required fields');
      return;
    }
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (registerData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await customerAPI.register(registerData);
      localStorage.setItem('customerToken', response.data.data.token);
      localStorage.setItem('customerData', JSON.stringify(response.data.data.customer));
      toast.success('Registration successful! Welcome to ' + BRANDING.name);
      navigate("/booking");
    } catch (error) {
      const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error');
      if (isNetworkError) {
        toast.error(
          '⚠️ Cannot reach server — check your internet connection. If the problem persists, try a different network or VPN.',
          { duration: 6000 }
        );
      } else {
        toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: `linear-gradient(to bottom right, ${BRANDING.colors.primary[700]}, ${BRANDING.colors.primary[900]})` }}>
      {/* ── Top navbar ── */}
      <nav className="w-full px-6 py-3 flex items-center justify-between" style={{ background: 'rgba(0,0,0,0.15)' }}>
        <BrandLogo size="sm" linkTo="/" />
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-medium text-white opacity-80 hover:opacity-100 transition-opacity">Home</Link>
          <Link to="/services" className="text-sm font-medium text-white opacity-80 hover:opacity-100 transition-opacity">Services</Link>
          <Link to="/booking" className="text-sm font-medium text-white opacity-80 hover:opacity-100 transition-opacity">Book Now</Link>
        </div>
      </nav>

      {/* ── Login form ── */}
      <div className="flex-grow flex items-center justify-center py-8 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mt-2">{BRANDING.name}</h1>
          <p className="mt-2" style={{ color: BRANDING.colors.primary[200] }}>Login or Sign Up to manage your bookings</p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          {/* User Type Toggle */}
          <div className="flex mb-6 rounded-lg bg-gray-100 p-1">
            <button
              type="button"
              onClick={() => { setUserType('customer'); setIsRegister(false); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                userType === 'customer' 
                  ? 'bg-white text-green-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => { setUserType('admin'); setIsRegister(false); }}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                userType === 'admin' 
                  ? 'bg-white text-green-700 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Admin
            </button>
          </div>

          {!isRegister ? (
            <div>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    className="input-field"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    className="input-field"
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors"
                  style={{ backgroundColor: BRANDING.colors.primary[600] }}
                >
                  {loading ? 'Please wait...' : 'Sign In'}
                </button>
              </form>

              {/* Forgot Password Link for Customers */}
              {userType === 'customer' && (
                <div className="mt-4 text-center">
                  <Link 
                    to="/forgot-password" 
                    className="text-sm font-medium"
                    style={{ color: BRANDING.colors.primary[600] }}
                  >
                    Forgot Password? Reset here
                  </Link>
                </div>
              )}
            </div>
          ) : (
            /* Registration Form */
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={registerData.name}
                  onChange={handleRegisterChange}
                  className="input-field"
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={registerData.phone}
                    onChange={handleRegisterChange}
                    className="input-field"
                    placeholder="+91 9876543210"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Alternate Phone</label>
                  <input
                    type="tel"
                    name="alternate_phone"
                    value={registerData.alternate_phone}
                    onChange={handleRegisterChange}
                    className="input-field"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  value={registerData.email}
                  onChange={handleRegisterChange}
                  className="input-field"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Address *</label>
                <textarea
                  name="address"
                  value={registerData.address}
                  onChange={handleRegisterChange}
                  className="input-field"
                  placeholder="Your complete address"
                  rows="2"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
                  <input
                    type="text"
                    name="city"
                    value={registerData.city}
                    onChange={handleRegisterChange}
                    className="input-field"
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={registerData.state}
                    onChange={handleRegisterChange}
                    className="input-field"
                    placeholder="State"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={registerData.pincode}
                    onChange={handleRegisterChange}
                    className="input-field"
                    placeholder="123456"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Service You're Interested In</label>
                <select
                  name="service_interest"
                  value={registerData.service_interest}
                  onChange={handleRegisterChange}
                  className="input-field"
                >
                  <option value="">Select a service</option>
                  <option value="residential">Residential Solar Installation</option>
                  <option value="commercial">Commercial Solar Installation</option>
                  <option value="water_heater">Solar Water Heater</option>
                  <option value="inverter">Solar Inverter Setup</option>
                  <option value="maintenance">Maintenance Service</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How did you hear about us?</label>
                <select
                  name="how_heard"
                  value={registerData.how_heard}
                  onChange={handleRegisterChange}
                  className="input-field"
                >
                  <option value="">Select an option</option>
                  <option value="google">Google Search</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="referral">Friend/Referral</option>
                  <option value="advertisement">Advertisement</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={registerData.password}
                  onChange={handleRegisterChange}
                  className="input-field"
                  placeholder="Create a password (min 6 characters)"
                  minLength="6"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={registerData.confirmPassword}
                  onChange={handleRegisterChange}
                  className="input-field"
                  placeholder="Confirm your password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors"
                style={{ backgroundColor: BRANDING.colors.primary[600] }}
              >
                {loading ? 'Please wait...' : 'Create Account'}
              </button>
            </form>
          )}

          {/* Toggle between login/register for customers */}
          {userType === 'customer' && (
            <div className="mt-5 text-center">
              {isRegister ? (
                <p className="text-gray-600">
                  Already have an account?{' '}
                  <button type="button" onClick={() => setIsRegister(false)} className="font-medium" style={{ color: BRANDING.colors.primary[600] }}>
                    Sign In
                  </button>
                </p>
              ) : (
                <p className="text-gray-600">
                  Don't have an account?{' '}
                  <button type="button" onClick={() => setIsRegister(true)} className="font-medium" style={{ color: BRANDING.colors.primary[600] }}>
                    Sign Up
                  </button>
                </p>
              )}
            </div>
          )}
        </div>

        <p className="text-center text-gray-400 text-sm mt-4">
          © {new Date().getFullYear()} {BRANDING.name}. All rights reserved.
        </p>
      </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;
