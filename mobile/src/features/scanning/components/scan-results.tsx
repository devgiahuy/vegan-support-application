import * as React from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Pencil, RotateCcw, X } from 'lucide-react-native';
import { FormSheet } from '@/components/shared/form-sheet';
import { LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { canEditScan, canSelectCandidate, type ScanCandidate, type ScanImage, type ScanJob, type ScanStatus } from '../types/scanning.model';

const labels: Record<ScanStatus, string> = { QUEUED: 'Đang chờ', PROCESSING: 'Đang xử lý', READY: 'Kết quả nhận diện', PARTIAL_FAILED: 'Một số ảnh chưa đọc được', FAILED: 'Chưa nhận diện được', CONFIRMED: 'Đã nhập tủ bếp', CANCELLED: 'Đã hủy' };

export function ScanResults({ job, selected, busy, onSelect, onEdit, onReject, onRetry, onCancel, onConfirm }: {
  job: ScanJob; selected: string[]; busy: boolean;
  onSelect: (candidate: ScanCandidate, selected: boolean) => void;
  onEdit: (candidate: ScanCandidate) => void;
  onReject: (candidate: ScanCandidate) => void;
  onRetry: () => void; onCancel: () => void; onConfirm: () => void;
}) {
  const colors = useIconColors();
  const [preview, setPreview] = React.useState<ScanImage | null>(null);
  const editable = canEditScan(job);
  return (
    <View className="gap-4">
      <Text className="text-lg font-bold text-foreground">{labels[job.status]}</Text>
      {job.status === 'QUEUED' || job.status === 'PROCESSING' ? <LoadingState message={`Đang xử lý ${job.completedImages}/${job.totalImages} ảnh`} /> : null}
      {job.issue ? <Text accessibilityRole="alert" className="text-sm text-destructive">{job.issue.message}</Text> : null}
      <View className="flex-row flex-wrap gap-3">
        {job.images.map(image => (
          <View key={image.id} style={{ width: 104 }} className="gap-1">
            <Pressable accessibilityRole="button" accessibilityLabel={`Xem ảnh ${image.position + 1}`} onPress={() => setPreview(image)}>
              <Image source={{ uri: image.url }} style={{ width: 104, height: 104, borderRadius: 8 }} contentFit="cover" accessibilityLabel={`Ảnh ${image.position + 1}`} />
            </Pressable>
            {image.issue ? <Text className="text-xs text-destructive">{image.issue}</Text> : null}
          </View>
        ))}
      </View>
      {job.receipt ? (
        <View className="gap-1">
          {job.receipt.merchant ? <Text className="font-semibold text-foreground">{job.receipt.merchant}</Text> : null}
          {job.receipt.purchasedAt ? <Text className="text-sm text-muted-foreground">{job.receipt.purchasedAt}</Text> : null}
          {job.receipt.total !== null ? <Text className="text-sm text-foreground">Tổng: {job.receipt.total} {job.receipt.currency ?? ''}</Text> : null}
        </View>
      ) : null}
      {job.disclaimer ? <Text className="text-sm text-muted-foreground">{job.disclaimer}</Text> : null}
      {job.candidates.length === 0 && editable ? <Text className="text-sm text-muted-foreground">Không tìm thấy nguyên liệu trong ảnh.</Text> : null}
      {job.candidates.map(candidate => (
        <View key={candidate.id} className="gap-2 border border-border p-3" style={{ borderRadius: 8 }}>
          <View className="flex-row items-center gap-2">
            <Text className="flex-1 font-semibold text-foreground">{candidate.name}</Text>
            {editable ? <Switch accessibilityLabel={`Chọn ${candidate.name}`} disabled={busy || !canSelectCandidate(candidate)} value={selected.includes(candidate.id)} onValueChange={value => onSelect(candidate, value)} /> : null}
          </View>
          <Text className="text-sm text-foreground">{candidate.quantity === null ? 'Chưa rõ số lượng' : `${candidate.quantity} ${candidate.unit ?? ''}`}</Text>
          <Text className="text-xs text-muted-foreground">Mức tin cậy: {Math.round(candidate.confidence * 100)}%</Text>
          {candidate.lineText ? <Text className="text-sm text-muted-foreground">{candidate.lineText}</Text> : null}
          {candidate.lineTotal !== null ? <Text className="text-sm text-foreground">Thành tiền: {candidate.lineTotal} {candidate.currency ?? ''}</Text> : null}
          {candidate.freshness ? <Text className="text-sm text-muted-foreground">{candidate.freshness}</Text> : null}
          {candidate.uncertainty ? <Text className="text-sm text-muted-foreground">{candidate.uncertainty}</Text> : null}
          {candidate.status === 'REJECTED' ? <Text className="text-sm text-muted-foreground">Đã loại bỏ</Text> : null}
          {editable ? (
            <View className="flex-row gap-3">
              <Pressable accessibilityRole="button" accessibilityLabel={`Sửa ${candidate.name}`} disabled={busy} onPress={() => onEdit(candidate)} className="h-12 w-12 items-center justify-center"><Pencil size={20} color={colors.primary} /></Pressable>
              {candidate.status !== 'REJECTED' ? <Pressable accessibilityRole="button" accessibilityLabel={`Loại bỏ ${candidate.name}`} disabled={busy} onPress={() => onReject(candidate)} className="h-12 w-12 items-center justify-center"><X size={20} color={colors.foreground} /></Pressable> : null}
            </View>
          ) : null}
        </View>
      ))}
      {editable ? <PrimaryButton label={`Xác nhận vào tủ bếp (${selected.length})`} disabled={busy || !selected.length} onPress={onConfirm} /> : null}
      {job.status === 'FAILED' || job.status === 'PARTIAL_FAILED' ? <PrimaryButton label="Thử lại" variant="outline" disabled={busy} icon={<RotateCcw size={18} color={colors.primary} />} onPress={onRetry} /> : null}
      {job.status !== 'CANCELLED' && job.status !== 'CONFIRMED' ? <PrimaryButton label="Hủy tác vụ" variant="outline" disabled={busy} onPress={onCancel} /> : null}
      {preview ? <FormSheet title={`Ảnh ${preview.position + 1}`} onClose={() => setPreview(null)}><Image source={{ uri: preview.url }} style={{ width: '100%', height: 420 }} contentFit="contain" accessibilityLabel="Ảnh quét gốc" /></FormSheet> : null}
    </View>
  );
}
