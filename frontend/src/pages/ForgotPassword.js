import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BRANDING } from '../utils/branding';
import BrandLogo from '../components/BrandLogo';
import { useT } from '../i18n';
import LanguageToggle from '../i18n/LanguageToggle';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { t } = useT();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error(t('Please enter your email address'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BRANDING.apiUrl}/customer/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      
      if (data.success) {
        setOtpSent(true);
        toast.success(t('OTP sent to your email!'));
      } else {
        toast.error(t(data.message || 'Failed to send OTP'));
      }
    } catch (error) {
      toast.error(t('Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!otp || !newPassword || !confirmPassword) {
      toast.error(t('Please fill all fields'));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(t('Password must be at least 6 characters'));
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(t('Passwords do not match'));
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${BRANDING.apiUrl}/customer/reset-password-with-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword })
      });
      const data = await response.json();
      
      if (data.success) {
        toast.success(t('Password reset successfully! You can now login with your new password.'));
        navigate('/login');
      } else {
        toast.error(t(data.message || 'Failed to reset password'));
      }
    } catch (error) {
      toast.error(t('Something went wrong. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4" style={{ background: `linear-gradient(to bottom right, ${BRANDING.colors.primary[700]}, ${BRANDING.colors.primary[900]})` }}>
      <div className="max-w-md w-full">
        <div className="flex justify-end mb-3">
          <LanguageToggle compact />
        </div>
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-2xl font-bold text-white mt-2">{t('Reset Password')}</h1>
          <p className="mt-2" style={{ color: BRANDING.colors.primary[200] }}>
            {!otpSent ? t('Enter your email to receive OTP') : t('Enter the OTP and create new password')}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8">
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Email Address')}</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors"
                style={{ backgroundColor: BRANDING.colors.primary[600] }}
              >
                {loading ? t('Sending OTP...') : t('Send OTP')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Enter OTP (check your email)')}</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input-field"
                  placeholder={t('Enter 6-digit OTP')}
                  maxLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('New Password')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder={t('Min 6 characters')}
                  minLength={6}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('Confirm Password')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-field"
                  placeholder={t('Confirm new password')}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg font-semibold text-white transition-colors"
                style={{ backgroundColor: BRANDING.colors.primary[600] }}
              >
                {loading ? t('Resetting...') : t('Reset Password')}
              </button>
            </form>
          )}

          <div className="mt-5 text-center">
            <Link to="/login" className="text-sm font-medium" style={{ color: BRANDING.colors.primary[600] }}>
              {t('Back to Login')}
            </Link>
          </div>
        </div>

        <p className="text-center text-gray-400 text-sm mt-4">
          © {new Date().getFullYear()} {BRANDING.name}
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
