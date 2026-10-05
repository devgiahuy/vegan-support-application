import type { CandidateEdit, ScanKind } from '../types/scanning.model';

export interface CandidateForm {
  name: string;
  ingredientId: string | null;
  quantity: string;
  unit: string;
  freshness: string;
  lineText: string;
  unitPrice: string;
  lineTotal: string;
  currency: string;
}

function numberOrNull(text: string, positive: boolean): number | null {
  if (!text.trim()) return null;
  const normalized = text.trim().replace(',', '.');
  const value = Number(normalized);
  if (!/^\d+(?:\.\d+)?$/.test(normalized) || !Number.isFinite(value) || value > (positive ? 999999999 : 999999999999) || (positive ? value <= 0 : value < 0))
    throw new Error(positive ? 'Số lượng phải là số dương hợp lệ.' : 'Giá tiền phải là số không âm hợp lệ.');
  return value;
}

export function parseCandidateForm(form: CandidateForm, kind: ScanKind, version: number): CandidateEdit {
  const name = form.name.trim();
  if (!name || name.length > 160) throw new Error('Tên nguyên liệu cần có 1-160 ký tự.');
  const quantity = numberOrNull(form.quantity, true);
  const unit = form.unit.trim() || null;
  if ((quantity === null) !== (unit === null)) throw new Error('Nhập cả số lượng và đơn vị hoặc để trống cả hai.');
  if (unit && unit.length > 40) throw new Error('Đơn vị không được vượt quá 40 ký tự.');
  const common: CandidateEdit = { name, ingredientId: form.ingredientId, quantity, unit, expectedVersion: version, decision: 'KEEP' };
  if (kind === 'fridge') {
    if (form.freshness.trim().length > 2000) throw new Error('Ghi chú không được vượt quá 2000 ký tự.');
    return { ...common, freshness: form.freshness.trim() || null };
  }
  const lineText = form.lineText.trim();
  if (!lineText || lineText.length > 1000) throw new Error('Dòng hóa đơn cần có 1-1000 ký tự.');
  const currency = form.currency.trim().toUpperCase() || null;
  if (currency && !/^[A-Z]{3}$/.test(currency)) throw new Error('Mã tiền tệ cần có 3 chữ cái, ví dụ VND.');
  return { ...common, lineText, currency, unitPrice: numberOrNull(form.unitPrice, false), lineTotal: numberOrNull(form.lineTotal, false) };
}
