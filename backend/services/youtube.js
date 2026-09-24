// Videos from the Sologix YouTube channel, shown on the homepage.
//
// Source: the channel's public RSS feed (latest 15 uploads, no API key needed).
// If YOUTUBE_API_KEY is set, the YouTube Data API is used instead and ALL
// uploads (up to 200) are listed. Results are cached for 30 minutes and the last
// good list is kept in the database, so a YouTube outage or a restart never
// empties the section.
//
// .env: YOUTUBE_CHANNEL (channel link, @handle or UC… id; falls back to
//       SOCIAL_YOUTUBE, then the Sologix channel), YOUTUBE_CHANNEL_ID (optional,
//       skips the lookup), YOUTUBE_API_KEY (optional).
const db = require('../config/database');

const DEFAULT_CHANNEL = 'https://www.youtube.com/@Solar_by_Sologix';
const CACHE_MS = 30 * 60 * 1000;
const FAIL_RETRY_MS = 5 * 60 * 1000;
const CACHE_KEY = 'youtube_cache';        // private site_settings row (not in the public key list)
const ID_RE = /^[A-Za-z0-9_-]{11}$/;
const CH_RE = /^UC[A-Za-z0-9_-]{22}$/;
const UA = 'Mozilla/5.0 (compatible; SologixWebsite/1.0; +https://sologixenergy.com)';

const DEFAULT_SECTION = {
  enabled: true,
  title: 'Watch Sologix in Action',
  subtitle: 'Real installations, customer stories and solar tips from our YouTube channel',
  max: 8,
  include_shorts: true,
  hidden: [],
};

const clean = (v) => String(v === undefined || v === null ? '' : v).trim();
function channelSetting() {
  return clean(process.env.YOUTUBE_CHANNEL) || clean(process.env.SOCIAL_YOUTUBE).replace(/^(off|none|hide|-)$/i, '') || DEFAULT_CHANNEL;
}
function channelUrl() {
  const c = channelSetting();
  if (/^https:\/\/(www\.|m\.)?youtube\.com\//i.test(c)) return c.replace(/\/+$/, '');
  if (/^@[\w.-]{3,}$/.test(c)) return `https://www.youtube.com/${c}`;
  if (CH_RE.test(c)) return `https://www.youtube.com/channel/${c}`;
  return DEFAULT_CHANNEL;
}

async function http(url, timeoutMs = 10000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': UA, 'Accept-Language': 'en' } });
    if (!res.ok) throw new Error(`YouTube answered ${res.status}`);
    return await res.text();
  } finally { clearTimeout(timer); }
}

// ---- channel id -------------------------------------------------------------
let resolved = { key: '', id: '' };
async function channelId() {
  const envId = clean(process.env.YOUTUBE_CHANNEL_ID);
  if (CH_RE.test(envId)) return envId;
  const setting = channelSetting();
  const direct = (setting.match(/(UC[A-Za-z0-9_-]{22})/) || [])[1];
  if (direct) return direct;
  if (resolved.key === setting && resolved.id) return resolved.id;
  const html = await http(channelUrl());
  const id = (html.match(/"externalId":"(UC[A-Za-z0-9_-]{22})"/) || html.match(/channel_id=(UC[A-Za-z0-9_-]{22})/) || html.match(/"channelId":"(UC[A-Za-z0-9_-]{22})"/) || [])[1];
  if (!id) throw new Error('Could not find the channel. Check YOUTUBE_CHANNEL in .env.');
  resolved = { key: setting, id };
  return id;
}

// ---- RSS ----------------------------------------------------------------------
const decode = (s) => String(s || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(Number(n)))
  .trim();
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)); return m ? decode(m[1]) : ''; };

function parseFeed(xml) {
  const head = xml.split('<entry>')[0];
  const channel = { title: tag(head, 'title') };
  const videos = [];
  for (const chunk of xml.split('<entry>').slice(1)) {
    const id = tag(chunk, 'yt:videoId');
    if (!ID_RE.test(id)) continue;
    const link = (chunk.match(/<link rel="alternate" href="([^"]+)"/) || [])[1] || '';
    const views = (chunk.match(/<media:statistics views="(\d+)"/) || [])[1];
    videos.push({
      id,
      title: tag(chunk, 'title').slice(0, 200) || 'Video',
      published: tag(chunk, 'published'),
      url: /\/shorts\//.test(link) ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`,
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      is_short: /\/shorts\//.test(link),
      views: views ? Number(views) : null,
    });
  }
  return { channel, videos };
}

// ---- Data API (optional, all uploads) ------------------------------------------
async function fromDataApi(key, chId) {
  const api = (path) => http(`https://www.googleapis.com/youtube/v3/${path}&key=${encodeURIComponent(key)}`).then(JSON.parse);
  const ch = await api(`channels?part=snippet,contentDetails&id=${chId}`);
  const item = ch.items && ch.items[0];
  if (!item) throw new Error('Channel not found via YouTube API');
  const uploads = item.contentDetails.relatedPlaylists.uploads;
  const videos = [];
  let page = '';
  for (let i = 0; i < 4; i++) { // 4 x 50 = 200 videos max
    const pl = await api(`playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${uploads}${page ? '&pageToken=' + page : ''}`);
    for (const it of pl.items || []) {
      const id = it.contentDetails && it.contentDetails.videoId;
      if (!ID_RE.test(id || '')) continue;
      videos.push({
        id, title: clean(it.snippet.title).slice(0, 200) || 'Video', published: it.contentDetails.videoPublishedAt || it.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${id}`, thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        is_short: false, views: null,
      });
    }
    if (!pl.nextPageToken) break;
    page = pl.nextPageToken;
  }
  // The API doesn't flag Shorts; mark them from the RSS feed where we can.
  try { const rss = parseFeed(await http(`https://www.youtube.com/feeds/videos.xml?channel_id=${chId}`)); const shorts = new Set(rss.videos.filter(v => v.is_short).map(v => v.id)); videos.forEach(v => { if (shorts.has(v.id)) { v.is_short = true; v.url = `https://www.youtube.com/shorts/${v.id}`; } }); } catch (e) { /* optional */ }
  return { channel: { title: clean(item.snippet.title) }, videos };
}

// ---- cache ------------------------------------------------------------------------
let mem = null;          // { channel, videos, updated_at, source }
let lastTry = 0;
let lastError = null;
let inflight = null;

async function loadStored() {
  try {
    const [rows] = await db.query('SELECT `value` FROM site_settings WHERE `key` = ?', [CACHE_KEY]);
    return rows.length ? JSON.parse(rows[0].value) : null;
  } catch (e) { return null; }
}
async function store(data) {
  try {
    const v = JSON.stringify(data);
    await db.query('INSERT INTO site_settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?', [CACHE_KEY, v, v]);
  } catch (e) { /* not fatal */ }
}

async function fetchFresh() {
  const chId = await channelId();
  const key = clean(process.env.YOUTUBE_API_KEY);
  const data = key ? await fromDataApi(key, chId) : parseFeed(await http(`https://www.youtube.com/feeds/videos.xml?channel_id=${chId}`));
  data.videos.sort((a, b) => String(b.published).localeCompare(String(a.published)));
  const out = { channel: { id: chId, title: data.channel.title || 'Solar by Sologix', url: channelUrl() }, videos: data.videos, updated_at: new Date().toISOString(), source: key ? 'api' : 'rss' };
  mem = out;
  lastError = null;
  await store(out);
  return out;
}

async function getAll({ force = false } = {}) {
  if (!mem) mem = await loadStored();
  const fresh = mem && Date.now() - Date.parse(mem.updated_at || 0) < CACHE_MS && mem.channel && mem.channel.url === channelUrl();
  if (!force && fresh) return { ...mem, stale: false, error: null };
  if (!force && Date.now() - lastTry < FAIL_RETRY_MS && mem) return { ...mem, stale: true, error: lastError };
  if (!inflight) {
    lastTry = Date.now();
    inflight = fetchFresh().catch(err => {
      lastError = String(err && err.message || err).slice(0, 200);
      console.error('YouTube refresh failed:', lastError);
      return null;
    }).finally(() => { inflight = null; });
  }
  const r = await inflight;
  if (r) return { ...r, stale: false, error: null };
  return mem ? { ...mem, stale: true, error: lastError } : { channel: { id: '', title: 'Solar by Sologix', url: channelUrl() }, videos: [], updated_at: null, stale: true, error: lastError };
}

// ---- admin section settings (site_settings.youtube_section) -------------------------
function normalizeSection(v) {
  const s = { ...DEFAULT_SECTION, ...(v && typeof v === 'object' && !Array.isArray(v) ? v : {}) };
  return {
    enabled: s.enabled !== false && s.enabled !== 'false' && s.enabled !== 0,
    title: clean(s.title).slice(0, 120) || DEFAULT_SECTION.title,
    subtitle: clean(s.subtitle).slice(0, 250),
    max: Math.min(24, Math.max(3, parseInt(s.max, 10) || DEFAULT_SECTION.max)),
    include_shorts: s.include_shorts !== false && s.include_shorts !== 'false' && s.include_shorts !== 0,
    hidden: Array.isArray(s.hidden) ? [...new Set(s.hidden.filter(x => ID_RE.test(String(x))))].slice(0, 500) : [],
  };
}
async function getSection() {
  try {
    const [rows] = await db.query("SELECT `value` FROM site_settings WHERE `key` = 'youtube_section'");
    return normalizeSection(rows.length ? JSON.parse(rows[0].value) : null);
  } catch (e) { return normalizeSection(null); }
}

async function publicData() {
  const [all, section] = await Promise.all([getAll(), getSection()]);
  const hidden = new Set(section.hidden);
  const videos = all.videos.filter(v => !hidden.has(v.id) && (section.include_shorts || !v.is_short)).slice(0, section.max);
  return { enabled: section.enabled, title: section.title, subtitle: section.subtitle, channel: all.channel, videos, updated_at: all.updated_at, stale: !!all.stale };
}
async function adminData({ force = false } = {}) {
  const [all, section] = await Promise.all([getAll({ force }), getSection()]);
  const hidden = new Set(section.hidden);
  return { settings: section, channel: all.channel, videos: all.videos.map(v => ({ ...v, hidden: hidden.has(v.id) })), updated_at: all.updated_at, stale: !!all.stale, error: all.error || null, source: all.source || 'rss' };
}

module.exports = { publicData, adminData, normalizeSection, parseFeed, channelUrl, DEFAULT_SECTION };
