import { createHash } from 'node:crypto';
import { MediaKind, MediaProvider } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';
import type { MediaInput, UploadSignatureInput } from './content.schemas.js';

const imageMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'] as const;
const videoMimeTypes = ['video/mp4', 'video/webm', 'video/quicktime'] as const;

function invalidMedia(message: string): AppError {
  return new AppError({ statusCode: 400, code: 'INVALID_MEDIA_REFERENCE', message });
}

function youtubeVideoId(value: string): string | null {
  const url = new URL(value);
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] ?? null;
  if (!['youtube.com', 'm.youtube.com'].includes(host)) return null;
  if (url.pathname === '/watch') return url.searchParams.get('v');
  const [kind, id] = url.pathname.split('/').filter(Boolean);
  return ['embed', 'shorts'].includes(kind ?? '') ? (id ?? null) : null;
}

export class MediaService {
  constructor(private readonly config: AppConfig) {}

  createUploadSignature(input: UploadSignatureInput) {
    const timestamp = Math.floor(Date.now() / 1_000);
    const parameters = `folder=${this.config.cloudinaryUploadFolder}&timestamp=${String(timestamp)}`;
    const signature = createHash('sha1')
      .update(`${parameters}${this.config.cloudinaryApiSecret}`)
      .digest('hex');
    const allowedMimeTypes = input.resourceType === 'image' ? imageMimeTypes : videoMimeTypes;
    const maxBytes =
      input.resourceType === 'image'
        ? this.config.maxUploadImageBytes
        : this.config.maxUploadVideoBytes;
    return {
      cloudName: this.config.cloudinaryCloudName,
      apiKey: this.config.cloudinaryApiKey,
      resourceType: input.resourceType,
      uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(this.config.cloudinaryCloudName)}/${input.resourceType}/upload`,
      timestamp,
      signature,
      folder: this.config.cloudinaryUploadFolder,
      maxBytes,
      allowedMimeTypes: [...allowedMimeTypes],
      expiresAt: new Date((timestamp + 600) * 1_000).toISOString(),
    };
  }

  validateAndNormalize(media: MediaInput[]): MediaInput[] {
    return media.map((item) =>
      item.provider === MediaProvider.YOUTUBE
        ? this.normalizeYoutube(item)
        : this.validateCloudinary(item),
    );
  }

  private normalizeYoutube(item: Extract<MediaInput, { provider: 'YOUTUBE' }>): MediaInput {
    const id = youtubeVideoId(item.secureUrl);
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) {
      throw invalidMedia('YouTube URL không thuộc allowlist hoặc video ID không hợp lệ');
    }
    return {
      provider: MediaProvider.YOUTUBE,
      kind: MediaKind.VIDEO,
      secureUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  }

  private validateCloudinary(item: Extract<MediaInput, { provider: 'CLOUDINARY' }>): MediaInput {
    if (
      !/^[a-zA-Z0-9/_-]+$/.test(item.publicId) ||
      item.publicId.includes('..') ||
      !item.publicId.startsWith(`${this.config.cloudinaryUploadFolder}/`)
    ) {
      throw invalidMedia('Cloudinary publicId phải nằm trong upload folder được cấp');
    }

    const url = new URL(item.secureUrl);
    const expectedResourceType = item.kind === MediaKind.COVER_IMAGE ? 'image' : 'video';
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'res.cloudinary.com' ||
      !url.pathname.startsWith(
        `/${this.config.cloudinaryCloudName}/${expectedResourceType}/upload/`,
      )
    ) {
      throw invalidMedia('Cloudinary secureUrl không khớp cloud hoặc resource type được cấu hình');
    }

    const allowedMimeTypes = item.kind === MediaKind.COVER_IMAGE ? imageMimeTypes : videoMimeTypes;
    const maxBytes =
      item.kind === MediaKind.COVER_IMAGE
        ? this.config.maxUploadImageBytes
        : this.config.maxUploadVideoBytes;
    if (!(allowedMimeTypes as readonly string[]).includes(item.mimeType)) {
      throw invalidMedia('MIME type của media không được hỗ trợ');
    }
    if (item.bytes > maxBytes) throw invalidMedia('Media vượt quá giới hạn kích thước');
    if (item.kind === MediaKind.COVER_IMAGE && item.durationSeconds !== undefined) {
      throw invalidMedia('Cover image không nhận durationSeconds');
    }
    return item;
  }
}
