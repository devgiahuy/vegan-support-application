import { AllowanceNotice } from '@/features/billing/components/allowance-notice';
import * as React from 'react';
import { Linking, Platform, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
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
import { useAuthStore } from '@/store/useAuthStore';
import { DEV_SCANS_ENABLED, SCAN_PROVIDER_MODE } from '../lib/scan-access';
import { isScanDraftDirty, parseScanDraft, type ScanDraft } from '../lib/scan-draft';
import { scanningErrorMessage } from '../lib/scanning-errors';
import { useScanJobQuery, useScanMutations } from '../queries/scanning.queries';
import { canEditScan, type CandidateEdit, type ScanCandidate, type ScanConfirmation, type ScanKind } from '../types/scanning.model';
import { CandidateEditor } from './candidate-editor';
import { FreshnessBanner, ScanIntro, ScanUploadStage } from './scan-upload-stage';
import { ScanReview } from './scan-review';

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
  const [editing, setEditing] = React.useState<ScanCandidate | null>(null);
  const [cancelling, setCancelling] = React.useState(false);
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
      setConfirmation(null); setProgress('');
    } catch (value) { setError(creating ? scanningErrorMessage(value) : storageErrorMessage(value)); }
    finally { setStarting(false); }
  };

  const save = async (candidate: ScanCandidate, values: CandidateEdit) => {
    setError('');
    try {
      await mutations.edit.mutateAsync({ id: jobId, candidateId: candidate.id, values });
      setEditing(null);
    } catch (value) {
      setError(scanningErrorMessage(value));
      if (getApiErrorCode(value)?.endsWith('VERSION_CONFLICT') || getApiErrorCode(value)?.endsWith('STATE_CONFLICT')) { setEditing(null); }
    }
  };

  const saveReview = async (drafts: ScanDraft[]) => {
    if (!job) return;
    setError('');
    const active = drafts.filter(draft => !draft.rejected);
    if (!active.length) { setError('Vui lòng giữ lại ít nhất một ' + (kind === 'fridge' ? 'nguyên liệu' : 'mặt hàng thực phẩm') + ' để lưu vào Tủ bếp.'); return; }
    try {
      const entries = drafts.map(draft => {
        const candidate = job.candidates.find(item => item.id === draft.id);
        if (!candidate) throw new Error('Danh sách nguyên liệu đã thay đổi. Vui lòng thử lại.');
        return { draft, candidate, values: draft.rejected && !isScanDraftDirty(draft) ? null : parseScanDraft(draft, candidate, candidate.version) };
      });
      const versions = new Map(job.candidates.map(candidate => [candidate.id, candidate.version]));
      for (const { draft, candidate, values } of entries) {
        if (!values || !isScanDraftDirty(draft)) continue;
        const updated = await mutations.edit.mutateAsync({ id: jobId, candidateId: candidate.id, values: { ...values, expectedVersion: versions.get(candidate.id) ?? candidate.version } });
        const next = updated.candidates.find(item => item.id === candidate.id);
        if (next) versions.set(candidate.id, next.version);
      }
      const candidates = active.map(draft => ({ id: draft.id, version: versions.get(draft.id) ?? draft.version }));
      const fingerprint = JSON.stringify([jobId, candidates]);
      if (confirmKey.current?.fingerprint !== fingerprint) confirmKey.current = { fingerprint, key: createOperationKey('scan-confirm') };
      const result = await mutations.confirm.mutateAsync({ id: jobId, values: { candidates, operationKey: confirmKey.current.key } });
      setConfirmation(result);
    } catch (value) { setError(value instanceof Error && !getApiErrorCode(value) ? value.message : scanningErrorMessage(value)); }
  };

  const retry = async () => {
    setError('');
    if (retryKey.current?.jobId !== jobId) retryKey.current = { jobId, key: createOperationKey('scan-retry') };
    try { await mutations.retry.mutateAsync({ id: jobId, operationKey: retryKey.current.key }); retryKey.current = null; }
    catch (value) { setError(scanningErrorMessage(value)); }
  };

  const cancel = async () => {
    setError('');
    try { await mutations.cancel.mutateAsync(jobId); setCancelling(false); }
    catch (value) { setError(scanningErrorMessage(value)); }
  };

  const move = (index: number, offset: number) => setImages(current => {
    const copy = [...current]; [copy[index], copy[index + offset]] = [copy[index + offset], copy[index]]; return copy;
  });

  if (!DEV_SCANS_ENABLED) return <SiteScreen><View className="gap-4 p-5"><Text className="text-xl font-bold text-foreground">{title}</Text><Text className="text-muted-foreground">Chức năng quét chưa khả dụng ở môi trường này.</Text></View></SiteScreen>;
  if (!authenticated) return <SiteScreen><View className="gap-4 p-5"><Text className="text-xl font-bold text-foreground">{title}</Text><Link href="/(auth)/login" asChild><PrimaryButton label="Đăng nhập" /></Link></View></SiteScreen>;

  return (
    <SiteScreen>
      <View className="gap-4 px-5 pt-4 pb-8" style={{ width: '100%', maxWidth: 760, alignSelf: 'center' }}>
        <AllowanceNotice feature={kind === 'fridge' ? 'FRIDGE' : 'RECEIPT'} />
        {kind === 'fridge' ? <FreshnessBanner disclaimer={job?.disclaimer} /> : null}
        {jobId ? <Text className="text-2xl font-bold text-foreground">{title}</Text> : <ScanIntro kind={kind} />}
        <Text className="text-sm text-muted-foreground">{SCAN_PROVIDER_MODE === 'fake' ? 'DEV · Kết quả mẫu, không phải nhận diện ảnh thật.' : 'DEV · Provider cấu hình: OpenAI'}</Text>
        {!jobId ? (
          <ScanUploadStage kind={kind} limit={limit} busy={busy} starting={starting} progress={progress} permissionDenied={permissionDenied}
            images={images.map(entry => ({ id: entry.id, uri: entry.image.uri, name: entry.image.name, bytes: entry.image.bytes }))}
            onPick={camera => void pick(camera)} onMove={move} onRemove={id => setImages(current => current.filter(item => item.id !== id))}
            onClear={() => setImages([])} onStart={() => void start()} onOpenSettings={() => void Linking.openSettings()} />
        ) : query.isPending ? <LoadingState /> : query.isError ? <ErrorState description={scanningErrorMessage(query.error)} onRetry={() => void query.refetch()} /> : job ? (
          <ScanReview job={job} busy={busy} error={error}
            onSave={drafts => void saveReview(drafts)}
            onEdit={candidate => { setError(''); setEditing(candidate); }}
            onRetry={() => void retry()} onCancel={() => { setError(''); setCancelling(true); }} />
        ) : null}
        {confirmation ? <View className="gap-2"><Text className="font-semibold text-foreground">Đã cập nhật tủ bếp</Text>{confirmation.changes.map(change => <Text key={change.candidateId} className="text-sm text-foreground">{change.action === 'CREATED' ? 'Đã thêm' : 'Đã cập nhật'}: {change.name} · {change.quantity} {change.unit}</Text>)}</View> : null}
        {error && !(job && canEditScan(job)) ? <Text accessibilityRole="alert" className="text-sm text-destructive">{error}</Text> : null}
        {jobId ? <PrimaryButton label="Quét ảnh mới" variant="outline" disabled={busy || (job && !['CONFIRMED', 'CANCELLED', 'FAILED'].includes(job.status))} onPress={() => { router.setParams({ jobId: '' }); setImages([]); setConfirmation(null); setError(''); }} /> : null}
      </View>
      {editing ? <CandidateEditor key={`${editing.id}:${editing.version}`} candidate={editing} kind={kind} error={error} busy={mutations.edit.isPending} onClose={() => setEditing(null)} onSave={values => void save(editing, values)} /> : null}
      {cancelling ? <FormSheet title="Hủy tác vụ này?" busy={mutations.cancel.isPending} onClose={() => setCancelling(false)} variant="popup"><Text className="text-sm text-muted-foreground">Ảnh đã tải lên vẫn được tính vào dung lượng tài khoản.</Text>{error ? <Text className="text-sm text-destructive">{error}</Text> : null}<PrimaryButton label="Xác nhận hủy" loading={mutations.cancel.isPending} onPress={() => void cancel()} /></FormSheet> : null}
    </SiteScreen>
  );
}
