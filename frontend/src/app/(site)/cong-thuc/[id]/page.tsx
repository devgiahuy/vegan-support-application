'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { RecipeDetailView } from '@/features/recipe/components/recipe-detail-view';
import { MOCK_RECIPES } from '@/features/recipe/data/mock-recipes';

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;

  const recipe = React.useMemo(() => {
    const found = MOCK_RECIPES.find((r) => r.id === id);
    return found || MOCK_RECIPES[0];
  }, [id]);

  const relatedRecipes = React.useMemo(() => {
    return MOCK_RECIPES.filter((r) => r.id !== recipe.id);
  }, [recipe.id]);

  return <RecipeDetailView recipe={recipe} relatedRecipes={relatedRecipes} />;
}
