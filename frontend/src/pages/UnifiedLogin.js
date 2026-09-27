// One login for everyone. The server (POST /api/auth/login) decides whether
// the email belongs to an admin or a customer and the page opens the right
// portal — no Customer/Admin choice to make.
// Designed as a pop-up over the site: the normal navbar stays on top, the
// page behind is the soft calculator-style backdrop, and the form sits in a
// floating card with a ✕ that returns to the homepage.
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authAPI, customerAPI } from '../utils/api';
import { BRANDING } from '../utils/branding';
import Navbar from '../components/Navbar';
import { useT } from '../i18n';

const inputCls = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] focus:border-[#006948]';
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5';

const UnifiedLogin = () => {
  const navigate = useNavigate();
  const { t } = useT();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({
    name: '', email: '', phone: '', alternate_phone: '', address: '', city: '', state: '',
    pincode: '', service_interest: '', how_heard: '', password: '', confirmPassword: '',
  });

  useEffect(() => {
    if (localStorage.getItem('adminToken')) navigate('/admin');
    else if (localStorage.getItem('customerToken')) navigate('/portal');
  }, [navigate]);

  const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
  const handleRegisterChange = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value });

  const networkToast = () => toast.error(
    '⚠️ ' + t('Cannot reach server — check your internet connection. If the problem persists, try a different network or VPN.'),
    { duration: 6000 }
  );

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) { toast.error(t('Please enter your email and password')); return; }
    setLoading(true);
    try {
      const response = await authAPI.login({ email: loginData.email.trim(), password: loginData.password.trim() });
      const d = response.data.data;
      toast.success(t('Login successful!'));
      if (d.type === 'admin') {
        localStorage.setItem('adminToken', d.token);
        navigate('/admin');
      } else {
        localStorage.setItem('customerToken', d.token);
        localStorage.setItem('customerData', JSON.stringify(d.customer));
        navigate('/portal');
      }
    } catch (error) {
      const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error');
      if (isNetworkError) networkToast();
      else toast.error(t(error.response?.data?.message || 'Login failed. Please try again.'));
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerData.name || !registerData.email || !registerData.phone || !registerData.password) {
      toast.error(t('Please fill all required fields')); return;
    }
    if (registerData.password !== registerData.confirmPassword) { toast.error(t('Passwords do not match')); return; }
    if (registerData.password.length < 8) { toast.error(t('Password must be at least 8 characters')); return; }
    setLoading(true);
    try {
      const response = await customerAPI.register(registerData);
      localStorage.setItem('customerToken', response.data.data.token);
      localStorage.setItem('customerData', JSON.stringify(response.data.data.customer));
      toast.success(t('Registration successful! Welcome to {name}', { name: BRANDING.name }));
      navigate('/booking');
    } catch (error) {
      const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.message === 'Network Error');
      if (isNetworkError) networkToast();
      else toast.error(t(error.response?.data?.message || 'Registration failed. Please try again.'));
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />

      {/* soft site-style backdrop with the floating login card */}
      <div className="flex-grow relative bg-gradient-to-br from-[#e9edff] to-[#d1fae5]">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'radial-gradient(600px 300px at 80% 10%, rgba(255,255,255,0.65), transparent 70%)',
        }}></div>

        <div className="relative flex items-start sm:items-center justify-center px-4 py-10 sm:py-14 min-h-full">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-7 sm:p-8">
            {/* ✕ returns to the site, like closing a pop-up */}
            <button type="button" onClick={() => navigate('/')} aria-label={t('Close')}
              className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 text-xl leading-none">
              ✕
            </button>

            <div className="text-center mb-6">
              <span aria-hidden="true" className="inline-flex w-12 h-12 rounded-full bg-green-50 border border-green-100 items-center justify-center text-2xl mb-3">☀️</span>
              <h1 className="text-2xl font-bold text-gray-900">
                {isRegister ? t('Create your account') : t('Welcome back')}
              </h1>
              <p className="text-sm text-gray-500 mt-1.5">
                {isRegister
                  ? t('Sign up to book and track your solar journey')
                  : t('One login for customers and staff — we open the right portal for you.')}
              </p>
            </div>

            {!isRegister ? (
              <div>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label htmlFor="ul-email" className={labelCls}>{t('Email Address')}</label>
                    <input id="ul-email" type="email" name="email" value={loginData.email} onChange={handleLoginChange}
                      autoComplete="email" className={inputCls} placeholder={t('Enter your email')} />
                  </div>
                  <div>
                    <label htmlFor="ul-pass" className={labelCls}>{t('Password')}</label>
                    <input id="ul-pass" type="password" name="password" value={loginData.password} onChange={handleLoginChange}
                      autoComplete="current-password" className={inputCls} placeholder={t('Enter your password')} />
                  </div>
                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-full font-semibold text-white bg-[#006948] hover:bg-green-700 shadow transition-colors disabled:opacity-60">
                    {loading ? t('Please wait...') : t('Sign In')}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <Link to="/forgot-password" className="text-sm font-medium text-[#006948] hover:underline">
                    {t('Forgot Password? Reset here')}
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className={labelCls}>{t('Full Name')} *</label>
                  <input type="text" name="name" value={registerData.name} onChange={handleRegisterChange}
                    className={inputCls} placeholder={t('Your full name')} required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{t('Phone Number')} *</label>
                    <input type="tel" name="phone" value={registerData.phone} onChange={handleRegisterChange}
                      className={inputCls} placeholder="+91 9876543210" required />
                  </div>
                  <div>
                    <label className={labelCls}>{t('Alternate Phone')}</label>
                    <input type="tel" name="alternate_phone" value={registerData.alternate_phone} onChange={handleRegisterChange}
                      className={inputCls} placeholder="+91 9876543210" />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t('Email Address')} *</label>
                  <input type="email" name="email" value={registerData.email} onChange={handleRegisterChange}
                    className={inputCls} placeholder="your@email.com" required />
                </div>
                <div>
                  <label className={labelCls}>{t('Full Address')} *</label>
                  <textarea name="address" value={registerData.address} onChange={handleRegisterChange}
                    className={inputCls + ' resize-none'} placeholder={t('Your complete address')} rows="2" required />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>{t('City')} *</label>
                    <input type="text" name="city" value={registerData.city} onChange={handleRegisterChange}
                      className={inputCls} placeholder={t('City')} required />
                  </div>
                  <div>
                    <label className={labelCls}>{t('State')} *</label>
                    <input type="text" name="state" value={registerData.state} onChange={handleRegisterChange}
                      className={inputCls} placeholder={t('State')} required />
                  </div>
                  <div>
                    <label className={labelCls}>{t('Pincode')} *</label>
                    <input type="text" name="pincode" value={registerData.pincode} onChange={handleRegisterChange}
                      className={inputCls} placeholder="123456" required />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>{t("Service You're Interested In")}</label>
                  <select name="service_interest" value={registerData.service_interest} onChange={handleRegisterChange} className={inputCls}>
                    <option value="">{t('Select a service')}</option>
                    <option value="residential">{t('Residential Solar Installation')}</option>
                    <option value="commercial">{t('Commercial Solar Installation')}</option>
                    <option value="water_heater">{t('Solar Water Heater')}</option>
                    <option value="inverter">{t('Solar Inverter Setup')}</option>
                    <option value="maintenance">{t('Maintenance Service')}</option>
                    <option value="other">{t('Other')}</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('How did you hear about us?')}</label>
                  <select name="how_heard" value={registerData.how_heard} onChange={handleRegisterChange} className={inputCls}>
                    <option value="">{t('Select an option')}</option>
                    <option value="google">{t('Google Search')}</option>
                    <option value="facebook">Facebook</option>
                    <option value="instagram">Instagram</option>
                    <option value="referral">{t('Friend/Referral')}</option>
                    <option value="advertisement">{t('Advertisement')}</option>
                    <option value="other">{t('Other')}</option>
                  </select>
                </div>
                <div>
                  <label className={labelCls}>{t('Password')} *</label>
                  <input type="password" name="password" value={registerData.password} onChange={handleRegisterChange}
                    autoComplete="new-password" className={inputCls} placeholder={t('Create a password (min 8 characters)')} minLength="8" required />
                </div>
                <div>
                  <label className={labelCls}>{t('Confirm Password')} *</label>
                  <input type="password" name="confirmPassword" value={registerData.confirmPassword} onChange={handleRegisterChange}
                    autoComplete="new-password" className={inputCls} placeholder={t('Confirm your password')} required />
                </div>
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-full font-semibold text-white bg-[#006948] hover:bg-green-700 shadow transition-colors disabled:opacity-60">
                  {loading ? t('Please wait...') : t('Create Account')}
                </button>
              </form>
            )}

            <div className="mt-5 text-center">
              {isRegister ? (
                <p className="text-sm text-gray-600">
                  {t('Already have an account?')}{' '}
                  <button type="button" onClick={() => setIsRegister(false)} className="font-semibold text-[#006948] hover:underline">
                    {t('Sign In')}
                  </button>
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  {t("Don't have an account?")}{' '}
                  <button type="button" onClick={() => setIsRegister(true)} className="font-semibold text-[#006948] hover:underline">
                    {t('Sign Up')}
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLogin;
