import * as React from 'react';
import { Text, View } from 'react-native';
import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { IngredientPicker } from '@/features/ingredient/components/ingredient-picker';
import { parseCandidateForm, type CandidateForm } from '../lib/candidate-form';
import type { CandidateEdit, ScanCandidate, ScanKind } from '../types/scanning.model';

export function CandidateEditor({ candidate, kind, busy, error, onSave, onClose }: {
  candidate: ScanCandidate;
  kind: ScanKind;
  busy: boolean;
  error: string;
  onSave: (input: CandidateEdit) => void;
  onClose: () => void;
}) {
  const [form, setForm] = React.useState<CandidateForm>(() => ({
    name: candidate.name, ingredientId: candidate.ingredient?.id ?? null,
    quantity: candidate.quantity?.toString() ?? '', unit: candidate.unit ?? '',
    freshness: candidate.freshness ?? '', lineText: candidate.lineText ?? '',
    unitPrice: candidate.unitPrice?.toString() ?? '', lineTotal: candidate.lineTotal?.toString() ?? '', currency: candidate.currency ?? '',
  }));
  const [validation, setValidation] = React.useState('');
  const field = (key: keyof CandidateForm, value: string) => setForm(current => ({ ...current, [key]: value }));
  const save = () => {
    setValidation('');
    try { onSave(parseCandidateForm(form, kind, candidate.version)); }
    catch (value) { setValidation(value instanceof Error ? value.message : 'Dữ liệu không hợp lệ.'); }
  };
  return (
    <FormSheet title="Sửa nguyên liệu" onClose={onClose} busy={busy}>
      <View style={{ pointerEvents: busy ? 'none' : 'auto' }} className="gap-4">
        <IngredientPicker label="Nguyên liệu" value={{ displayName: form.name, ingredientId: form.ingredientId }} onChange={value => setForm(current => ({ ...current, name: value.displayName, ingredientId: value.ingredientId }))} />
        <TextField label="Số lượng" accessibilityLabel="Số lượng" editable={!busy} value={form.quantity} keyboardType="decimal-pad" onChangeText={value => field('quantity', value)} />
        <TextField label="Đơn vị" accessibilityLabel="Đơn vị" editable={!busy} value={form.unit} maxLength={40} onChangeText={value => field('unit', value)} />
        {kind === 'fridge' ? <TextField label="Quan sát độ tươi" accessibilityLabel="Quan sát độ tươi" editable={!busy} value={form.freshness} multiline maxLength={2000} onChangeText={value => field('freshness', value)} /> : (
          <>
            <TextField label="Dòng hóa đơn" accessibilityLabel="Dòng hóa đơn" editable={!busy} value={form.lineText} maxLength={1000} onChangeText={value => field('lineText', value)} />
            <TextField label="Đơn giá" accessibilityLabel="Đơn giá" editable={!busy} value={form.unitPrice} keyboardType="decimal-pad" onChangeText={value => field('unitPrice', value)} />
            <TextField label="Thành tiền" accessibilityLabel="Thành tiền" editable={!busy} value={form.lineTotal} keyboardType="decimal-pad" onChangeText={value => field('lineTotal', value)} />
            <TextField label="Tiền tệ" accessibilityLabel="Tiền tệ" editable={!busy} value={form.currency} maxLength={3} autoCapitalize="characters" onChangeText={value => field('currency', value)} />
          </>
        )}
      </View>
      {validation || error ? <Text accessibilityRole="alert" className="text-sm text-destructive">{validation || error}</Text> : null}
      <PrimaryButton label="Lưu thay đổi" loading={busy} onPress={save} />
    </FormSheet>
  );
}
