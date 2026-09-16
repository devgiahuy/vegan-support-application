import { describe, expect, it } from 'vitest';
import { profileMapper } from '@/features/profile/mappers/profile.mapper';
import { MemberStatus, UserRole } from '@/common/enums';

const FULL_RESPONSE = {
  success: true,
  data: {
    id: 'u-1',
    email: 'user@example.com',
    displayName: 'Nguyễn Văn A',
    avatarUrl: 'https://x/avatar.png',
    role: 'MEMBER',
    status: 'ACTIVE',
    createdAt: '2026-01-10T08:00:00.000Z',
    contributorApplication: null,
    healthProfile: {
      heightCm: 170,
      weightKg: 65,
      age: 30,
      sex: 'MALE',
      activityLevel: 'MODERATELY_ACTIVE',
      bmi: 22.49,
      bmr: 1567.5,
      tdee: 2429.63,
      dataSource: 'MANUAL',
      updatedAt: '2026-09-10T08:00:00.000Z',
    },
    dietPreference: {
      dietPattern: 'VEGAN',
      practiceSchedule: 'PERIODIC',
      tradition: 'BUDDHIST',
      requiresRuleReview: false,
      confirmedAt: '2026-09-12T08:00:00.000Z',
    },
  },
  meta: null,
};

describe('ProfileMapper.toModel', () => {
  it('map đủ user + health + diet tóm tắt + ngày tham gia', () => {
    const p = profileMapper.toModel(FULL_RESPONSE);

    expect(p.user.id).toBe('u-1');
    expect(p.user.displayName).toBe('Nguyễn Văn A');
    expect(p.user.role).toBe(UserRole.MEMBER);
    expect(p.health?.bmi).toBe(22.49);
    expect(p.health?.bmiCategory).toBe('Bình thường');
    expect(p.diet?.dietPatternLabel).toBe('Thuần chay');
    expect(p.diet?.practiceScheduleLabel).toBe('Chay kỳ');
    expect(p.memberSince).toBe('10/01/2026');
  });

  it('map ngày chay kỳ trong tóm tắt diet, lọc ngày sai', () => {
    const p = profileMapper.toModel({
      success: true,
      data: {
        id: 'u-3',
        email: 'c@example.com',
        displayName: 'C',
        role: 'MEMBER',
        status: 'ACTIVE',
        dietPreference: {
          dietPattern: 'VEGAN',
          practiceSchedule: 'PERIODIC',
          tradition: 'NONE',
          schedule: { timezone: 'Asia/Ho_Chi_Minh', dates: ['2026-09-15', 'nope', null] },
        },
      },
      meta: null,
    });

    expect(p.diet?.scheduleDates).toEqual(['2026-09-15']);
    expect(p.diet?.scheduleTimezone).toBe('Asia/Ho_Chi_Minh');
  });

  it('health/diet null khi backend chưa có dữ liệu', () => {
    const p = profileMapper.toModel({
      success: true,
      data: {
        id: 'u-2',
        email: 'b@example.com',
        displayName: 'B',
        role: 'MEMBER',
        status: 'ACTIVE',
        healthProfile: null,
        dietPreference: null,
      },
      meta: null,
    });

    expect(p.health).toBeNull();
    expect(p.diet).toBeNull();
    expect(p.memberSince).toBe('-');
  });

  it('trả defaults an toàn khi dto null', () => {
    const p = profileMapper.toModel(null);
    expect(p.user.id).toBe('');
    expect(p.health).toBeNull();
    expect(p.diet).toBeNull();
  });
});

describe('ProfileMapper.toUpdateDto', () => {
  it('chỉ gửi field đã đổi, avatar rỗng thành null', () => {
    expect(profileMapper.toUpdateDto({ displayName: 'Mới' })).toEqual({ displayName: 'Mới' });
    expect(profileMapper.toUpdateDto({ avatarUrl: '' })).toEqual({ avatarUrl: null });
    expect(profileMapper.toUpdateDto({ displayName: 'M', avatarUrl: 'https://x/a.png' })).toEqual({
      displayName: 'M',
      avatarUrl: 'https://x/a.png',
    });
  });

  it('giữ nguyên URL Cloudinary từ uploader', () => {
    const cloudinaryUrl = 'https://res.cloudinary.com/veggie-connect/image/upload/v123/avatar.png';
    expect(profileMapper.toUpdateDto({ avatarUrl: cloudinaryUrl })).toEqual({
      avatarUrl: cloudinaryUrl,
    });
  });
});
