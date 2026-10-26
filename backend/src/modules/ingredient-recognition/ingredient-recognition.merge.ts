import { RecognitionCandidateStatus } from '@prisma/client';
import type { DeduplicatedCandidateData } from './ingredient-recognition.repository.js';

export interface ExistingRecognitionCandidate {
  id: string;
  ingredientId: string | null;
  normalizedName: string;
  quantity: number | null;
  unit: string | null;
  confidence: number;
  status: RecognitionCandidateStatus;
  editedByUser: boolean;
  evidenceInputIds: readonly string[];
}

export interface RecognitionCandidateUpdate {
  id: string;
  /** Present only when the stored candidate is still an untouched proposal. */
  data: {
    quantity?: number | null;
    unit?: string | null;
    confidence?: number;
    freshnessObservation?: string | null;
    uncertaintyNote: string;
  } | null;
  evidence: DeduplicatedCandidateData['evidence'];
}

export interface RecognitionMergePlan {
  updates: RecognitionCandidateUpdate[];
  creates: DeduplicatedCandidateData[];
}

const SAME_QUANTITY_NOTE =
  'Nguyên liệu này cũng xuất hiện trong ảnh bổ sung. Số lượng không được cộng dồn vì các ảnh có thể chụp trùng cùng vật thể; vui lòng kiểm tra trước khi xác nhận.';
const CONFLICT_NOTE =
  'Ảnh bổ sung cho ước tính số lượng hoặc đơn vị khác với kết quả trước. Hệ thống giữ ước tính có độ tin cậy cao hơn, không cộng dồn; vui lòng kiểm tra và chỉnh sửa trước khi xác nhận.';

function candidateKey(candidate: { ingredientId: string | null; normalizedName: string }): string {
  return candidate.ingredientId
    ? `ingredient:${candidate.ingredientId}`
    : `unknown:${candidate.normalizedName}`;
}

/**
 * Folds candidates read from newly added images into the candidates already stored on the job.
 * Same ingredient: only add the new image as evidence (and refresh an untouched proposal when the
 * new reading is more confident) — user edits and rejections are never overwritten and quantities
 * are never summed. New ingredient: created as a fresh candidate.
 */
export function planAppendedCandidates(
  existing: readonly ExistingRecognitionCandidate[],
  incoming: readonly DeduplicatedCandidateData[],
): RecognitionMergePlan {
  const byKey = new Map(existing.map((candidate) => [candidateKey(candidate), candidate]));
  const plan: RecognitionMergePlan = { updates: [], creates: [] };
  for (const candidate of incoming) {
    const current = byKey.get(candidateKey(candidate));
    if (!current) {
      plan.creates.push(candidate);
      continue;
    }
    const attached = new Set(current.evidenceInputIds);
    const evidence = candidate.evidence.filter((item) => !attached.has(item.inputId));
    const untouched =
      current.status === RecognitionCandidateStatus.PROPOSED && !current.editedByUser;
    if (!untouched) {
      if (evidence.length) plan.updates.push({ id: current.id, data: null, evidence });
      continue;
    }
    const conflict = current.quantity !== candidate.quantity || current.unit !== candidate.unit;
    const moreConfident = candidate.confidence > current.confidence;
    plan.updates.push({
      id: current.id,
      data: {
        ...(moreConfident
          ? {
              quantity: candidate.quantity,
              unit: candidate.unit,
              confidence: candidate.confidence,
              freshnessObservation: candidate.freshnessObservation,
            }
          : {}),
        uncertaintyNote: conflict ? CONFLICT_NOTE : SAME_QUANTITY_NOTE,
      },
      evidence,
    });
  }
  return plan;
}
