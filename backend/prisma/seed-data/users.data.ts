import {
  ActivityLevel,
  AllergySeverity,
  ContributorApplicationSource,
  ContributorApprovalBasis,
  DietPattern,
  HealthDataSource,
  HealthSex,
  PracticeSchedule,
  Role,
  Tradition,
  UserStatus,
  type Prisma,
} from '@prisma/client';

export interface UserSeedDefinition {
  email: string;
  displayName: string;
  role: Role;
  status: UserStatus;
  bio?: string;
  avatarUrl?: string;
  healthProfile?: {
    heightCm: number;
    weightKg: number;
    age: number;
    sex: HealthSex;
    activityLevel: ActivityLevel;
    bmi: number;
    bmr: number;
    tdee: number;
    dataSource?: HealthDataSource;
  };
  dietPreference?: {
    dietPattern: DietPattern;
    practiceSchedule: PracticeSchedule;
    tradition: Tradition;
  };
  allergies?: Array<{
    allergenCode: string;
    label: string;
    severity: AllergySeverity;
  }>;
  exclusions?: Array<{
    ingredientNormalizedName: string;
    ingredientName: string;
    reason: string;
  }>;
  contributorProfile?: {
    applicationId: string;
    claimedApprovalBasis: ContributorApprovalBasis;
    approvalBasis: ContributorApprovalBasis;
    source: ContributorApplicationSource;
    organizationClaim?: string | null;
    referenceLinks: string[];
    experience: string;
    invitationReason?: string | null;
    approvalEvidence: Prisma.InputJsonValue;
  };
}

export const userDefinitions: readonly UserSeedDefinition[] = [
  // 1. Quản trị viên hệ thống (Admin)
  {
    email: 'admin@example.com',
    displayName: 'Quản Trị Viên VeggieConnect',
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
    bio: 'Ban điều hành và kiểm duyệt nội dung nền tảng hỗ trợ lối sống thuần chay VeggieConnect.',
    avatarUrl: '/seed/avatars/admin-avatar.jpg',
  },

  // 2. Contributor: Đầu bếp ẩm thực thực vật uy tín (Platform Track Record)
  {
    email: 'platform.contributor@example.com',
    displayName: 'Bếp Trưởng Minh Tâm',
    role: Role.CONTRIBUTOR,
    status: UserStatus.ACTIVE,
    bio: '10 năm sáng tạo ẩm thực thuần chay Việt Nam, tác giả nhiều công thức món chay thanh đạm giữ trọn hương vị truyền thống.',
    avatarUrl: '/seed/avatars/chef-minh-tam.jpg',
    contributorProfile: {
      applicationId: '80000000-0000-4000-8000-000000000001',
      claimedApprovalBasis: ContributorApprovalBasis.PLATFORM_TRACK_RECORD,
      approvalBasis: ContributorApprovalBasis.PLATFORM_TRACK_RECORD,
      source: ContributorApplicationSource.REGISTRATION,
      referenceLinks: ['https://veggieconnect.vn/chef/minh-tam'],
      experience: '10 năm nghiên cứu và chế tác món chay hiện đại, hoạt động tích cực trong cộng đồng ẩm thực thực vật.',
      approvalEvidence: {
        kind: ContributorApprovalBasis.PLATFORM_TRACK_RECORD,
        capturedAt: '2026-09-15T00:00:00.000Z',
        snapshotVersion: 'seed-platform-track-record-v1',
        posts: { total: 15, published: 15, pendingReview: 0, rejected: 0 },
        interactions: { commentsReceived: 45, votesReceived: 120, ratingsReceived: 38, bookmarksReceived: 80, averageTasteRating: 4.9 },
      },
    },
  },

  // 3. Contributor: Chuyên gia dinh dưỡng từ Viện Nghiên Cứu (Organization Affiliation)
  {
    email: 'org.contributor@example.com',
    displayName: 'ThS. BS. Hoài Thu (Viện Dinh Dưỡng)',
    role: Role.CONTRIBUTOR,
    status: UserStatus.ACTIVE,
    bio: 'Thạc sĩ, Bác sĩ chuyên khoa Dinh dưỡng Thực vật. Cố vấn khoa học cân bằng vi chất B12, Sắt và Protein thực vật.',
    avatarUrl: '/seed/avatars/dr-hoai-thu.jpg',
    contributorProfile: {
      applicationId: '80000000-0000-4000-8000-000000000002',
      claimedApprovalBasis: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
      approvalBasis: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
      source: ContributorApplicationSource.REGISTRATION,
      organizationClaim: 'Viện Nghiên Cứu Dinh Dưỡng Thực Vật Việt Nam',
      referenceLinks: ['https://example.com/plant-nutrition-institute'],
      experience: 'Đại diện cố vấn dinh dưỡng thực vật từ đối tác nghiên cứu; hỗ trợ thẩm định các cẩm nang sức khỏe.',
      approvalEvidence: {
        kind: ContributorApprovalBasis.ORGANIZATION_AFFILIATION,
        capturedAt: '2026-09-15T00:00:00.000Z',
        snapshotVersion: 'seed-organization-claim-v1',
        organizationClaim: 'Viện Nghiên Cứu Dinh Dưỡng Thực Vật Việt Nam',
        referenceLinks: ['https://example.com/plant-nutrition-institute'],
        verificationStatus: 'CLAIM_RETAINED_NOT_VERIFIED',
      },
    },
  },

  // 4. Contributor: Nghệ nhân cỗ chay được mời (Admin Invited)
  {
    email: 'invited.contributor@example.com',
    displayName: 'Nghệ Nhân Diệu Hạnh',
    role: Role.CONTRIBUTOR,
    status: UserStatus.ACTIVE,
    bio: 'Chuyên gia mâm cỗ chay thanh tịnh cung đình Huế và các món chay dưỡng sinh truyền thống.',
    avatarUrl: '/seed/avatars/dieu-hanh.jpg',
    contributorProfile: {
      applicationId: '80000000-0000-4000-8000-000000000003',
      claimedApprovalBasis: ContributorApprovalBasis.ADMIN_INVITED,
      approvalBasis: ContributorApprovalBasis.ADMIN_INVITED,
      source: ContributorApplicationSource.ADMIN_INVITATION,
      referenceLinks: [],
      experience: 'Nghệ nhân ẩm thực chay cổ truyền được Ban Quản Trị mời thẩm định công thức truyền thống.',
      invitationReason: 'Chuyên gia văn hóa ẩm thực chay Phật giáo Việt Nam.',
      approvalEvidence: {
        kind: ContributorApprovalBasis.ADMIN_INVITED,
        capturedAt: '2026-09-15T00:00:00.000Z',
        snapshotVersion: 'seed-admin-invitation-v1',
        invitationReason: 'Chuyên gia văn hóa ẩm thực chay Phật giáo Việt Nam.',
      },
    },
  },

  // 5. Member 1: Bạn trẻ văn phòng tập gym - Mục tiêu tăng cơ thuần chay (High Protein)
  {
    email: 'member@example.com',
    displayName: 'Trần Quang Huy',
    role: Role.MEMBER,
    status: UserStatus.ACTIVE,
    bio: 'Kỹ sư phần mềm đam mê thể hình và lối sống thuần chay. Đang tập trung xây dựng cơ bắp với protein thực vật.',
    avatarUrl: '/seed/avatars/hoang-nam.jpg',
    healthProfile: {
      heightCm: 175.0,
      weightKg: 68.5,
      age: 27,
      sex: HealthSex.MALE,
      activityLevel: ActivityLevel.VERY_ACTIVE,
      bmi: 22.37,
      bmr: 1675.0,
      tdee: 2200.0,
      dataSource: HealthDataSource.MANUAL,
    },
    dietPreference: {
      dietPattern: DietPattern.VEGAN,
      practiceSchedule: PracticeSchedule.PERMANENT,
      tradition: Tradition.NONE,
    },
    allergies: [
      { allergenCode: 'PEANUT', label: 'Đậu phộng (lạc)', severity: AllergySeverity.MODERATE },
    ],
  },

  // 6. Member 2: Người ăn chay kỳ Phật giáo - Kiêng ngũ vị tân vào ngày Rằm & Mùng Một
  {
    email: 'member.buddhist@example.com',
    displayName: 'Lê Thị Ngọc Mai',
    role: Role.MEMBER,
    status: UserStatus.ACTIVE,
    bio: 'Ăn chay định kỳ theo lịch trăng Rằm và Mùng Một. Yêu thích các món canh thanh đạm không ngũ vị tân.',
    avatarUrl: '/seed/avatars/dieu-tam.jpg',
    healthProfile: {
      heightCm: 158.0,
      weightKg: 50.0,
      age: 34,
      sex: HealthSex.FEMALE,
      activityLevel: ActivityLevel.LIGHTLY_ACTIVE,
      bmi: 20.03,
      bmr: 1240.0,
      tdee: 1700.0,
      dataSource: HealthDataSource.MANUAL,
    },
    dietPreference: {
      dietPattern: DietPattern.VEGAN,
      practiceSchedule: PracticeSchedule.PERIODIC,
      tradition: Tradition.BUDDHIST,
    },
    exclusions: [
      { ingredientNormalizedName: 'hanh boaro', ingredientName: 'Hành boaro (Tỏi tây)', reason: 'Kiêng ngũ vị tân theo truyền thống Phật giáo' },
      { ingredientNormalizedName: 'hanh la', ingredientName: 'Hành lá', reason: 'Kiêng ngũ vị tân theo truyền thống Phật giáo' },
    ],
  },

  // 7. Member 3: Người cần giảm cân & dị ứng Gluten
  {
    email: 'member.weightloss@example.com',
    displayName: 'Hoàng Thu Hà',
    role: Role.MEMBER,
    status: UserStatus.ACTIVE,
    bio: 'Nhân viên thiết kế đồ họa. Đang thực hiện lộ trình giảm mỡ thanh lọc và ăn không gluten (Gluten-Free).',
    avatarUrl: '/seed/avatars/thanh-mai.jpg',
    healthProfile: {
      heightCm: 162.0,
      weightKg: 62.0,
      age: 29,
      sex: HealthSex.FEMALE,
      activityLevel: ActivityLevel.MODERATELY_ACTIVE,
      bmi: 23.62,
      bmr: 1380.0,
      tdee: 1600.0,
      dataSource: HealthDataSource.MANUAL,
    },
    dietPreference: {
      dietPattern: DietPattern.VEGAN,
      practiceSchedule: PracticeSchedule.PERMANENT,
      tradition: Tradition.NONE,
    },
    allergies: [
      { allergenCode: 'GLUTEN', label: 'Gluten (Lúa mì)', severity: AllergySeverity.SEVERE },
    ],
  },
] as const;
