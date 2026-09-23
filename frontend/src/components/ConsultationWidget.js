import React from 'react';
import { Link } from 'react-router-dom';

const ConsultationWidget = () => (
  <Link
    to="/contact"
    className="fixed bottom-8 left-6 z-[200] flex items-center gap-3 bg-white/90 backdrop-blur-md px-5 py-4 rounded-2xl border border-gray-200 shadow-2xl hover:shadow-green-200 hover:border-[#006948] transition-all group"
    style={{ animation: 'floatBounce 2.5s ease-in-out infinite' }}
    title="Contact us for a free consultation"
  >
    <style>{`
      @keyframes floatBounce {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
      }
    `}</style>
    <img
      src="https://res.cloudinary.com/dsiratycd/image/upload/v1780519660/Gemini_Generated_Image_9vrp69vrp69vrp69_yjkv0f.png"
      alt="Call us"
      className="w-11 h-11 rounded-full object-cover flex-shrink-0 shadow-md"
      onError={e => { e.target.src = 'https://res.cloudinary.com/dsiratycd/image/upload/logo_yo5zg9.png'; }}
    />
    <div>
      <p className="text-xs text-[#006948] font-bold uppercase tracking-wider whitespace-nowrap">Free Consultation</p>
      <p className="text-sm text-gray-800 font-semibold whitespace-nowrap">+91 9771419133</p>
    </div>
  </Link>
);

export default ConsultationWidget;
