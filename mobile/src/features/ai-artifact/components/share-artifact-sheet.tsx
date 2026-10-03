import * as React from 'react';
import { Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { Globe, Send, Undo2, X } from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { useSubmitAiArtifactMutation, useUpdateAiArtifactVisibilityMutation } from '../queries/ai-artifact.queries';
import type { AiArtifact } from '../types/ai-artifact.model';
import { getAiArtifactErrorMessage } from '../utils/ai-artifact-errors';

/**
 * Bảng điều khiển chia sẻ của chủ sở hữu: bật công khai (cần xác nhận), thu hồi, gửi thẩm định.
 * Mọi thay đổi gửi kèm `expectedLifecycleVersion`; backend từ chối nếu không phải chủ sở hữu.
 */
export function ShareArtifactPanel({ initial }: { initial: AiArtifact }) {
  const colors = useIconColors();
  const visibilityMutation = useUpdateAiArtifactVisibilityMutation();
  const submitMutation = useSubmitAiArtifactMutation();
  const [artifact, setArtifact] = React.useState(initial);
  const [acknowledged, setAcknowledged] = React.useState(false);
  const [message, setMessage] = React.useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  React.useEffect(() => {
    setArtifact(initial);
  }, [initial]);

  const setVisibility = async (visibility: 'PUBLIC' | 'PRIVATE') => {
    setMessage(null);
    if (visibility === 'PUBLIC' && !acknowledged) {
      setMessage({ tone: 'error', text: 'Vui lòng xác nhận trước khi chia sẻ công khai.' });
      return;
    }
    try {
      const updated = await visibilityMutation.mutateAsync({
        id: artifact.id,
        visibility,
        expectedLifecycleVersion: artifact.lifecycleVersion,
      });
      setArtifact(updated);
      setAcknowledged(false);
      setMessage({
        tone: 'success',
        text: updated.isPublic ? 'Đã bật chia sẻ công khai.' : 'Đã thu hồi chia sẻ, bản ghi về chế độ riêng tư.',
      });
    } catch (error) {
      setMessage({ tone: 'error', text: getAiArtifactErrorMessage(error) });
    }
  };

  const submitForReview = async () => {
    setMessage(null);
    try {
      const updated = await submitMutation.mutateAsync({ id: artifact.id, expectedLifecycleVersion: artifact.lifecycleVersion });
      setArtifact(updated);
      setMessage({ tone: 'success', text: 'Đã gửi tới hàng đợi thẩm định của Người đóng góp.' });
    } catch (error) {
      setMessage({ tone: 'error', text: getAiArtifactErrorMessage(error) });
    }
  };

  const busy = visibilityMutation.isPending || submitMutation.isPending;

  return (
    <View className="gap-4">
      <View className="rounded-2xl border border-border bg-card p-3.5">
        <Text className="text-sm font-bold text-foreground">{artifact.title}</Text>
        <Text className="mt-1 text-xs text-muted-foreground">
          {artifact.isPublic ? 'Đang công khai' : 'Riêng tư'}
          {artifact.isSubmitted ? ' · đã gửi thẩm định' : ''}
        </Text>
      </View>

      {artifact.isPublic ? (
        <>
          <View className="rounded-xl border border-amber-300 bg-amber-50 p-3">
            <Text className="text-xs leading-relaxed text-amber-900">
              Lưu ý quyền riêng tư: toàn bộ lịch sử trò chuyện hoặc ảnh gốc không được chia sẻ, chỉ nội dung trích xuất này hiển thị
              trong mục Tri thức AI.
            </Text>
          </View>
          {!artifact.isSubmitted ? (
            <PrimaryButton
              label={submitMutation.isPending ? 'Đang gửi...' : 'Gửi thẩm định'}
              loading={submitMutation.isPending}
              disabled={busy}
              icon={<Send size={15} color={colors.primaryForeground} />}
              onPress={() => void submitForReview()}
            />
          ) : null}
          <PrimaryButton
            label={visibilityMutation.isPending ? 'Đang xử lý...' : 'Thu hồi chia sẻ'}
            loading={visibilityMutation.isPending}
            variant="outline"
            disabled={busy}
            icon={<Undo2 size={15} color={colors.foreground} />}
            onPress={() => void setVisibility('PRIVATE')}
          />
        </>
      ) : (
        <>
          <Pressable onPress={() => setAcknowledged((value) => !value)} className="flex-row items-start gap-3 rounded-2xl border border-border p-3">
            <Switch value={acknowledged} onValueChange={setAcknowledged} />
            <Text className="flex-1 text-xs leading-relaxed text-foreground">
              Tôi hiểu nội dung trích xuất này sẽ được công khai cho cộng đồng và có thể được Người đóng góp thẩm định.
            </Text>
          </Pressable>
          <PrimaryButton
            label={visibilityMutation.isPending ? 'Đang xử lý...' : 'Bật chia sẻ công khai'}
            loading={visibilityMutation.isPending}
            disabled={!acknowledged || busy}
            icon={<Globe size={15} color={colors.primaryForeground} />}
            onPress={() => void setVisibility('PUBLIC')}
          />
        </>
      )}

      {message ? <Text className={message.tone === 'error' ? 'text-sm text-destructive' : 'text-sm text-primary'}>{message.text}</Text> : null}
    </View>
  );
}

/** Hộp thoại quản lý chia sẻ của một bản ghi đã có. */
export function ShareArtifactSheet({ artifact, visible, onClose }: { artifact: AiArtifact; visible: boolean; onClose: () => void }) {
  const colors = useIconColors();
  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Đóng" />
        <View className="max-h-[85%] rounded-t-3xl bg-background px-5 pb-6 pt-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">Quản lý chia sẻ</Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">
                Chỉ chủ sở hữu bản ghi mới thay đổi được chế độ chia sẻ.
              </Text>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Đóng" className="h-9 w-9 items-center justify-center rounded-full bg-muted">
              <X size={16} color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView className="mt-4" contentContainerClassName="pb-2">
            <ShareArtifactPanel initial={artifact} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
