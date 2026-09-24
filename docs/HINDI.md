# Hindi version of the website

Visitors switch language with the **EN | हिन्दी** pill in the top menu (also on the login,
forgot-password and customer-portal pages). The choice is remembered in their browser.
A link can open the site directly in Hindi by adding `?lang=hi`, e.g.
`https://sologixenergy.com/?lang=hi` (handy for WhatsApp or Facebook posts).

## Where the Hindi text lives
`frontend/src/i18n/hi/*.json`, one file per area:

| File | Pages |
|---|---|
| common.json | top menu, product categories, messages from the server |
| home.json | home page, consultation badge, mobile booking popup, service cards |
| products.json | products catalogue, product detail, quote cart, order form |
| booking.json | booking, confirmation, booking history, callback, service names |
| portal.json | login, forgot password, customer portal, booking detail |
| pages1.json | services, solutions, calculator, subsidies, footer |
| pages2.json | about, FAQ, contact, become a partner, gallery, projects |

Each line is `"English text": "हिन्दी पाठ"`. To change a Hindi wording, edit the right-hand
side only, then rebuild (`docker compose up -d --build`). If an English text has no Hindi entry
the English is shown, so nothing breaks.

## What stays in English on purpose
Brand and product model names, prices, phone numbers, emails, addresses, customer names,
testimonial quotes and anything typed in the admin panel (project names, new services, etc.).
The admin panel itself is English.

## Checking coverage after changing a page
`cd frontend && node scripts/i18n-check.js` lists any `t('...')` text without Hindi and any
raw English left in the customer-facing pages.
