import { describe, expect, it } from 'vitest';
import { formatInvalidUploadFilesMessage } from './use-selected-upload-images';

describe('formatInvalidUploadFilesMessage', () => {
  it('returns null when there are no invalid files', () => {
    expect(formatInvalidUploadFilesMessage([])).toBeNull();
  });

  it('returns a single detailed toast title for 1 invalid file', () => {
    expect(
      formatInvalidUploadFilesMessage([{ name: 'notes.txt', error: 'Định dạng không hỗ trợ.' }])
    ).toEqual({
      title: 'notes.txt: Định dạng không hỗ trợ.',
    });
  });

  it('consolidates 2 invalid files into 1 summary toast', () => {
    expect(
      formatInvalidUploadFilesMessage([
        { name: 'a.txt', error: 'Sai định dạng' },
        { name: 'b.pdf', error: 'Sai định dạng' },
      ])
    ).toEqual({
      title: 'Không thể thêm 2 ảnh không hợp lệ.',
      description: 'a.txt: Sai định dạng\nb.pdf: Sai định dạng',
    });
  });

  it('summarizes 5 invalid files with preview of first 2 and remaining count', () => {
    const files = Array.from({ length: 5 }, (_, index) => ({
      name: `file-${index + 1}.bin`,
      error: 'Quá dung lượng',
    }));

    expect(formatInvalidUploadFilesMessage(files)).toEqual({
      title: 'Không thể thêm 5 ảnh không hợp lệ.',
      description: 'file-1.bin: Quá dung lượng\nfile-2.bin: Quá dung lượng\n... và 3 tệp khác.',
    });
  });
});
