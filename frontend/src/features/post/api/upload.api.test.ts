import { describe, it, expect } from 'vitest';
import { toUploadedMeta, type CloudinaryUploadResult } from './upload.api';

function result(overrides: Partial<CloudinaryUploadResult> = {}): CloudinaryUploadResult {
  return {
    public_id: 'vegan-app/images/abc',
    version: 1,
    format: 'jpg',
    resource_type: 'image',
    bytes: 120000,
    url: 'https://res.cloudinary.com/demo/image/upload/abc.jpg',
    secure_url: 'https://res.cloudinary.com/demo/image/upload/abc.jpg',
    ...overrides,
  };
}

describe('toUploadedMeta', () => {
  it('prefers browser File MIME over Cloudinary format (jpg vs jpeg)', () => {
    // Cloudinary trả format "jpg" nhưng backend chỉ nhận "image/jpeg".
    const meta = toUploadedMeta(result({ format: 'jpg' }), 'image/jpeg');
    expect(meta.mimeType).toBe('image/jpeg');
  });

  it('normalizes image/jpg to image/jpeg', () => {
    const meta = toUploadedMeta(result({ format: '' }), 'image/jpg');
    expect(meta.mimeType).toBe('image/jpeg');
  });

  it('maps mov format to video/quicktime per backend allowlist', () => {
    const meta = toUploadedMeta(result({ format: 'mov', resource_type: 'video' }), '');
    expect(meta.mimeType).toBe('video/quicktime');
  });

  it('keeps valid video mp4 mime from File API', () => {
    const meta = toUploadedMeta(
      result({ format: 'mp4', resource_type: 'video', bytes: 9000000 }),
      'video/mp4'
    );
    expect(meta.mimeType).toBe('video/mp4');
    expect(meta.publicId).toBe('vegan-app/images/abc');
    expect(meta.bytes).toBe(9000000);
  });

  it('rounds upload duration to seconds', () => {
    const meta = toUploadedMeta(
      result({ format: 'mp4', resource_type: 'video', duration: 372.6 }),
      'video/mp4'
    );
    expect(meta.durationSeconds).toBe(373);
  });
});
