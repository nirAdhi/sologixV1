# What each admin page changes on the website

Everything below was tested on 2026-09-24 by changing it in the admin and opening the site as a
new visitor (English and Hindi). Admin-typed text is shown exactly as typed in both languages; the
built-in default texts have Hindi translations.

| Admin page | What you change | Where visitors see it |
|---|---|---|
| Site Content → Stats | Numbers + labels (add/remove/reorder) | Homepage badges, About page |
| Site Content → Offerings | Title, text, image (upload or link), link | Homepage "Our Offerings" carousel |
| Site Content → Why choose us | Icon, title, text | Homepage cards (empty list hides the section) |
| Site Content → Work process | Step number, title, text, icon | Homepage steps (all three places) |
| Site Content → Social links | YouTube / Facebook / Instagram / LinkedIn / X (empty = hidden) | Floating buttons + footer (a link set in `.env` wins) |
| Site Content → YouTube videos | On/off, title, subtitle, how many, Shorts on/off, hide single videos, refresh | Homepage "Watch Sologix in Action" (videos come from the channel automatically) |
| Site Content → Theme | Colour theme | Whole site, from the visitor's next page load |
| Testimonials | Add/edit, photo, installation photo, active, order | Homepage testimonials (none active = section hidden) |
| Projects | Add/edit, image, type, ★ featured | Featured → homepage "Our Projects" (newest 6 if none featured); all → Projects page and Gallery (new types get their own filter tab) |
| Product Catalog | Category (can add new), brand/model/specs, price, sale price, unit, show price, in stock, badge, image, order | Products page + filters, navbar Products menu, product page, homepage products strip |
| Services | Name, text, price ("Starting from"), features, image, active | Services page, booking form, mobile booking popup |
| Bookings | Status, message to customer, progress, reschedule | Customer portal, booking page, status email |
| Product Orders | Status | Status email to the customer |
| Email | Which emails go out, sender name, reply-to, alert address, test | Customer emails + your alerts |
| CRM → Visitor Tracking | Google Analytics 4 ID, Microsoft Clarity ID | Loaded on every public page |
| CRM → Lead Capture | Exit-intent / timed pop-up (heading, text, button, delay), Tidio live chat | Public pages (desktop; once per visitor per 7 days) |

Contact numbers, email, address and the WhatsApp number come from `.env.docker` (see ENV-SETTINGS.md).
