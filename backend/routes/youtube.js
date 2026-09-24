const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { auth, requirePermission } = require('../middleware/auth');
const yt = require('../services/youtube');

// Public: videos for the homepage section (already filtered by the admin settings).
router.get('/', async (req, res) => {
  try {
    res.set('Cache-Control', 'public, max-age=120');
    res.json({ success: true, data: await yt.publicData() });
  } catch (e) {
    console.error('YouTube public data failed:', e.message);
    res.json({ success: true, data: { enabled: false, videos: [], channel: { url: yt.channelUrl() } } });
  }
});

const canManage = [auth, requirePermission('manage_settings')];
router.get('/admin', ...canManage, async (req, res) => {
  res.json({ success: true, data: await yt.adminData() });
});
const refreshLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: 'Please wait a minute before refreshing again.' } });
router.post('/refresh', ...canManage, refreshLimiter, async (req, res) => {
  const data = await yt.adminData({ force: true });
  res.status(data.error && !data.videos.length ? 502 : 200).json({ success: !data.error, data, message: data.error ? `Could not reach YouTube: ${data.error}` : `Loaded ${data.videos.length} videos from YouTube` });
});

module.exports = router;
