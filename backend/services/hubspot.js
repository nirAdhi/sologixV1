const BASE = 'https://api.hubapi.com';

// Read the token at call time (not once at startup) so /api/admin/hubspot/save
// takes effect without a restart. The token lives only in the environment.
const token = () => process.env.HUBSPOT_TOKEN || '';
const hdrs = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });
const TIMEOUT_MS = 10000;
const hsFetch = (url, opts = {}) => fetch(url, { ...opts, signal: AbortSignal.timeout(TIMEOUT_MS) });

const testConnection = async () => {
  if (!token()) throw new Error('HUBSPOT_TOKEN not set');
  const res = await hsFetch(`${BASE}/crm/v3/objects/contacts?limit=1`, { headers: hdrs() });
  if (!res.ok) throw new Error(`HubSpot error ${res.status}`);
  return { connected: true };
};

const findContactByEmail = async (email) => {
  if (!email) return null;
  const sr = await hsFetch(`${BASE}/crm/v3/objects/contacts/search`, {
    method: 'POST', headers: hdrs(),
    body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }], limit: 1 }),
  }).then(r => r.json()).catch(() => ({ results: [] }));
  return sr.results?.length ? sr.results[0].id : null;
};

// SECURITY: leads arrive from an unauthenticated public form. If a contact with
// that email already exists we must NOT overwrite its name/phone/lifecycle with
// whatever the form sent (anyone who knows a customer's email could otherwise
// rewrite their CRM record). Existing contacts are left untouched; only new
// contacts are created.
const upsertContact = async (lead) => {
  if (!token()) return null;
  const existingId = await findContactByEmail(lead.email);
  if (existingId) return { contactId: existingId, action: 'existing' };

  const parts = (lead.name || '').split(' ');
  const props = {
    firstname: parts[0] || lead.name,
    lastname: parts.slice(1).join(' ') || '',
    phone: lead.phone || '',
    email: lead.email || '',
    hs_lead_status: 'NEW',
    lifecyclestage: 'lead',
  };
  const res = await hsFetch(`${BASE}/crm/v3/objects/contacts`, { method: 'POST', headers: hdrs(), body: JSON.stringify({ properties: props }) });
  if (!res.ok) throw new Error(`HubSpot contact create failed (${res.status})`);
  const data = await res.json();
  return { contactId: data.id, action: 'created' };
};

const createDeal = async (contactId, lead) => {
  if (!token() || !contactId) return null;
  const res = await hsFetch(`${BASE}/crm/v3/objects/deals`, {
    method: 'POST', headers: hdrs(),
    body: JSON.stringify({
      properties: { dealname: `${lead.name} — ${lead.service_interest || 'Solar Inquiry'}`, dealstage: 'appointmentscheduled', pipeline: 'default' },
      associations: [{ to: { id: contactId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] }],
    }),
  });
  if (!res.ok) return null;
  return (await res.json()).id;
};

const syncLead = async (lead) => {
  if (!token()) return { skipped: true };
  try {
    const contact = await upsertContact(lead);
    // One deal per NEW contact. Repeat submissions from an existing contact don't
    // spawn a new deal each time (spam or double-clicks would otherwise flood the pipeline).
    if (contact?.action === 'created') await createDeal(contact.contactId, lead);
    console.log(`[HubSpot] Lead synced -> contact ${contact?.contactId} (${contact?.action})`); // no names in logs
    return { success: true, contactId: contact?.contactId, action: contact?.action };
  } catch (e) {
    console.error('[HubSpot] Sync failed:', e.message);
    return { success: false, error: e.message };
  }
};

module.exports = { testConnection, syncLead };
