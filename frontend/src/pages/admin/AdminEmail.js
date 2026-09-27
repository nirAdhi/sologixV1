import AdminLayout from '../../components/AdminLayout';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { emailAdminAPI } from '../../utils/api';

// Admin > Email & Integrations
// SMTP credentials live in the server's .env file (never in the database or the
// browser). This page shows whether email works, sends a test, and controls
// which emails go out. It also lists which integrations are set up.

const TOGGLES = [
  { key: 'customer_booking_confirmation', title: 'Booking confirmation to the customer', desc: 'Sent right after a customer books a consultation / site visit on the website.' },
  { key: 'customer_status_updates', title: 'Booking status updates to the customer', desc: 'Sent when you change a booking (Admin → Bookings) or a product order status (Admin → Product Orders).' },
  { key: 'admin_new_booking', title: 'Alert me about every new booking', desc: 'Sent to the notification address below.' },
  { key: 'admin_new_lead', title: 'Alert me about new enquiries', desc: 'Contact form, callback requests, quote requests and partner applications.' },
  { key: 'admin_new_order', title: 'Alert me about new product orders', desc: 'Pay-on-Delivery orders and quote-cart orders from the Products page.' },
];

const INTEGRATIONS = [
  { key: 'email', name: 'Email (SMTP)', ok: 'Sending emails', off: 'Not set up — no emails are sent (booking confirmations, alerts and password-reset codes).' },
  { key: 'whatsapp_button', name: 'WhatsApp chat button', ok: 'Live on the website', off: 'Hidden — set WHATSAPP_NUMBER.' },
  { key: 'whatsapp_api', name: 'WhatsApp Business API (admin inbox)', ok: 'Connected', off: 'Not connected — Admin → WhatsApp cannot send or receive messages until the Meta keys are added.' },
  { key: 'razorpay', name: 'Razorpay online payments', ok: 'Keys present', off: 'Not set up — online payment is off (Pay on Delivery still works).' },
  { key: 'cloudinary', name: 'Cloudinary image uploads', ok: 'Keys present', off: 'Not set up — photos are stored on the server instead.' },
  { key: 'hubspot', name: 'HubSpot CRM', ok: 'Syncing leads', off: 'Not set up (optional).' },
];

const Card = ({ title, children, right }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="text-base font-bold text-gray-800">{title}</h2>
      {right}
    </div>
    {children}
  </div>
);

const Pill = ({ ok, children }) => (
  <span className={'inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ' + (ok ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700')}>
    <span className={'w-2 h-2 rounded-full ' + (ok ? 'bg-green-500' : 'bg-amber-500')} />{children}
  </span>
);

const BLANK_SMTP = { host: '', port: '587', security: 'auto', user: '', pass: '', from: '' };

export default function AdminEmail() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [smtpForm, setSmtpForm] = useState(BLANK_SMTP);
  const [smtpOpen, setSmtpOpen] = useState(false);
  const [smtpSaving, setSmtpSaving] = useState(false);

  const load = async () => {
    try {
      const r = await emailAdminAPI.get();
      setData(r.data.data);
      setForm(r.data.data.settings);
      const s = r.data.data.settings;
      setTestTo(t => t || (Array.isArray(s.admin_notify_emails) && s.admin_notify_emails[0]) || s.admin_notify_email || '');
    } catch (e) {
      toast.error(e.response?.data?.message || 'Could not load email settings');
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await emailAdminAPI.saveSettings(form);
      setForm(r.data.data);
      toast.success('Email settings saved');
    } catch (e) { toast.error(e.response?.data?.message || 'Could not save'); }
    finally { setSaving(false); }
  };
  const verify = async () => {
    setVerifying(true);
    try { const r = await emailAdminAPI.verify(); toast.success(r.data.message); }
    catch (e) { toast.error(e.response?.data?.message || 'Could not connect', { duration: 8000 }); }
    finally { setVerifying(false); load(); }
  };
  const sendTest = async () => {
    setTesting(true);
    try { const r = await emailAdminAPI.test(testTo); toast.success(r.data.message, { duration: 6000 }); }
    catch (e) { toast.error(e.response?.data?.message || 'Sending failed', { duration: 9000 }); }
    finally { setTesting(false); load(); }
  };
  const saveSmtp = async () => {
    setSmtpSaving(true);
    try {
      const r = await emailAdminAPI.saveSmtp(smtpForm);
      toast.success(r.data.message, { duration: 6000 });
      setSmtpForm(f => ({ ...f, pass: '' }));
      setSmtpOpen(false);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Could not save', { duration: 8000 }); }
    finally { setSmtpSaving(false); }
  };
  const clearSmtp = async () => {
    setSmtpSaving(true);
    try { const r = await emailAdminAPI.clearSmtp(); toast.success(r.data.message, { duration: 6000 }); setSmtpOpen(false); load(); }
    catch (e) { toast.error(e.response?.data?.message || 'Could not remove'); }
    finally { setSmtpSaving(false); }
  };

  if (loading) {
    return <AdminLayout title="Email & Integrations"><div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" /></div></AdminLayout>;
  }
  if (!data || !form) {
    return <AdminLayout title="Email & Integrations"><p className="text-gray-500">Could not load settings. You need the "Site settings" permission.</p></AdminLayout>;
  }
  const st = data.status;

  return (
    <AdminLayout title="Email & Integrations">
      <div className="max-w-4xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Email & Integrations</h1>
          <p className="text-sm text-gray-500 mt-1">Set up the email (SMTP) connection, choose which emails go out, and see whether the other integrations are active.</p>
        </div>

        {/* SMTP status */}
        <Card title="Email server (SMTP)" right={<Pill ok={st.configured}>{st.configured ? 'Set up' : 'Not set up'}</Pill>}>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2 text-sm mb-5">
            <div><span className="text-gray-500">Server:</span> <b>{st.host}:{st.port}</b> <span className="text-gray-400">({st.security})</span></div>
            <div><span className="text-gray-500">Login:</span> <b>{st.user || '—'}</b></div>
            <div><span className="text-gray-500">Sends as:</span> <b>{form.from_name}</b> &lt;{st.from || '—'}&gt;</div>
            <div><span className="text-gray-500">Connection from:</span> <b>{st.source === 'admin' ? 'this admin panel' : st.source === 'env' ? 'the server .env file' : 'not set up'}</b></div>
          </div>
          {!st.configured && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl p-4 mb-5">
              <p className="font-semibold mb-1">Emails are switched off until the SMTP connection is entered</p>
              <p>Fill in the connection below (for Gmail / Google Workspace: server <code>smtp.gmail.com</code>, port <code>587</code>, and an <b>App Password</b> — not the normal password).</p>
            </div>
          )}

          {/* SMTP connection editor */}
          <div className="border border-gray-100 rounded-xl p-4 mb-5 bg-gray-50">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-gray-800">SMTP connection</p>
              <button onClick={() => setSmtpOpen(o => !o)} className="text-xs font-semibold text-[#006948] hover:underline">
                {smtpOpen ? 'Close' : st.configured ? 'Change connection' : 'Enter connection'}
              </button>
            </div>
            {smtpOpen && (
              <div className="mt-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Mail server (host)</label>
                    <input value={smtpForm.host} onChange={e => setSmtpForm(f => ({ ...f, host: e.target.value }))} placeholder="smtp.gmail.com"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Port</label>
                      <input value={smtpForm.port} onChange={e => setSmtpForm(f => ({ ...f, port: e.target.value }))} placeholder="587"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Security</label>
                      <select value={smtpForm.security} onChange={e => setSmtpForm(f => ({ ...f, security: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white">
                        <option value="auto">Automatic (by port)</option>
                        <option value="starttls">STARTTLS (port 587)</option>
                        <option value="ssl">SSL/TLS (port 465)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Username (email)</label>
                    <input value={smtpForm.user} onChange={e => setSmtpForm(f => ({ ...f, user: e.target.value }))} placeholder="info@sologixenergy.in" autoComplete="off"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Password / App Password</label>
                    <input type="password" value={smtpForm.pass} onChange={e => setSmtpForm(f => ({ ...f, pass: e.target.value }))}
                      placeholder={st.source === 'admin' ? '(unchanged — leave empty to keep)' : ''} autoComplete="new-password"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Send from — email address (optional)</label>
                    <input type="email" value={smtpForm.from} onChange={e => setSmtpForm(f => ({ ...f, from: e.target.value }))} placeholder="usually the same as the username"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white" />
                    <p className="text-[11px] text-gray-400 mt-1">Leave empty to send as the username. This must be an email — to change the <b>name</b> people see (e.g. "Sologix Enquiry"), edit "Sender name" further down.</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                  <button onClick={saveSmtp} disabled={smtpSaving}
                    className="bg-[#006948] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
                    {smtpSaving ? 'Saving…' : 'Save connection'}
                  </button>
                  {st.source === 'admin' && (
                    <button onClick={clearSmtp} disabled={smtpSaving}
                      className="border border-red-200 text-red-600 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-red-50 disabled:opacity-50">
                      Remove (use .env instead)
                    </button>
                  )}
                  <span className="text-xs text-gray-400 self-center">After saving, use "Check connection" and "Send test email" below.</span>
                </div>
                <p className="text-xs text-gray-400 mt-3">The password is stored on your own server and is never shown here again. A connection saved here overrides the .env values.</p>
              </div>
            )}
          </div>
          {st.last_error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-4 mb-5">
              <p className="font-semibold">Last error ({new Date(st.last_error.at).toLocaleString('en-IN')})</p>
              <p className="break-words">{st.last_error.message}</p>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <input type="email" value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="you@example.com"
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
            <button onClick={sendTest} disabled={testing || !st.configured}
              className="bg-[#006948] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
              {testing ? 'Sending…' : 'Send test email'}
            </button>
            <button onClick={verify} disabled={verifying || !st.configured}
              className="border border-gray-200 px-5 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:border-[#006948] disabled:opacity-50">
              {verifying ? 'Checking…' : 'Check connection'}
            </button>
          </div>
        </Card>

        {/* What gets sent */}
        <Card title="Which emails are sent">
          <div className="divide-y divide-gray-100">
            {TOGGLES.map(({ key, title, desc }) => (
              <label key={key} className="flex items-start justify-between gap-4 py-3 cursor-pointer">
                <span>
                  <span className="block text-sm font-semibold text-gray-800">{title}</span>
                  <span className="block text-xs text-gray-500">{desc}</span>
                </span>
                <span className="relative inline-flex flex-shrink-0 mt-1">
                  <input type="checkbox" className="sr-only peer" checked={!!form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                  <span className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-[#006948] transition-colors" />
                  <span className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
                </span>
              </label>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-4 mt-5">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Sender name</label>
              <input value={form.from_name || ''} onChange={e => setForm(f => ({ ...f, from_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Customer replies go to</label>
              <input type="email" value={form.reply_to || ''} onChange={e => setForm(f => ({ ...f, reply_to: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Send my alerts to (up to 5, one per line)</label>
              <textarea rows={3}
                value={Array.isArray(form.admin_notify_emails) ? form.admin_notify_emails.join('\n') : (form.admin_notify_email || '')}
                onChange={e => setForm(f => ({ ...f, admin_notify_emails: e.target.value.split('\n') }))}
                placeholder={'divya@sologixenergy.in\ninfo@sologixenergy.in'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none" />
              <p className="text-[11px] text-gray-400 mt-1">Every booking / enquiry / order alert goes to all addresses listed here.</p>
            </div>
          </div>
          <button onClick={save} disabled={saving}
            className="mt-5 bg-[#006948] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Save email settings'}
          </button>
        </Card>

        {/* Recent activity */}
        <Card title="Recent emails" right={<button onClick={load} className="text-xs text-[#006948] font-semibold hover:underline">Refresh</button>}>
          {st.recent && st.recent.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-gray-400 border-b border-gray-100">
                  <th className="py-2 pr-3 font-medium">When</th><th className="py-2 pr-3 font-medium">Type</th>
                  <th className="py-2 pr-3 font-medium">To</th><th className="py-2 font-medium">Result</th></tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {st.recent.map((r, i) => (
                    <tr key={i}>
                      <td className="py-2 pr-3 whitespace-nowrap text-gray-500">{new Date(r.at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{String(r.kind).replace(/_/g, ' ')}</td>
                      <td className="py-2 pr-3 whitespace-nowrap text-gray-600">{r.to}</td>
                      <td className="py-2">{r.ok ? <Pill ok>Sent</Pill> : <span className="text-xs text-red-600" title={r.error}>{r.skipped ? 'Skipped — email not set up' : 'Failed: ' + (r.error || '').slice(0, 80)}</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-sm text-gray-400">No emails since the site last restarted.</p>}
        </Card>

        {/* Integrations */}
        <Card title="Integrations status">
          <div className="divide-y divide-gray-100">
            {INTEGRATIONS.map(({ key, name, ok, off }) => {
              const it = data.integrations[key] || {};
              return (
                <div key={key} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{name}</p>
                    <p className="text-xs text-gray-500">{it.configured ? ok : off}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">.env: {it.note}</p>
                  </div>
                  <Pill ok={!!it.configured}>{it.configured ? 'Active' : 'Off'}</Pill>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
