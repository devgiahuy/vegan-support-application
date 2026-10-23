import type { CandidateEdit, ScanCandidate } from '../types/scanning.model';

/** Bản nháp chỉnh sửa tại chỗ của một nguyên liệu nhận diện từ ảnh tủ lạnh (đồng bộ web `CandidateReviewScreen`). */
export interface ScanDraft {
  id: string;
  version: number;
  name: string;
  quantity: string;
  unit: string;
  rejected: boolean;
  initial: { name: string; quantity: string; unit: string; rejected: boolean };
}

export const SCAN_COMMON_UNITS = ['g', 'kg', 'ml', 'l', 'quả', 'trái', 'củ', 'bó', 'gói', 'hộp', 'cây', 'miếng', 'tép', 'phần'] as const;

export function toScanDraft(candidate: ScanCandidate): ScanDraft {
  const quantity = candidate.quantity === null ? '' : String(candidate.quantity);
  const unit = candidate.unit ?? '';
  const rejected = candidate.status === 'REJECTED';
  return { id: candidate.id, version: candidate.version, name: candidate.name, quantity, unit, rejected, initial: { name: candidate.name, quantity, unit, rejected } };
}

export function isScanDraftDirty(draft: ScanDraft): boolean {
  const { initial } = draft;
  return draft.name.trim() !== initial.name.trim() || draft.quantity.trim() !== initial.quantity.trim() ||
    draft.unit.trim() !== initial.unit.trim() || draft.rejected !== initial.rejected;
}

/** Đồng bộ lại khi dữ liệu job đổi, giữ chỉnh sửa chưa lưu của người dùng nếu phiên bản nguyên liệu không đổi. */
export function mergeScanDrafts(previous: ScanDraft[], candidates: ScanCandidate[]): ScanDraft[] {
  const byId = new Map(previous.map(draft => [draft.id, draft]));
  return candidates.map(candidate => {
    const existing = byId.get(candidate.id);
    return existing && existing.version === candidate.version && isScanDraftDirty(existing) ? existing : toScanDraft(candidate);
  });
}

export function parseScanDraft(draft: ScanDraft, candidate: ScanCandidate, version: number): CandidateEdit {
  const name = draft.name.trim();
  if (!name || name.length > 160) throw new Error('Tên nguyên liệu cần có 1-160 ký tự.');
  if (draft.rejected) {
    return { expectedVersion: version, name: candidate.name, ingredientId: candidate.ingredient?.id ?? null, quantity: candidate.quantity, unit: candidate.unit, freshness: candidate.freshness, decision: 'REJECT' };
  }
  const normalized = draft.quantity.trim().replace(',', '.');
  const quantity = Number(normalized);
  const unit = draft.unit.trim();
  if (!/^\d+(?:\.\d+)?$/.test(normalized) || !Number.isFinite(quantity) || quantity <= 0 || quantity > 999999999 || !unit)
    throw new Error(`Vui lòng nhập trọng lượng (> 0) và đơn vị cho món "${name}" trước khi lưu.`);
  if (unit.length > 40) throw new Error('Đơn vị không được vượt quá 40 ký tự.');
  return {
    expectedVersion: version, name, quantity, unit, freshness: candidate.freshness, decision: 'KEEP',
    ingredientId: name === candidate.name.trim() ? candidate.ingredient?.id ?? null : null,
  };
}
