const HUBSPOT_TOKEN = process.env.HUBSPOT_TOKEN || '';
const BASE = 'https://api.hubapi.com';
const hdrs = () => ({ 'Authorization': `Bearer ${HUBSPOT_TOKEN}`, 'Content-Type': 'application/json' });

const testConnection = async () => {
  if (!HUBSPOT_TOKEN) throw new Error('HUBSPOT_TOKEN not set in .env');
  const res = await fetch(`${BASE}/crm/v3/objects/contacts?limit=1`, { headers: hdrs() });
  if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.message || `HubSpot error ${res.status}`); }
  return { connected: true };
};

const upsertContact = async (lead) => {
  if (!HUBSPOT_TOKEN) return null;
  const parts = (lead.name||'').split(' ');
  const props = {
    firstname: parts[0] || lead.name,
    lastname: parts.slice(1).join(' ') || '',
    phone: lead.phone || '',
    email: lead.email || '',
    hs_lead_status: 'NEW',
    lifecyclestage: 'lead',
  };
  // Search by email
  let contactId = null;
  if (lead.email) {
    const sr = await fetch(`${BASE}/crm/v3/objects/contacts/search`, {
      method:'POST', headers: hdrs(),
      body: JSON.stringify({ filterGroups:[{filters:[{propertyName:'email',operator:'EQ',value:lead.email}]}], limit:1 }),
    }).then(r=>r.json()).catch(()=>({results:[]}));
    if (sr.results?.length) contactId = sr.results[0].id;
  }
  if (contactId) {
    await fetch(`${BASE}/crm/v3/objects/contacts/${contactId}`,{ method:'PATCH', headers:hdrs(), body:JSON.stringify({properties:props}) });
    return { contactId, action:'updated' };
  }
  const res = await fetch(`${BASE}/crm/v3/objects/contacts`,{ method:'POST', headers:hdrs(), body:JSON.stringify({properties:props}) });
  if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e.message||'HubSpot contact create failed'); }
  const data = await res.json();
  return { contactId: data.id, action:'created' };
};

const createDeal = async (contactId, lead) => {
  if (!HUBSPOT_TOKEN || !contactId) return null;
  const res = await fetch(`${BASE}/crm/v3/objects/deals`,{
    method:'POST', headers:hdrs(),
    body: JSON.stringify({
      properties:{ dealname:`${lead.name} — ${lead.service_interest||'Solar Inquiry'}`, dealstage:'appointmentscheduled', pipeline:'default' },
      associations:[{ to:{id:contactId}, types:[{associationCategory:'HUBSPOT_DEFINED',associationTypeId:3}] }],
    }),
  });
  if (!res.ok) return null;
  return (await res.json()).id;
};

const syncLead = async (lead) => {
  if (!HUBSPOT_TOKEN) return { skipped:true };
  try {
    const contact = await upsertContact(lead);
    if (contact?.contactId) await createDeal(contact.contactId, lead);
    console.log(`[HubSpot] Lead synced: ${lead.name} → contactId ${contact?.contactId}`);
    return { success:true, contactId: contact?.contactId };
  } catch(e) {
    console.error('[HubSpot] Sync failed:', e.message);
    return { success:false, error: e.message };
  }
};

module.exports = { testConnection, syncLead };
