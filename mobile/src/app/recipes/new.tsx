import * as React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { Hourglass, ShieldCheck } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { FormSheet } from '@/components/shared/form-sheet';
import { PrimaryButton } from '@/components/ui/primary-button';
import { RecipeForm } from '@/features/recipe/components/recipe-form';
import { useCreateRecipeMutation } from '@/features/recipe/queries/recipe.queries';
import type { Recipe } from '@/features/recipe/types/recipe.model';
import { PostStatus } from '@/common/enums';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Đăng công thức mới — form 5 bước như web; lưu `POST /posts` (type=RECIPE) rồi `POST /posts/:id/submit` ngay sau đó.
 * Lưu được nhưng gửi duyệt lỗi thì chuyển sang màn sửa để gửi lại (như web). Trợ lý AI chỉ có ở màn tạo mới.
 */
export default function CreateRecipeScreen() {
  const router = useRouter();
  const colors = useIconColors();
  const scrollRef = React.useRef<ScrollView>(null);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const createMutation = useCreateRecipeMutation();
  const [created, setCreated] = React.useState<Recipe | null>(null);

  React.useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để đăng công thức mới.');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

  return (
    <SiteScreen scrollRef={scrollRef}>
      <View className="gap-5 px-5 pt-4">
        <View className="gap-1">
          <Text className="text-2xl font-extrabold tracking-tight text-foreground">Đăng công thức món chay</Text>
          <Text className="text-sm leading-5 text-muted-foreground">
            Năm bước ngắn: thông tin món, nguyên liệu, cách nấu, phân loại rồi xem lại. Công thức được Ban biên tập duyệt trước khi xuất bản.
          </Text>
        </View>

        <RecipeForm
          enableAi
          submitLabel="Gửi công thức để duyệt"
          isSubmitting={createMutation.isPending}
          onStepChange={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          onSubmit={async (values) => {
            const result = await createMutation.mutateAsync(values);
            if (result.status === PostStatus.DRAFT) {
              // Đã lưu nháp nhưng chưa gửi duyệt được: sang màn sửa, nơi gửi lại được.
              Alert.alert('Đã lưu bản nháp', 'Công thức đã được lưu nhưng chưa gửi duyệt được. Hãy kiểm tra rồi gửi lại.');
              router.replace(`/recipes/${result.id}/edit` as Href);
              return;
            }
            setCreated(result);
          }}
        />
      </View>

      {created ? (
        <FormSheet title="Gửi công thức thành công!" variant="popup" onClose={() => router.replace(`/recipes/${created.id}` as Href)}>
          <View className="items-center gap-3">
            <View className="size-14 items-center justify-center rounded-2xl bg-amber-500/15">
              <Hourglass size={28} color={colors.cta} />
            </View>
            <Text className="text-center text-sm leading-5 text-muted-foreground">
              Công thức <Text className="font-bold text-foreground">{created.title}</Text> đã được ghi nhận và đang ở trạng thái{' '}
              <Text className="font-semibold text-amber-700 dark:text-amber-400">Chờ kiểm duyệt</Text>.
            </Text>
          </View>
          <View className="gap-1.5 rounded-2xl border border-border bg-muted/50 p-4">
            <View className="flex-row items-center gap-1.5">
              <ShieldCheck size={15} color={colors.primary} />
              <Text className="text-sm font-semibold text-foreground">Tiêu chuẩn chất lượng thuần thực vật</Text>
            </View>
            <Text className="text-xs leading-5 text-muted-foreground">
              Nhằm đảm bảo 100% nguyên liệu thuần chay, dinh dưỡng an toàn và định lượng chính xác, công thức sẽ được Ban biên tập thẩm định trước khi xuất bản công khai.
            </Text>
          </View>
          <PrimaryButton label="Xem công thức" onPress={() => router.replace(`/recipes/${created.id}` as Href)} />
          <PrimaryButton label="Bài viết của tôi" variant="outline" onPress={() => router.replace('/my-content' as Href)} />
        </FormSheet>
      ) : null}
    </SiteScreen>
  );
}
