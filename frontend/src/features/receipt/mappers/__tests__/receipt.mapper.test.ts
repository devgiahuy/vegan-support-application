import { describe, it, expect } from 'vitest';
import { ReceiptMapper } from '../receipt.mapper';
import type {
  ReceiptConfirmationResponseDto,
  ReceiptJobResponseDto,
} from '../../types/receipt.dto';

describe('ReceiptMapper', () => {
  const mapper = new ReceiptMapper();

  it('xử lý an toàn khi DTO null hoặc undefined', () => {
    const model = mapper.toModel(null);
    expect(model.id).toBe('');
    expect(model.status).toBe('QUEUED');
    expect(model.statusLabel).toBe('Đang chờ xử lý');
    expect(model.receiptMetadata.merchantName).toBe('Hóa đơn mua sắm');
    expect(model.receiptMetadata.formattedTotalAmount).toBe('Chưa có giá');
    expect(model.candidates).toEqual([]);
    expect(model.activeCandidates).toEqual([]);
    expect(model.rejectedCandidates).toEqual([]);
    expect(model.canConfirm).toBe(false);
    expect(model.canRetry).toBe(false);
    expect(model.canCancel).toBe(true);
  });

  it('chuyển đổi đầy đủ thông tin ReceiptJobResponseDto hợp lệ', () => {
    const dto: ReceiptJobResponseDto = {
      id: 'job-123',
      status: 'READY',
      progress: {
        completedImages: 2,
        totalImages: 2,
      },
      receipt: {
        merchantName: 'Siêu thị Co.opmart',
        purchasedAt: '2026-09-24T09:30:00.000Z',
        currency: 'VND',
        totalAmount: 154000,
        confidence: 0.92,
      },
      images: [
        {
          id: 'img-1',
          position: 0,
          url: 'https://cdn.example.com/receipt1.jpg',
          status: 'PROCESSED',
          issue: null,
        },
      ],
      candidates: [
        {
          id: 'cand-1',
          imageId: 'img-1',
          lineText: 'DAU HU MIENG 200G',
          name: 'Đậu hũ miếng',
          ingredientSuggestion: {
            id: 'ing-1',
            name: 'Đậu phụ',
            confidence: 0.88,
          },
          quantity: {
            value: 200,
            unit: 'g',
          },
          pricing: {
            unitPrice: 15000,
            lineTotal: 30000,
            currency: 'VND',
          },
          confidence: 0.85,
          uncertaintyNote: null,
          status: 'PROPOSED',
          version: 1,
        },
        {
          id: 'cand-2',
          imageId: 'img-1',
          lineText: 'XA PHONG OMO',
          name: 'Xà phòng OMO',
          ingredientSuggestion: null,
          quantity: {
            value: 1,
            unit: 'bịch',
          },
          pricing: {
            unitPrice: 124000,
            lineTotal: 124000,
            currency: 'VND',
          },
          confidence: 0.95,
          uncertaintyNote: null,
          status: 'REJECTED',
          version: 1,
        },
      ],
      attempt: 1,
      issue: null,
      createdAt: '2026-09-24T09:30:00.000Z',
      updatedAt: '2026-09-24T09:31:00.000Z',
      completedAt: '2026-09-24T09:31:30.000Z',
      confirmedAt: null,
    };

    const model = mapper.toModel(dto);

    expect(model.id).toBe('job-123');
    expect(model.status).toBe('READY');
    expect(model.statusLabel).toBe('Sẵn sàng kiểm duyệt');
    expect(model.statusBadgeVariant).toBe('default');
    expect(model.progress.percent).toBe(100);
    expect(model.receiptMetadata.merchantName).toBe('Siêu thị Co.opmart');
    expect(model.receiptMetadata.formattedTotalAmount).toBe('154.000 ₫');
    expect(model.receiptMetadata.confidencePercent).toBe(92);
    expect(model.images.length).toBe(1);
    expect(model.images[0].statusLabel).toBe('Đã xử lý');
    expect(model.candidates.length).toBe(2);
    expect(model.activeCandidates.length).toBe(1);
    expect(model.rejectedCandidates.length).toBe(1);
    expect(model.canConfirm).toBe(true);
    expect(model.isReadyForReview).toBe(true);
    expect(model.isProcessing).toBe(false);
  });

  it('phân loại confidence tier chính xác', () => {
    const candHigh = mapper.toCandidateModel({
      id: 'c1',
      imageId: 'i1',
      lineText: 'test',
      name: 'Rau cải',
      ingredientSuggestion: null,
      quantity: { value: 1, unit: 'kg' },
      pricing: { unitPrice: null, lineTotal: null, currency: 'VND' },
      confidence: 0.85,
      uncertaintyNote: null,
      status: 'PROPOSED',
      version: 1,
    });
    expect(candHigh.confidenceTier).toBe('high');
    expect(candHigh.confidencePercent).toBe(85);

    const candMed = mapper.toCandidateModel({
      id: 'c2',
      imageId: 'i1',
      lineText: 'test',
      name: 'Nấm rơm',
      ingredientSuggestion: null,
      quantity: { value: 1, unit: 'kg' },
      pricing: { unitPrice: null, lineTotal: null, currency: 'VND' },
      confidence: 0.65,
      uncertaintyNote: null,
      status: 'PROPOSED',
      version: 1,
    });
    expect(candMed.confidenceTier).toBe('medium');

    const candLow = mapper.toCandidateModel({
      id: 'c3',
      imageId: 'i1',
      lineText: 'test',
      name: 'Gia vị',
      ingredientSuggestion: null,
      quantity: { value: null, unit: null },
      pricing: { unitPrice: null, lineTotal: null, currency: 'VND' },
      confidence: 0.3,
      uncertaintyNote: 'Khó nhận diện',
      status: 'PROPOSED',
      version: 1,
    });
    expect(candLow.confidenceTier).toBe('low');
    expect(candLow.uncertaintyNote).toBe('Khó nhận diện');
  });

  it('định dạng số lượng và đơn giá ứng viên chính xác', () => {
    const cand = mapper.toCandidateModel({
      id: 'c1',
      imageId: 'i1',
      lineText: 'CA ROT 500G',
      name: 'Cà rốt',
      ingredientSuggestion: {
        id: 'ing-carot',
        name: 'Cà rốt tươi',
        confidence: 0.9,
      },
      quantity: { value: 500, unit: 'g' },
      pricing: { unitPrice: 20000, lineTotal: 10000, currency: 'VND' },
      confidence: 0.9,
      uncertaintyNote: null,
      status: 'EDITED',
      version: 2,
    });

    expect(cand.quantity.formatted).toBe('500 g');
    expect(cand.pricing.formattedUnitPrice).toBe('20.000 ₫');
    expect(cand.pricing.formattedLineTotal).toBe('10.000 ₫');
    expect(cand.ingredientSuggestion?.isHighConfidence).toBe(true);
    expect(cand.statusLabel).toBe('Đã chỉnh sửa');
    expect(cand.isEdited).toBe(true);
  });

  it('kiểm tra trạng thái canConfirm và canRetry khi thất bại một phần', () => {
    const model = mapper.toModel({
      id: 'job-err',
      status: 'PARTIAL_FAILED',
      progress: { completedImages: 1, totalImages: 2 },
      receipt: {
        merchantName: null,
        purchasedAt: null,
        currency: 'VND',
        totalAmount: null,
        confidence: null,
      },
      images: [
        { id: 'i1', position: 0, url: 'url1', status: 'PROCESSED', issue: null },
        { id: 'i2', position: 1, url: 'url2', status: 'FAILED', issue: 'Ảnh quá mờ' },
      ],
      candidates: [
        {
          id: 'c1',
          imageId: 'i1',
          lineText: 'NAM',
          name: 'Nấm đùi gà',
          ingredientSuggestion: null,
          quantity: { value: 200, unit: 'g' },
          pricing: { unitPrice: null, lineTotal: null, currency: 'VND' },
          confidence: 0.8,
          uncertaintyNote: null,
          status: 'PROPOSED',
          version: 1,
        },
      ],
      attempt: 1,
      issue: { code: 'PARTIAL_EXTRACTION_FAILURE', message: '1 trong 2 ảnh không đọc được' },
      createdAt: '2026-09-24T00:00:00.000Z',
      updatedAt: '2026-09-24T00:01:00.000Z',
      completedAt: null,
      confirmedAt: null,
    });

    expect(model.status).toBe('PARTIAL_FAILED');
    expect(model.canRetry).toBe(true);
    expect(model.canConfirm).toBe(true); // có 1 ứng viên hợp lệ từ ảnh 1
    expect(model.issue?.code).toBe('PARTIAL_EXTRACTION_FAILURE');
  });

  it('chuyển đổi kết quả xác nhận nhập kho và pantry changes', () => {
    const dto: ReceiptConfirmationResponseDto = {
      job: {
        id: 'job-123',
        status: 'CONFIRMED',
        progress: { completedImages: 1, totalImages: 1 },
        receipt: {
          merchantName: 'WinMart',
          purchasedAt: null,
          currency: 'VND',
          totalAmount: 50000,
          confidence: 0.9,
        },
        images: [],
        candidates: [],
        attempt: 1,
        issue: null,
        createdAt: '2026-09-24T00:00:00.000Z',
        updatedAt: '2026-09-24T00:02:00.000Z',
        completedAt: '2026-09-24T00:01:00.000Z',
        confirmedAt: '2026-09-24T00:02:00.000Z',
      },
      pantryChanges: [
        {
          candidateId: 'cand-1',
          action: 'CREATED',
          pantryItem: {
            id: 'pantry-1',
            ingredient: { id: 'ing-1', name: 'Đậu phụ' },
            unmatchedText: null,
            quantity: 300,
            unit: 'g',
            source: 'RECEIPT',
            confidence: 0.95,
            confirmationStatus: 'CONFIRMED',
            purchasedAt: '2026-09-24T00:00:00.000Z',
            version: 1,
          },
        },
        {
          candidateId: 'cand-2',
          action: 'UPDATED',
          pantryItem: {
            id: 'pantry-2',
            ingredient: null,
            unmatchedText: 'Rau dớn rừng',
            quantity: 500,
            unit: 'g',
            source: 'RECEIPT',
            confidence: 0.8,
            confirmationStatus: 'CONFIRMED',
            purchasedAt: null,
            version: 3,
          },
        },
      ],
    };

    const diff = mapper.toConfirmationModel(dto);

    expect(diff.job.status).toBe('CONFIRMED');
    expect(diff.job.isConfirmed).toBe(true);
    expect(diff.job.canConfirm).toBe(false);
    expect(diff.job.canCancel).toBe(false);
    expect(diff.pantryChanges.length).toBe(2);

    expect(diff.pantryChanges[0].actionLabel).toBe('Thêm mới');
    expect(diff.pantryChanges[0].pantryItem.displayName).toBe('Đậu phụ');
    expect(diff.pantryChanges[0].pantryItem.formattedQuantity).toBe('300 g');

    expect(diff.pantryChanges[1].actionLabel).toBe('Cộng dồn');
    expect(diff.pantryChanges[1].pantryItem.displayName).toBe('Rau dớn rừng');
  });

  it('tạo request DTOs chính xác', () => {
    const createDto = mapper.toCreateJobDto({
      imageAssetIds: ['asset-1', 'asset-2'],
      idempotencyKey: 'idem-12345',
    });
    expect(createDto.imageAssetIds).toEqual(['asset-1', 'asset-2']);
    expect(createDto.idempotencyKey).toBe('idem-12345');

    const updateDto = mapper.toUpdateCandidateDto({
      expectedVersion: 2,
      detectedName: 'Cà chua bi',
      quantity: 300,
      unit: 'g',
      decision: 'KEEP',
    });
    expect(updateDto.expectedVersion).toBe(2);
    expect(updateDto.detectedName).toBe('Cà chua bi');
    expect(updateDto.quantity).toBe(300);
    expect(updateDto.unit).toBe('g');

    const confirmDto = mapper.toConfirmJobDto({
      candidates: [{ id: 'c1', expectedVersion: 1 }],
      idempotencyKey: 'confirm-key',
    });
    expect(confirmDto.candidates).toEqual([{ id: 'c1', expectedVersion: 1 }]);
    expect(confirmDto.idempotencyKey).toBe('confirm-key');
  });
});
