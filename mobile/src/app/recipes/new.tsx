import * as React from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { PlusCircle, Send, Trash2 } from 'lucide-react-native';

import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { CategoryType, RecipeDifficulty } from '@/common/enums';
import { CategoryFilterPills } from '@/features/category/components/category-filter-pills';
import { useCategoryTreeQuery } from '@/features/category/queries/category.queries';
import { useCreateRecipeMutation } from '@/features/recipe/queries/recipe.queries';
import type { CreateRecipeIngredientInput } from '@/features/recipe/api/recipe.api';
import { getApiErrorMessage } from '@/lib/api-error';
import { cn } from '@/lib/utils';
import { useIconColors } from '@/lib/theme-colors';
import { useAuthStore } from '@/store/useAuthStore';

const DIFFICULTY_OPTIONS: { value: RecipeDifficulty; label: string }[] = [
  { value: RecipeDifficulty.EASY, label: 'Dễ' },
  { value: RecipeDifficulty.MEDIUM, label: 'Trung bình' },
  { value: RecipeDifficulty.HARD, label: 'Nâng cao' },
];

function splitTags(value: string): string[] {
  return value.split(',').map((t) => t.trim()).filter(Boolean).slice(0, 15);
}

interface DraftIngredient extends CreateRecipeIngredientInput {
  key: string;
}

/**
 * Đăng công thức mới — `POST /posts` (type=RECIPE) + `POST /posts/:id/submit` ngay
 * sau đó để gửi duyệt. Chưa hỗ trợ ảnh bìa (cần luồng upload Cloudinary riêng).
 */
export default function CreateRecipeScreen() {
  const colors = useIconColors();
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const createMutation = useCreateRecipeMutation();

  const [title, setTitle] = React.useState('');
  const [excerpt, setExcerpt] = React.useState('');
  const [body, setBody] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string | null>(null);
  const [servings, setServings] = React.useState('4');
  const [prepTime, setPrepTime] = React.useState('15');
  const [cookTime, setCookTime] = React.useState('20');
  const [difficulty, setDifficulty] = React.useState<RecipeDifficulty>(RecipeDifficulty.EASY);
  const [calories, setCalories] = React.useState('');
  const [protein, setProtein] = React.useState('');

  const [ingredients, setIngredients] = React.useState<DraftIngredient[]>([
    { key: '1', displayName: '', amount: 0, unit: '' },
  ]);
  const [ingName, setIngName] = React.useState('');
  const [ingAmount, setIngAmount] = React.useState('');
  const [ingUnit, setIngUnit] = React.useState('');

  const {
    data: categoryTree = [],
    isLoading: isCategoryLoading,
    isError: isCategoryError,
    refetch: refetchCategories,
  } = useCategoryTreeQuery(CategoryType.RECIPE_GROUP);

  React.useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để đăng công thức mới.');
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, router]);

  const addIngredient = () => {
    const name = ingName.trim();
    const amountNum = Number(ingAmount.replace(',', '.'));
    const unit = ingUnit.trim();
    if (!name || !unit || !Number.isFinite(amountNum) || amountNum <= 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập đủ tên, số lượng (>0) và đơn vị nguyên liệu.');
      return;
    }
    setIngredients((prev) => [
      ...prev.filter((i) => i.displayName.trim().length > 0),
      { key: `${Date.now()}`, displayName: name, amount: amountNum, unit },
    ]);
    setIngName('');
    setIngAmount('');
    setIngUnit('');
  };

  const removeIngredient = (key: string) => {
    setIngredients((prev) => prev.filter((i) => i.key !== key));
  };

  const submit = async () => {
    const cleanTitle = title.trim();
    const cleanBody = body.trim();
    const validIngredients = ingredients.filter((i) => i.displayName.trim().length > 0 && i.amount > 0 && i.unit.trim().length > 0);
    const servingsNum = Math.trunc(Number(servings));
    const prepNum = Math.trunc(Number(prepTime));
    const cookNum = Math.trunc(Number(cookTime));

    if (cleanTitle.length < 3) {
      Alert.alert('Thiếu tiêu đề', 'Tiêu đề công thức cần ít nhất 3 ký tự.');
      return;
    }
    if (cleanBody.length < 20) {
      Alert.alert('Thiếu hướng dẫn', 'Cách chế biến cần mô tả ít nhất 20 ký tự.');
      return;
    }
    if (validIngredients.length === 0) {
      Alert.alert('Thiếu nguyên liệu', 'Vui lòng thêm ít nhất một nguyên liệu.');
      return;
    }
    if (!Number.isFinite(servingsNum) || servingsNum < 1) {
      Alert.alert('Khẩu phần chưa hợp lệ', 'Số khẩu phần phải từ 1 trở lên.');
      return;
    }
    if (!Number.isFinite(prepNum) || prepNum < 0 || !Number.isFinite(cookNum) || cookNum < 0) {
      Alert.alert('Thời gian chưa hợp lệ', 'Thời gian chuẩn bị/nấu phải là số không âm.');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        title: cleanTitle,
        excerpt: excerpt.trim() || undefined,
        body: cleanBody,
        categoryIds: categoryId ? [categoryId] : undefined,
        tags: splitTags(tags),
        servings: servingsNum,
        prepTimeMinutes: prepNum,
        cookTimeMinutes: cookNum,
        difficulty,
        nutrition: {
          calories: calories.trim() ? Number(calories) : undefined,
          proteinGrams: protein.trim() ? Number(protein) : undefined,
        },
        ingredients: validIngredients.map(({ displayName, amount, unit }) => ({ displayName, amount, unit })),
      });
      Alert.alert('Đã gửi công thức', 'Công thức đã được gửi cho Ban biên tập kiểm duyệt.');
      router.replace(`/recipes/${created.id}` as Href);
    } catch (error) {
      Alert.alert('Không đăng được công thức', getApiErrorMessage(error, 'Vui lòng kiểm tra dữ liệu và thử lại.'));
    }
  };

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold tracking-tight text-foreground">Đăng công thức mới</Text>

        <View className="gap-4">
          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Tên món</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ví dụ: Cơm gạo lứt đậu hũ nhiều rau"
              placeholderTextColor={colors.mutedForeground}
              className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
            />
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Mô tả ngắn</Text>
            <TextInput
              value={excerpt}
              onChangeText={setExcerpt}
              placeholder="Mô tả ngắn hiển thị ở danh sách"
              placeholderTextColor={colors.mutedForeground}
              className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
            />
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Khẩu phần</Text>
              <TextInput
                value={servings}
                onChangeText={setServings}
                keyboardType="numeric"
                className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Chuẩn bị (phút)</Text>
              <TextInput
                value={prepTime}
                onChangeText={setPrepTime}
                keyboardType="numeric"
                className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Nấu (phút)</Text>
              <TextInput
                value={cookTime}
                onChangeText={setCookTime}
                keyboardType="numeric"
                className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
              />
            </View>
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Độ khó</Text>
            <View className="flex-row gap-2">
              {DIFFICULTY_OPTIONS.map((o) => (
                <Pressable
                  key={o.value}
                  onPress={() => setDifficulty(o.value)}
                  className={cn('flex-1 items-center rounded-xl border px-2 py-2.5', difficulty === o.value ? 'border-primary bg-primary/10' : 'border-input')}>
                  <Text className={cn('text-sm', difficulty === o.value ? 'font-semibold text-primary' : 'text-foreground')}>{o.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View className="flex-row gap-3">
            <View className="flex-1">
              <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Calo (không bắt buộc)</Text>
              <TextInput
                value={calories}
                onChangeText={setCalories}
                keyboardType="numeric"
                placeholder="VD: 420"
                placeholderTextColor={colors.mutedForeground}
                className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
              />
            </View>
            <View className="flex-1">
              <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Đạm (g, không bắt buộc)</Text>
              <TextInput
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
                placeholder="VD: 18"
                placeholderTextColor={colors.mutedForeground}
                className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
              />
            </View>
          </View>

          <View className="gap-2 rounded-2xl border border-dashed border-border p-4">
            <Text className="text-xs font-bold uppercase text-muted-foreground">Nguyên liệu</Text>
            {ingredients.filter((i) => i.displayName.trim().length > 0).length > 0 ? (
              <View className="gap-1.5">
                {ingredients
                  .filter((i) => i.displayName.trim().length > 0)
                  .map((i) => (
                    <View key={i.key} className="flex-row items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
                      <Text className="flex-1 text-xs text-foreground">
                        {i.displayName} — {i.amount} {i.unit}
                      </Text>
                      <Pressable onPress={() => removeIngredient(i.key)}>
                        <Trash2 size={14} color={colors.destructive} />
                      </Pressable>
                    </View>
                  ))}
              </View>
            ) : null}
            <View className="flex-row gap-2">
              <TextInput
                value={ingName}
                onChangeText={setIngName}
                placeholder="Tên nguyên liệu"
                placeholderTextColor={colors.mutedForeground}
                className="flex-1 rounded-xl border border-input bg-background px-2.5 py-2.5 text-sm text-foreground"
              />
              <TextInput
                value={ingAmount}
                onChangeText={setIngAmount}
                placeholder="SL"
                keyboardType="numeric"
                placeholderTextColor={colors.mutedForeground}
                className="w-16 rounded-xl border border-input bg-background px-2.5 py-2.5 text-sm text-foreground"
              />
              <TextInput
                value={ingUnit}
                onChangeText={setIngUnit}
                placeholder="Đơn vị"
                placeholderTextColor={colors.mutedForeground}
                className="w-20 rounded-xl border border-input bg-background px-2.5 py-2.5 text-sm text-foreground"
              />
            </View>
            <PrimaryButton label="Thêm nguyên liệu" variant="outline" icon={<PlusCircle size={16} color={colors.foreground} />} onPress={addIngredient} />
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Cách chế biến</Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              multiline
              placeholder="Mô tả từng bước nấu, mẹo và lưu ý dinh dưỡng..."
              placeholderTextColor={colors.mutedForeground}
              className="min-h-32 rounded-2xl border border-input bg-card px-3.5 py-3 text-sm leading-relaxed text-foreground"
              textAlignVertical="top"
            />
          </View>

          <View>
            <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">Tag</Text>
            <TextInput
              value={tags}
              onChangeText={setTags}
              placeholder="đậu hũ, bữa tối, nhiều rau"
              placeholderTextColor={colors.mutedForeground}
              className="h-12 rounded-2xl border border-input bg-card px-3.5 text-sm text-foreground"
            />
          </View>

          <View className="border-t border-border pt-4">
            <Text className="mb-2 text-xs font-bold uppercase text-muted-foreground">Danh mục</Text>
            {isCategoryLoading ? (
              <View className="h-8 rounded-lg bg-muted" />
            ) : isCategoryError ? (
              <Pressable onPress={() => void refetchCategories()}>
                <Text className="text-sm text-primary underline">Không tải được danh mục. Thử lại.</Text>
              </Pressable>
            ) : categoryTree.length === 0 ? (
              <Text className="text-sm text-muted-foreground">Có thể đăng mà không chọn danh mục.</Text>
            ) : (
              <CategoryFilterPills items={categoryTree} selectedId={categoryId} onSelect={setCategoryId} />
            )}
          </View>
        </View>

        <PrimaryButton
          label={createMutation.isPending ? 'Đang gửi...' : 'Gửi công thức'}
          loading={createMutation.isPending}
          icon={<Send size={16} color={colors.primaryForeground} />}
          onPress={() => void submit()}
        />
      </View>
    </SiteScreen>
  );
}
