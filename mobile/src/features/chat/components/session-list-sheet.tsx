import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  StyleSheet,
} from "react-native";
import { Link, type Href } from "expo-router";
import {
  Compass,
  LogIn,
  MessageSquare,
  MessagesSquare,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react-native";

import { LoadMoreButton } from "@/components/shared/load-more-button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useIconColors } from "@/lib/theme-colors";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/useAuthStore";
import { getApiErrorCode } from "@/lib/api-error";
import {
  useChatSessionsQuery,
  useDeleteChatSessionMutation,
} from "../queries/chat.queries";
import type { ChatSession } from "../types/chat.model";

const POPULAR_TOPICS = [
  "Thực đơn tuần",
  "Bổ sung Đạm",
  "Thiếu máu B12",
  "Món thanh nhiệt",
  "Ăn chay giảm cân",
];

/**
 * Danh sách phiên chat dạng bottom sheet (thay cho sidebar của web): khi đã đăng nhập hiện các phiên gần đây;
 * khách thấy thẻ mời đăng nhập để lưu lịch sử cùng các chủ đề phổ biến.
 */
export function SessionListSheet({
  visible,
  activeId,
  creating,
  onSelect,
  onNewChat,
  onClose,
  onDelete,
  isStreaming = false,
}: {
  visible: boolean;
  activeId: string;
  creating: boolean;
  onSelect: (sessionId: string) => void;
  onNewChat: () => void;
  onClose: () => void;
  onDelete: (sessionId: string) => void;
  isStreaming?: boolean;
}) {
  const colors = useIconColors();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const sessionsQuery = useChatSessionsQuery();
  const deleteSession = useDeleteChatSessionMutation();
  const sessions =
    sessionsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const confirmDelete = (session: ChatSession) => {
    Alert.alert(
      "Xóa cuộc trò chuyện?",
      `“${session.title}” sẽ biến mất khỏi lịch sử và không thể mở lại. Nội dung vẫn được lưu trên máy chủ theo chính sách lưu trữ.`,
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa khỏi lịch sử",
          style: "destructive",
          onPress: () => {
            void deleteSession.mutateAsync(session.id).then(
              ({ id }) => onDelete(id),
              (error: unknown) => {
                const code = getApiErrorCode(error);
                const message =
                  code === "CHAT_SESSION_BUSY"
                    ? "Cuộc trò chuyện đang trả lời. Vui lòng chờ hoàn tất rồi thử lại."
                    : code === "NOT_FOUND"
                      ? "Cuộc trò chuyện không còn trong lịch sử hoặc không thuộc tài khoản này."
                      : code === "AUTH_REQUIRED" ||
                          code === "INVALID_ACCESS_TOKEN" ||
                          code === "TOKEN_EXPIRED"
                        ? "Vui lòng đăng nhập lại."
                        : code === "ACCOUNT_BANNED"
                          ? "Tài khoản hiện không thể thực hiện thao tác này."
                          : code === "VALIDATION_ERROR"
                            ? "Mã cuộc trò chuyện không hợp lệ."
                            : "Vui lòng kiểm tra kết nối và thử lại.";
                Alert.alert("Không thể xóa cuộc trò chuyện", message);
                if (code === "NOT_FOUND") void sessionsQuery.refetch();
              },
            );
          },
        },
      ],
    );
  };

  if (!visible) return null;

  return (
    <Modal
      visible
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-5">
        <Pressable
          accessibilityLabel="Đóng"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View className="w-full max-w-md max-h-[80%] rounded-3xl border border-border bg-background p-5">
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-base font-bold text-foreground">
              Đoạn chat
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityLabel="Đóng"
              className="h-9 w-9 items-center justify-center rounded-full bg-muted"
            >
              <X size={16} color={colors.foreground} />
            </Pressable>
          </View>

          <View className="mt-3">
            <PrimaryButton
              label={creating ? "Đang tạo..." : "Đoạn chat mới"}
              loading={creating}
              icon={<Plus size={16} color={colors.primaryForeground} />}
              onPress={onNewChat}
            />
          </View>

          <ScrollView className="mt-3" contentContainerClassName="gap-2 pb-2">
            {!isAuthenticated ? (
              <>
                <View className="gap-1 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <View className="h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <Sparkles size={16} color={colors.primary} />
                  </View>
                  <Text className="mt-1.5 text-sm font-semibold text-foreground">
                    Lưu giữ lịch sử tư vấn
                  </Text>
                  <Text className="text-xs leading-relaxed text-muted-foreground">
                    Đăng nhập để xem lại các cuộc trò chuyện trước đây và đồng
                    bộ mục tiêu dinh dưỡng cá nhân.
                  </Text>
                  <View className="mt-2.5">
                    <Link href={"/(auth)/login" as Href} asChild>
                      <PrimaryButton
                        label="Đăng nhập ngay"
                        icon={
                          <LogIn size={15} color={colors.primaryForeground} />
                        }
                      />
                    </Link>
                  </View>
                </View>
                <View className="gap-2 pt-2">
                  <View className="flex-row items-center gap-1.5">
                    <Compass size={12} color={colors.mutedForeground} />
                    <Text className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Chủ đề phổ biến
                    </Text>
                  </View>
                  <View className="flex-row flex-wrap gap-1.5">
                    {POPULAR_TOPICS.map((topic) => (
                      <View
                        key={topic}
                        className="rounded-lg border border-border bg-card px-2.5 py-1"
                      >
                        <Text className="text-[11px] text-muted-foreground">
                          {topic}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : sessionsQuery.isLoading ? (
              <Text className="py-4 text-center text-xs text-muted-foreground">
                Đang tải danh sách phiên...
              </Text>
            ) : sessionsQuery.isError ? (
              <Text className="py-4 text-center text-xs text-muted-foreground">
                Không tải được danh sách phiên.
              </Text>
            ) : sessions.length === 0 ? (
              <View className="items-center py-6">
                <MessagesSquare size={24} color={colors.mutedForeground} />
                <Text className="mt-2 text-xs text-muted-foreground">
                  Chưa có đoạn chat nào.
                </Text>
              </View>
            ) : (
              sessions.map((session) => {
                const active = session.id === activeId;
                return (
                  <View
                    key={session.id}
                    className={cn(
                      "flex-row items-center rounded-xl border",
                      active
                        ? "border-primary/30 bg-primary/10"
                        : "border-transparent bg-card",
                    )}
                  >
                    <Pressable
                      onPress={() => onSelect(session.id)}
                      className="min-w-0 flex-1 flex-row items-center gap-2.5 px-3 py-3"
                    >
                      <MessageSquare
                        size={14}
                        color={active ? colors.primary : colors.mutedForeground}
                      />
                      <Text
                        numberOfLines={1}
                        className={cn(
                          "flex-1 text-sm",
                          active
                            ? "font-semibold text-primary"
                            : "text-foreground",
                        )}
                      >
                        {session.title}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => confirmDelete(session)}
                      disabled={
                        deleteSession.isPending || (active && isStreaming)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`Xóa cuộc trò chuyện ${session.title}`}
                      accessibilityHint={
                        active && isStreaming
                          ? "Chờ câu trả lời hoàn tất"
                          : undefined
                      }
                      className="h-11 w-11 items-center justify-center"
                      style={{
                        opacity:
                          deleteSession.isPending || (active && isStreaming)
                            ? 0.4
                            : 1,
                      }}
                    >
                      <Trash2 size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                );
              })
            )}
            {isAuthenticated ? (
              <LoadMoreButton
                hasNextPage={sessionsQuery.hasNextPage}
                isFetchingNextPage={sessionsQuery.isFetchingNextPage}
                onPress={() => void sessionsQuery.fetchNextPage()}
              />
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
