import { describe, it, expect } from 'vitest';
import { storageMapper } from './storage.mapper';
import { calculateUsedPercent, formatBytes, formatDeltaBytes } from '../utils/format-bytes';
import type {
  MediaAssetDto,
  StorageAccountDto,
  StorageAdjustmentDto,
  StoragePolicyDto,
  StorageUsageDto,
  UploadReservationDto,
} from '../types/storage.dto';

describe('StorageMapper & FormatUtils', () => {
  describe('formatBytes', () => {
    it('1. formats 0 or null bytes gracefully', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(null)).toBe('0 B');
      expect(formatBytes(undefined)).toBe('0 B');
    });

    it('2. formats exact binary byte sizes (KB, MB, GB)', () => {
      expect(formatBytes(1024)).toBe('1.0 KB');
      expect(formatBytes(1048576)).toBe('1.0 MB');
      expect(formatBytes(1073741824)).toBe('1.0 GB');
      expect(formatBytes(26214400)).toBe('25.0 MB');
    });

    it('3. formats delta bytes with +/- sign', () => {
      expect(formatDeltaBytes(524288000)).toBe('+500.0 MB');
      expect(formatDeltaBytes(-209715200)).toBe('-200.0 MB');
      expect(formatDeltaBytes(0)).toBe('0 B');
    });

    it('4. calculates used percent safely within [0, 100]', () => {
      expect(calculateUsedPercent(250, 1000)).toBe(25);
      expect(calculateUsedPercent(1200, 1000)).toBe(100);
      expect(calculateUsedPercent(0, 1000)).toBe(0);
      expect(calculateUsedPercent(100, 0)).toBe(0);
    });
  });

  describe('StorageMapper.toUsageModel', () => {
    it('5. maps null/undefined dto to safe default usage model', () => {
      const model = storageMapper.toUsageModel(null);
      expect(model.usedBytes).toBe(0);
      expect(model.limitBytes).toBe(1073741824);
      expect(model.usedFormatted).toBe('0 B');
      expect(model.limitFormatted).toBe('1.0 GB');
      expect(model.percentUsed).toBe(0);
      expect(model.isWarning).toBe(false);
      expect(model.isCritical).toBe(false);
    });

    it('6. calculates warning and critical flags correctly', () => {
      const normalDto: StorageUsageDto = {
        usedBytes: 536870912, // 50%
        reservedBytes: 0,
        limitBytes: 1073741824,
        remainingBytes: 536870912,
        overQuota: false,
        warningPercent: 80,
      };
      const normalModel = storageMapper.toUsageModel(normalDto);
      expect(normalModel.percentUsed).toBe(50);
      expect(normalModel.isWarning).toBe(false);
      expect(normalModel.isCritical).toBe(false);

      const warningDto: StorageUsageDto = {
        usedBytes: 912680550, // ~85%
        reservedBytes: 0,
        limitBytes: 1073741824,
        remainingBytes: 161061274,
        overQuota: false,
        warningPercent: 80,
      };
      const warningModel = storageMapper.toUsageModel(warningDto);
      expect(warningModel.isWarning).toBe(true);
      expect(warningModel.isCritical).toBe(false);

      const criticalDto: StorageUsageDto = {
        usedBytes: 1073741824,
        reservedBytes: 0,
        limitBytes: 1073741824,
        remainingBytes: 0,
        overQuota: true,
        warningPercent: 80,
      };
      const criticalModel = storageMapper.toUsageModel(criticalDto);
      expect(criticalModel.isWarning).toBe(true);
      expect(criticalModel.isCritical).toBe(true);
    });
  });

  describe('StorageMapper.toPolicyModel', () => {
    it('7. converts policy dto and computes TTL in minutes', () => {
      const policyDto: StoragePolicyDto = {
        id: 'pol-1',
        code: 'PRO_CONTRIBUTOR',
        name: 'Gói Contributor',
        quotaBytes: 5368709120, // 5 GB
        reservationTtlSeconds: 900,
        warningPercent: 85,
        active: true,
        isDefault: false,
        version: 2,
        updatedAt: '2026-09-20T12:00:00.000Z',
      };
      const model = storageMapper.toPolicyModel(policyDto);
      expect(model.id).toBe('pol-1');
      expect(model.quotaFormatted).toBe('5.0 GB');
      expect(model.reservationTtlMinutes).toBe(15);
      expect(model.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('StorageMapper.toMediaAssetModel', () => {
    it('8. returns null when dto is null or undefined', () => {
      expect(storageMapper.toMediaAssetModel(null)).toBeNull();
      expect(storageMapper.toMediaAssetModel(undefined)).toBeNull();
    });

    it('9. computes aspect ratio and video duration formatting', () => {
      const assetDto: MediaAssetDto = {
        id: 'asset-1',
        provider: 'CLOUDINARY',
        resourceType: 'VIDEO',
        kind: 'VIDEO',
        publicId: 'users/v1/vid_1',
        secureUrl: 'https://cloudinary.com/vid_1.mp4',
        mimeType: 'video/mp4',
        extension: '.mp4',
        bytes: 10485760, // 10 MB
        width: 1920,
        height: 1080,
        durationSeconds: 125, // 02:05
        status: 'COMMITTED',
        createdAt: '2026-09-21T08:00:00.000Z',
        deletedAt: null,
      };
      const model = storageMapper.toMediaAssetModel(assetDto);
      expect(model).not.toBeNull();
      expect(model?.sizeFormatted).toBe('10.0 MB');
      expect(model?.aspectRatio).toBe('16:9');
      expect(model?.durationFormatted).toBe('02:05');
    });
  });

  describe('StorageMapper.toReservationModel', () => {
    it('10. maps reservation lifecycle and nested media asset', () => {
      const resDto: UploadReservationDto = {
        id: 'res-1',
        status: 'COMMITTED',
        resourceType: 'IMAGE',
        kind: 'COVER_IMAGE',
        declaredMimeType: 'image/png',
        declaredExtension: '.png',
        declaredBytes: 2097152,
        actualBytes: 2000000,
        expiresAt: '2026-09-23T15:00:00.000Z',
        committedAt: '2026-09-23T14:50:00.000Z',
        releasedAt: null,
        asset: {
          id: 'asset-2',
          provider: 'CLOUDINARY',
          resourceType: 'IMAGE',
          kind: 'COVER_IMAGE',
          publicId: 'img_2',
          secureUrl: 'https://cloudinary.com/img_2.png',
          mimeType: 'image/png',
          extension: '.png',
          bytes: 2000000,
          width: 800,
          height: 800,
          durationSeconds: null,
          status: 'COMMITTED',
          createdAt: '2026-09-23T14:50:00.000Z',
          deletedAt: null,
        },
      };
      const model = storageMapper.toReservationModel(resDto);
      expect(model.id).toBe('res-1');
      expect(model.status).toBe('COMMITTED');
      expect(model.declaredSizeFormatted).toBe('2.0 MB');
      expect(model.asset?.aspectRatio).toBe('1:1');
    });
  });

  describe('StorageMapper.toAccountModel and toAdjustmentModel', () => {
    it('11. maps storage account with user fallback and adjustment formatting', () => {
      const accountDto: StorageAccountDto = {
        userId: 'user-1',
        user: {
          id: 'user-1',
          email: 'contributor@veggie.vn',
          displayName: 'Đầu Bếp Xanh',
          avatarUrl: 'https://cdn.com/avatar.jpg',
        },
        usedBytes: 104857600,
        reservedBytes: 0,
        limitBytes: 1073741824,
        remainingBytes: 968884224,
        overQuota: false,
        warningPercent: 80,
        quotaAdjustmentBytes: 524288000,
        policy: {
          id: 'pol-1',
          code: 'DEF',
          name: 'Chính sách chuẩn',
          quotaBytes: 1073741824,
          reservationTtlSeconds: 900,
          warningPercent: 80,
          active: true,
          isDefault: true,
          version: 1,
          updatedAt: '2026-09-20T00:00:00.000Z',
        },
      };
      const model = storageMapper.toAccountModel(accountDto);
      expect(model.userDisplayName).toBe('Đầu Bếp Xanh');
      expect(model.adjustmentFormatted).toBe('+500.0 MB');
      expect(model.usedFormatted).toBe('100.0 MB');
    });

    it('12. maps admin storage adjustment correctly', () => {
      const adjDto: StorageAdjustmentDto = {
        id: 'adj-1',
        userId: 'user-1',
        adminUserId: 'admin-1',
        deltaBytes: -104857600,
        reason: 'Thu hồi dung lượng thử nghiệm',
        createdAt: '2026-09-22T10:00:00.000Z',
      };
      const model = storageMapper.toAdjustmentModel(adjDto);
      expect(model.deltaFormatted).toBe('-100.0 MB');
      expect(model.reason).toBe('Thu hồi dung lượng thử nghiệm');
      expect(model.createdAt).toBeInstanceOf(Date);
    });
  });
});
