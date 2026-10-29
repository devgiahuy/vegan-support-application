/** `revision.body` gửi backend dựng từ các bước nấu (backend yêu cầu body tối thiểu 20 ký tự). */
export function stepsToBody(steps: { instruction: string }[]): string {
  return steps.map((step, index) => `Bước ${index + 1}: ${step.instruction.trim()}`).join('\n');
}

export const MIN_RECIPE_BODY_LENGTH = 20;
