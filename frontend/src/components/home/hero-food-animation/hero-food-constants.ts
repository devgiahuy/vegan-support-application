/**
 * Hằng số thời lượng và thông số hoạt cảnh cho Hero Food Animation (Remotion).
 * Tổng thời lượng: 240 frames @ 30 FPS = 8.0 giây loop.
 */

export const HERO_ANIMATION_CONFIG = {
  FPS: 30,
  TOTAL_FRAMES: 240,
  COMPOSITION_WIDTH: 700,
  COMPOSITION_HEIGHT: 700,
  CENTER: { x: 350, y: 350 },
} as const;

export const PHASES = {
  // Phase 1: Chiếc tô nguyên bản, nhấp nhô nhẹ
  PHASE_1_BOWL_IDLE: { start: 0, end: 25 },
  // Phase 2: Tô xoay 360 độ tạo động lực
  PHASE_2_FIRST_ROTATION: { start: 25, end: 65 },
  // Phase 3: Các nguyên liệu bung nở từ lòng tô ra xung quanh
  PHASE_3_INGREDIENT_REVEAL: { start: 66, end: 110 },
  // Phase 4: Các nguyên liệu bay lượn kết nối nhẹ nhàng quanh tô
  PHASE_4_INGREDIENT_ORBIT: { start: 111, end: 150 },
  // Phase 5: Xoay chuẩn bị kết hợp món ăn
  PHASE_5_SECOND_ROTATION: { start: 151, end: 175 },
  // Phase 6: Nguyên liệu hội tụ xoáy về trung tâm
  PHASE_6_CONVERGENCE: { start: 176, end: 195 },
  // Phase 7: Món Rainbow Buddha Bowl hoàn chỉnh xuất hiện
  PHASE_7_COMPLETED_DISH: { start: 196, end: 220 },
  // Phase 8: Giữ món ăn hoàn chỉnh, đồng bộ cùng chỉ số dinh dưỡng
  PHASE_8_PAUSE_SHOWCASE: { start: 221, end: 235 },
  // Phase 9: Chuyển mượt về đầu vòng lặp
  PHASE_9_LOOP_WRAP: { start: 236, end: 240 },
} as const;

export interface IngredientDef {
  id: string;
  name: string;
  angle: number; // góc bung ra (độ)
  distance: number; // khoảng cách từ tâm (px)
  delayFrames: number; // stagger delay
  scale: number;
  rotationOffset: number;
}

/**
 * 5 nguyên liệu đặc trưng của món Buddha Bowl thuần chay chuẩn vị
 */
export const INGREDIENTS_CONFIG: IngredientDef[] = [
  {
    id: 'avocado',
    name: 'Bơ sáp tươi',
    angle: -135, // Trên - Trái
    distance: 215,
    delayFrames: 0,
    scale: 1.05,
    rotationOffset: -15,
  },
  {
    id: 'chickpeas',
    name: 'Đậu gà nướng giòn',
    angle: -45, // Trên - Phải
    distance: 210,
    delayFrames: 6,
    scale: 0.95,
    rotationOffset: 20,
  },
  {
    id: 'tomato',
    name: 'Cà chua bi mọng',
    angle: 0, // Phải
    distance: 220,
    delayFrames: 12,
    scale: 1.0,
    rotationOffset: -10,
  },
  {
    id: 'carrot',
    name: 'Cà rốt giòn ngọt',
    angle: 80, // Dưới - Phải
    distance: 210,
    delayFrames: 18,
    scale: 1.0,
    rotationOffset: 25,
  },
  {
    id: 'greens',
    name: 'Rau mầm & xà lách',
    angle: 150, // Dưới - Trái
    distance: 215,
    delayFrames: 24,
    scale: 1.1,
    rotationOffset: -20,
  },
];
