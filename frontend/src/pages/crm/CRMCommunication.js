import React, { useState } from 'react';
import CRMLayout from '../../components/CRMLayout';

const TEMPLATES = {
  welcome: {
    subject: 'Thank you for your solar enquiry — Sologix Energy',
    body: `Dear {{name}},

Thank you for reaching out to Sologix Energy! We have received your enquiry and our team will get back to you within 24 hours.

Your enquiry details:
- Phone: {{phone}}
- Service Interest: {{service_interest}}
- Source: {{source}}

In the meantime, you can:
✅ Explore our services at https://www.sologixenergy.in
☀️ Calculate your savings at https://www.sologixenergy.in/solar-calculator

Best regards,
Team Sologix Energy
📞 +91 8287766474 | info@sologixenergy.in
STPI Building, Namkum Industrial Area, Ranchi, Jharkhand`,
  },
  followup1: {
    subject: 'Following up on your solar enquiry — Sologix Energy',
    body: `Dear {{name}},

We wanted to follow up on your recent enquiry about solar installation.

Our expert team is ready to provide you with a free site survey and customised quotation for your property.

Benefits you can expect:
• Reduce electricity bill by up to 90%
• Government subsidy up to ₹78,000
• ROI within 3-5 years

Would you like to schedule a free consultation? Reply to this email or call us at +91 8287766474.

Best regards,
Team Sologix Energy`,
  },
  proposal: {
    subject: 'Your Solar Proposal is Ready — Sologix Energy',
    body: `Dear {{name}},

We are pleased to share that your customised solar proposal is ready!

Our team has prepared a detailed proposal based on your energy requirements. Please find the attached quotation.

Next Steps:
1. Review the attached proposal
2. Schedule a site visit
3. Apply for PM Surya Ghar Subsidy (we'll assist)

Call us at +91 8287766474 to discuss further.

Best regards,
Team Sologix Energy`,
  },
};

export default function CRMCommunication() {
  const [activeTemplate, setActiveTemplate] = useState('welcome');
  const [templates, setTemplates] = useState(TEMPLATES);
  const [smtpSettings, setSmtpSettings] = useState({
    host: 'smtp.gmail.com',
    port: '587',
    user: '',
    pass: '',
    from: 'Sologix Energy <info@sologixenergy.in>',
  });
  const [saved, setSaved] = useState(false);

  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };

  return (
    <CRMLayout title="Communication & Automation">
      <div className="space-y-6 max-w-5xl">

        {/* PRD requirements */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <h3 className="text-white font-semibold mb-4">📋 PRD Requirements — Communication Module</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id:'CA-01', label:'Auto-send confirmation email within 60s of form submission', status:'configure' },
              { id:'CA-02', label:'Auto-notify sales team via email when new lead is created', status:'configure' },
              { id:'CA-03', label:'Follow-up email sequence: Day 1, Day 3, Day 7', status:'template' },
              { id:'CA-04', label:'SMS notification to sales team for high-intent leads', status:'manual' },
              { id:'CA-05', label:'Email templates editable by admin (no developer needed)', status:'live' },
              { id:'CA-06', label:'All emails must include unsubscribe link (GDPR)', status:'note' },
              { id:'CA-07', label:'Track email open rate and click rate per lead', status:'hubspot' },
            ].map(({ id, label, status }) => (
              <div key={id} className="flex items-start gap-3 bg-white/5 rounded-xl p-3">
                <span className="text-xs px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 bg-green-500/20 text-green-400">{id}</span>
                <p className="text-gray-300 text-xs flex-1">{label}</p>
                <span className="text-xs flex-shrink-0">{
                  status==='live' ? '✅' : status==='configure' ? '⚙️' : status==='template' ? '📝' : status==='hubspot' ? '🔌' : '📌'
                }</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Template list */}
          <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-5">
            <h3 className="text-white font-semibold mb-4">📝 Email Templates</h3>
            <div className="space-y-2">
              {[
                { key:'welcome', label:'Welcome / Confirmation', icon:'📨', auto:'Immediate' },
                { key:'followup1', label:'Follow-up Day 1', icon:'📩', auto:'Day 1' },
                { key:'proposal', label:'Proposal Sent', icon:'📋', auto:'Manual' },
              ].map(({ key, label, icon, auto }) => (
                <button key={key} onClick={() => setActiveTemplate(key)}
                  className={"w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all " +
                    (activeTemplate === key ? 'bg-[#006948]/30 border border-[#006948]/50' : 'bg-white/5 hover:bg-white/10 border border-transparent')}>
                  <span className="text-xl">{icon}</span>
                  <div>
                    <p className="text-white text-xs font-medium">{label}</p>
                    <p className="text-gray-500 text-xs">{auto}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Template editor */}
          <div className="lg:col-span-2 bg-[#1a2235] rounded-2xl border border-white/5 p-6">
            <h3 className="text-white font-semibold mb-4">Edit Template — <span className="text-[#006948]">{activeTemplate}</span></h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-2">Subject Line</label>
                <input value={templates[activeTemplate].subject}
                  onChange={e => setTemplates(prev => ({ ...prev, [activeTemplate]: { ...prev[activeTemplate], subject: e.target.value } }))}
                  className="w-full bg-gray-950 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
              </div>
              <div>
                <label className="text-xs text-gray-400 font-medium block mb-2">Body <span className="text-gray-600">— use {'{{name}}'}, {'{{phone}}'}, {'{{service_interest}}'} as variables</span></label>
                <textarea value={templates[activeTemplate].body}
                  onChange={e => setTemplates(prev => ({ ...prev, [activeTemplate]: { ...prev[activeTemplate], body: e.target.value } }))}
                  rows={14}
                  className="w-full bg-gray-950 border border-white/10 text-white rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#006948] resize-none font-mono text-xs" />
              </div>
            </div>
          </div>
        </div>

        {/* SMTP Settings */}
        <div className="bg-[#1a2235] rounded-2xl border border-white/5 p-6">
          <h3 className="text-white font-semibold mb-4">📮 SMTP Configuration</h3>
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-5 text-yellow-400 text-xs">
            ⚠️ These values should also be set in your backend <code>.env</code> file as SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[['SMTP Host','host','smtp.gmail.com'],['SMTP Port','port','587'],['Email User','user','your@gmail.com'],['App Password','pass',''],['From Name','from','Sologix Energy <info@...>']].map(([label, key, ph]) => (
              <div key={key}>
                <label className="text-xs text-gray-400 font-medium block mb-2">{label}</label>
                <input type={key === 'pass' ? 'password' : 'text'} value={smtpSettings[key]}
                  onChange={e => setSmtpSettings(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={ph}
                  className="w-full bg-gray-950 border border-white/10 text-white rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#006948]" />
              </div>
            ))}
          </div>
        </div>

        <button onClick={save} className="bg-[#006948] text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors">
          {saved ? '✅ Saved!' : 'Save Templates & Settings'}
        </button>
      </div>
    </CRMLayout>
  );
}
