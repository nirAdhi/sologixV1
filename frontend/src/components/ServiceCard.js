import React from 'react';
import { Link } from 'react-router-dom';
import { BRANDING } from '../utils/branding';
import { useT } from '../i18n';

const API_URL = BRANDING.apiUrl.replace('/api', '');

// `features` may arrive as an array, a JSON string, a double-encoded JSON
// string, or plain text (one per line / comma separated). Never throw.
export function parseFeatures(value) {
  const clean = (arr) => arr
    .map(f => (f === null || f === undefined ? '' : (typeof f === 'object' ? '' : String(f).trim())))
    .filter(Boolean);
  if (Array.isArray(value)) return clean(value);
  if (typeof value !== 'string') return [];
  const text = value.trim();
  if (!text) return [];
  let v = text;
  for (let i = 0; i < 2 && typeof v === 'string'; i += 1) {
    try { v = JSON.parse(v); } catch (e) { break; }
  }
  if (Array.isArray(v)) return clean(v);
  if (v && typeof v === 'object') return [];
  const raw = typeof v === 'string' ? v : text;
  return clean(raw.split(/\r?\n|,/));
}

const formatINR = (n) => '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

const ServiceCard = ({ service }) => {
  const { t } = useT();
  if (!service) return null;
  const features = parseFeatures(service.features);
  const price = Number(service.price);
  const hasPrice = Number.isFinite(price) && price > 0;

  // Handle both file URLs and base64 data URLs
  let imageUrl = null;
  if (service.image_url && typeof service.image_url === 'string') {
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
            onError={e => { e.target.style.display = 'none'; }}
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
        <h3 className="text-xl font-bold text-gray-800 mb-2 line-clamp-2 break-words">{t(service.name)}</h3>
        {hasPrice && (
          <p className="text-sm font-semibold text-[#006948] -mt-1 mb-2">{t('Starting from {price}', { price: formatINR(price) })}</p>
        )}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{t(service.description)}</p>
        
        {features.length > 0 && (
          <ul className="mb-4 space-y-1">
            {features.slice(0, 3).map((feature, index) => (
              <li key={index} className="text-sm text-gray-500 flex items-start">
                <span className="text-primary-500 mr-2">✓</span>
                <span className="line-clamp-1 break-words">{t(feature)}</span>
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
