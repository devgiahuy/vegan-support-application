import { RecipeDifficulty } from '@/common/enums';
import { bodyToSteps } from '../mappers/recipe.mapper';
import type { RecipeFormValues } from '../schemas/recipe-form.schema';
import type { Recipe } from '../types/recipe.model';

/** Giá trị form → domain `Recipe` truyền cho `recipeMapper.toCreateDto/toUpdateDto`. */
export function recipeFormToRecipe(values: RecipeFormValues): Partial<Recipe> {
  return {
    title: values.title,
    category: values.categoryId,
    coverImageUrl: values.coverImageUrl || '',
    coverMedia: values.coverMedia ?? null,
    difficulty: values.difficulty,
    servings: values.servings,
    prepTimeMinutes: values.prepTimeMinutes,
    cookTimeMinutes: values.cookTimeMinutes,
    description: values.description || '',
    ingredients: values.ingredients.map((ing) => ({
      ingredientId: ing.ingredientId ?? null,
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      notes: '',
    })),
    steps: values.steps.map((st, idx) => ({
      stepNumber: idx + 1,
      instruction: st.instruction,
      imageUrl: st.imageUrl || null,
    })),
  };
}

/**
 * Domain `Recipe` → giá trị ban đầu của form sửa.
 * Mô tả lấy từ `excerpt` (`description`), các bước tách từ `body` — trước đây
 * form nạp cả `body` vào ô mô tả nên nội dung các bước bị hiển thị lặp.
 */
export function recipeToFormValues(recipe: Recipe): Partial<RecipeFormValues> {
  const categoryId =
    typeof recipe.category === 'string' ? recipe.category : recipe.category?.id || '';

  const difficulty = Object.values(RecipeDifficulty).includes(recipe.difficulty as RecipeDifficulty)
    ? (recipe.difficulty as RecipeDifficulty)
    : RecipeDifficulty.MEDIUM;

  const structuredSteps = (recipe.steps || [])
    .map((st) => ({
      stepNumber: st.stepNumber,
      instruction:
        ('instruction' in st && st.instruction ? st.instruction : '') ||
        ('desc' in st && st.desc ? st.desc : ''),
      imageUrl: st.imageUrl || null,
    }))
    .filter((st) => st.instruction);
  const steps =
    structuredSteps.length > 0
      ? structuredSteps
      : bodyToSteps(recipe.body).map((st) => ({ ...st, imageUrl: null }));

  return {
    title: recipe.title,
    categoryId,
    coverImageUrl: recipe.coverImageUrl || '',
    coverMedia:
      recipe.coverMedia?.publicId &&
      recipe.coverMedia?.mimeType &&
      typeof recipe.coverMedia?.bytes === 'number'
        ? {
            publicId: recipe.coverMedia.publicId,
            mimeType: recipe.coverMedia.mimeType,
            bytes: recipe.coverMedia.bytes,
          }
        : null,
    difficulty,
    servings: recipe.servings || 2,
    prepTimeMinutes: recipe.prepTimeMinutes ?? 15,
    cookTimeMinutes: recipe.cookTimeMinutes ?? 20,
    description: recipe.description || '',
    ingredients: (recipe.ingredients || []).map((ing) => ({
      ingredientId: ing.ingredientId ?? null,
      name: ing.name,
      amount: typeof ing.amount === 'number' ? ing.amount : Number(ing.amount) || 1,
      unit: ing.unit || 'phần',
    })),
    steps,
  };
}
