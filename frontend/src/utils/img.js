// Cloudinary delivery optimisation. The raw uploads behind the site are huge
// (multi-MB PNGs, 4K videos); adding a transformation to the URL makes
// Cloudinary serve a right-sized, modern-format version instead — typically
// 95% smaller. URLs that already carry a transformation, and non-Cloudinary
// URLs, pass through unchanged.
const IMG_RE = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i;
const VID_RE = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/video\/upload\/)(.+)$/i;
const hasTransform = (rest) => /(^|,)(c|w|h|f|q|g|ar)_[^,/]+/.test(String(rest).split('/')[0]);

export function cldImg(url, w = 900) {
  const m = String(url || '').match(IMG_RE);
  if (!m || hasTransform(m[2])) return url;
  return m[1] + `f_auto,q_auto,c_limit,w_${w}/` + m[2];
}

export function cldVideo(url, w = 1280) {
  const m = String(url || '').match(VID_RE);
  if (!m || hasTransform(m[2])) return url;
  return m[1] + `q_auto,w_${w}/` + m[2];
}

// A lightweight poster frame for a Cloudinary video (first frame as jpg).
export function cldPoster(url, w = 1280) {
  const m = String(url || '').match(VID_RE);
  if (!m) return '';
  const rest = m[2].replace(/\.(mp4|webm|ogg)(\?.*)?$/i, '.jpg');
  return m[1] + `q_auto,w_${w}/` + (hasTransform(rest) ? rest : rest);
}
