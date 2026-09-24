import React from 'react';
import { useT } from './index';

// Pill switch: EN | हिन्दी. `compact` is the small version for tight headers.
export default function LanguageToggle({ compact = false, className = '' }) {
  const { lang, setLang } = useT();
  const base = 'font-semibold transition-colors rounded-full ' + (compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs');
  const on = 'bg-[#006948] text-white shadow-sm';
  const off = 'text-gray-600 hover:text-[#006948]';
  return (
    <div role="group" aria-label="Language / भाषा"
      className={'inline-flex items-center bg-gray-100 border border-gray-200 rounded-full p-0.5 flex-shrink-0 ' + className}>
      <button type="button" lang="en" aria-pressed={lang === 'en'} onClick={() => setLang('en')}
        className={base + ' ' + (lang === 'en' ? on : off)} title="English">
        EN
      </button>
      <button type="button" lang="hi" aria-pressed={lang === 'hi'} onClick={() => setLang('hi')}
        className={base + ' ' + (lang === 'hi' ? on : off)} title="हिन्दी में देखें">
        हिन्दी
      </button>
    </div>
  );
}
