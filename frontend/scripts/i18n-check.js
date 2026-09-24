#!/usr/bin/env node
// Checks the Hindi translation coverage.
//   node scripts/i18n-check.js [file ...]
// 1) every literal t('...') used in the given files (default: all customer
//    facing files) has a Hindi entry in src/i18n/hi/*.json
// 2) lists JSX text / common attributes that still contain raw English
//    (not wrapped in t()), so they can be reviewed.
// Exit code 1 if any t() key is missing.
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const HI_DIR = path.join(SRC, 'i18n', 'hi');
const DEFAULT_FILES = [
  'components/Navbar.js', 'components/Footer.js', 'components/ConsultationWidget.js',
  'components/MobileBookingPopup.js', 'components/ServiceCard.js',
  'pages/HomePage.js', 'pages/Services.js', 'pages/ServiceAndSolution.js', 'pages/Booking.js',
  'pages/BookingConfirmation.js', 'pages/BookingHistory.js', 'pages/Callback.js',
  'pages/SolarCalculator.js', 'pages/Gallery.js', 'pages/Products.js', 'pages/ProductDetail.js',
  'pages/BecomePartner.js', 'pages/About.js', 'pages/FAQ.js', 'pages/Contact.js',
  'pages/ProjectsPage.js', 'pages/Subsidies.js', 'pages/UnifiedLogin.js', 'pages/ForgotPassword.js',
  'pages/CustomerPortal.js', 'pages/CustomerBookingDetail.js',
];

const HI = {};
const dupes = [];
for (const f of fs.readdirSync(HI_DIR).filter(f => f.endsWith('.json'))) {
  let obj;
  try { obj = JSON.parse(fs.readFileSync(path.join(HI_DIR, f), 'utf8')); }
  catch (e) { console.error(`BROKEN JSON in ${f}: ${e.message}`); process.exit(2); }
  for (const [k, v] of Object.entries(obj)) {
    if (HI[k] !== undefined && HI[k] !== v) dupes.push(`${k}  (${f})`);
    HI[k] = v;
  }
}

const files = process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_FILES.map(f => path.join(SRC, f));
const unesc = (s, q) => s.replace(new RegExp('\\\\' + q, 'g'), q).replace(/\\\\/g, '\\');
let missing = 0;
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const rel = path.relative(SRC, file);
  const miss = new Set();
  const re = /\bt\(\s*(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  let m;
  while ((m = re.exec(src))) {
    const key = unesc(m[2], m[1]);
    if (m[1] === '`' && key.includes('${')) continue; // template with expressions: can't check
    if (!HI[key] && !HI[key.trim()]) miss.add(key);
  }
  // raw English left in JSX text nodes or common attributes
  const raw = [];
  const lines = src.split('\n');
  lines.forEach((line, i) => {
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('import ')) return;
    const jsxText = line.match(/>\s*([A-Za-z][^<>{}]*[A-Za-z.!?:])\s*</g) || [];
    const bare = /^[A-Za-z][A-Za-z0-9 ,.'’!?&:;()\-–—/%₹+]*[A-Za-z.!?:)]$/.test(t) && !/[=;{}]/.test(t) && t.split(' ').length > 1;
    const attr = line.match(/\b(placeholder|title|alt|aria-label)="([^"]*[A-Za-z]{3,}[^"]*)"/g) || [];
    if (jsxText.length || bare || attr.length) raw.push(`${i + 1}: ${t.slice(0, 110)}`);
  });
  if (miss.size || raw.length) {
    console.log(`\n== ${rel}`);
    for (const k of miss) console.log(`  MISSING HI: ${JSON.stringify(k)}`);
    if (raw.length) { console.log(`  raw English candidates (${raw.length}):`); raw.slice(0, 60).forEach(r => console.log('    ' + r)); }
  }
  missing += miss.size;
}
if (dupes.length) { console.log('\nKeys translated differently in two files:'); dupes.forEach(d => console.log('  ' + d)); }
console.log(`\n${Object.keys(HI).length} Hindi entries; ${missing} missing t() keys in ${files.length} files.`);
process.exit(missing ? 1 : 0);
