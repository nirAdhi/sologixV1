// Cookie-consent banner (bottom of the screen, public pages only). Until the
// visitor answers, no analytics run at all — accepting turns on the first-party
// footfall counter (Admin > Analytics) and Google Analytics / Clarity when the
// admin configured them; declining keeps the site fully usable without tracking.
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useT } from '../i18n';
import { getConsent, setConsent, clearVisitorId } from '../utils/consent';

const isPrivatePath = (p) => /^\/(admin|portal|crm)(\/|$)/.test(p);

export default function CookieConsent() {
  const { t } = useT();
  const location = useLocation();
  const [answered, setAnswered] = useState(() => getConsent() !== null);

  if (answered || isPrivatePath(location.pathname || '/')) return null;

  const accept = () => { setConsent('yes'); setAnswered(true); };
  const decline = () => { clearVisitorId(); setConsent('no'); setAnswered(true); };

  return (
    <div role="region" aria-label={t('Cookie preferences')}
      className="fixed bottom-0 inset-x-0 z-[250] p-3 sm:p-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
        <p className="text-sm text-gray-700 leading-snug flex-1">
          <span className="font-semibold text-gray-900">🍪 {t('Cookies on this site')} — </span>
          {t('We use cookies to count visitors and understand which pages help you, so we can improve our solar services. No personal details are collected without your permission.')}
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button type="button" onClick={decline}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-300 text-gray-600 hover:bg-gray-100 transition-colors">
            {t('Only necessary')}
          </button>
          <button type="button" onClick={accept}
            className="px-5 py-2.5 rounded-xl text-sm font-bold bg-[#006948] text-white hover:bg-green-700 transition-colors">
            {t('Accept cookies')}
          </button>
        </div>
      </div>
    </div>
  );
}
