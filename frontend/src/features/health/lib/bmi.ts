export type BiologicalSex = 'female' | 'male';

export interface BmiResult {
  value: number;
  category: string;
  level: 0 | 1 | 2 | 3;
  isOutOfSafeRange: boolean;
}

/** BMI = cân nặng(kg) / chiều cao(m)² — phân loại theo chuẩn WHO châu Á. */
export function calcBmi(weightKg: number, heightCm: number): BmiResult {
  const h = heightCm / 100;
  const value = h > 0 ? weightKg / (h * h) : 0;

  let category = 'Bình thường';
  let level: BmiResult['level'] = 1;
  if (value < 18.5) {
    category = 'Thiếu cân';
    level = 0;
  } else if (value < 23) {
    category = 'Bình thường';
    level = 1;
  } else if (value < 25) {
    category = 'Thừa cân';
    level = 2;
  } else {
    category = 'Béo phì';
    level = 3;
  }

  return { value, category, level, isOutOfSafeRange: value < 12 || value > 45 };
}

/** Công thức Mifflin-St Jeor. */
export function calcBmr(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: BiologicalSex
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(base + (sex === 'male' ? 5 : -161));
}

export function calcTdee(bmr: number, activityFactor: number): number {
  return Math.round(bmr * activityFactor);
}

export const ACTIVITY_LEVELS = [
  { value: 1.2, label: 'Ít vận động (Nhân viên văn phòng, ngồi nhiều)' },
  { value: 1.375, label: 'Vận động nhẹ (Tập yoga, đi bộ 1-3 ngày/tuần)' },
  { value: 1.55, label: 'Vận động vừa (Tập thể thao đều 3-5 ngày/tuần)' },
  { value: 1.725, label: 'Vận động nhiều (Cường độ cao 6-7 ngày/tuần)' },
  { value: 1.9, label: 'Vận động rất nhiều (Lao động nặng / tập 2 buổi mỗi ngày)' },
];

export function calGoalTargets(tdee: number) {
  return [
    { key: 'lose', label: 'Giảm mỡ thon gọn', kcal: tdee - 300, note: '-300 kcal thâm hụt nhẹ' },
    { key: 'maintain', label: 'Duy trì cân nặng', kcal: tdee, note: 'Cân bằng năng lượng chuẩn' },
    {
      key: 'muscle',
      label: 'Tăng cơ thực vật',
      kcal: tdee + 300,
      note: '+300 kcal + đạm thực vật',
    },
  ];
}
