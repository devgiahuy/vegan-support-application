import { MediaKind, MediaProvider } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { StorageRepository } from '../storage/storage.repository.js';
import type { MediaInput } from './content.schemas.js';

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
  constructor(private readonly storageRepository: StorageRepository) {}

  async validateAndNormalize(ownerId: string, media: MediaInput[]): Promise<ResolvedMediaInput[]> {
    return Promise.all(
      media.map((item) =>
        item.provider === MediaProvider.YOUTUBE
          ? Promise.resolve(this.normalizeYoutube(item))
          : this.resolveCloudinary(ownerId, item),
      ),
    );
  }

  private normalizeYoutube(item: Extract<MediaInput, { provider: 'YOUTUBE' }>): ResolvedMediaInput {
    const id = youtubeVideoId(item.secureUrl);
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) {
      throw invalidMedia('YouTube URL không thuộc allowlist hoặc video ID không hợp lệ');
    }
    return {
      provider: MediaProvider.YOUTUBE,
      kind: MediaKind.VIDEO,
      publicId: id,
      secureUrl: `https://www.youtube.com/watch?v=${id}`,
    };
  }

  private async resolveCloudinary(
    ownerId: string,
    item: Extract<MediaInput, { provider: 'CLOUDINARY' }>,
  ): Promise<ResolvedMediaInput> {
    const asset = await this.storageRepository.findAttachableAsset(ownerId, item.assetId, item.kind);
    if (!asset || !asset.mimeType || asset.bytes <= 0n) {
      throw invalidMedia('Cloudinary asset không tồn tại, chưa commit hoặc không thuộc tài khoản');
    }
    return {
      provider: MediaProvider.CLOUDINARY,
      assetId: asset.id,
      kind: asset.kind,
      publicId: asset.publicId,
      secureUrl: asset.secureUrl,
      mimeType: asset.mimeType,
      bytes: Number(asset.bytes),
      ...(asset.width !== null ? { width: asset.width } : {}),
      ...(asset.height !== null ? { height: asset.height } : {}),
      ...(asset.durationSeconds !== null
        ? { durationSeconds: Number(asset.durationSeconds) }
        : {}),
    };
  }
}

export type ResolvedMediaInput =
  | {
      provider: 'CLOUDINARY';
      assetId: string;
      kind: MediaKind;
      publicId: string;
      secureUrl: string;
      mimeType: string;
      bytes: number;
      width?: number;
      height?: number;
      durationSeconds?: number;
    }
  | { provider: 'YOUTUBE'; kind: MediaKind; publicId: string; secureUrl: string };
