import * as React from 'react';
import { ActivityIndicator, Platform, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, CircleAlert, CircleHelp, Plus, Receipt, Refrigerator, ShieldAlert, Sparkles, Trash2, UploadCloud, X, ZoomIn } from 'lucide-react-native';
import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import type { ScanKind } from '../types/scanning.model';

export interface UploadPreview {
  id: string;
  uri: string;
  name: string;
  bytes: number;
}

const COPY = {
  fridge: {
    unit: 'ảnh', part: 'Ảnh', title: 'Tải ảnh các ngăn tủ lạnh', selectedTitle: 'Ảnh tủ lạnh đã chọn',
    selectedHint: 'AI sẽ nhận diện đồng thời các loại rau củ, trái cây, gia vị trong tất cả ảnh',
    drop: (max: number) => `Chọn ảnh từ thiết bị. Bạn có thể chụp từ 1 đến ${max} ảnh các ngăn tủ (ngăn mát, ngăn rau củ, ngăn đông, cánh tủ) để AI quét toàn diện.`,
    limitChip: (max: number) => `Tối đa ${max} ảnh các ngăn tủ`, first: 'Ảnh 1 (Toàn cảnh / Ngăn chính)', ready: 'Đã sẵn sàng nhận diện thực phẩm',
    moreTitle: 'Chụp thêm các ngăn khác?', moreHint: (max: number) => `Bạn có thể chụp thêm tối đa ${max - 1} ảnh nữa (ngăn rau củ, ngăn đông, cánh tủ...) để kiểm kê đầy đủ Tủ bếp.`,
    morePick: 'Chọn ảnh ngăn khác', moreCamera: 'Chụp tiếp', uploading: 'Đang tải ảnh tủ lạnh và khởi tạo AI nhận diện...',
    after: 'Sau khi quét, AI sẽ gợi ý danh sách thực phẩm, bạn có thể kiểm tra và chỉnh sửa trước khi lưu vào Tủ bếp.',
    start: (count: number) => `Bắt đầu nhận diện AI (${count} ảnh)`,
  },
  receipt: {
    unit: 'đoạn', part: 'Đoạn', title: 'Tải ảnh hóa đơn siêu thị', selectedTitle: 'Ảnh hóa đơn đã chọn',
    selectedHint: 'AI sẽ đọc và tự động ghép nối các đoạn theo thứ tự từ trên xuống dưới',
    drop: (max: number) => `Chọn ảnh từ thiết bị. Hóa đơn dài có thể chụp từ 1 đến ${max} ảnh liên tiếp để AI tự động ghép nối.`,
    limitChip: (max: number) => `Tối đa ${max} ảnh liên tiếp`, first: 'Đoạn 1 (Chính)', ready: 'Đã sẵn sàng nhận diện OCR',
    moreTitle: 'Hóa đơn còn dài chưa chụp hết?', moreHint: () => 'Bạn có thể chụp hoặc tải thêm đoạn 2, 3 hoặc 4. AI sẽ nối các phần theo thứ tự.',
    morePick: 'Chọn ảnh đoạn 2', moreCamera: 'Chụp đoạn 2', uploading: 'Đang tải ảnh và khởi tạo tác vụ bóc tách OCR...',
    after: 'Sau khi bắt đầu, AI sẽ bóc tách các món và bạn có thể kiểm tra danh sách trước khi lưu vào Tủ bếp.',
    start: (count: number) => `Bắt đầu bóc tách hóa đơn (${count} ảnh)`,
  },
} as const;

const megabytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(2)} MB`;

function IconBox({ kind, size }: { kind: ScanKind; size: 'lg' | 'sm' }) {
  const colors = useIconColors();
  const Icon = kind === 'fridge' ? Refrigerator : Receipt;
  return (
    <View className={cn('items-center justify-center border border-primary/20 bg-primary/10', size === 'lg' ? 'h-16 w-16 rounded-2xl' : 'h-9 w-9 rounded-xl')}>
      <Icon size={size === 'lg' ? 32 : 20} color={colors.primary} />
    </View>
  );
}

/** Banner khuyến cáo an toàn thực phẩm & độ tươi, cố định ở đầu màn quét tủ lạnh (đồng bộ web `FreshnessDisclaimerBanner`). */
export function FreshnessBanner({ disclaimer }: { disclaimer?: string | null }) {
  const colors = useIconColors();
  return (
    <View accessibilityRole="alert" className="flex-row items-start gap-3 rounded-2xl border border-warning/30 bg-warning/10 p-3.5">
      <ShieldAlert size={18} color={colors.cta} />
      <Text className="flex-1 text-xs leading-5 text-foreground">
        <Text className="font-semibold text-warning">Khuyến cáo an toàn thực phẩm & độ tươi: </Text>
        {disclaimer || 'Quan sát độ tươi chỉ là ước lượng thị giác sơ bộ từ hình ảnh. Người dùng phải tự kiểm tra chất lượng thực phẩm thực tế trước khi sử dụng; hệ thống không đưa ra quyết định hay chứng nhận về an toàn thực phẩm.'}
      </Text>
    </View>
  );
}

/** Phần giới thiệu trước khi quét (tiêu đề, mô tả, mẹo chụp ảnh) theo web `/pantry/scan` và `/receipts/scan`. */
export function ScanIntro({ kind }: { kind: ScanKind }) {
  const colors = useIconColors();
  if (kind === 'fridge') {
    return (
      <View className="gap-1">
        <Text className="text-2xl font-bold text-foreground">Quét ảnh tủ lạnh</Text>
        <Text className="text-sm text-muted-foreground">Chụp hoặc tải ảnh các ngăn tủ lạnh để AI tự động nhận diện thực phẩm và đưa vào tủ bếp của bạn.</Text>
      </View>
    );
  }
  const tips = [
    { icon: CheckCircle2, color: colors.primary, text: 'Đặt hóa đơn trên mặt phẳng phẳng, đủ ánh sáng và không bị lóa bóng.' },
    { icon: CheckCircle2, color: colors.primary, text: 'Hóa đơn dài có thể chụp liên tiếp từ 2 đến 4 ảnh từ trên xuống dưới.' },
    { icon: ShieldAlert, color: colors.cta, text: 'Bạn sẽ luôn được đối chiếu và kiểm duyệt danh sách trước khi lưu vào kho.' },
  ];
  return (
    <View className="gap-4">
      <View className="gap-2">
        <View className="flex-row items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/10 px-3 py-1">
          <Receipt size={14} color={colors.primary} />
          <Text className="text-xs font-medium text-primary">Nhận diện OCR & Bóc tách Hóa đơn</Text>
        </View>
        <Text className="text-2xl font-bold text-foreground">Quét hóa đơn mua thực phẩm</Text>
        <Text className="text-sm leading-5 text-muted-foreground">Chụp hoặc tải ảnh hóa đơn từ siêu thị hoặc cửa hàng tiện lợi. AI sẽ tự động đọc các dòng hàng, hiển thị ảnh đối chiếu và danh sách để bạn điền trọng lượng, đơn vị trước khi lưu vào Tủ bếp.</Text>
      </View>
      <View className="gap-3 rounded-2xl border border-border bg-muted p-4">
        {tips.map(tip => (
          <View key={tip.text} className="flex-row items-start gap-2">
            <tip.icon size={16} color={tip.color} />
            <Text className="flex-1 text-xs leading-4 text-muted-foreground">{tip.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Màn chọn ảnh trước khi quét: ô tải ảnh trống, hoặc khung làm việc với các ảnh đã chọn (đồng bộ web `FridgeUploadZone` / `ReceiptUploadZone`). */
export function ScanUploadStage({ kind, images, limit, busy, starting, progress, permissionDenied, onPick, onMove, onRemove, onClear, onStart, onOpenSettings }: {
  kind: ScanKind; images: UploadPreview[]; limit: number; busy: boolean; starting: boolean; progress: string; permissionDenied: boolean;
  onPick: (camera: boolean) => void; onMove: (index: number, offset: number) => void; onRemove: (id: string) => void; onClear: () => void;
  onStart: () => void; onOpenSettings: () => void;
}) {
  const colors = useIconColors();
  const copy = COPY[kind];
  const [preview, setPreview] = React.useState<UploadPreview | null>(null);
  const canAdd = images.length < limit && !busy;
  const camera = Platform.OS !== 'web';
  const chip = (text: string, icon?: boolean) => (
    <View key={text} className="flex-row items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
      {icon ? <CircleAlert size={14} color={colors.mutedForeground} /> : null}
      <Text className="text-xs text-muted-foreground">{text}</Text>
    </View>
  );

  if (images.length === 0) {
    return (
      <View className="items-center rounded-3xl border-2 border-dashed border-border bg-card p-6">
        <View className="mb-4"><IconBox kind={kind} size="lg" /></View>
        <Text className="mb-2 text-center text-lg font-bold text-foreground">{copy.title}</Text>
        <Text className="mb-6 text-center text-sm leading-5 text-muted-foreground">{copy.drop(limit)}</Text>
        <View className="w-full gap-3">
          <PrimaryButton label="Chọn ảnh từ thiết bị" disabled={busy} icon={<UploadCloud size={16} color={colors.primaryForeground} />} onPress={() => onPick(false)} />
          {camera ? <PrimaryButton label="Chụp ảnh trực tiếp" variant="outline" disabled={busy} icon={<Camera size={16} color={colors.foreground} />} onPress={() => onPick(true)} /> : null}
        </View>
        <View className="mt-6 flex-row flex-wrap items-center justify-center gap-2">
          {chip('JPG, PNG, WebP • Tối đa 10 MB/ảnh', true)}
          {chip(copy.limitChip(limit))}
        </View>
        {permissionDenied ? <View className="mt-4 w-full"><PrimaryButton label="Mở cài đặt quyền" variant="outline" onPress={onOpenSettings} /></View> : null}
      </View>
    );
  }

  const single = images.length === 1;
  const remove = (image: UploadPreview, small = false) => (
    <Pressable accessibilityRole="button" accessibilityLabel={`Bỏ ảnh ${image.name}`} disabled={busy} onPress={() => onRemove(image.id)} className={cn('items-center justify-center', small ? 'h-8 w-8' : 'h-9 w-9')}>
      {single ? <Trash2 size={16} color={colors.mutedForeground} /> : <X size={16} color={colors.mutedForeground} />}
    </Pressable>
  );

  return (
    <View className="gap-5 rounded-3xl border border-border bg-card p-4">
      <View className="gap-3 border-b border-border pb-4">
        <View className="flex-row items-center gap-3">
          <IconBox kind={kind} size="sm" />
          <View className="flex-1 gap-0.5">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-base font-bold text-foreground">{copy.selectedTitle}</Text>
              <View className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5"><Text className="text-xs font-semibold text-primary">{images.length}/{limit} {copy.unit}</Text></View>
            </View>
            <Text className="text-xs text-muted-foreground">{copy.selectedHint}</Text>
          </View>
        </View>
        <View className="flex-row flex-wrap items-center gap-2">
          {canAdd ? (
            <>
              <Pressable accessibilityRole="button" onPress={() => onPick(false)} className="h-9 flex-row items-center gap-1 rounded-xl border border-input bg-background px-3"><Plus size={14} color={colors.foreground} /><Text className="text-xs font-medium text-foreground">Thêm ảnh {images.length + 1}</Text></Pressable>
              {camera ? <Pressable accessibilityRole="button" accessibilityLabel="Chụp ảnh tiếp theo" onPress={() => onPick(true)} className="h-9 w-10 items-center justify-center rounded-xl border border-input bg-background"><Camera size={14} color={colors.foreground} /></Pressable> : null}
            </>
          ) : null}
          {!busy ? <Pressable accessibilityRole="button" onPress={onClear} className="h-9 flex-row items-center gap-1 rounded-xl px-2.5"><Trash2 size={14} color={colors.destructive} /><Text className="text-xs font-medium text-muted-foreground">Xóa tất cả</Text></Pressable> : null}
        </View>
      </View>

      {single ? (
        <View className="gap-4">
          <View className="gap-3 rounded-2xl border border-border bg-muted/50 p-3">
            <View className="flex-row items-center justify-between gap-2">
              <View className="flex-1 flex-row items-center gap-2">
                <View className="rounded-md bg-foreground px-2.5 py-0.5"><Text className="text-xs font-semibold text-background">{copy.first}</Text></View>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setPreview(images[0])} className="h-8 flex-row items-center gap-1 rounded-lg border border-input bg-background px-2.5"><ZoomIn size={14} color={colors.primary} /><Text className="text-xs font-medium text-foreground">Phóng to</Text></Pressable>
              {remove(images[0], true)}
            </View>
            <Text numberOfLines={1} className="text-xs text-muted-foreground">{images[0].name}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Bấm để phóng to" onPress={() => setPreview(images[0])} className="overflow-hidden rounded-xl bg-black" style={{ height: 320 }}>
              <Image source={{ uri: images[0].uri }} style={{ width: '100%', height: '100%' }} contentFit="contain" accessibilityLabel={images[0].name} />
            </Pressable>
            <View className="flex-row flex-wrap items-center justify-between gap-2 px-1">
              <Text className="text-xs text-muted-foreground">Dung lượng: {images[0].bytes ? megabytes(images[0].bytes) : 'chưa rõ'}</Text>
              <View className="flex-row items-center gap-1"><CheckCircle2 size={14} color={colors.primary} /><Text className="text-xs font-medium text-primary">{copy.ready}</Text></View>
            </View>
          </View>
          <View className="gap-3 rounded-2xl border-2 border-dashed border-border bg-muted/40 p-4">
            <View className="flex-row items-center gap-3">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary/10"><Plus size={20} color={colors.primary} /></View>
              <View className="flex-1 gap-0.5">
                <Text className="text-sm font-bold text-foreground">{copy.moreTitle}</Text>
                <Text className="text-xs leading-4 text-muted-foreground">{copy.moreHint(limit)}</Text>
              </View>
            </View>
            <View className="flex-row flex-wrap gap-2">
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => onPick(false)} className="h-9 flex-row items-center gap-1.5 rounded-xl border border-input bg-background px-3"><UploadCloud size={14} color={colors.foreground} /><Text className="text-xs font-medium text-foreground">{copy.morePick}</Text></Pressable>
              {camera ? <Pressable accessibilityRole="button" disabled={busy} onPress={() => onPick(true)} className="h-9 flex-row items-center gap-1.5 rounded-xl border border-input bg-background px-3"><Camera size={14} color={colors.foreground} /><Text className="text-xs font-medium text-foreground">{copy.moreCamera}</Text></Pressable> : null}
            </View>
          </View>
        </View>
      ) : (
        <View className="flex-row flex-wrap gap-3">
          {images.map((image, index) => (
            <View key={image.id} className="gap-2.5 rounded-2xl border border-border bg-muted/50 p-3" style={{ width: '100%' }}>
              <View className="flex-row items-center justify-between">
                <View className="rounded-md bg-foreground px-2 py-0.5"><Text className="text-[11px] font-semibold text-background">{copy.part} #{index + 1}</Text></View>
                <View className="flex-row items-center">
                  {index > 0 && !busy ? <Pressable accessibilityRole="button" accessibilityLabel={`Đưa ảnh ${index + 1} lên trước`} onPress={() => onMove(index, -1)} className="h-8 w-8 items-center justify-center"><ArrowLeft size={14} color={colors.mutedForeground} /></Pressable> : null}
                  {index < images.length - 1 && !busy ? <Pressable accessibilityRole="button" accessibilityLabel={`Đưa ảnh ${index + 1} xuống sau`} onPress={() => onMove(index, 1)} className="h-8 w-8 items-center justify-center"><ArrowRight size={14} color={colors.mutedForeground} /></Pressable> : null}
                  {!busy ? remove(image, true) : null}
                </View>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel={`Xem phóng to ${image.name}`} onPress={() => setPreview(image)} className="overflow-hidden rounded-xl bg-black" style={{ aspectRatio: 4 / 3 }}>
                <Image source={{ uri: image.uri }} style={{ width: '100%', height: '100%' }} contentFit="contain" accessibilityLabel={image.name} />
              </Pressable>
              <View className="gap-0.5">
                <Text numberOfLines={1} className="text-xs font-medium text-foreground">{image.name}</Text>
                {image.bytes ? <Text className="text-[11px] text-muted-foreground">{megabytes(image.bytes)}</Text> : null}
              </View>
            </View>
          ))}
          {canAdd ? (
            <Pressable accessibilityRole="button" onPress={() => onPick(false)} className="items-center justify-center gap-2.5 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-4" style={{ width: '100%', minHeight: 140 }}>
              <View className="h-10 w-10 items-center justify-center rounded-xl border border-border bg-background"><Plus size={20} color={colors.mutedForeground} /></View>
              <View className="items-center gap-0.5">
                <Text className="text-xs font-bold text-foreground">Thêm {copy.part.toLowerCase()} #{images.length + 1}</Text>
                <Text className="text-[11px] text-muted-foreground">Bấm để chọn tệp</Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      )}

      {starting ? (
        <View className="gap-2 rounded-2xl border border-primary/20 bg-primary/10 p-4">
          <View className="flex-row items-center gap-2">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="flex-1 text-xs font-medium text-foreground">{copy.uploading}</Text>
          </View>
          {progress ? <Text className="text-xs text-muted-foreground">{progress}</Text> : null}
        </View>
      ) : null}

      {permissionDenied ? <PrimaryButton label="Mở cài đặt quyền" variant="outline" onPress={onOpenSettings} /> : null}

      <View className="gap-3 border-t border-border pt-4">
        <View className="flex-row items-start gap-2">
          <CircleHelp size={16} color={colors.primary} />
          <Text className="flex-1 text-xs leading-4 text-muted-foreground">{copy.after}</Text>
        </View>
        <PrimaryButton label={starting ? 'Đang xử lý...' : copy.start(images.length)} loading={starting} disabled={busy || images.length === 0} icon={<Sparkles size={16} color={colors.primaryForeground} />} onPress={onStart} />
        <PrimaryButton label="Hủy / Chọn lại" variant="outline" disabled={busy} onPress={onClear} />
      </View>
      {preview ? <FormSheet title={copy.part === 'Ảnh' ? 'Xem chi tiết ảnh tủ lạnh' : 'Xem chi tiết ảnh hóa đơn'} onClose={() => setPreview(null)} variant="popup"><Image source={{ uri: preview.uri }} style={{ width: '100%', height: 420 }} contentFit="contain" accessibilityLabel={preview.name} /></FormSheet> : null}
    </View>
  );
}
