import * as React from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Link, type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowDown, ArrowUp, Camera, ImagePlus, X } from 'lucide-react-native';
import { SiteScreen } from '@/components/layout/site-screen';
import { FormSheet } from '@/components/shared/form-sheet';
import { ErrorState, LoadingState } from '@/components/shared/state-views';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useUploadImageMutation } from '@/features/storage/queries/storage.queries';
import { validateImage } from '@/features/storage/mappers/storage.mapper';
import { storageErrorMessage } from '@/features/storage/lib/storage-errors';
import type { MediaAsset, SelectedImage, UploadAttempt } from '@/features/storage/types/storage.model';
import { getApiErrorCode, getApiErrorMessage } from '@/lib/api-error';
import { createOperationKey } from '@/lib/operation-key';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';
import { DEV_SCANS_ENABLED, SCAN_PROVIDER_MODE } from '../lib/scan-access';
import { scanningErrorMessage } from '../lib/scanning-errors';
import { useScanJobQuery, useScanMutations } from '../queries/scanning.queries';
import { canSelectCandidate, type CandidateEdit, type ScanCandidate, type ScanConfirmation, type ScanKind } from '../types/scanning.model';
import { CandidateEditor } from './candidate-editor';
import { ScanResults } from './scan-results';

interface UploadEntry {
  id: string;
  image: SelectedImage;
  attempt: UploadAttempt;
  asset: MediaAsset | null;
}

export function ScanWorkspace({ kind }: { kind: ScanKind }) {
  const owner = useAuthStore(state => state.user?.id ?? 'guest');
  return <ScanWorkspaceSession key={`${kind}:${owner}`} kind={kind} />;
}

function ScanWorkspaceSession({ kind }: { kind: ScanKind }) {
  const router = useRouter();
  const colors = useIconColors();
  const authenticated = useAuthStore(state => state.isAuthenticated);
  const owner = useAuthStore(state => state.user?.id ?? '');
  const params = useLocalSearchParams<{ jobId?: string }>();
  const jobId = typeof params.jobId === 'string' ? params.jobId : '';
  const query = useScanJobQuery(kind, jobId);
  const mutations = useScanMutations(kind);
  const upload = useUploadImageMutation();
  const [images, setImages] = React.useState<UploadEntry[]>([]);
  const [picking, setPicking] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const [permissionDenied, setPermissionDenied] = React.useState(false);
  const [progress, setProgress] = React.useState('');
  const [error, setError] = React.useState('');
  const [selected, setSelected] = React.useState<string[]>([]);
  const [editing, setEditing] = React.useState<ScanCandidate | null>(null);
  const [review, setReview] = React.useState<ScanCandidate[] | null>(null);
  const [cancelling, setCancelling] = React.useState(false);
  const [rejecting, setRejecting] = React.useState<ScanCandidate | null>(null);
  const [confirmation, setConfirmation] = React.useState<ScanConfirmation | null>(null);
  const createKey = React.useRef<{ fingerprint: string; key: string } | null>(null);
  const confirmKey = React.useRef<{ fingerprint: string; key: string } | null>(null);
  const retryKey = React.useRef<{ jobId: string; key: string } | null>(null);
  const busy = picking || starting || mutations.edit.isPending || mutations.confirm.isPending || mutations.cancel.isPending || mutations.retry.isPending;
  const job = query.data;
  const limit = kind === 'fridge' ? 6 : 4;
  const title = kind === 'fridge' ? 'Quét tủ lạnh' : 'Quét hóa đơn';

  const pick = async (camera: boolean) => {
    setPicking(true); setError(''); setPermissionDenied(false);
    try {
      if (Platform.OS !== 'web') {
        const permission = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) { setPermissionDenied(true); throw new Error(camera ? 'Cần quyền camera để chụp ảnh.' : 'Cần quyền thư viện để chọn ảnh.'); }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.9, allowsMultipleSelection: !camera, selectionLimit: limit - images.length };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled) return;
      if (images.length + result.assets.length > limit) throw new Error(`Chọn tối đa ${limit} ảnh.`);
      const additions = result.assets.map(asset => {
        const mimeType = asset.file?.type || asset.mimeType || '';
        const extension = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, string>)[mimeType];
        if (!extension) throw new Error('Chọn ảnh JPG, PNG hoặc WebP.');
        const image: SelectedImage = { uri: asset.uri, name: `scan.${extension}`, mimeType, bytes: asset.fileSize ?? asset.file?.size ?? 0, ...(asset.file ? { file: asset.file } : {}) };
        validateImage(image);
        return { id: createOperationKey('scan-image'), image, asset: null, attempt: { key: createOperationKey('scan-upload'), reservationId: null, receipt: null } } satisfies UploadEntry;
      });
      setImages(current => [...current, ...additions]);
    } catch (value) { setError(getApiErrorMessage(value, 'Không chọn được ảnh.')); }
    finally { setPicking(false); }
  };

  const start = async () => {
    if (!images.length || busy) return;
    setStarting(true); setError('');
    let creating = false;
    try {
      const assetIds: string[] = [];
      for (const [index, entry] of images.entries()) {
        if (useAuthStore.getState().user?.id !== owner) throw new Error('Phiên đăng nhập đã thay đổi.');
        const asset = entry.asset ?? await upload.mutateAsync({ input: { kind: kind === 'fridge' ? 'FRIDGE_IMAGE' : 'RECEIPT_IMAGE', image: entry.image, idempotencyKey: entry.attempt.key }, attempt: entry.attempt, onProgress: percent => setProgress(`Ảnh ${index + 1}/${images.length}: ${percent}%`) });
        entry.asset = asset;
        setImages(current => current.map(item => item.id === entry.id ? { ...item, asset } : item));
        assetIds.push(asset.id);
      }
      if (useAuthStore.getState().user?.id !== owner) throw new Error('Phiên đăng nhập đã thay đổi.');
      creating = true;
      const fingerprint = JSON.stringify([kind, assetIds]);
      if (createKey.current?.fingerprint !== fingerprint) createKey.current = { fingerprint, key: createOperationKey('scan-create') };
      const created = await mutations.create.mutateAsync({ assetIds, operationKey: createKey.current.key });
      router.setParams({ jobId: created.id });
      setSelected([]); setConfirmation(null); setProgress('');
    } catch (value) { setError(creating ? scanningErrorMessage(value) : storageErrorMessage(value)); }
    finally { setStarting(false); }
  };

  const save = async (candidate: ScanCandidate, values: CandidateEdit, reject = false) => {
    setError('');
    try {
      await mutations.edit.mutateAsync({ id: jobId, candidateId: candidate.id, values });
      setEditing(null); setRejecting(null);
      if (reject) setSelected(current => current.filter(id => id !== candidate.id));
    } catch (value) {
      setError(scanningErrorMessage(value));
      if (getApiErrorCode(value)?.endsWith('VERSION_CONFLICT') || getApiErrorCode(value)?.endsWith('STATE_CONFLICT')) { setEditing(null); setRejecting(null); }
    }
  };

  const confirm = async () => {
    if (!review?.length) return;
    setError('');
    const candidates = review.map(candidate => ({ id: candidate.id, version: candidate.version }));
    const fingerprint = JSON.stringify([jobId, candidates]);
    if (confirmKey.current?.fingerprint !== fingerprint) confirmKey.current = { fingerprint, key: createOperationKey('scan-confirm') };
    try {
      const result = await mutations.confirm.mutateAsync({ id: jobId, values: { candidates, operationKey: confirmKey.current.key } });
      setConfirmation(result); setReview(null); setSelected([]);
    } catch (value) { setError(scanningErrorMessage(value)); setReview(null); }
  };

  const retry = async () => {
    setError('');
    if (retryKey.current?.jobId !== jobId) retryKey.current = { jobId, key: createOperationKey('scan-retry') };
    try { await mutations.retry.mutateAsync({ id: jobId, operationKey: retryKey.current.key }); retryKey.current = null; setSelected([]); }
    catch (value) { setError(scanningErrorMessage(value)); }
  };

  const cancel = async () => {
    setError('');
    try { await mutations.cancel.mutateAsync(jobId); setCancelling(false); setSelected([]); }
    catch (value) { setError(scanningErrorMessage(value)); }
  };

  const move = (index: number, offset: number) => setImages(current => {
    const copy = [...current]; [copy[index], copy[index + offset]] = [copy[index + offset], copy[index]]; return copy;
  });

  if (!DEV_SCANS_ENABLED) return <SiteScreen><View className="gap-4 p-5"><Text className="text-xl font-bold text-foreground">{title}</Text><Text className="text-muted-foreground">Chức năng quét chưa khả dụng ở môi trường này.</Text><Link href={'/pantry' as Href} asChild><PrimaryButton label="Về tủ bếp" variant="outline" /></Link></View></SiteScreen>;
  if (!authenticated) return <SiteScreen><View className="gap-4 p-5"><Text className="text-xl font-bold text-foreground">{title}</Text><Link href="/(auth)/login" asChild><PrimaryButton label="Đăng nhập" /></Link></View></SiteScreen>;

  return (
    <SiteScreen>
      <View className="gap-4 px-5 pt-4 pb-8" style={{ width: '100%', maxWidth: 760, alignSelf: 'center' }}>
        <Text className="text-2xl font-bold text-foreground">{title}</Text>
        <Text className="text-sm text-muted-foreground">{SCAN_PROVIDER_MODE === 'fake' ? 'DEV · Kết quả mẫu, không phải nhận diện ảnh thật.' : 'DEV · Provider cấu hình: OpenAI'}</Text>
        {!jobId ? (
          <>
            <Text className="text-sm text-muted-foreground">Ảnh đã chọn: {images.length}/{limit}</Text>
            <View className="flex-row flex-wrap gap-3">
              {images.map((entry, index) => (
                <View key={entry.id} style={{ width: 144 }} className="gap-1">
                  <Image source={{ uri: entry.image.uri }} style={{ width: 144, height: 144, borderRadius: 8 }} contentFit="cover" accessibilityLabel={`Ảnh đã chọn ${index + 1}`} />
                  <View className="flex-row">
                    <Pressable accessibilityRole="button" accessibilityLabel={`Đưa ảnh ${index + 1} lên trước`} disabled={busy || index === 0} onPress={() => move(index, -1)} className="h-12 flex-1 items-center justify-center"><ArrowUp size={18} color={colors.primary} /></Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Đưa ảnh ${index + 1} xuống sau`} disabled={busy || index === images.length - 1} onPress={() => move(index, 1)} className="h-12 flex-1 items-center justify-center"><ArrowDown size={18} color={colors.primary} /></Pressable>
                    <Pressable accessibilityRole="button" accessibilityLabel={`Bỏ ảnh ${index + 1}`} disabled={busy} onPress={() => setImages(current => current.filter(item => item.id !== entry.id))} className="h-12 flex-1 items-center justify-center"><X size={18} color={colors.foreground} /></Pressable>
                  </View>
                </View>
              ))}
            </View>
            <PrimaryButton label="Chọn ảnh" variant="outline" disabled={busy || images.length >= limit} icon={<ImagePlus size={18} color={colors.primary} />} onPress={() => void pick(false)} />
            {Platform.OS !== 'web' ? <PrimaryButton label="Chụp ảnh" variant="outline" disabled={busy || images.length >= limit} icon={<Camera size={18} color={colors.primary} />} onPress={() => void pick(true)} /> : null}
            {permissionDenied ? <PrimaryButton label="Mở cài đặt quyền" variant="outline" onPress={() => void Linking.openSettings()} /> : null}
            {starting ? <Text className="text-sm text-muted-foreground">{progress || 'Đang tạo tác vụ…'}</Text> : null}
            <PrimaryButton label="Bắt đầu quét" disabled={!images.length || picking} loading={starting} onPress={() => void start()} />
          </>
        ) : query.isPending ? <LoadingState /> : query.isError ? <ErrorState description={scanningErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : job ? (
          <ScanResults job={job} busy={busy} selected={selected.filter(id => job.candidates.some(candidate => candidate.id === id && canSelectCandidate(candidate)))}
            onSelect={(candidate, checked) => setSelected(current => checked ? [...new Set([...current, candidate.id])] : current.filter(id => id !== candidate.id))}
            onEdit={candidate => { setError(''); setEditing(candidate); }}
            onReject={candidate => { setError(''); setRejecting(candidate); }}
            onRetry={() => void retry()} onCancel={() => { setError(''); setCancelling(true); }}
            onConfirm={() => { setError(''); setReview(job.candidates.filter(candidate => selected.includes(candidate.id) && canSelectCandidate(candidate))); }} />
        ) : null}
        {confirmation ? <View className="gap-2"><Text className="font-semibold text-foreground">Đã cập nhật tủ bếp</Text>{confirmation.changes.map(change => <Text key={change.candidateId} className="text-sm text-foreground">{change.action === 'CREATED' ? 'Đã thêm' : 'Đã cập nhật'}: {change.name} · {change.quantity} {change.unit}</Text>)}</View> : null}
        {error ? <Text accessibilityRole="alert" className="text-sm text-destructive">{error}</Text> : null}
        {jobId ? <PrimaryButton label="Quét ảnh mới" variant="outline" disabled={busy || (job && !['CONFIRMED', 'CANCELLED', 'FAILED'].includes(job.status))} onPress={() => { router.setParams({ jobId: '' }); setImages([]); setSelected([]); setConfirmation(null); setError(''); }} /> : null}
        <Link href={'/pantry' as Href} asChild><PrimaryButton label="Về tủ bếp" variant="outline" disabled={busy} /></Link>
      </View>
      {editing ? <CandidateEditor key={`${editing.id}:${editing.version}`} candidate={editing} kind={kind} error={error} busy={mutations.edit.isPending} onClose={() => setEditing(null)} onSave={values => void save(editing, values)} /> : null}
      {review ? <FormSheet title="Xác nhận nhập tủ bếp" busy={mutations.confirm.isPending} onClose={() => setReview(null)}>{review.map(candidate => <Text key={candidate.id} className="text-sm text-foreground">{candidate.name} · {candidate.quantity} {candidate.unit}</Text>)}<PrimaryButton label="Xác nhận nhập" disabled={!review.length} loading={mutations.confirm.isPending} onPress={() => void confirm()} /></FormSheet> : null}
      {cancelling ? <FormSheet title="Hủy tác vụ này?" busy={mutations.cancel.isPending} onClose={() => setCancelling(false)}><Text className="text-sm text-muted-foreground">Ảnh đã tải lên vẫn được tính vào dung lượng tài khoản.</Text>{error ? <Text className="text-sm text-destructive">{error}</Text> : null}<PrimaryButton label="Xác nhận hủy" loading={mutations.cancel.isPending} onPress={() => void cancel()} /></FormSheet> : null}
      {rejecting ? <FormSheet title="Loại bỏ nguyên liệu?" busy={mutations.edit.isPending} onClose={() => setRejecting(null)}><Text className="text-sm text-foreground">{rejecting.name}</Text>{error ? <Text className="text-sm text-destructive">{error}</Text> : null}<PrimaryButton label="Xác nhận loại bỏ" loading={mutations.edit.isPending} onPress={() => void save(rejecting, { expectedVersion: rejecting.version, name: rejecting.name, ingredientId: rejecting.ingredient?.id ?? null, quantity: rejecting.quantity, unit: rejecting.unit, freshness: rejecting.freshness, decision: 'REJECT' }, true)} /></FormSheet> : null}
    </SiteScreen>
  );
}
