# Secrets checklist — what the site needs and where to get it

Everything goes into `.env.docker` on the server (never into chat, email, WhatsApp or git).
To build the new file from your current one: `bash scripts/update-env.sh` (preview), then
`bash scripts/update-env.sh --apply`. It keeps every value you already have, generates
`JWT_SECRET` if needed and lists what is still missing (names only, never values).

## Must have (site will not work properly without)

| Setting | What it is | Where to get it |
|---|---|---|
| `JWT_SECRET` | Random key that signs logins | Generated for you by the script (`openssl rand -hex 48`). |
| `ADMIN_EMAIL` | Your admin login email | You choose. |
| `ADMIN_PASSWORD` | Your admin login password (12+ characters) | You choose. Applied on every restart. |
| `SMTP_HOST` / `SMTP_PORT` | Your email provider's server | Gmail: `smtp.gmail.com` / `587`. Hostinger: `smtp.hostinger.com` / `465`. Zoho India: `smtp.zoho.in` / `465`. |
| `SMTP_USER` | The mailbox that sends emails | e.g. `info@sologixenergy.in` |
| `SMTP_PASS` | That mailbox's password | Gmail/Workspace: Google Account → Security → 2-Step Verification → **App passwords** (16 letters). Hostinger: hPanel → Emails → the mailbox password. |

Without SMTP: no booking confirmations, no alerts to you, and customers can't reset passwords.

## Already correct unless you change them

`CONTACT_PHONE`, `CONTACT_EMAIL`, `WHATSAPP_NUMBER`, `SOCIAL_*`, `YOUTUBE_CHANNEL`, `UPI_*`, `DB_*` —
the template has today's values. **Do not change `DB_PASSWORD` / `MYSQL_ROOT_PASSWORD`** after the
database exists.

## Optional (each feature stays off until filled)

| Setting | Feature | Where to get it |
|---|---|---|
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` | Admin → WhatsApp inbox (send/receive from the admin panel) | developers.facebook.com → your app → WhatsApp → API Setup (use a *permanent* System User token from business.facebook.com → Settings → System users). |
| `WHATSAPP_APP_SECRET` | Receiving WhatsApp messages | Same app → App settings → Basic → App secret. |
| `WHATSAPP_VERIFY_TOKEN` | Webhook check | Any word you choose; enter the same in Meta's webhook settings (callback URL `https://sologixenergy.com/api/whatsapp/webhook`). |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Online payment (parked for now) | dashboard.razorpay.com → Settings → API Keys / Webhooks. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Store uploaded images in the cloud (otherwise kept on the server) | cloudinary.com → Dashboard → API Keys. You already use cloud `dsiratycd` for site images. |
| `HUBSPOT_TOKEN`, `HUBSPOT_PORTAL_ID` | Copy leads into HubSpot | HubSpot → Settings → Integrations → Private apps. |
| `YOUTUBE_API_KEY` | Show ALL channel videos (without it: latest 15) | console.cloud.google.com → APIs & Services → enable "YouTube Data API v3" → Credentials → API key (restrict it to that API). |

## Set in the admin panel (not secrets)

Google Analytics ID and Microsoft Clarity ID (CRM → Visitor Tracking), Tidio live-chat key and lead
pop-up (CRM → Lead Capture), email on/off switches and alert address (Admin → Email), YouTube section
(Admin → Site Content → YouTube videos).
