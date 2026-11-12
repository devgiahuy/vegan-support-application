/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RecipeDifficulty } from '@/common/enums';
import { applyDraftBasics, linkedIngredientIds, toEditorValues } from './recipe-editor';

const draft = { title: 'Món AI', description: 'Mô tả AI', servings: 3, prepTimeMinutes: 10, cookTimeMinutes: 15 };

test('applyDraftBasics fills only blank basics', () => {
  const blank = { ...toEditorValues(undefined), title: '', description: '', servings: '', prepTime: '', cookTime: '' };
  assert.deepEqual(applyDraftBasics(blank, draft), {
    title: 'Món AI', description: 'Mô tả AI', servings: '3', prepTime: '10', cookTime: '15',
  });

  const entered = { ...blank, title: 'Món của tôi', description: 'Mô tả của tôi', servings: '2', prepTime: '0', cookTime: '5', difficulty: RecipeDifficulty.EASY };
  assert.deepEqual(applyDraftBasics(entered, draft), {
    title: 'Món của tôi', description: 'Mô tả của tôi', servings: '2', prepTime: '0', cookTime: '5',
  });
});

test('linkedIngredientIds keeps only linked ingredients keyed by normalized name', () => {
  const linked = linkedIngredientIds([
    { key: 'a', ingredientId: 'id-1', name: ' Đậu Hũ ', amount: '1', unit: 'g' },
    { key: 'b', ingredientId: null, name: 'Nấm', amount: '1', unit: 'g' },
  ]);
  assert.equal(linked.get('đậu hũ'), 'id-1');
  assert.equal(linked.has('nấm'), false);
});
