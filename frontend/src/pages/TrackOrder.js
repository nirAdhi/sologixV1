// Public "Track my order" page: order number + the phone used for the order.
// Reads GET /api/product-orders/track (rate limited; phone must match).
import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useT } from '../i18n';

const API = process.env.REACT_APP_API_URL || '/api';

// Order journey shown as a timeline. 'cancelled' is handled separately.
const STEPS = ['pending', 'contacted', 'confirmed', 'dispatched', 'delivered'];
const STEP_LABEL = {
  pending: 'Order received',
  contacted: 'Team contacted you',
  confirmed: 'Confirmed',
  dispatched: 'Dispatched',
  delivered: 'Delivered',
};
const fmtINR = (v) => '₹' + Number(v).toLocaleString('en-IN');

export default function TrackOrder() {
  const { t } = useT();
  const [params] = useSearchParams();
  const [id, setId] = useState(params.get('id') || '');
  const [phone, setPhone] = useState('');
  const [state, setState] = useState('idle'); // idle | loading | ok | error
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  const lookup = async (e) => {
    if (e) e.preventDefault();
    if (!/^\d+$/.test(id.trim())) { setError(t('Enter your order number (digits only)')); setState('error'); return; }
    if (String(phone).replace(/\D/g, '').length < 10) { setError(t('Enter the 10-digit phone number used for the order')); setState('error'); return; }
    setState('loading'); setError('');
    try {
      const r = await fetch(API + '/product-orders/track?id=' + encodeURIComponent(id.trim()) + '&phone=' + encodeURIComponent(phone.replace(/\D/g, '')));
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.success && j.data) { setOrder(j.data); setState('ok'); }
      else { setError(j.message ? t(j.message) : t('No order found for that order number and phone')); setState('error'); }
    } catch (err) { setError(t('Could not connect. Please check your internet and try again.')); setState('error'); }
  };

  const status = order ? String(order.status || '').toLowerCase() : '';
  const stepIndex = STEPS.indexOf(status);
  const cancelled = status === 'cancelled';
  const completed = status === 'completed';

  return (
    <div className="min-h-screen bg-gray-50 py-14 px-4">
      <div className="max-w-xl mx-auto">
        <div className="text-center mb-8">
          <span className="text-[#006948] font-medium uppercase tracking-[0.2em] block mb-3 text-sm">{t('Order Status')}</span>
          <h1 className="text-3xl font-bold text-gray-900">{t('Track Your Order')}</h1>
          <p className="text-gray-500 text-sm mt-2">{t('Enter your order number and the phone number you ordered with.')}</p>
        </div>

        <form onSubmit={lookup} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="to-id" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{t('Order number')}</label>
              <input id="to-id" value={id} onChange={e => setId(e.target.value)} inputMode="numeric" placeholder="e.g. 42"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
            </div>
            <div>
              <label htmlFor="to-phone" className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">{t('Phone number')}</label>
              <input id="to-phone" value={phone} onChange={e => setPhone(e.target.value)} type="tel" inputMode="tel" placeholder="98xxxxxxxx"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
            </div>
          </div>
          <button type="submit" disabled={state === 'loading'}
            className="mt-4 w-full bg-[#006948] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#004d34] transition-colors disabled:opacity-60">
            {state === 'loading' ? t('Checking...') : t('Check status')}
          </button>
          {state === 'error' && <p className="text-red-600 text-sm mt-3" role="alert">{error}</p>}
        </form>

        {state === 'ok' && order && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
              <h2 className="text-lg font-bold text-gray-900">{t('Order')} #{order.id}</h2>
              <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="text-sm text-gray-600 mb-5">
              {(order.items || []).map((i, idx) => <p key={idx}>• {i.qty} × {i.brand} {i.model}</p>)}
              {order.amount > 0 && <p className="mt-1 font-semibold text-gray-800">{t('Amount')}: {fmtINR(order.amount)}</p>}
            </div>

            {cancelled ? (
              <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700 font-semibold">
                {t('This order was cancelled. If that is unexpected, please call us.')}
              </div>
            ) : (
              <ol className="relative">
                {STEPS.map((s, i) => {
                  const reached = completed || (stepIndex >= 0 && i <= stepIndex);
                  const current = !completed && i === stepIndex;
                  return (
                    <li key={s} className="flex gap-3 pb-5 last:pb-0 relative">
                      {i < STEPS.length - 1 && <span className={'absolute left-[11px] top-6 bottom-0 w-0.5 ' + (reached ? 'bg-[#006948]' : 'bg-gray-200')} aria-hidden="true"></span>}
                      <span className={'w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 z-10 ' +
                        (reached ? 'bg-[#006948] text-white' : 'bg-gray-200 text-gray-400')}>
                        {reached ? '✓' : i + 1}
                      </span>
                      <span className={'text-sm ' + (current ? 'font-bold text-[#006948]' : reached ? 'font-semibold text-gray-800' : 'text-gray-400')}>
                        {t(STEP_LABEL[s])}
                        {current && <span className="ml-2 text-[11px] bg-green-50 text-[#006948] px-2 py-0.5 rounded-full font-bold">{t('Current')}</span>}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
            {completed && <p className="mt-4 text-sm font-semibold text-[#006948]">✅ {t('This order is complete. Thank you for choosing Sologix!')}</p>}
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-8">
          {t('Questions about your order?')}{' '}
          <Link to="/contact" className="text-[#006948] font-semibold hover:underline">{t('Contact us')}</Link>
        </p>
      </div>
    </div>
  );
}
