import React from 'react';
import { BRANDING } from '../utils/branding';

const SessionTimeoutModal = ({ isOpen, timeLeft, onStayLoggedIn, onLogout }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full relative">
        <div className="text-center">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Are you still there?</h2>
          <p className="text-gray-600 mb-6">
            For your security, you will be automatically logged out due to inactivity in <span className="font-bold text-red-600">{timeLeft}</span> seconds.
          </p>
          <div className="flex gap-4">
            <button
              onClick={onLogout}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Logout Now
            </button>
            <button
              onClick={onStayLoggedIn}
              className="flex-1 py-2 px-4 rounded-lg text-white font-medium transition-colors"
              style={{ backgroundColor: BRANDING.colors.primary[600] }}
            >
              Stay Logged In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutModal;
