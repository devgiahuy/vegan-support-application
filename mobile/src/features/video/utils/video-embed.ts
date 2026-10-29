/** Cách phát một video trong app: nhúng YouTube, phát tệp (Cloudinary…) bằng thẻ <video>, hoặc không phát được. */
export type VideoEmbed =
  | { kind: 'youtube'; id: string; embedUrl: string; watchUrl: string }
  | { kind: 'file'; url: string }
  | { kind: 'invalid' };

const YOUTUBE_HOSTS = ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'music.youtube.com', 'youtube-nocookie.com', 'www.youtube-nocookie.com', 'youtu.be'];
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

function parseUrl(value: string): URL | null {
  try {
    return new URL(value.trim());
  } catch {
    return null;
  }
}

/** Lấy mã 11 ký tự của video YouTube từ link watch/youtu.be/embed/shorts/live; không hợp lệ thì `null`. */
export function extractYoutubeId(url: string): string | null {
  const parsed = parseUrl(url);
  if (!parsed || !YOUTUBE_HOSTS.includes(parsed.hostname.toLowerCase())) return null;
  let candidate = '';
  if (parsed.hostname.toLowerCase() === 'youtu.be') {
    candidate = parsed.pathname.split('/')[1] ?? '';
  } else {
    const [, first, second] = parsed.pathname.split('/');
    candidate = first === 'embed' || first === 'shorts' || first === 'live' || first === 'v' ? (second ?? '') : (parsed.searchParams.get('v') ?? '');
  }
  return YOUTUBE_ID.test(candidate) ? candidate : null;
}

/**
 * Quyết định cách phát — đồng bộ `video-player.tsx` của web: link YouTube → iframe `youtube-nocookie`;
 * còn lại (video tải lên Cloudinary) → thẻ <video>. Chỉ nhận `https`, link lạ hoặc YouTube hỏng là `invalid`.
 */
export function resolveVideoEmbed(videoUrl: string, provider?: string): VideoEmbed {
  const parsed = parseUrl(videoUrl);
  if (!parsed || parsed.protocol !== 'https:') return { kind: 'invalid' };
  const looksYoutube = YOUTUBE_HOSTS.includes(parsed.hostname.toLowerCase()) || provider?.toUpperCase() === 'YOUTUBE';
  if (looksYoutube) {
    const id = extractYoutubeId(videoUrl);
    return id
      ? { kind: 'youtube', id, embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`, watchUrl: `https://www.youtube.com/watch?v=${id}` }
      : { kind: 'invalid' };
  }
  return { kind: 'file', url: parsed.toString() };
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const PAGE_STYLE = 'html,body{margin:0;height:100%;background:#000;overflow:hidden}iframe,video{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}';

/** Trang HTML nhúng iframe YouTube (cần origin `https` để YouTube nhận referrer, tránh lỗi "không cấu hình được trình phát"). */
export function buildYoutubeEmbedHtml(embedUrl: string, title: string): string {
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${PAGE_STYLE}</style></head><body><iframe src="${escapeAttribute(embedUrl)}" title="${escapeAttribute(title)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></body></html>`;
}

/** Trang HTML phát tệp video trực tiếp (mp4/webm) với bộ điều khiển có sẵn của hệ điều hành. */
export function buildFileVideoHtml(url: string, posterUrl?: string): string {
  const poster = posterUrl && /^https:\/\//i.test(posterUrl) ? ` poster="${escapeAttribute(posterUrl)}"` : '';
  const source = escapeAttribute(url);
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${PAGE_STYLE}video{object-fit:contain}</style></head><body><video controls playsinline preload="metadata"${poster}><source src="${source}" type="video/mp4"><source src="${source}" type="video/webm"></video></body></html>`;
}
