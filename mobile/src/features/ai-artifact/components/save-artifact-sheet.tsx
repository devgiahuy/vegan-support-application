import * as React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Bookmark, Lock, X } from 'lucide-react-native';

import type { AiArtifactType } from '@/common/enums';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { SUMMARY_MAX, SUMMARY_MIN, TITLE_MAX, TITLE_MIN } from '../mappers/ai-artifact.mapper';
import { useCreateAiArtifactMutation } from '../queries/ai-artifact.queries';
import type { AiArtifact } from '../types/ai-artifact.model';
import { getAiArtifactErrorMessage } from '../utils/ai-artifact-errors';
import { ShareArtifactPanel } from './share-artifact-sheet';

interface SaveArtifactSheetProps {
  visible: boolean;
  type: AiArtifactType;
  sourceId: string;
  defaultTitle: string;
  defaultSummary: string;
  onClose: () => void;
}

/**
 * Lưu đầu ra AI thành "Tri thức AI" bất biến (riêng tư), rồi chuyển sang bước chia sẻ công khai/gửi thẩm định —
 * đồng bộ luồng `SaveArtifactDialog` → `ShareArtifactDialog` của web.
 */
export function SaveArtifactSheet({ visible, type, sourceId, defaultTitle, defaultSummary, onClose }: SaveArtifactSheetProps) {
  const colors = useIconColors();
  const createMutation = useCreateAiArtifactMutation();

  const [title, setTitle] = React.useState(defaultTitle);
  const [summary, setSummary] = React.useState(defaultSummary);
  const [anonymous, setAnonymous] = React.useState(true);
  const [artifact, setArtifact] = React.useState<AiArtifact | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setTitle(defaultTitle);
      setSummary(defaultSummary);
      setAnonymous(true);
      setArtifact(null);
      setError(null);
    }
  }, [visible, defaultTitle, defaultSummary]);

  if (!visible) return null;

  const save = async () => {
    setError(null);
    const titleLength = title.trim().length;
    const summaryLength = summary.trim().length;
    if (titleLength < TITLE_MIN || titleLength > TITLE_MAX) {
      setError(`Tiêu đề cần từ ${TITLE_MIN} đến ${TITLE_MAX} ký tự.`);
      return;
    }
    if (summaryLength < SUMMARY_MIN || summaryLength > SUMMARY_MAX) {
      setError(`Tóm tắt cần từ ${SUMMARY_MIN} đến ${SUMMARY_MAX} ký tự.`);
      return;
    }
    try {
      setArtifact(await createMutation.mutateAsync({ type, sourceId, title, summary, authorAnonymous: anonymous }));
    } catch (err) {
      setError(getAiArtifactErrorMessage(err, 'Không thể lưu tri thức AI. Vui lòng thử lại.'));
    }
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Đóng" />
        <View className="max-h-[88%] rounded-t-3xl bg-background px-5 pb-6 pt-4">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-foreground">{artifact ? 'Đã lưu tri thức AI' : 'Lưu thành tri thức AI'}</Text>
              <Text className="mt-0.5 text-xs text-muted-foreground">
                {artifact
                  ? 'Bản ghi đang ở chế độ riêng tư. Bạn có thể chia sẻ công khai hoặc gửi thẩm định.'
                  : 'Đóng gói kết quả AI thành một bản ghi bất biến để xem lại hoặc chia sẻ cho cộng đồng.'}
              </Text>
            </View>
            <Pressable onPress={onClose} accessibilityLabel="Đóng" className="h-9 w-9 items-center justify-center rounded-full bg-muted">
              <X size={16} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView className="mt-4" contentContainerClassName="gap-4 pb-2" keyboardShouldPersistTaps="handled">
            {artifact ? (
              <>
                <ShareArtifactPanel initial={artifact} />
                <PrimaryButton label="Xong" variant="outline" onPress={onClose} />
              </>
            ) : (
              <>
                <View>
                  <Text className="mb-1.5 text-sm font-semibold text-foreground">Tiêu đề tri thức</Text>
                  <TextInput
                    value={title}
                    onChangeText={setTitle}
                    maxLength={TITLE_MAX}
                    placeholder="VD: Bổ sung canxi và sắt cho người ăn chay thuần"
                    placeholderTextColor={colors.mutedForeground}
                    className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
                  />
                </View>
                <View>
                  <Text className="mb-1.5 text-sm font-semibold text-foreground">Tóm tắt ngắn gọn</Text>
                  <TextInput
                    value={summary}
                    onChangeText={setSummary}
                    multiline
                    maxLength={SUMMARY_MAX}
                    placeholder="Tóm lược ý chính hoặc bối cảnh cần lưu ý..."
                    placeholderTextColor={colors.mutedForeground}
                    className="min-h-24 rounded-2xl border border-input bg-card px-3.5 py-3 text-sm text-foreground"
                    textAlignVertical="top"
                  />
                </View>
                <View className="flex-row items-start gap-3 rounded-2xl border border-border p-3">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">Ẩn danh tác giả khi chia sẻ</Text>
                    <Text className="mt-0.5 text-xs text-muted-foreground">
                      Tên của bạn hiển thị là &quot;Thành viên ẩn danh&quot; để bảo vệ quyền riêng tư.
                    </Text>
                  </View>
                  <Switch value={anonymous} onValueChange={setAnonymous} />
                </View>
                <View className="flex-row items-center gap-2 rounded-xl bg-muted/60 p-2.5">
                  <Lock size={14} color={colors.mutedForeground} />
                  <Text className="flex-1 text-xs text-muted-foreground">
                    Sau khi lưu, bản ghi ở chế độ Riêng tư. Bạn có thể bật chia sẻ công khai bất cứ lúc nào.
                  </Text>
                </View>
                {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
                <PrimaryButton
                  label={createMutation.isPending ? 'Đang lưu...' : 'Lưu tri thức AI'}
                  loading={createMutation.isPending}
                  icon={<Bookmark size={15} color={colors.primaryForeground} />}
                  onPress={() => void save()}
                />
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
