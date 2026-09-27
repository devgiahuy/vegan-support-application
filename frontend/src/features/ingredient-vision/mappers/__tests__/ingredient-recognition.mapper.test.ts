import { describe, it, expect } from 'vitest';
import { IngredientRecognitionMapper } from '../ingredient-recognition.mapper';
import type {
  RecognitionJobResponseDto,
  RecognitionCandidateDto,
  RecognitionImageDto,
  RecognitionConfirmationResponseDto,
} from '../../types/ingredient-recognition.dto';

describe('IngredientRecognitionMapper', () => {
  const mapper = new IngredientRecognitionMapper();

  describe('toModel', () => {
    it('1. should handle null or undefined input gracefully with safe fallbacks', () => {
      const model = mapper.toModel(null);
      expect(model.id).toBe('');
      expect(model.status).toBe('FAILED');
      expect(model.statusLabel).toBe('Phân tích thất bại');
      expect(model.progress.totalImages).toBe(0);
      expect(model.progress.percent).toBe(0);
      expect(model.images).toEqual([]);
      expect(model.candidates).toEqual([]);
      expect(model.isProcessing).toBe(false);
      expect(model.canConfirm).toBe(false);
    });

    it('2. should correctly parse a complete RecognitionJobResponseDto', () => {
      const dto: RecognitionJobResponseDto = {
        id: '11111111-1111-1111-1111-111111111111',
        status: 'READY',
        progress: { completedImages: 3, totalImages: 3 },
        images: [
          {
            id: 'img-1',
            position: 1,
            url: 'https://cdn.example.com/fridge1.jpg',
            status: 'PROCESSED',
            issue: null,
          },
        ],
        candidates: [
          {
            id: 'cand-1',
            name: 'Đậu phụ non',
            ingredientSuggestion: {
              id: 'ing-1',
              name: 'Đậu phụ',
              confidence: 0.95,
            },
            quantity: { value: 300, unit: 'g' },
            freshnessObservation: 'Còn tươi nguyên',
            confidence: 0.92,
            uncertaintyNote: null,
            status: 'PROPOSED',
            version: 1,
            evidence: [{ imageId: 'img-1', imagePosition: 1, confidence: 0.92 }],
          },
        ],
        attempt: 1,
        issue: null,
        freshnessDisclaimer: 'Quan sát thị giác sơ bộ',
        createdAt: '2026-09-26T10:00:00Z',
        updatedAt: '2026-09-26T10:02:00Z',
        completedAt: '2026-09-26T10:02:00Z',
        confirmedAt: null,
      };

      const model = mapper.toModel(dto);
      expect(model.id).toBe('11111111-1111-1111-1111-111111111111');
      expect(model.status).toBe('READY');
      expect(model.statusLabel).toBe('Sẵn sàng duyệt');
      expect(model.statusBadgeVariant).toBe('default');
      expect(model.progress.percent).toBe(100);
      expect(model.candidates.length).toBe(1);
      expect(model.proposedCandidatesCount).toBe(1);
      expect(model.rejectedCandidatesCount).toBe(0);
      expect(model.isReadyForReview).toBe(true);
      expect(model.canConfirm).toBe(true);
      expect(model.canRetry).toBe(false);
    });

    it('3. should map all job statuses and Vietnamese status labels properly', () => {
      expect(mapper.toModel({ status: 'QUEUED' } as any).statusLabel).toBe('Đang xếp hàng');
      expect(mapper.toModel({ status: 'PROCESSING' } as any).statusLabel).toBe('Đang phân tích');
      expect(mapper.toModel({ status: 'PARTIAL_FAILED' } as any).statusLabel).toBe(
        'Lỗi một số ảnh'
      );
      expect(mapper.toModel({ status: 'FAILED' } as any).statusLabel).toBe('Phân tích thất bại');
      expect(mapper.toModel({ status: 'CONFIRMED' } as any).statusLabel).toBe('Đã thêm vào tủ bếp');
      expect(mapper.toModel({ status: 'CANCELLED' } as any).statusLabel).toBe('Đã hủy tác vụ');
    });

    it('4. should compute progress percentage safely and avoid divide-by-zero', () => {
      const modelZero = mapper.toModel({ progress: { completedImages: 0, totalImages: 0 } } as any);
      expect(modelZero.progress.percent).toBe(0);

      const modelHalf = mapper.toModel({ progress: { completedImages: 1, totalImages: 2 } } as any);
      expect(modelHalf.progress.percent).toBe(50);
    });

    it('5. should calculate proposed and rejected candidate counts accurately', () => {
      const dto = {
        status: 'READY',
        candidates: [
          { id: '1', status: 'PROPOSED' },
          { id: '2', status: 'EDITED' },
          { id: '3', status: 'REJECTED' },
          { id: '4', status: 'CONFIRMED' },
        ],
      } as any;

      const model = mapper.toModel(dto);
      expect(model.proposedCandidatesCount).toBe(2); // PROPOSED + EDITED
      expect(model.rejectedCandidatesCount).toBe(1); // REJECTED
    });

    it('6. should derive correct boolean control flags for processing and retry', () => {
      const queuedJob = mapper.toModel({ status: 'QUEUED' } as any);
      expect(queuedJob.isProcessing).toBe(true);
      expect(queuedJob.canRetry).toBe(false);

      const partialFailed = mapper.toModel({ status: 'PARTIAL_FAILED' } as any);
      expect(partialFailed.isProcessing).toBe(false);
      expect(partialFailed.isReadyForReview).toBe(true);
      expect(partialFailed.canRetry).toBe(true);

      const failedJob = mapper.toModel({ status: 'FAILED' } as any);
      expect(failedJob.isFailed).toBe(true);
      expect(failedJob.canRetry).toBe(true);

      const confirmedJob = mapper.toModel({ status: 'CONFIRMED' } as any);
      expect(confirmedJob.isConfirmed).toBe(true);
      expect(confirmedJob.canConfirm).toBe(false);
    });
  });

  describe('toCandidateModel', () => {
    it('7. should handle null candidate with safe defaults', () => {
      const cand = mapper.toCandidateModel(null);
      expect(cand.id).toBe('');
      expect(cand.name).toBe('Nguyên liệu');
      expect(cand.quantity.formatted).toBe('Chưa xác định');
      expect(cand.confidencePercent).toBe(0);
      expect(cand.confidenceTier).toBe('low');
      expect(cand.ingredientSuggestion).toBeNull();
      expect(cand.evidence).toEqual([]);
    });

    it('8. should categorize confidence into high, medium, and low tiers', () => {
      const candHigh = mapper.toCandidateModel({ confidence: 0.85 } as any);
      expect(candHigh.confidenceTier).toBe('high');
      expect(candHigh.confidencePercent).toBe(85);

      const candMed = mapper.toCandidateModel({ confidence: 0.65 } as any);
      expect(candMed.confidenceTier).toBe('medium');
      expect(candMed.confidencePercent).toBe(65);

      const candLow = mapper.toCandidateModel({ confidence: 0.35 } as any);
      expect(candLow.confidenceTier).toBe('low');
      expect(candLow.confidencePercent).toBe(35);
    });

    it('9. should format quantity and unit properly with Vietnamese localization', () => {
      const cand1 = mapper.toCandidateModel({
        quantity: { value: 500, unit: 'g' },
      } as any);
      expect(cand1.quantity.formatted).toBe('500 g');

      const candNoUnit = mapper.toCandidateModel({
        quantity: { value: 3, unit: null },
      } as any);
      expect(candNoUnit.quantity.formatted).toBe('3');

      const candEmpty = mapper.toCandidateModel({
        quantity: { value: null, unit: null },
      } as any);
      expect(candEmpty.quantity.formatted).toBe('Chưa xác định');
    });

    it('10. should sort evidence items ascending by imagePosition', () => {
      const cand = mapper.toCandidateModel({
        evidence: [
          { imageId: 'img-3', imagePosition: 3, confidence: 0.7 },
          { imageId: 'img-1', imagePosition: 1, confidence: 0.9 },
          { imageId: 'img-2', imagePosition: 2, confidence: 0.8 },
        ],
      } as any);

      expect(cand.evidence.length).toBe(3);
      expect(cand.evidence[0].imagePosition).toBe(1);
      expect(cand.evidence[1].imagePosition).toBe(2);
      expect(cand.evidence[2].imagePosition).toBe(3);
      expect(cand.evidence[0].confidencePercent).toBe(90);
    });

    it('11. should parse ingredient suggestion and flag high confidence', () => {
      const cand = mapper.toCandidateModel({
        ingredientSuggestion: {
          id: 'ing-1',
          name: 'Nấm đùi gà',
          confidence: 0.91,
        },
      } as any);

      expect(cand.ingredientSuggestion).not.toBeNull();
      expect(cand.ingredientSuggestion?.name).toBe('Nấm đùi gà');
      expect(cand.ingredientSuggestion?.confidencePercent).toBe(91);
      expect(cand.ingredientSuggestion?.isHighConfidence).toBe(true);
    });
  });

  describe('toImageModel', () => {
    it('12. should map image fields and fallback missing values safely', () => {
      const img = mapper.toImageModel({
        id: 'img-10',
        position: 2,
        url: 'https://example.com/fridge.webp',
        status: 'PROCESSED',
        issue: null,
      });

      expect(img.id).toBe('img-10');
      expect(img.position).toBe(2);
      expect(img.url).toBe('https://example.com/fridge.webp');
      expect(img.status).toBe('PROCESSED');
      expect(img.issue).toBeNull();
    });
  });

  describe('toConfirmationModel', () => {
    it('13. should map confirmation response and explicit pantry changes diff', () => {
      const dto: RecognitionConfirmationResponseDto = {
        job: {
          id: 'job-1',
          status: 'CONFIRMED',
          progress: { completedImages: 2, totalImages: 2 },
          images: [],
          candidates: [],
          attempt: 1,
          issue: null,
          freshnessDisclaimer: 'Quan sát',
          createdAt: '2026-09-26T10:00:00Z',
          updatedAt: '2026-09-26T10:05:00Z',
          completedAt: '2026-09-26T10:05:00Z',
          confirmedAt: '2026-09-26T10:06:00Z',
        },
        pantryChanges: [
          {
            candidateId: 'cand-1',
            action: 'CREATED',
            pantryItem: {
              id: 'pantry-1',
              ingredient: { id: 'ing-1', name: 'Đậu hũ non' },
              unmatchedText: null,
              quantity: 200,
              unit: 'g',
              source: 'FRIDGE_RECOGNITION',
              confidence: 0.95,
              confirmationStatus: 'CONFIRMED',
              version: 1,
            },
          },
          {
            candidateId: 'cand-2',
            action: 'UPDATED',
            pantryItem: {
              id: 'pantry-2',
              ingredient: null,
              unmatchedText: 'Nấm mèo khô',
              quantity: 100,
              unit: 'g',
              source: 'FRIDGE_RECOGNITION',
              confidence: 0.8,
              confirmationStatus: 'CONFIRMED',
              version: 2,
            },
          },
        ],
      };

      const result = mapper.toConfirmationModel(dto);
      expect(result.job.status).toBe('CONFIRMED');
      expect(result.pantryChanges.length).toBe(2);
      expect(result.pantryChanges[0].actionLabel).toBe('Đã thêm mới');
      expect(result.pantryChanges[0].pantryItem.ingredient?.name).toBe('Đậu hũ non');
      expect(result.pantryChanges[1].actionLabel).toBe('Đã cập nhật');
      expect(result.pantryChanges[1].pantryItem.unmatchedText).toBe('Nấm mèo khô');
    });
  });

  describe('DTO generation methods', () => {
    it('14. should format update candidate DTO with trimmed values and expectedVersion', () => {
      const dto = mapper.toUpdateCandidateDto({
        expectedVersion: 3,
        detectedName: '   Cà rốt Đà Lạt   ',
        quantity: 2,
        unit: '  củ  ',
        freshnessObservation: '  Vỏ hơi nhăn  ',
        decision: 'KEEP',
      });

      expect(dto.expectedVersion).toBe(3);
      expect(dto.detectedName).toBe('Cà rốt Đà Lạt');
      expect(dto.quantity).toBe(2);
      expect(dto.unit).toBe('củ');
      expect(dto.freshnessObservation).toBe('Vỏ hơi nhăn');
      expect(dto.decision).toBe('KEEP');
    });

    it('15. should build create job, confirm, and retry request DTOs properly', () => {
      const createDto = mapper.toCreateJobDto({
        imageAssetIds: ['asset-1', 'asset-2'],
        idempotencyKey: 'idemp-12345678',
      });
      expect(createDto.imageAssetIds).toEqual(['asset-1', 'asset-2']);
      expect(createDto.idempotencyKey).toBe('idemp-12345678');

      const confirmDto = mapper.toConfirmDto({
        candidates: [{ id: 'cand-1', expectedVersion: 1 }],
        idempotencyKey: 'confirm-key-123',
      });
      expect(confirmDto.candidates.length).toBe(1);
      expect(confirmDto.idempotencyKey).toBe('confirm-key-123');

      const retryDto = mapper.toRetryDto({
        idempotencyKey: 'retry-key-456',
      });
      expect(retryDto.idempotencyKey).toBe('retry-key-456');
    });
  });
});
