# Email (SMTP) setup — booking / quotation / order alerts

Two ways to connect the mailbox. Use ONE of them (the admin panel wins if both are set).

## Option A — Admin panel (no server access needed)
Admin → **Email & Integrations** → "SMTP connection" → *Enter connection*:

| Field | Value |
|---|---|
| Mail server (host) | `mail.prasanit.org` |
| Port | `465` |
| Security | SSL/TLS (port 465) |
| Username (email) | `solarenquiry@prasanit.org` |
| Password | the email account's password (from cPanel) |
| Send from | `solarenquiry@prasanit.org` |

Then press **Save connection** → **Check connection** → **Send test email**.

## Option B — .env file on the server
1. SSH into the server, go to the project folder.
2. **Back up first:** `cp .env.docker .env.docker.bak-$(date +%F)`
3. Open `.env.docker` and set these lines (these match the cPanel
   "Mail Client Manual Settings" for solarenquiry@prasanit.org):

```
SMTP_HOST=mail.prasanit.org
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=solarenquiry@prasanit.org
SMTP_PASS=PUT-THE-EMAIL-PASSWORD-HERE
SMTP_FROM=solarenquiry@prasanit.org
MAIL_FROM_NAME=Sologix Energy

# Where the "new booking / new enquiry / new order" alert emails go:
ADMIN_NOTIFY_EMAIL=divya@sologixenergy.in
```

4. Apply: `docker compose up -d --force-recreate app`
5. In Admin → Email & Integrations, press **Send test email** to confirm.

## Who receives what
- **Alerts to your team** (new booking, new quotation/enquiry, new product order)
  go to the "Send my alerts to" address — set it on the Email page
  (or `ADMIN_NOTIFY_EMAIL` in .env). Currently intended: divya@sologixenergy.in.
- **Customers** get booking confirmations, order confirmations and status
  updates automatically at their own address.
- Each alert type has its own on/off toggle on the Email page.

## Notes
- Never commit `.env.docker` to git (it is already gitignored).
- The password is stored only on your server. If it ever leaks, change it in
  cPanel and update it here.
- Emails send *from* prasanit.org; customer replies go to the "Customer replies
  go to" address set on the Email page (e.g. info@sologixenergy.in).
