import { z } from 'zod';
import { ReportReasonCode } from '@/common/enums';

export const MAX_REPORT_DETAILS_LENGTH = 2000;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const reportSchema = z.object({
  reasonCode: z.nativeEnum(ReportReasonCode, { message: 'Vui lòng chọn lý do báo cáo.' }),
  details: z
    .string()
    .trim()
    .max(MAX_REPORT_DETAILS_LENGTH, `Chi tiết tối đa ${MAX_REPORT_DETAILS_LENGTH} ký tự.`),
  /** UUID mục tiêu — validate ở form, sai thì không gửi. */
  targetId: z.string().regex(UUID_RE, 'Mục tiêu báo cáo không hợp lệ.'),
});

export type ReportFormValues = z.infer<typeof reportSchema>;
