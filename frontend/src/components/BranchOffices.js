// Branch office cards, driven by Admin > Site Content > Branch offices
// (site setting "branches"; the two built-in branches show until edited).
// Used on the Contact page (full cards) and in the Footer (compact).
import React from 'react';
import { useSiteContent, DEFAULT_BRANCHES } from '../utils/siteContent';
import { useT } from '../i18n';

// "Amit Ranjan — 9031018640" → clickable number, label kept as text.
function PhoneLine({ line, compact }) {
  const m = String(line).match(/^(.*?)[\s:—–-]*((?:\+?\d[\d\s-]{8,14}\d))\s*$/);
  const label = m ? m[1].replace(/[\s:—–-]+$/, '').trim() : '';
  const number = m ? m[2].replace(/[\s-]/g, '') : '';
  if (!number) return <span>{line}</span>;
  return (
    <span className={compact ? '' : 'whitespace-nowrap'}>
      {label && <span>{label}: </span>}
      <a href={'tel:' + number} className={compact ? 'hover:text-white font-medium' : 'text-[#006948] font-semibold hover:underline'}>{m[2].trim()}</a>
    </span>
  );
}

export function useBranches() {
  const { pick } = useSiteContent();
  const branches = pick('branches', DEFAULT_BRANCHES);
  return Array.isArray(branches)
    ? branches.filter(b => b && typeof b === 'object' && b.name)
    : [];
}

// Full cards (Contact page).
export default function BranchOffices() {
  const { t } = useT();
  const branches = useBranches();
  if (!branches.length) return null;
  return (
    <section id="branches" className="mt-12">
      <div className="text-center mb-8">
        <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-3 text-sm">{t('Near You')}</span>
        <h2 className="text-3xl font-bold text-gray-900">{t('Our Branch Offices')}</h2>
        <p className="text-gray-500 text-sm mt-2">{t('Walk in or call the branch closest to you.')}</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 max-w-4xl mx-auto">
        {branches.map((b, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:border-green-200 transition-all">
            <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-2"><span aria-hidden="true">🏢</span>{t(b.name)}</h3>
            {b.address && <p className="text-sm text-gray-600 leading-relaxed mb-3">📍 {b.address}</p>}
            <ul className="space-y-1 text-sm text-gray-700">
              {(b.phones || []).map((p, j) => <li key={j}>📞 <PhoneLine line={p} /></li>)}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

// Compact list (Footer, dark background).
export function BranchOfficesCompact() {
  const { t } = useT();
  const branches = useBranches();
  if (!branches.length) return null;
  return (
    <div className="border-t border-white/10 pt-6 mt-8">
      <p className="text-sm font-semibold text-white mb-3">{t('Our Branch Offices')}</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {branches.map((b, i) => (
          <div key={i} className="text-xs text-gray-400 leading-relaxed">
            <p className="font-semibold text-gray-300">🏢 {t(b.name)}</p>
            {b.address && <p className="mt-0.5">{b.address}</p>}
            <p className="mt-0.5 space-x-3">
              {(b.phones || []).map((p, j) => <PhoneLine key={j} line={p} compact />)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
