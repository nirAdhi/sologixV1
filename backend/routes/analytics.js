// Aggregated footfall numbers for Admin > Analytics. Reads the first-party
// site_visits table written by routes/track.js. Requires the view_reports
// permission — the same gate as transactions and dashboard stats.
const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { auth, requirePermission } = require('../middleware/auth');

router.get('/', auth, requirePermission('view_reports'), async (req, res) => {
  try {
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 7), 90);

    const [[today]] = await db.query(
      `SELECT COUNT(*) views, COUNT(DISTINCT visitor) visitors FROM site_visits
       WHERE event='pageview' AND created_at >= CURDATE()`);
    const [[d7]] = await db.query(
      `SELECT COUNT(*) views, COUNT(DISTINCT visitor) visitors FROM site_visits
       WHERE event='pageview' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)`);
    const [[dN]] = await db.query(
      `SELECT COUNT(*) views, COUNT(DISTINCT visitor) visitors FROM site_visits
       WHERE event='pageview' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`, [days - 1]);

    const [daily] = await db.query(
      // DATE_FORMAT so the day arrives as a plain 'YYYY-MM-DD' string — a DATE
      // column would come back as a JS Date shifted by the server timezone.
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') d, COUNT(*) views, COUNT(DISTINCT visitor) visitors
       FROM site_visits WHERE event='pageview' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY d ORDER BY d ASC`, [days - 1]);

    const [topPages] = await db.query(
      `SELECT path, COUNT(*) views, COUNT(DISTINCT visitor) visitors
       FROM site_visits WHERE event='pageview' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY path ORDER BY views DESC LIMIT 10`, [days - 1]);

    const [devices] = await db.query(
      `SELECT device, COUNT(DISTINCT visitor) visitors
       FROM site_visits WHERE event='pageview' AND device <> '' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY device`, [days - 1]);

    const [referrers] = await db.query(
      `SELECT referrer, COUNT(DISTINCT visitor) visitors
       FROM site_visits WHERE event='pageview' AND referrer <> '' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY referrer ORDER BY visitors DESC LIMIT 8`, [days - 1]);

    const [langs] = await db.query(
      `SELECT lang, COUNT(DISTINCT visitor) visitors
       FROM site_visits WHERE event='pageview' AND lang <> '' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY lang`, [days - 1]);

    const [logins] = await db.query(
      `SELECT event, COUNT(*) count, SUM(created_at >= CURDATE()) today
       FROM site_visits WHERE event IN ('admin_login','customer_login')
       AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY) GROUP BY event`, [days - 1]);

    res.json({
      success: true,
      data: {
        days,
        totals: { today, d7, range: dN },
        daily, topPages, devices, referrers, langs,
        logins: Object.fromEntries(logins.map(l => [l.event, { count: l.count, today: Number(l.today) || 0 }])),
      },
    });
  } catch (e) {
    console.error('Analytics query failed:', e.code || e.message);
    res.status(500).json({ success: false, message: 'Could not load analytics' });
  }
});

module.exports = router;
