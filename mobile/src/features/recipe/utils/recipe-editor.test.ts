/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RecipeDifficulty } from '@/common/enums';
import { buildRecipeInput, hasUserContent, issueLocation, toEditorValues, validateRecipeEditor, type RecipeEditorValues } from './recipe-editor';

function valid(): RecipeEditorValues {
  return {
    title: 'Đậu hũ sốt nấm', description: 'Món ngon', servings: '4', prepTime: '15', cookTime: '25',
    categoryId: 'cat-1', difficulty: RecipeDifficulty.MEDIUM,
    ingredients: [{ key: 'a', ingredientId: null, name: 'Đậu hũ', amount: '2,5', unit: 'bìa' }],
    steps: [{ key: 's', instruction: 'Rửa sạch nấm rồi để ráo nước.' }],
  };
}

test('an empty new form reports every required field in step order', () => {
  const issues = validateRecipeEditor(toEditorValues(undefined));
  assert.deepEqual(
    issues.map((issue) => issue.path),
    ['title', 'servings', 'prepTimeMinutes', 'cookTimeMinutes', 'ingredients.0.name', 'ingredients.0.amount', 'ingredients.0.unit', 'steps.0.instruction', 'categoryId']
  );
  assert.equal(issues[0].step, 'basics');
  assert.equal(issues[issues.length - 1].step, 'classify');
});

test('a complete form has no issues and accepts a decimal comma', () => {
  assert.deepEqual(validateRecipeEditor(valid()), []);
  assert.equal(buildRecipeInput(valid(), {}).ingredients[0].amount, 2.5);
});

test('web rules: title >= 5, integer servings, positive amount, step >= 5 chars, category required', () => {
  const values: RecipeEditorValues = { ...valid(), title: 'Cơm', servings: '1.5', categoryId: null, ingredients: [{ key: 'a', ingredientId: null, name: 'x', amount: '0', unit: 'g' }], steps: [{ key: 's', instruction: 'abc' }] };
  const messages = validateRecipeEditor(values).map((issue) => issue.message);
  assert.ok(messages.includes('Tên món cần ít nhất 5 ký tự'));
  assert.ok(messages.includes('Khẩu phần phải là số nguyên'));
  assert.ok(messages.includes('Định lượng phải lớn hơn 0'));
  assert.ok(messages.includes('Mô tả bước nấu cần ít nhất 5 ký tự'));
  assert.ok(messages.includes('Chọn danh mục món ăn'));
});

test('backend body rule: very short steps are rejected even when each has 5 characters', () => {
  const issues = validateRecipeEditor({ ...valid(), steps: [{ key: 's', instruction: 'abcde' }] });
  assert.deepEqual(issues.map((issue) => issue.path), ['steps']);
});

test('issue location names the row for ingredient and step errors', () => {
  assert.equal(issueLocation('ingredients.1.unit'), 'Nguyên liệu 2');
  assert.equal(issueLocation('steps.0.instruction'), 'Bước nấu 1');
  assert.equal(issueLocation('title'), null);
});

test('payload remaps step ingredient references after a row is removed', () => {
  const values: RecipeEditorValues = {
    ...valid(),
    ingredients: [
      { key: 'b', ingredientId: 'i2', name: 'Nấm', amount: '1', unit: 'g', originalPosition: 1 },
      { key: 'c', ingredientId: null, name: 'Mới', amount: '1', unit: 'g' },
    ],
    steps: [{ key: 's', instruction: 'Xào nấm với hành thật thơm', durationMinutes: 5, affectedIngredientPositions: [0, 1] }],
  };
  const input = buildRecipeInput(values, { tags: ['chay'], coverAssetId: 'asset' });
  assert.deepEqual(input.steps[0].affectedIngredientPositions, [0]);
  assert.equal(input.steps[0].durationMinutes, 5);
  assert.deepEqual(input.tags, ['chay']);
  assert.equal(input.coverAssetId, 'asset');
  assert.equal(input.ingredients[0].ingredientId, 'i2');
  assert.equal('ingredientId' in input.ingredients[1], false);
});

test('editing keeps preserved step data and detects user content', () => {
  const values = toEditorValues({ steps: [{ instruction: 'Hấp 10 phút cho chín', cookingMethodId: 'm1', temperatureCelsius: 100 }] });
  assert.equal(values.steps[0].cookingMethodId, 'm1');
  assert.equal(hasUserContent(toEditorValues(undefined)), false);
  assert.equal(hasUserContent(values), true);
});
