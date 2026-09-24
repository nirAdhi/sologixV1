// Public business details and integration status, all driven by .env.
// Nothing secret is returned by publicConfig(); integrationStatus() only says
// whether each integration is set up, never the credentials themselves.

const clean = (v) => String(v === undefined || v === null ? '' : v).trim();
const PLACEHOLDER = /^(your[_-]|change[_-]?me|xxx|rzp_(live|test)_x+|placeholder)/i;
const isSet = (v) => clean(v) !== '' && !PLACEHOLDER.test(clean(v));
const httpsUrl = (v) => (/^https:\/\/[^\s"'<>]+$/i.test(clean(v)) ? clean(v) : '');
const digits = (v) => clean(v).replace(/[^\d]/g, '');

// Built-in defaults = what the site showed before .env control existed.
const DEFAULTS = {
  phone: '+91 8287766474',
  phoneAlt: '+91 9031018640',
  consultationPhone: '+91 9771419133',
  email: 'info@sologixenergy.in',
  emailAlt: 'amit@sologixenergy.in',
  whatsapp: '918287766474',
  siteUrl: 'https://sologixenergy.com',
  address: 'STPI Building, Plot-8, Namkum Industrial Area, Ranchi, Jharkhand - 834010',
  social: {
    youtube: 'https://www.youtube.com/@Solar_by_Sologix',
    facebook: 'https://www.facebook.com/sologix/',
    instagram: 'https://www.instagram.com/sologixenergy/',
    linkedin: 'https://www.linkedin.com/company/m-s-sologix-energy/',
    x: '',
  },
};

const SOCIAL_KEYS = ['youtube', 'facebook', 'instagram', 'linkedin', 'x'];

function envSocial() {
  const out = {};
  for (const k of SOCIAL_KEYS) {
    const raw = clean(process.env['SOCIAL_' + k.toUpperCase()]);
    if (/^(off|none|hide|-)$/i.test(raw)) { out[k] = 'off'; continue; } // hide the button
    const v = httpsUrl(raw);
    if (v) out[k] = v;
  }
  return out;
}

// adminSocial: links saved in Admin > Site Content (used only where .env is empty)
function publicConfig(adminSocial = {}) {
  const env = envSocial();
  const social = {};
  const socialFromEnv = {};
  for (const k of SOCIAL_KEYS) {
    if (env[k]) { social[k] = env[k] === 'off' ? '' : env[k]; socialFromEnv[k] = true; }
    // Saved in Admin > Site Content: an empty field there means "hide this button"
    else if (adminSocial && Object.prototype.hasOwnProperty.call(adminSocial, k)) social[k] = httpsUrl(adminSocial[k]);
    else social[k] = DEFAULTS.social[k];
  }
  const phone = clean(process.env.CONTACT_PHONE) || DEFAULTS.phone;
  return {
    name: clean(process.env.BUSINESS_NAME) || 'Sologix Energy',
    phone,
    phoneAlt: clean(process.env.CONTACT_PHONE_ALT) || DEFAULTS.phoneAlt,
    consultationPhone: clean(process.env.CONSULTATION_PHONE) || (clean(process.env.CONTACT_PHONE) ? phone : DEFAULTS.consultationPhone),
    email: clean(process.env.CONTACT_EMAIL) || DEFAULTS.email,
    emailAlt: clean(process.env.CONTACT_EMAIL_ALT) || DEFAULTS.emailAlt,
    whatsapp: digits(process.env.WHATSAPP_NUMBER) || digits(DEFAULTS.whatsapp),
    address: clean(process.env.BUSINESS_ADDRESS) || DEFAULTS.address,
    siteUrl: httpsUrl(process.env.SITE_URL) || DEFAULTS.siteUrl,
    social,
    socialFromEnv,
  };
}

function smtpConfigured() {
  return isSet(process.env.SMTP_HOST || 'smtp.gmail.com') && isSet(process.env.SMTP_USER) && isSet(process.env.SMTP_PASS);
}

// For the admin "Integrations" panel. true/false only.
function integrationStatus() {
  return {
    email: { configured: smtpConfigured(), note: 'SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS' },
    whatsapp_api: {
      configured: isSet(process.env.WHATSAPP_TOKEN) && isSet(process.env.WHATSAPP_PHONE_ID),
      webhook_verified: isSet(process.env.WHATSAPP_APP_SECRET),
      note: 'WHATSAPP_TOKEN, WHATSAPP_PHONE_ID, WHATSAPP_APP_SECRET (Meta WhatsApp Cloud API, for the admin WhatsApp inbox)',
    },
    whatsapp_button: { configured: !!publicConfig().whatsapp, note: 'WHATSAPP_NUMBER (the green chat button on the website)' },
    razorpay: { configured: isSet(process.env.RAZORPAY_KEY_ID) && isSet(process.env.RAZORPAY_KEY_SECRET), note: 'RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET' },
    cloudinary: { configured: isSet(process.env.CLOUDINARY_CLOUD_NAME) && isSet(process.env.CLOUDINARY_API_KEY) && isSet(process.env.CLOUDINARY_API_SECRET), note: 'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET (image uploads)' },
    hubspot: { configured: isSet(process.env.HUBSPOT_TOKEN), note: 'HUBSPOT_TOKEN (optional CRM sync)' },
  };
}

module.exports = { publicConfig, integrationStatus, smtpConfigured, isSet, clean, SOCIAL_KEYS };
