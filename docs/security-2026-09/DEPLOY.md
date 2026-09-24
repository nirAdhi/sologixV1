# Deploying the fixed live build

**Tested before release (2026-09-24):** built with this `Dockerfile` and run against MySQL 8.0.46 in strict
mode (same as production). 25/25 end-to-end browser checks passed against the container itself (contact
form, booking, booking lookup, Pay on Delivery order, admin login, testimonial with a 12 MB photo, leads,
orders, catalog, site settings), plus 34/34 backend behaviour tests. Container reports `healthy`.

**Base image is now Node 22** (was Node 18, which stopped receiving security updates in April 2025 and is
too old for the patched email library). Nothing to do on the server: `docker compose up -d --build` pulls it.
The first build after this change downloads the new base image, so it takes a few minutes longer.

This tree is the **exact code running on the server** (`/root/sologix/sologix_up_2026-06-13/sologix-main`,
verified: `HomePage.js` is byte-identical to what sologixenergy.com serves) plus the security and
functional fixes in the latest commit. It is safe to deploy over the live folder: no live feature is
removed.

## 1. BEFORE you deploy: rotate JWT_SECRET (the app will refuse to start otherwise)

The fixed backend refuses to start with a missing, short, placeholder, or old `sologix_...` default
secret. On the server:

    cd /root/sologix/sologix_up_2026-06-13/sologix-main
    cp .env.docker .env.docker.bak.$(date +%F-%H%M)
    NEWJWT=$(openssl rand -hex 48)
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=$NEWJWT|" .env.docker
    grep -c '^JWT_SECRET=' .env.docker        # must print 1

Optional, only if you use them:

    WHATSAPP_APP_SECRET=...   # Meta App Dashboard > App settings > Basic > App secret (needed for the WhatsApp bot)
    HUBSPOT_TOKEN=...         # HubSpot private app token (never store it in the admin panel/DB)

**Admin login is now managed from `.env.docker`.** On every start the account in `ADMIN_EMAIL` is
set to `ADMIN_PASSWORD` / `ADMIN_NAME` with full super-admin rights (turn off with
`ADMIN_SYNC_FROM_ENV=false`). Check those two lines are what you want before deploying — that is the
login you will use afterwards. A weak value (under 12 characters or starting with admin/change/your/
password) is ignored with a warning in the logs.

### 1b. Add the new settings (email, contact details, social links)

Open `.env.docker` in WinSCP and copy in the sections you need from `.env.docker.example`
(full explanation in `docs/ENV-SETTINGS.md`). Anything you leave out keeps today's behaviour, except:
booking emails need `SMTP_*`, and the YouTube button stays hidden until you set `SOCIAL_YOUTUBE`
(both old YouTube links were dead).

## 2. Back up the current code

    cd /root/sologix/sologix_up_2026-06-13
    tar czf /root/sologix-backup-before-fixes-$(date +%F).tgz --exclude='*/node_modules' --exclude='*/frontend/build' sologix-main

## 3. Copy the fixed code over the live folder

Upload `sologix-live-fixed.zip` to `/root` with WinSCP, then:

    cd /root && rm -rf sologix-live && unzip -q sologix-live-fixed.zip     # creates /root/sologix-live
    cp -r /root/sologix-live/. /root/sologix/sologix_up_2026-06-13/sologix-main/

This overwrites code files only. `.env.docker`, `backend/uploads/` and the database are not in the zip
and are untouched. The zip also includes the `.git` folder, so the live folder becomes a git
repository from now on (see step 6).

## 4. Rebuild and restart

    cd /root/sologix/sologix_up_2026-06-13/sologix-main
    docker compose up -d --build
    docker compose logs --tail=40 backend      # expect "Admin login synced from .env" and "Server running on port 5000"

Then log in to the admin panel and open **Email** (top menu) → "Send test email".

## 5. Check it

    curl -s -o /dev/null -w "%{http_code}\n" https://sologixenergy.com/api/bookings                 # 400
    curl -s -o /dev/null -w "%{http_code}\n" https://sologixenergy.com/api/bookings/1               # 404
    curl -s -o /dev/null -w "%{http_code}\n" "https://sologixenergy.com/api/testimonials?all=true"  # 401
    curl -s -o /dev/null -w "%{http_code}\n" https://sologixenergy.com/api/no-such-endpoint         # 404
    curl -s https://sologixenergy.com/api/site-settings | head -c 200                               # only content keys

Then:
- Log in to the admin panel again (everyone is logged out by the new JWT secret and token format).
- Open Testimonials, edit one, upload a photo: it is resized in the browser and now saves.
  Add an "installation photo" URL too: it now saves and replaces the stock image on the home page.
- Place a test "Pay on Delivery" order on /products: it now appears under Admin > Product Orders.

## 6. From now on (long-term)

The folder is now a git repository with two commits: the live baseline and the fixes. To publish it
to GitHub (from the server, once its deploy key is set up):

    git remote add origin git@github.com:nirAdhi/sologix.git
    git push origin main:live-2026-09      # review, then make it the default branch

Future releases: push to GitHub, then on the server `git pull && docker compose up -d --build`.

## Rollback

    cd /root/sologix/sologix_up_2026-06-13
    tar xzf /root/sologix-backup-before-fixes-<date>.tgz
    cd sologix-main && cp .env.docker.bak.<stamp> .env.docker && docker compose up -d --build

## Worth checking in the database (orders that may have been lost)

Until now every product order failed to save (see audit). If you have Razorpay live keys configured,
compare your Razorpay dashboard with the orders table for payments that have no matching order:

    docker compose exec mysql mysql -uroot -p solar_booking -e "SELECT COUNT(*) FROM product_orders; SELECT COUNT(*) FROM leads;"
