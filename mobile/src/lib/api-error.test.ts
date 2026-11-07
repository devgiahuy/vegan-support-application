/// <reference types="node" />
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatApiErrorFields, getApiErrorDetail, localizeFieldValidation } from './api-error';

function apiError(fields: Record<string, unknown>, message = 'Dữ liệu không hợp lệ') {
  return { isAxiosError: true, response: { status: 400, data: { success: false, error: { code: 'VALIDATION_ERROR', message, fields } } } };
}

test('Zod length messages are translated with the field label', () => {
  assert.equal(
    localizeFieldValidation('body', 'Too small: expected string to have >=100 characters'),
    'Nội dung bài viết: quá ngắn (yêu cầu tối thiểu 100 ký tự)'
  );
  assert.equal(
    localizeFieldValidation('title', 'Too big: expected string to have <=200 characters'),
    'Tiêu đề: quá dài (tối đa 200 ký tự)'
  );
  assert.equal(localizeFieldValidation('email', 'Invalid email address'), 'Email: email không hợp lệ');
  assert.equal(localizeFieldValidation('excerpt', 'Required'), 'Đoạn trích tóm tắt: không được để trống');
});

test('unknown fields keep their key and untranslated messages stay readable', () => {
  assert.equal(localizeFieldValidation('servings', 'Invalid input'), 'servings: Invalid input');
  assert.equal(localizeFieldValidation('title', 'Something else'), 'Tiêu đề: Something else');
});

test('field errors are capped and summarised, and detail appends them to the main message', () => {
  const error = apiError({ body: ['Too small: expected string to have >=100 characters'], title: 'Required', tags: 'Invalid input', email: 'Invalid email', name: 'Required' });
  const lines = formatApiErrorFields(error)!.split('\n');
  assert.equal(lines.length, 4);
  assert.equal(lines[0], 'Nội dung bài viết: quá ngắn (yêu cầu tối thiểu 100 ký tự)');
  assert.equal(lines[3], '... và 2 lỗi khác');
  assert.equal(getApiErrorDetail(apiError({ title: 'Required' })), 'Dữ liệu không hợp lệ\nTiêu đề: không được để trống');
  assert.equal(formatApiErrorFields(new Error('x')), undefined);
  assert.equal(getApiErrorDetail(new Error('mất mạng')), 'mất mạng');
});
