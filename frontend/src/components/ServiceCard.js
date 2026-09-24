import React from 'react';
import { Link } from 'react-router-dom';
import { BRANDING } from '../utils/branding';
import { useT } from '../i18n';

const API_URL = BRANDING.apiUrl.replace('/api', '');

const ServiceCard = ({ service }) => {
  const { t } = useT();
  const features = service.features ? 
    (typeof service.features === 'string' ? JSON.parse(service.features) : service.features) : [];

  // Handle both file URLs and base64 data URLs
  let imageUrl = null;
  if (service.image_url) {
    if (service.image_url.startsWith('data:')) {
      // Base64 data URL - use directly
      imageUrl = service.image_url;
    } else if (service.image_url.startsWith('http')) {
      // External URL
      imageUrl = service.image_url;
    } else {
      // Local file URL - prepend API URL
      imageUrl = `${API_URL}${service.image_url}`;
    }
  }




  return (
    <div className="card overflow-hidden group">
      <div className="h-48 bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center relative overflow-hidden">
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={t(service.name)}
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-black opacity-10 group-hover:opacity-20 transition-opacity"></div>
            <svg className="w-24 h-24 text-white opacity-80 relative z-10" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="10" y="10" width="35" height="35" rx="2" fill="currentColor" fillOpacity="0.8"/>
              <rect x="55" y="10" width="35" height="35" rx="2" fill="currentColor" fillOpacity="0.6"/>
              <rect x="10" y="55" width="35" height="35" rx="2" fill="currentColor" fillOpacity="0.6"/>
              <rect x="55" y="55" width="35" height="35" rx="2" fill="currentColor" fillOpacity="0.4"/>
              <circle cx="50" cy="50" r="12" fill={BRANDING.colors.accent.yellow}/>
              <path d="M50 30 L50 70 M30 50 L70 50" stroke="#fff" strokeWidth="2" strokeOpacity="0.3"/>
            </svg>
          </>
        )}
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{t(service.name)}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{t(service.description)}</p>
        
        {features.length > 0 && (
          <ul className="mb-4 space-y-1">
            {features.slice(0, 3).map((feature, index) => (
              <li key={index} className="text-sm text-gray-500 flex items-center">
                <span className="text-primary-500 mr-2">✓</span>
                {t(feature)}
              </li>
            ))}
          </ul>
        )}
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            <span className="text-sm text-gray-500">{t('Booking')}</span>
            <p className="text-xl font-bold text-green-600">{t('Free Consultation — Book Now')}</p>
          </div>
          <Link
            to={`/booking/${service.id}`}
            className="btn-primary text-sm"
          >
            {t('Book Now')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
