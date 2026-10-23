import * as React from 'react';
import { Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import { ArrowRight, Calendar, Camera, Check, CircleAlert, CreditCard, Maximize2, Pencil, Receipt, RotateCcw, Sparkles, Store, Trash2 } from 'lucide-react-native';
import { FormSheet } from '@/components/shared/form-sheet';
import { LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { SCAN_COMMON_UNITS, isScanDraftDirty, mergeScanDrafts, toScanDraft, type ScanDraft } from '../lib/scan-draft';
import { canEditScan, type ScanCandidate, type ScanJob } from '../types/scanning.model';

type Filter = 'all' | 'active' | 'rejected';

function formatMoney(amount: number | null, currency: string | null): string {
  if (amount === null) return '—';
  const code = currency ?? 'VND';
  if (code === 'VND') return `${amount.toLocaleString('vi-VN')} ₫`;
  try { return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: code }).format(amount); }
  catch { return `${amount.toLocaleString('vi-VN')} ${code}`; }
}

function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('vi-VN');
}

/** Dòng chữ thô OCR: gộp khoảng trắng liên tiếp (hóa đơn thường căn cột bằng nhiều dấu cách) để không bị dãn rộng. */
function compactLineText(text: string | null): string {
  if (!text) return '';
  return text.replace(/\s+/g, ' ').trim();
}

const MONO_FONT = Platform.select({ ios: 'Menlo', default: 'monospace' });

function Metric({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <View className={cn('flex-1 flex-row items-start gap-2 rounded-xl border p-2.5', accent ? 'border-primary/20 bg-primary/10' : 'border-border bg-muted/50')} style={{ minWidth: 96 }}>
      {icon}
      <View className="flex-1"><Text className="text-[10px] text-muted-foreground">{label}</Text><Text numberOfLines={2} className={cn('text-xs', accent ? 'font-bold text-primary' : 'font-semibold text-foreground')}>{value}</Text></View>
    </View>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <View className="self-start rounded-full bg-primary/10 px-2.5 py-0.5"><Text className="text-xs font-semibold text-primary">{children}</Text></View>;
}

/** Màn kiểm tra & nhập thông tin sau khi quét tủ lạnh / hóa đơn (đồng bộ bố cục web `CandidateReviewScreen` và `ReceiptInspectionView`). */
export function ScanReview({ job, busy, error, onSave, onEdit, onRetry, onCancel }: {
  job: ScanJob; busy: boolean; error: string;
  onSave: (drafts: ScanDraft[]) => void;
  onEdit: (candidate: ScanCandidate) => void;
  onRetry: () => void; onCancel: () => void;
}) {
  const colors = useIconColors();
  const editable = canEditScan(job);
  const fridge = job.kind === 'fridge';
  const copy = fridge
    ? { title: 'Kiểm tra & Nhập thông tin nguyên liệu', count: 'món nhận diện', hint: 'Đối chiếu hình ảnh tủ lạnh phía trên và hoàn tất trọng lượng, đơn vị bên dưới trước khi lưu.', imageTitle: 'Ảnh chụp tủ lạnh', imageCount: (n: number) => `${n} ảnh`, part: 'Góc ảnh', pick: 'Chọn góc chụp để đối chiếu:', noImage: 'Không tìm thấy ảnh tủ lạnh trong tác vụ này.', guide: 'Hướng dẫn', guideText: 'Nhìn ảnh tủ lạnh phía trên để kiểm tra món đồ, điền trọng lượng và đơn vị vào danh sách bên dưới. Sau đó nhấn ', listTitle: 'Danh sách nguyên liệu', listHint: 'Điền số lượng và đơn vị cho các món thực tế có trong tủ lạnh.', noun: 'nguyên liệu', empty: 'Không tìm thấy nguyên liệu trong ảnh.', sheet: 'Ảnh tủ lạnh' }
    : { title: 'Kiểm tra & Nhập thông tin hóa đơn', count: 'dòng hàng nhận diện', hint: 'Đối chiếu hóa đơn phía trên và kiểm tra, nhập trọng lượng, đơn vị bên dưới trước khi lưu.', imageTitle: 'Ảnh chụp hóa đơn', imageCount: (n: number) => `${n} ảnh đoạn`, part: 'Đoạn', pick: 'Chọn đoạn để đối chiếu:', noImage: 'Không tìm thấy ảnh hóa đơn trong tác vụ này.', guide: 'Hướng dẫn đối chiếu', guideText: 'Nhìn ảnh hóa đơn phía trên để kiểm tra món đồ, điền trọng lượng và đơn vị vào danh sách bên dưới. Sau đó nhấn ', listTitle: 'Danh sách mặt hàng', listHint: 'Điền trọng lượng và đơn vị cho các mặt hàng thực phẩm muốn lưu vào Tủ bếp.', noun: 'mặt hàng', empty: 'Không tìm thấy mặt hàng trong ảnh.', sheet: 'Ảnh hóa đơn' };
  const ImageIcon = fridge ? Camera : Receipt;
  const [drafts, setDrafts] = React.useState<ScanDraft[]>(() => job.candidates.map(toScanDraft));
  const [filter, setFilter] = React.useState<Filter>('all');
  const [imageIndex, setImageIndex] = React.useState(0);
  const [zoom, setZoom] = React.useState(false);
  const [unitFocus, setUnitFocus] = React.useState<string | null>(null);
  const [source, setSource] = React.useState(job.candidates);
  if (source !== job.candidates) { setSource(job.candidates); setDrafts(current => mergeScanDrafts(current, job.candidates)); }

  const update = (id: string, values: Partial<ScanDraft>) => setDrafts(current => current.map(draft => draft.id === id ? { ...draft, ...values } : draft));
  const activeCount = drafts.filter(draft => !draft.rejected).length;
  const rejectedCount = drafts.length - activeCount;
  const shown = drafts.filter(draft => filter === 'all' || (filter === 'active' ? !draft.rejected : draft.rejected));
  const image = job.images[imageIndex] ?? job.images[0] ?? null;
  const processing = job.status === 'QUEUED' || job.status === 'PROCESSING';
  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: `Tất cả (${drafts.length})` },
    { key: 'active', label: `Cần thêm (${activeCount})` },
    ...(rejectedCount > 0 ? [{ key: 'rejected' as const, label: `Đã loại (${rejectedCount})` }] : []),
  ];
  const label = processing ? `Đang xử lý ${job.completedImages}/${job.totalImages} ảnh`
    : job.status === 'FAILED' ? 'Chưa nhận diện được' : job.status === 'PARTIAL_FAILED' ? 'Một số ảnh chưa đọc được'
      : job.status === 'CONFIRMED' ? 'Đã nhập tủ bếp' : job.status === 'CANCELLED' ? 'Đã hủy' : '';
  const inputClass = 'h-11 rounded-xl border border-input bg-background px-3 text-sm text-foreground';

  return (
    <View className="gap-4">
      <View className="gap-2 rounded-2xl border border-border bg-card p-4">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className="text-lg font-bold text-foreground">{copy.title}</Text>
          <Badge>{job.candidates.length} {copy.count}</Badge>
        </View>
        <Text className="text-sm text-muted-foreground">{copy.hint}</Text>
        {label ? <Text className="text-sm font-semibold text-foreground">{label}</Text> : null}
        {processing ? <LoadingState message={`Đang xử lý ${job.completedImages}/${job.totalImages} ảnh`} /> : null}
        {job.issue ? <Text accessibilityRole="alert" className="text-sm text-destructive">{job.issue.message}</Text> : null}
        {job.status === 'FAILED' || job.status === 'PARTIAL_FAILED' ? <PrimaryButton label="Thử lại" variant="outline" disabled={busy} icon={<RotateCcw size={16} color={colors.primary} />} onPress={onRetry} /> : null}
        {processing ? <PrimaryButton label="Hủy tác vụ" variant="outline" disabled={busy} onPress={onCancel} /> : null}
      </View>

      <View className="gap-3 rounded-2xl border border-border bg-card p-4">
        <View className="flex-row items-center justify-between gap-2 border-b border-border pb-2">
          <View className="flex-row items-center gap-2">
            <ImageIcon size={16} color={colors.primary} />
            <Text className="text-sm font-semibold text-foreground">{copy.imageTitle}</Text>
          </View>
          {job.images.length > 0 ? <View className="rounded-full bg-muted px-2.5 py-0.5"><Text className="text-xs font-medium text-muted-foreground">{fridge ? `${imageIndex + 1} / ${job.images.length} ảnh` : copy.imageCount(job.images.length)}</Text></View> : null}
        </View>
        {image ? (
          <View className="overflow-hidden rounded-xl border border-border bg-black" style={{ aspectRatio: 4 / 3 }}>
            <Image source={{ uri: image.url }} style={{ width: '100%', height: '100%' }} contentFit="contain" accessibilityLabel={`${copy.sheet} ${copy.part.toLowerCase()} ${image.position + 1}`} />
            <View className="absolute left-2.5 top-2.5 rounded-full bg-black/60 px-2.5 py-1"><Text className="text-[11px] font-medium text-white">{copy.part} #{image.position + 1}</Text></View>
            <Pressable accessibilityRole="button" accessibilityLabel="Xem phóng to ảnh" onPress={() => setZoom(true)} className="absolute bottom-2.5 right-2.5 h-9 w-9 items-center justify-center rounded-full bg-black/65"><Maximize2 size={16} color="#ffffff" /></Pressable>
            {image.issue ? <View className="absolute bottom-2.5 left-2.5 right-14"><Text className="text-xs text-white">{image.issue}</Text></View> : null}
          </View>
        ) : (
          <View className="items-center justify-center gap-2 rounded-xl border border-dashed border-border p-6" style={{ aspectRatio: 4 / 3 }}>
            <ImageIcon size={36} color={colors.mutedForeground} />
            <Text className="text-center text-xs text-muted-foreground">{copy.noImage}</Text>
          </View>
        )}
        {job.images.length > 1 ? (
          <View className="gap-1.5">
            <Text className="text-[11px] font-medium text-muted-foreground">{copy.pick}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 4 }}>
              {job.images.map((item, index) => (
                <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Xem ${copy.part.toLowerCase()} ${index + 1}`} onPress={() => setImageIndex(index)}
                  className={cn('overflow-hidden rounded-lg border-2', imageIndex === index ? 'border-primary' : 'border-transparent opacity-60')}>
                  <Image source={{ uri: item.url }} style={{ width: 56, height: 56 }} contentFit="cover" />
                </Pressable>
              ))}
            </ScrollView>
          </View>
        ) : null}
        {!fridge && job.receipt ? (
          <View className="flex-row flex-wrap gap-2.5">
            <Metric icon={<Store size={14} color={colors.mutedForeground} />} label="Cửa hàng" value={job.receipt.merchant || '—'} />
            <Metric icon={<Calendar size={14} color={colors.mutedForeground} />} label="Thời gian" value={formatDate(job.receipt.purchasedAt)} />
            <Metric accent icon={<CreditCard size={14} color={colors.primary} />} label="Tổng tiền" value={formatMoney(job.receipt.total, job.receipt.currency)} />
          </View>
        ) : null}
        <View className="gap-1 rounded-xl border border-primary/20 bg-primary/10 p-3">
          <View className="flex-row items-center gap-1.5"><Sparkles size={14} color={colors.primary} /><Text className="text-xs font-semibold text-primary">{copy.guide}</Text></View>
          <Text className="text-[11px] leading-4 text-muted-foreground">{copy.guideText}<Text className="font-bold">Lưu vào Tủ bếp</Text> để hoàn tất.</Text>
        </View>
      </View>

      <View className="gap-4 rounded-2xl border border-border bg-card p-4">
        <View className="gap-3 border-b border-border pb-3">
          <View className="gap-1">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-lg font-bold text-foreground">{copy.listTitle}</Text>
              <Badge>{activeCount} món sẽ thêm</Badge>
            </View>
            <Text className="text-xs text-muted-foreground">{copy.listHint}</Text>
          </View>
          <View className="flex-row gap-1 self-start rounded-xl bg-muted p-1">
            {tabs.map(tab => (
              <Pressable key={tab.key} accessibilityRole="button" accessibilityState={{ selected: filter === tab.key }} onPress={() => setFilter(tab.key)} className={cn('rounded-lg px-2.5 py-1.5', filter === tab.key ? 'bg-background' : '')}>
                <Text className={cn('text-xs font-medium', filter === tab.key ? 'text-foreground' : 'text-muted-foreground')}>{tab.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {shown.length === 0 ? (
          <View className="items-center rounded-xl border border-dashed border-border py-10"><Text className="text-sm text-muted-foreground">{drafts.length === 0 && editable ? copy.empty : `Không có ${copy.noun} nào trong mục này.`}</Text></View>
        ) : shown.map(draft => {
          const candidate = job.candidates.find(item => item.id === draft.id);
          if (!candidate) return null;
          const locked = !editable || busy || draft.rejected;
          return (
            <View key={draft.id} className={cn('gap-3 rounded-xl border p-3.5', draft.rejected ? 'border-dashed border-border bg-muted/30 opacity-60' : 'border-border bg-card')}>
              <View className="gap-1.5">
                <TextInput accessibilityLabel={`Tên ${candidate.name}`} style={{ marginLeft: -8 }} editable={!locked} value={draft.name} placeholder="Tên nguyên liệu..." placeholderTextColor={colors.mutedForeground}
                  onChangeText={value => update(draft.id, { name: value })} maxLength={160}
                  className={cn('h-10 rounded-lg border border-transparent bg-transparent px-2 text-base font-semibold focus:border-input', draft.rejected ? 'text-muted-foreground line-through' : 'text-foreground')} />
                {!fridge ? (
                  <View className="flex-row flex-wrap items-center justify-between gap-x-4 gap-y-1.5 pl-0.5">
                    <View className="shrink flex-row items-center gap-1.5">
                      <View className="rounded bg-muted px-1.5 py-0.5"><Text className="text-[10px] font-bold uppercase text-muted-foreground">OCR</Text></View>
                      <Text numberOfLines={1} style={{ fontFamily: MONO_FONT }} className="shrink text-xs text-muted-foreground">{compactLineText(candidate.lineText) || '(Không có dòng chữ gốc)'}</Text>
                    </View>
                    <View className="flex-row flex-wrap items-center gap-2">
                      {candidate.lineTotal !== null ? (
                        <View className="rounded-md border border-emerald-200/50 bg-emerald-50 px-2 py-0.5 dark:border-emerald-800/50 dark:bg-emerald-950/30"><Text className="text-xs font-medium text-emerald-700 dark:text-emerald-400">{formatMoney(candidate.lineTotal, candidate.currency)}{candidate.unitPrice !== null ? <Text className="text-[11px] font-normal text-muted-foreground"> ({formatMoney(candidate.unitPrice, candidate.currency)}/{draft.unit || 'đv'})</Text> : null}</Text></View>
                      ) : null}
                      <Text className="text-[11px] text-muted-foreground">Độ tin cậy: {Math.round(candidate.confidence * 100)}%</Text>
                    </View>
                  </View>
                ) : null}
                <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1 pl-0.5">
                  {draft.rejected && !fridge ? <View className="rounded-md bg-destructive/10 px-1.5 py-0.5"><Text className="text-[11px] text-destructive">Đã loại bỏ</Text></View> : null}
                  {!draft.rejected && !fridge && isScanDraftDirty(draft) ? <View className="rounded-md border border-input px-1.5 py-0.5"><Text className="text-[11px] text-primary">Đã sửa</Text></View> : null}
                  {candidate.ingredient && !draft.rejected ? (
                    <View className="flex-row items-center gap-1 rounded-full border border-emerald-200/60 bg-emerald-50 px-2 py-0.5 dark:border-emerald-800/60 dark:bg-emerald-950/40"><Check size={12} color={colors.primary} /><Text className="text-[11px] text-emerald-700 dark:text-emerald-300">Khớp: {candidate.ingredient.name}</Text></View>
                  ) : null}
                  {fridge && !candidate.ingredient ? <Text className="text-[11px] text-muted-foreground">Độ tin cậy: {Math.round(candidate.confidence * 100)}%</Text> : null}
                  {fridge && candidate.freshness ? <Text className="text-[11px] text-warning">· {candidate.freshness}</Text> : null}
                  {candidate.uncertainty && !draft.rejected ? <View className="flex-row items-center gap-1"><CircleAlert size={12} color={colors.cta} /><Text className="text-[11px] text-warning">{candidate.uncertainty}</Text></View> : null}
                </View>
              </View>
              <View className="flex-row items-end gap-2">
                <View className="gap-1" style={{ width: 88 }}>
                  <Text className="text-[11px] font-medium text-muted-foreground">Trọng lượng</Text>
                  <TextInput accessibilityLabel={`Trọng lượng ${candidate.name}`} editable={!locked} value={draft.quantity} placeholder="VD: 500" placeholderTextColor={colors.mutedForeground}
                    keyboardType="decimal-pad" onChangeText={value => update(draft.id, { quantity: value })} className={cn(inputClass, 'text-center font-medium')} />
                </View>
                <View className="flex-1 gap-1">
                  <Text className="text-[11px] font-medium text-muted-foreground">Đơn vị</Text>
                  <TextInput accessibilityLabel={`Đơn vị ${candidate.name}`} editable={!locked} value={draft.unit} placeholder="g, kg..." placeholderTextColor={colors.mutedForeground}
                    maxLength={40} autoCapitalize="none" onFocus={() => setUnitFocus(draft.id)} onBlur={() => setUnitFocus(current => current === draft.id ? null : current)}
                    onChangeText={value => update(draft.id, { unit: value })} className={inputClass} />
                </View>
                {editable ? (
                  <View className="flex-row items-center">
                    <Pressable accessibilityRole="button" accessibilityLabel={`Chỉnh sửa nâng cao ${candidate.name}`} disabled={busy} onPress={() => onEdit({ ...candidate, name: draft.name.trim() || candidate.name, unit: draft.unit.trim() || candidate.unit, quantity: Number(draft.quantity.replace(',', '.')) > 0 ? Number(draft.quantity.replace(',', '.')) : candidate.quantity })} className="h-10 w-10 items-center justify-center"><Pencil size={18} color={colors.mutedForeground} /></Pressable>
                    {draft.rejected ? (
                      <Pressable accessibilityRole="button" accessibilityLabel={`Khôi phục ${candidate.name}`} disabled={busy} onPress={() => update(draft.id, { rejected: false })} className="h-10 flex-row items-center gap-1 rounded-lg border border-border px-2.5"><RotateCcw size={14} color={colors.primary} /><Text className="text-xs text-emerald-600 dark:text-emerald-400">Khôi phục</Text></Pressable>
                    ) : (
                      <Pressable accessibilityRole="button" accessibilityLabel={`Loại bỏ ${candidate.name}`} disabled={busy} onPress={() => update(draft.id, { rejected: true })} className="h-10 w-10 items-center justify-center"><Trash2 size={18} color={colors.mutedForeground} /></Pressable>
                    )}
                  </View>
                ) : null}
              </View>
              {unitFocus === draft.id ? (
                <ScrollView horizontal keyboardShouldPersistTaps="always" showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {SCAN_COMMON_UNITS.map(unit => (
                    <Pressable key={unit} accessibilityRole="button" accessibilityLabel={`Chọn đơn vị ${unit}`} onPress={() => update(draft.id, { unit })} className={cn('rounded-full border px-3 py-1', draft.unit === unit ? 'border-primary bg-primary/10' : 'border-border bg-background')}>
                      <Text className={cn('text-xs', draft.unit === unit ? 'font-semibold text-primary' : 'text-foreground')}>{unit}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              ) : null}
              {draft.rejected ? <Text className="text-xs text-muted-foreground">Đã loại bỏ — bấm khôi phục để thêm lại.</Text> : isScanDraftDirty(draft) && editable ? <Text className="text-[11px] text-muted-foreground">Chưa lưu thay đổi</Text> : null}
            </View>
          );
        })}

        {editable ? (
          <View className="gap-3 border-t border-border pt-4">
            <Text className="text-center text-xs text-muted-foreground">Đã chọn <Text className="font-bold text-foreground">{activeCount}</Text> {copy.noun} để thêm vào kho Tủ bếp gia đình.</Text>
            {error ? <Text accessibilityRole="alert" className="text-sm text-destructive">{error}</Text> : null}
            <PrimaryButton label={busy ? 'Đang lưu vào Tủ bếp...' : `Lưu vào Tủ bếp (${activeCount})`} loading={busy} disabled={busy || activeCount === 0} icon={<ArrowRight size={16} color={colors.primaryForeground} />} onPress={() => onSave(drafts)} />
            <PrimaryButton label="Hủy bỏ" variant="outline" disabled={busy} onPress={onCancel} />
          </View>
        ) : null}
      </View>
      {zoom && image ? <FormSheet title={`${copy.sheet} ${copy.part.toLowerCase()} #${image.position + 1}`} onClose={() => setZoom(false)} variant="popup"><Image source={{ uri: image.url }} style={{ width: '100%', height: 420 }} contentFit="contain" accessibilityLabel="Ảnh quét gốc" /></FormSheet> : null}
    </View>
  );
}
