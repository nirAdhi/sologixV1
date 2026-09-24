// Turn a Cloudinary image link into a small square crop centred on the face,
// so any customer photo (portrait, landscape, group shot) looks right in the
// round testimonial avatar and loads fast. Other URLs are returned unchanged.
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/i;

export function avatarUrl(url, size = 160) {
  if (!url || typeof url !== 'string') return url;
  const m = url.match(CLOUDINARY_UPLOAD);
  if (!m) return url;
  const rest = m[2];
  // Leave links that already carry their own transformation alone
  // (first path segment contains a transformation like c_fill,w_200).
  const first = rest.split('/')[0];
  if (/(^|,)(c|w|h|g|ar)_[^,]+/.test(first)) return url;
  const px = size * 2; // sharp on high-DPI screens
  return m[1] + `c_thumb,g_face,w_${px},h_${px},z_0.8/f_auto,q_auto/` + rest;
}
