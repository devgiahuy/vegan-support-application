import axios from 'axios';
import api from '@/lib/axios';
import { API_ENDPOINTS } from '@/common/constants/api-endpoints';

/**
 * DTO thô của `POST /uploads/signature` (resourceType=image).
 * Định nghĩa riêng trong profile để giữ biên feature độc lập
 * (không import từ `features/post`).
 */
export interface AvatarUploadSignatureResponseDto {
  cloudName: string;
  apiKey: string;
  resourceType: 'image' | 'video';
  uploadUrl: string;
  timestamp: number;
  signature: string;
  folder: string;
  maxBytes: number;
  allowedMimeTypes: string[];
  expiresAt: string;
}

export interface AvatarUploadSignature {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
  uploadUrl: string;
  maxBytes: number;
  allowedMimeTypes: string[];
  expiresAt: string;
  /** `true` khi backend chưa phục vụ (endpoint đang PLANNED) và phải dùng mock preview. */
  isMock: boolean;
}

export interface AvatarUploadResult {
  secureUrl: string;
  publicId: string;
}

/**
 * @deprecated Backend Phase 15 removed signature endpoint. Use `uploadWithReservation` from `@/features/storage/api/storage-upload` instead.
 */
export const avatarUploadApi = {
  getSignature: async (): Promise<AvatarUploadSignature> => {
    try {
      const res = await api.post<{ success: boolean; data: AvatarUploadSignatureResponseDto }>(
        API_ENDPOINTS.UPLOADS.SIGNATURE,
        { resourceType: 'image' },
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
          isMock: false,
        };
      }
      throw new Error('Phản hồi chữ ký tải lên không đúng định dạng.');
    } catch (err) {
      // Chỉ fallback mock khi backend chưa phục vụ (mạng / 5xx / 404).
      // Lỗi 4xx (chưa đăng nhập...) → ném tiếp để form báo lỗi thật.
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      const isNetwork = axios.isAxiosError(err) && !err.response && !!err.request;
      if (!isNetwork && !(status === 404 || (status !== undefined && status >= 500))) throw err;
    }

    return {
      signature: `mock_signature_avatar_${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000),
      apiKey: 'mock_api_key',
      cloudName: 'veggie-connect-mock',
      folder: 'vegan-app/images',
      uploadUrl: 'mock://cloudinary-upload',
      maxBytes: 5 * 1024 * 1024,
      allowedMimeTypes: [],
      expiresAt: new Date(Date.now() + 600_000).toISOString(),
      isMock: true,
    };
  },

  uploadToCloudinary: async (
    file: File,
    signature: AvatarUploadSignature,
    onProgress?: (percent: number) => void
  ): Promise<AvatarUploadResult> => {
    if (signature.isMock) {
      return new Promise((resolve) => {
        let percent = 0;
        const interval = setInterval(() => {
          percent += 25;
          if (onProgress) onProgress(Math.min(percent, 100));
          if (percent >= 100) {
            clearInterval(interval);
            const objectUrl = URL.createObjectURL(file);
            resolve({
              secureUrl: objectUrl,
              publicId: `mock_avatar_${Date.now()}`,
            });
          }
        }, 150);
      });
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', String(signature.timestamp));
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);

    const res = await axios.post<{ secure_url: string; url: string; public_id: string }>(
      signature.uploadUrl,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total && onProgress) {
            onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
          }
        },
      }
    );
    return {
      secureUrl: res.data.secure_url || res.data.url,
      publicId: res.data.public_id,
    };
  },
};
