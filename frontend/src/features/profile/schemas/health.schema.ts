import { z } from 'zod';
import { ActivityLevel, BiologicalSex } from '@/common/enums';

const positiveNumber = (label: string) =>
  z.coerce.number({ message: `${label} phải là số` }).gt(0, `${label} phải lớn hơn 0`);

export const healthProfileSchema = z.object({
  heightCm: positiveNumber('Chiều cao (cm)').max(300, 'Chiều cao không hợp lệ'),
  weightKg: positiveNumber('Cân nặng (kg)').max(1000, 'Cân nặng không hợp lệ'),
  age: z.coerce
    .number({ message: 'Tuổi phải là số' })
    .int('Tuổi phải là số nguyên')
    .min(1, 'Tuổi phải từ 1 trở lên')
    .max(120, 'Tuổi tối đa 120'),
  sex: z.enum([BiologicalSex.MALE, BiologicalSex.FEMALE], {
    message: 'Vui lòng chọn giới tính',
  }),
  activityLevel: z.enum(
    [
      ActivityLevel.SEDENTARY,
      ActivityLevel.LIGHTLY_ACTIVE,
      ActivityLevel.MODERATELY_ACTIVE,
      ActivityLevel.VERY_ACTIVE,
      ActivityLevel.EXTRA_ACTIVE,
    ],
    { message: 'Vui lòng chọn mức vận động' }
  ),
});

export type HealthProfileFormValues = z.infer<typeof healthProfileSchema>;
