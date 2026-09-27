import { describe, expect, it } from 'vitest';
import {
  MAX_TAG_LENGTH,
  MAX_TAGS_PER_MEAL,
  isValidUserTag,
  normalizeTagList,
  normalizeUserTag,
} from './tag-normalizer';

describe('tag-normalizer utils', () => {
  describe('normalizeUserTag', () => {
    it('chuyển đổi chữ thường và cắt khoảng trắng thừa', () => {
      expect(normalizeUserTag('  BỮA ĂN SÁNG  ')).toBe('bữa ăn sáng');
    });

    it('loại bỏ ký tự hashtag (#) ở đầu chuỗi', () => {
      expect(normalizeUserTag('#bua_trua')).toBe('bua_trua');
      expect(normalizeUserTag('###nhanh_gon')).toBe('nhanh_gon');
    });

    it('thu gọn nhiều khoảng trắng liên tiếp', () => {
      expect(normalizeUserTag('món   chay    ngon')).toBe('món chay ngon');
    });

    it('cắt ngắn nếu vượt quá MAX_TAG_LENGTH (30 ký tự)', () => {
      const longTag = 'a'.repeat(40);
      expect(normalizeUserTag(longTag).length).toBe(MAX_TAG_LENGTH);
    });

    it('trả về chuỗi rỗng khi đầu vào rỗng hoặc null', () => {
      expect(normalizeUserTag('')).toBe('');
      // @ts-expect-error kiểm tra trường hợp null ngoại lệ
      expect(normalizeUserTag(null)).toBe('');
    });
  });

  describe('isValidUserTag', () => {
    it('chấp nhận thẻ chứa dấu gạch dưới (_)', () => {
      expect(isValidUserTag('bua_trua')).toBe(true);
      expect(isValidUserTag('nhanh_gon')).toBe(true);
      expect(isValidUserTag('mon_an_chay_123')).toBe(true);
    });

    it('chấp nhận thẻ chứa dấu gạch nối (-)', () => {
      expect(isValidUserTag('an-sang')).toBe(true);
      expect(isValidUserTag('healthy-diet')).toBe(true);
    });

    it('chấp nhận tiếng Việt có dấu đầy đủ và khoảng trắng', () => {
      expect(isValidUserTag('món chay')).toBe(true);
      expect(isValidUserTag('chả giò chiên giòn')).toBe(true);
      expect(isValidUserTag('đậu hũ sốt cà')).toBe(true);
    });

    it('chấp nhận thẻ có ký tự # ở đầu vì hàm đã chuẩn hóa bóc tách', () => {
      expect(isValidUserTag('#shopee')).toBe(true);
      expect(isValidUserTag('#bua_trua')).toBe(true);
    });

    it('từ chối chuỗi rỗng hoặc chỉ có khoảng trắng', () => {
      expect(isValidUserTag('')).toBe(false);
      expect(isValidUserTag('   ')).toBe(false);
    });

    it('từ chối thẻ chứa ký tự đặc biệt không được phép như @, $, <, >, !', () => {
      expect(isValidUserTag('chay@home')).toBe(false);
      expect(isValidUserTag('$free')).toBe(false);
      expect(isValidUserTag('<script>')).toBe(false);
      expect(isValidUserTag('ngon!')).toBe(false);
    });
  });

  describe('normalizeTagList', () => {
    it('loại bỏ thẻ trùng lặp và chuẩn hóa từng thẻ', () => {
      const rawTags = ['BỮA_TRƯA', 'bữa_trưa', 'nhanh_gon', '#NHANH_GON', '  '];
      const result = normalizeTagList(rawTags);

      expect(result).toEqual(['bữa_trưa', 'nhanh_gon']);
    });

    it('giới hạn tối đa MAX_TAGS_PER_MEAL (10 thẻ)', () => {
      const rawTags = Array.from({ length: 15 }, (_, i) => `tag_${i}`);
      const result = normalizeTagList(rawTags);

      expect(result.length).toBe(MAX_TAGS_PER_MEAL);
      expect(result[0]).toBe('tag_0');
      expect(result[9]).toBe('tag_9');
    });

    it('loại trừ các thẻ không hợp lệ', () => {
      const rawTags = ['hợp_lệ', 'hỏng!@#', 'chuẩn-men'];
      const result = normalizeTagList(rawTags);

      expect(result).toEqual(['hợp_lệ', 'chuẩn-men']);
    });
  });
});
