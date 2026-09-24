# Run Sologix on your own PC (local test copy)

Needs Docker Desktop for Windows. Nothing here touches the live site or its database.

1. Unzip the project anywhere, open the `local` folder.
2. Double-click `start-local.bat`. The first run builds the site (5-10 minutes); later runs take seconds.
3. Your browser opens http://localhost:8080. Admin panel: http://localhost:8080/admin/login
   with `admin@sologixenergy.in` / `Local-Test-Sologix-2026` (local test login only).
4. `stop-local.bat` stops it; `reset-local.bat` wipes the local test data.

After you change code, run `start-local.bat` again: it rebuilds with your changes.

Emails, WhatsApp, Cloudinary and Razorpay use placeholder settings locally, so those
features show their "not configured" behaviour. Pay-on-Delivery orders, bookings,
contact forms, testimonials and all admin pages work.
