import { createHash, timingSafeEqual } from 'node:crypto';
import type { MediaResourceType } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import type { AppConfig } from '../../config/env.js';

export interface ProviderUploadProof {
  publicId: string;
  version: number;
  signature: string;
}

export interface ProviderAssetMetadata {
  publicId: string;
  secureUrl: string;
  resourceType: MediaResourceType;
  mimeType: string;
  extension: string;
  bytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  version: number;
  etag: string | null;
}

interface CloudinaryResourceResponse {
  public_id?: unknown;
  secure_url?: unknown;
  resource_type?: unknown;
  format?: unknown;
  bytes?: unknown;
  width?: unknown;
  height?: unknown;
  duration?: unknown;
  version?: unknown;
  etag?: unknown;
}

function sha1(value: string): string {
  return createHash('sha1').update(value).digest('hex');
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left.toLowerCase());
  const rightBuffer = Buffer.from(right.toLowerCase());
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function cloudinaryError(code: string, message: string, statusCode = 502): AppError {
  return new AppError({ statusCode, code, message, expose: true });
}

function mimeType(resourceType: MediaResourceType, format: string): string {
  if (resourceType === 'IMAGE' && format === 'jpg') return 'image/jpeg';
  if (resourceType === 'VIDEO' && format === 'mov') return 'video/quicktime';
  return `${resourceType.toLowerCase()}/${format}`;
}

function positiveInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value <= 0) {
    throw cloudinaryError('UPLOAD_PROVIDER_UNAVAILABLE', `Cloudinary không trả ${field} hợp lệ`);
  }
  return value;
}

function optionalPositive(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null;
}

export class CloudinaryMediaProvider {
  constructor(private readonly config: AppConfig) {}

  createUploadConfiguration(resourceType: MediaResourceType, maxBytes: number) {
    const timestamp = Math.floor(Date.now() / 1_000);
    const providerResourceType = resourceType.toLowerCase();
    const parameters = `folder=${this.config.cloudinaryUploadFolder}&timestamp=${String(timestamp)}`;
    return {
      cloudName: this.config.cloudinaryCloudName,
      apiKey: this.config.cloudinaryApiKey,
      resourceType: providerResourceType as 'image' | 'video',
      uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(this.config.cloudinaryCloudName)}/${providerResourceType}/upload`,
      timestamp,
      signature: sha1(`${parameters}${this.config.cloudinaryApiSecret}`),
      folder: this.config.cloudinaryUploadFolder,
      maxBytes,
      allowedMimeTypes:
        resourceType === 'IMAGE'
          ? ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
          : ['video/mp4', 'video/webm', 'video/quicktime'],
      expiresAt: new Date((timestamp + 600) * 1_000).toISOString(),
    };
  }

  async verifyUpload(
    proof: ProviderUploadProof,
    expectedResourceType: MediaResourceType,
  ): Promise<ProviderAssetMetadata> {
    const expectedSignature = sha1(
      `public_id=${proof.publicId}&version=${String(proof.version)}${this.config.cloudinaryApiSecret}`,
    );
    if (!safeEqual(proof.signature, expectedSignature)) {
      throw cloudinaryError(
        'UPLOAD_PROVIDER_MISMATCH',
        'Chữ ký kết quả upload không khớp Cloudinary',
        422,
      );
    }
    const metadata = await this.getResource(proof.publicId, expectedResourceType);
    if (metadata.version !== proof.version) {
      throw cloudinaryError(
        'UPLOAD_PROVIDER_MISMATCH',
        'Version kết quả upload không khớp provider',
        422,
      );
    }
    return metadata;
  }

  async getResource(
    publicId: string,
    resourceType: MediaResourceType,
  ): Promise<ProviderAssetMetadata> {
    const providerResourceType = resourceType.toLowerCase();
    const url = new URL(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(this.config.cloudinaryCloudName)}/resources/${providerResourceType}/upload/${encodeURIComponent(publicId)}`,
    );
    const response = await this.providerFetch(url, { method: 'GET' });
    if (response.status === 404) {
      throw cloudinaryError('UPLOAD_PROVIDER_MISMATCH', 'Provider không tìm thấy upload', 422);
    }
    if (!response.ok) {
      throw cloudinaryError('UPLOAD_PROVIDER_UNAVAILABLE', 'Không thể xác minh upload với Cloudinary');
    }
    return this.parseResource((await response.json()) as CloudinaryResourceResponse, resourceType);
  }

  async deleteResource(publicId: string, resourceType: MediaResourceType): Promise<void> {
    const timestamp = Math.floor(Date.now() / 1_000);
    const parameters = `public_id=${publicId}&timestamp=${String(timestamp)}&type=upload`;
    const body = new URLSearchParams({
      public_id: publicId,
      timestamp: String(timestamp),
      type: 'upload',
      api_key: this.config.cloudinaryApiKey,
      signature: sha1(`${parameters}${this.config.cloudinaryApiSecret}`),
    });
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(this.config.cloudinaryCloudName)}/${resourceType.toLowerCase()}/destroy`,
      {
        method: 'POST',
        body,
        signal: AbortSignal.timeout(this.config.cloudinaryApiTimeoutMs),
      },
    );
    if (!response.ok) {
      throw cloudinaryError('MEDIA_DELETE_FAILED', 'Cloudinary không xác nhận xóa media');
    }
    const result = (await response.json()) as { result?: unknown };
    if (result.result !== 'ok' && result.result !== 'not found') {
      throw cloudinaryError('MEDIA_DELETE_FAILED', 'Cloudinary không xác nhận media đã bị xóa');
    }
  }

  async listResources(resourceType: MediaResourceType): Promise<ProviderAssetMetadata[]> {
    const records: ProviderAssetMetadata[] = [];
    let nextCursor: string | undefined;
    do {
      const url = new URL(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(this.config.cloudinaryCloudName)}/resources/${resourceType.toLowerCase()}/upload`,
      );
      url.searchParams.set('prefix', `${this.config.cloudinaryUploadFolder}/`);
      url.searchParams.set('max_results', '500');
      if (nextCursor) url.searchParams.set('next_cursor', nextCursor);
      const response = await this.providerFetch(url, { method: 'GET' });
      if (!response.ok) {
        throw cloudinaryError('UPLOAD_PROVIDER_UNAVAILABLE', 'Không thể liệt kê media Cloudinary');
      }
      const body = (await response.json()) as { resources?: unknown; next_cursor?: unknown };
      if (!Array.isArray(body.resources)) {
        throw cloudinaryError('UPLOAD_PROVIDER_UNAVAILABLE', 'Cloudinary trả danh sách không hợp lệ');
      }
      records.push(
        ...body.resources.map((resource) =>
          this.parseResource(resource as CloudinaryResourceResponse, resourceType),
        ),
      );
      nextCursor = typeof body.next_cursor === 'string' ? body.next_cursor : undefined;
    } while (nextCursor);
    return records;
  }

  private async providerFetch(url: URL, init: RequestInit): Promise<Response> {
    const authorization = Buffer.from(
      `${this.config.cloudinaryApiKey}:${this.config.cloudinaryApiSecret}`,
    ).toString('base64');
    try {
      return await fetch(url, {
        ...init,
        headers: { ...init.headers, authorization: `Basic ${authorization}` },
        signal: AbortSignal.timeout(this.config.cloudinaryApiTimeoutMs),
      });
    } catch {
      throw cloudinaryError('UPLOAD_PROVIDER_UNAVAILABLE', 'Không thể kết nối Cloudinary để xác minh');
    }
  }

  private parseResource(
    input: CloudinaryResourceResponse,
    expectedResourceType: MediaResourceType,
  ): ProviderAssetMetadata {
    const publicId = typeof input.public_id === 'string' ? input.public_id : '';
    const secureUrl = typeof input.secure_url === 'string' ? input.secure_url : '';
    const format = typeof input.format === 'string' ? input.format.toLowerCase() : '';
    const actualResourceType =
      input.resource_type === 'image' ? 'IMAGE' : input.resource_type === 'video' ? 'VIDEO' : null;
    if (
      !publicId ||
      !publicId.startsWith(`${this.config.cloudinaryUploadFolder}/`) ||
      !secureUrl.startsWith(
        `https://res.cloudinary.com/${this.config.cloudinaryCloudName}/${expectedResourceType.toLowerCase()}/upload/`,
      ) ||
      !format ||
      actualResourceType !== expectedResourceType
    ) {
      throw cloudinaryError(
        'UPLOAD_PROVIDER_MISMATCH',
        'Cloudinary resource không khớp cloud, folder hoặc loại đã khai báo',
        422,
      );
    }
    return {
      publicId,
      secureUrl,
      resourceType: expectedResourceType,
      mimeType: mimeType(expectedResourceType, format),
      extension: `.${format}`,
      bytes: positiveInteger(input.bytes, 'bytes'),
      width: optionalPositive(input.width),
      height: optionalPositive(input.height),
      durationSeconds: optionalPositive(input.duration),
      version: positiveInteger(input.version, 'version'),
      etag: typeof input.etag === 'string' ? input.etag : null,
    };
  }
}
