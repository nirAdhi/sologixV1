# Managing the site from `.env.docker`

**Moving to the new file:** after copying the new code to the server run `bash scripts/update-env.sh`
(preview, keeps all your current values, generates `JWT_SECRET` if needed, lists what is missing) and then
`bash scripts/update-env.sh --apply`. See `docs/SECRETS-CHECKLIST.md` for where to get each secret.

All passwords, keys and business details live in one file on the server:
`/root/sologix/sologix_up_2026-06-13/sologix-main/.env.docker`
(the template with explanations is `.env.docker.example` in this folder).

After editing it, apply the change with:

    cd /root/sologix/sologix_up_2026-06-13/sologix-main
    docker compose up -d --force-recreate backend
    docker compose logs --tail=20 backend

No rebuild is needed for `.env` changes.

## What each section controls

| Section | Keys | What happens |
|---|---|---|
| Admin login | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`, `ADMIN_SYNC_FROM_ENV` | On every restart that account is created/updated: password, name, super-admin, all permissions, active. Change the password here, restart, log in with the new one. A weak password (under 12 characters, or starting with admin/change/your/password) is ignored and the log says so. Changing `ADMIN_EMAIL` creates a second admin; switch the old one off in Admin → Sub-Admins if no longer needed. |
| Security key | `JWT_SECRET` | Signs logins. Required. Changing it logs everyone out. |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `SMTP_FROM` | Sends booking confirmations, admin alerts and password-reset codes. Check it in Admin → Email → "Send test email". |
| Email defaults | `MAIL_FROM_NAME`, `MAIL_REPLY_TO`, `ADMIN_NOTIFY_EMAIL` | Starting values for the Admin → Email page (the page can change them). |
| Contact details | `BUSINESS_NAME`, `CONTACT_PHONE`, `CONTACT_PHONE_ALT`, `CONSULTATION_PHONE`, `CONTACT_EMAIL`, `CONTACT_EMAIL_ALT`, `BUSINESS_ADDRESS`, `SITE_URL` | Shown in the footer, contact page, booking confirmation page, floating consultation badge and every email. |
| WhatsApp button | `WHATSAPP_NUMBER` | The green chat button on the home page and the WhatsApp link in the footer. Digits with country code, e.g. `918287766474`. |
| Social buttons | `SOCIAL_YOUTUBE`, `SOCIAL_FACEBOOK`, `SOCIAL_INSTAGRAM`, `SOCIAL_LINKEDIN`, `SOCIAL_X` | Full `https://` link. Empty = use Admin → Site Content (or built-in). `off` = hide. |
| YouTube videos | `YOUTUBE_CHANNEL`, `YOUTUBE_API_KEY` | Homepage video section pulls the latest uploads from this channel every 30 minutes (15 latest without a key, up to 200 with a free YouTube Data API key). Title, on/off, number of videos, Shorts and hiding individual videos: Admin → Site Content → YouTube videos. |
| WhatsApp Business API | `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_APP_SECRET`, `WHATSAPP_VERIFY_TOKEN` | Only for the Admin → WhatsApp inbox (sending/receiving from the admin panel). Not needed for the chat button. |
| Payments | `RAZORPAY_*`, `UPI_*` | Online payment (currently off). |
| Images | `CLOUDINARY_*` | Optional cloud image storage. |
| CRM | `HUBSPOT_TOKEN`, `HUBSPOT_PORTAL_ID` | Optional lead sync. |
| Database / server | `DB_*`, `MYSQL_ROOT_PASSWORD`, `PORT`, `NODE_ENV`, `ALLOWED_ORIGINS` | Leave as they are. DB passwords are fixed when the database is first created. |

## Which emails are sent

Admin → **Email** (top menu, needs the "site settings" permission):

- Booking confirmation to the customer — right after they book on the website.
- Booking status updates to the customer — when you confirm/reschedule/complete/cancel in Admin → Bookings.
- Alerts to you for every new booking, enquiry (contact form, callback, quote, partner) and product order.

Each can be switched on/off there, plus the sender name, reply-to address and the address that gets
the alerts. The page also shows the last 30 emails (sent / failed and why) and which integrations
(WhatsApp API, Razorpay, Cloudinary, HubSpot) are set up.

## Gmail / Google Workspace

1. Turn on 2-Step Verification for the mailbox.
2. Google Account → Security → App passwords → create one called "Sologix website".
3. `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=the full address`, `SMTP_PASS=the 16-letter app password` (no spaces).
4. Restart, then Admin → Email → Send test email.

Hostinger mail: `SMTP_HOST=smtp.hostinger.com`, `SMTP_PORT=465`. Zoho India: `smtp.zoho.in`, `465`.
