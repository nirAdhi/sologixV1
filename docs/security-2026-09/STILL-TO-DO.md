# Not fixed in code (needs a decision, credentials, or content)

**Credentials (features silently off until set in .env.docker):** Razorpay key id/secret/webhook
secret, SMTP user/password (no emails send: booking confirmations, password-reset codes), WhatsApp
token/phone id + WHATSAPP_APP_SECRET, Cloudinary cloud/key/secret (in-app image uploads). Rotate
DB_PASSWORD and MYSQL_ROOT_PASSWORD too (they equal the defaults in docker-compose.yml).

**Online product payments:** the product pages used a Rs 1 placeholder ("admin sets actual price")
while telling the customer "Order confirmed". The server now charges the catalog price and refuses
online payment for items without a listed price (Pay on Delivery / quote instead). If you intended a
fixed token deposit, say so and it can be built explicitly with honest wording.

**Partner & client logos (34):** loaded from the old domain `www.sologixenergy.in/assets/img/partner/`,
which no longer serves them, so text labels show instead. Upload the logo files (e.g. to Cloudinary
folder `sologix/partners/`) and change the URL in `frontend/src/pages/HomePage.js`.

**Content:** 27 Unsplash stock photos stand in for your projects and products; the admin panel can
now store real ones. `show_price` in the catalog is never read by the public pages (prices show
whenever set).

**Google Analytics:** `frontend/public/index.html` still has the placeholder `G-XXXXXXXXXX`.

**Housekeeping on the server:** the unused copy `~/sologix/sologix-main` and `~/sologix/sologix-main.zip`,
plus `frontend.zip` and `*.bak*` files inside the live folder, should be archived off the server.
The frontend `package-lock.json` is out of sync with `package.json` (run `npm install` in
`frontend/` once and commit the lockfile).

**Hardening backlog (lower priority):** CSP still allows `'unsafe-inline'`/`'unsafe-eval'` and any
`connect-src`; schema changes run on every boot instead of versioned migrations; dependency upgrades
(`npm audit fix` in backend and frontend; nodemailer 10 and cloudinary 2 are major versions;
react-scripts is unmaintained, plan a move to Vite); add a UNIQUE(appointment_date, appointment_time)
constraint; `/api/payments/create-razorpay-order` requires an admin login (fine while bookings are
free; revisit if paid bookings return).
