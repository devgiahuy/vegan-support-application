import axios from 'axios';
import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';
import type { UploadSignatureResponseDto } from '../types/post.dto';

export interface UploadSignatureData {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
  maxBytes: number;
  allowedMimeTypes: string[];
  expiresAt: string;
}

export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  width?: number;
  height?: number;
  format: string;
  resource_type: string;
  bytes: number;
  url: string;
  secure_url: string;
  duration?: number;
}

/** Metadata tối thiểu để ráp `media[]` khi tạo/sửa post (backend validate strict). */
export interface UploadedMediaMeta {
  publicId: string;
  mimeType: string;
  bytes: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
}

export function toUploadedMeta(
  res: CloudinaryUploadResult,
  fallbackMimeType: string
): UploadedMediaMeta {
  const format = res.format || fallbackMimeType.split('/')[1] || '';
  return {
    publicId: res.public_id,
    mimeType: res.resource_type.startsWith('video')
      ? `video/${format || 'mp4'}`
      : `image/${format || 'jpeg'}`,
    bytes: res.bytes,
    ...(res.width ? { width: res.width } : {}),
    ...(res.height ? { height: res.height } : {}),
    ...(typeof res.duration === 'number' ? { durationSeconds: Math.round(res.duration) } : {}),
  };
}

export const uploadApi = {
  /**
   * Yêu cầu chữ ký máy chủ để upload an toàn lên Cloudinary.
   * Backend chỉ nhận `{ resourceType }` (strict) và tự quyết folder/giới hạn.
   */
  getUploadSignature: async (params: {
    resourceType: 'image' | 'video';
  }): Promise<UploadSignatureData> => {
    try {
      const res = await api.post<{ success: boolean; data: UploadSignatureResponseDto }>(
        API_ENDPOINTS.UPLOADS.SIGNATURE,
        { resourceType: params.resourceType },
        { silent: true }
      );

      if (res.data?.data) {
        const sig = res.data.data;
        return {
          signature: sig.signature,
          timestamp: sig.timestamp,
          apiKey: sig.apiKey,
          cloudName: sig.cloudName,
          folder: sig.folder,
          uploadUrl: sig.uploadUrl,
          maxBytes: sig.maxBytes,
          allowedMimeTypes: sig.allowedMimeTypes || [],
          expiresAt: sig.expiresAt,
        };
      }
      throw new Error('Phản hồi chữ ký tải lên không đúng định dạng.');
    } catch (err) {
      // Chỉ fallback mock khi backend chưa phục vụ (lỗi mạng / 5xx / 404).
      // Lỗi 4xx (chưa đăng nhập, MIME không hỗ trợ...) → ném tiếp.
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const isNetwork = axios.isAxiosError(err) && !err.response && !!err.request;
      if (!isNetwork && !(status === 404 || (status !== undefined && status >= 500))) throw err;
    }

    // Mock signature fallback cho môi trường dev/chờ backend
    return {
      signature: 'mock_signature_veggie_' + Date.now(),
      timestamp: Math.floor(Date.now() / 1000),
      apiKey: 'mock_api_key',
      cloudName: 'veggie-connect-mock',
      folder: `vegan-app/${params.resourceType}s`,
      uploadUrl: 'mock://cloudinary-upload',
      maxBytes: params.resourceType === 'image' ? 5 * 1024 * 1024 : 100 * 1024 * 1024,
      allowedMimeTypes: [],
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
    };
  },

  /**
   * Tải tệp lên Cloudinary bằng chữ ký đã xin (dùng `uploadUrl` do backend cấp,
   * không hard-code host).
   */
  uploadToCloudinary: async (
    file: File,
    signatureData: UploadSignatureData,
    onProgress?: (percent: number) => void
  ): Promise<CloudinaryUploadResult> => {
    // Nếu signature là mock (do backend endpoint đang PLANNED), giả lập upload có progress
    if (signatureData.apiKey === 'mock_api_key') {
      return new Promise((resolve) => {
        let percent = 0;
        const interval = setInterval(() => {
          percent += 25;
          if (onProgress) onProgress(Math.min(percent, 100));
          if (percent >= 100) {
            clearInterval(interval);
            const objectUrl = URL.createObjectURL(file);
            resolve({
              public_id: `mock_${file.name.replace(/\.[^/.]+$/, '')}_${Date.now()}`,
              version: Date.now(),
              format: file.type.split('/')[1] || 'webp',
              resource_type: file.type.startsWith('video') ? 'video' : 'image',
              bytes: file.size,
              url: objectUrl,
              secure_url: objectUrl,
            });
          }
        }, 150);
      });
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signatureData.apiKey);
    formData.append('timestamp', String(signatureData.timestamp));
    formData.append('signature', signatureData.signature);
    formData.append('folder', signatureData.folder);

    const res = await axios.post<CloudinaryUploadResult>(signatureData.uploadUrl, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });

    return res.data;
  },
};
