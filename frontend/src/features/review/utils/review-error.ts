/**
 * Chuyển đổi thông điệp lỗi kiểm duyệt (đặc biệt là lỗi Zod validation từ Backend)
 * thành thông báo tiếng Việt thân thiện, chuẩn xác và đúng ngữ cảnh cho Quản trị viên.
 */
export function localizeReviewReasonError(rawMessage: string, isApprove: boolean = true): string {
  const text = (rawMessage || '').trim();
  const lower = text.toLowerCase();

  // 1. Lỗi độ dài tối thiểu (Zod min): "Too small: expected string to have >=10 characters" / "must contain at least 10"
  if (
    lower.includes('too small') ||
    lower.includes('>=10') ||
    lower.includes('>= 10') ||
    lower.includes('at least 10') ||
    lower.includes('10 character')
  ) {
    return isApprove
      ? 'Lý do duyệt phải có ít nhất 10 ký tự.'
      : 'Lý do từ chối phải có ít nhất 10 ký tự.';
  }

  // 2. Lỗi độ dài tối đa (Zod max): "Too big: expected string to have <=2000 characters" / "must contain at most"
  if (
    lower.includes('too big') ||
    lower.includes('<=2000') ||
    lower.includes('<= 2000') ||
    lower.includes('at most 2000') ||
    lower.includes('2000 character')
  ) {
    return 'Lý do không được vượt quá 2000 ký tự.';
  }

  // 3. Lỗi bắt buộc (Zod required / null / undefined)
  if (
    lower.includes('required') ||
    lower.includes('received null') ||
    lower.includes('received undefined')
  ) {
    return isApprove
      ? 'Vui lòng nhập lý do duyệt (tối thiểu 10 ký tự).'
      : 'Vui lòng nhập lý do từ chối (tối thiểu 10 ký tự).';
  }

  // 4. Nếu đã là chuỗi tiếng Việt hoặc thông báo rõ ràng, giữ lại
  if (text.length > 0 && !lower.includes('expected string') && !lower.includes('invalid')) {
    return text;
  }

  // Fallback chuẩn cho ngữ cảnh duyệt/từ chối
  return isApprove
    ? 'Lý do duyệt phải có ít nhất 10 ký tự.'
    : 'Lý do từ chối phải có ít nhất 10 ký tự.';
}
