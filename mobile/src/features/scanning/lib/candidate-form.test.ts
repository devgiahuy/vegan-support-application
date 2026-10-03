/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseCandidateForm, type CandidateForm } from './candidate-form';

const form: CandidateForm = { name: 'Đậu hũ', ingredientId: null, quantity: '', unit: '', freshness: '', lineText: 'DAU HU', unitPrice: '', lineTotal: '', currency: '' };

test('unknown quantity remains null until explicitly entered', () => {
  const values = parseCandidateForm(form, 'fridge', 2);
  assert.equal(values.quantity, null);
  assert.equal(values.unit, null);
  assert.equal(values.expectedVersion, 2);
  assert.throws(() => parseCandidateForm({ ...form, unit: 'g' }, 'fridge', 2), /cả số lượng/);
  assert.throws(() => parseCandidateForm({ ...form, quantity: '1' }, 'fridge', 2), /cả số lượng/);
});

test('numeric validation accepts decimal commas but not negative, exponent or excessive amounts', () => {
  assert.equal(parseCandidateForm({ ...form, quantity: '1,5', unit: 'kg' }, 'fridge', 1).quantity, 1.5);
  for (const quantity of ['0', '-1', '1e3', 'Infinity', '1000000000', 'abc'])
    assert.throws(() => parseCandidateForm({ ...form, quantity, unit: 'g' }, 'fridge', 1), /Số lượng/);
});

test('receipt price zero is valid, empty price is unknown, and currency is validated', () => {
  const values = parseCandidateForm({ ...form, currency: 'vnd', unitPrice: '0' }, 'receipt', 1);
  assert.equal(values.unitPrice, 0);
  assert.equal(values.lineTotal, null);
  assert.equal(values.currency, 'VND');
  assert.throws(() => parseCandidateForm({ ...form, currency: 'VNDD' }, 'receipt', 1), /Mã tiền tệ/);
  assert.throws(() => parseCandidateForm({ ...form, lineText: '' }, 'receipt', 1), /Dòng hóa đơn/);
  assert.throws(() => parseCandidateForm({ ...form, unitPrice: '-1' }, 'receipt', 1), /Giá tiền/);
});
