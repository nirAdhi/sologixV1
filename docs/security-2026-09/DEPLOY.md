# Deploying the fixed live build

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

`ADMIN_PASSWORD` was already rotated on 2026-09-23. After this deploy it only seeds a brand-new
database; the existing admin keeps the password it has now, and changes made in the admin UI stick.

## 2. Back up the current code

    cd /root/sologix/sologix_up_2026-06-13
    tar czf /root/sologix-backup-before-fixes-$(date +%F).tgz --exclude='*/node_modules' --exclude='*/frontend/build' sologix-main

## 3. Copy the fixed code over the live folder

Upload `sologix-live-fixed.zip` to `/root` with WinSCP, then:

    cd /root && rm -rf sologix-live-fixed && unzip -q sologix-live-fixed.zip
    cp -r /root/sologix-live-fixed/. /root/sologix/sologix_up_2026-06-13/sologix-main/

This overwrites code files only. `.env.docker`, `backend/uploads/` and the database are not in the zip
and are untouched. The zip also includes the `.git` folder, so the live folder becomes a git
repository from now on (see step 6).

## 4. Rebuild and restart

    cd /root/sologix/sologix_up_2026-06-13/sologix-main
    docker compose up -d --build
    docker compose logs --tail=40 backend      # expect "Server running on port 5000", no errors

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
