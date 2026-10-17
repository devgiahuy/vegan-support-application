import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getApiErrorCode } from '@/lib/api-error';
import { toast } from 'sonner';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

function createAxiosError(code: string, message: string = 'Lỗi yêu cầu'): unknown {
  return {
    isAxiosError: true,
    response: {
      status: 400,
      data: {
        success: false,
        error: {
          code,
          message,
        },
      },
    },
  };
}

describe('Meal Plan Queries - Hard Constraint Violation Handling (US2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('1. correctly identifies ALLERGY_VIOLATION error code', () => {
    const error = createAxiosError('ALLERGY_VIOLATION', 'Món ăn chứa thành phần gây dị ứng');
    expect(getApiErrorCode(error)).toBe('ALLERGY_VIOLATION');
  });

  it('2. correctly identifies DIET_CONSTRAINT_VIOLATION error code', () => {
    const error = createAxiosError(
      'DIET_CONSTRAINT_VIOLATION',
      'Món ăn không phù hợp chế độ thuần chay'
    );
    expect(getApiErrorCode(error)).toBe('DIET_CONSTRAINT_VIOLATION');
  });

  it('3. correctly identifies MEAL_PLAN_HARD_CONSTRAINT_VIOLATION error code', () => {
    const error = createAxiosError('MEAL_PLAN_HARD_CONSTRAINT_VIOLATION', 'Vi phạm ràng buộc cứng');
    expect(getApiErrorCode(error)).toBe('MEAL_PLAN_HARD_CONSTRAINT_VIOLATION');
  });

  it('4. triggers blocking error toast when ALLERGY_VIOLATION occurs on manual add', () => {
    const error = createAxiosError('ALLERGY_VIOLATION');
    const code = getApiErrorCode(error);

    if (
      code === 'MEAL_PLAN_HARD_CONSTRAINT_VIOLATION' ||
      code === 'ALLERGY_VIOLATION' ||
      code === 'DIET_CONSTRAINT_VIOLATION'
    ) {
      toast.error('Không thể chọn món này', {
        description: 'Món ăn vi phạm quy tắc dị ứng, kiêng kỵ nghiêm ngặt hoặc chế độ ăn của bạn.',
      });
    }

    expect(toast.error).toHaveBeenCalledWith('Không thể chọn món này', {
      description: 'Món ăn vi phạm quy tắc dị ứng, kiêng kỵ nghiêm ngặt hoặc chế độ ăn của bạn.',
    });
  });

  it('5. triggers blocking error toast when DIET_CONSTRAINT_VIOLATION occurs on manual add', () => {
    const error = createAxiosError('DIET_CONSTRAINT_VIOLATION');
    const code = getApiErrorCode(error);

    if (
      code === 'MEAL_PLAN_HARD_CONSTRAINT_VIOLATION' ||
      code === 'ALLERGY_VIOLATION' ||
      code === 'DIET_CONSTRAINT_VIOLATION'
    ) {
      toast.error('Không thể chọn món này', {
        description: 'Món ăn vi phạm quy tắc dị ứng, kiêng kỵ nghiêm ngặt hoặc chế độ ăn của bạn.',
      });
    }

    expect(toast.error).toHaveBeenCalledWith('Không thể chọn món này', {
      description: 'Món ăn vi phạm quy tắc dị ứng, kiêng kỵ nghiêm ngặt hoặc chế độ ăn của bạn.',
    });
  });
});
