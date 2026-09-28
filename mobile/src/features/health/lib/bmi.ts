export interface BmiResult {
  value: number;
  category: string;
  level: 0 | 1 | 2 | 3;
  isOutOfSafeRange: boolean;
}

/** BMI = weight(kg) / height(m)^2, classified with the Asia-Pacific ranges. */
export function calcBmi(weightKg: number, heightCm: number): BmiResult {
  const heightM = heightCm / 100;
  const value = heightM > 0 ? weightKg / (heightM * heightM) : 0;

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

  return {
    value,
    category,
    level,
    isOutOfSafeRange: value < 12 || value > 45,
  };
}
