export enum StatusEnum {
  INACTIVE = 0,
  ACTIVE = 1,
  PENDING = 2,
  ARCHIVED = 3,
}

/**
 * Vai trò tài khoản theo contract backend (OpenAPI `ProfileResponse.data.role`).
 * - `requestedType` của đơn contributor KHÔNG thuộc enum này và không cấp quyền.
 */
export enum UserRole {
  MEMBER = 'MEMBER',
  CONTRIBUTOR = 'CONTRIBUTOR',
  ADMIN = 'ADMIN',
}

/** Trạng thái tài khoản (BL-13). `LOCKED` chặn login; `BANNED` chặn mutation. */
export enum MemberStatus {
  ACTIVE = 'ACTIVE',
  LOCKED = 'LOCKED',
  BANNED = 'BANNED',
  DELETED = 'DELETED',
}

/** Loại nguyện vọng contributor khi đăng ký (BL-01). Chỉ mô tả nguyện vọng, không cấp quyền. */
export enum ContributorType {
  EXPERIENCED_PRACTITIONER = 'EXPERIENCED_PRACTITIONER',
  NUTRITION_EXPERT = 'NUTRITION_EXPERT',
}

/** Trạng thái đơn nguyện vọng contributor. */
export enum ContributorApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

/** Phạm vi đăng xuất (OpenAPI `LogoutResponse.data.scope`). */
export enum LogoutScope {
  CURRENT = 'CURRENT',
  ALL_DEVICES = 'ALL_DEVICES',
}

/** Kiểu ăn (OpenAPI diet). */
export enum DietPattern {
  VEGAN = 'VEGAN',
  LACTO_OVO = 'LACTO_OVO',
}

/** Lịch thực hành (OpenAPI diet). */
export enum PracticeSchedule {
  PERMANENT = 'PERMANENT',
  PERIODIC = 'PERIODIC',
}

/** Truyền thống (OpenAPI diet). */
export enum Tradition {
  NONE = 'NONE',
  BUDDHIST = 'BUDDHIST',
  CHRISTIAN = 'CHRISTIAN',
}

/** Giới tính sinh học (`HealthProfileRequest.sex`). */
export enum BiologicalSex {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

/** Mức vận động (`HealthProfileRequest.activityLevel`). */
export enum ActivityLevel {
  SEDENTARY = 'SEDENTARY',
  LIGHTLY_ACTIVE = 'LIGHTLY_ACTIVE',
  MODERATELY_ACTIVE = 'MODERATELY_ACTIVE',
  VERY_ACTIVE = 'VERY_ACTIVE',
  EXTRA_ACTIVE = 'EXTRA_ACTIVE',
}

/** Nguồn dữ liệu sức khỏe. Slice này chỉ có nhập tay. */
export enum HealthDataSource {
  MANUAL = 'MANUAL',
}

/** Loại danh mục (OpenAPI category). */
export enum CategoryType {
  FOOD_TYPE = 'FOOD_TYPE',
  RECIPE_GROUP = 'RECIPE_GROUP',
  CONTENT_TOPIC = 'CONTENT_TOPIC',
}

/** Trạng thái danh mục / nguyên liệu. */
export enum CatalogStatus {
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

/** Nhóm thực phẩm (OpenAPI ingredient). */
export enum FoodGroup {
  GRAINS = 'GRAINS',
  LEGUMES = 'LEGUMES',
  VEGETABLES = 'VEGETABLES',
  FRUITS = 'FRUITS',
  NUTS_SEEDS = 'NUTS_SEEDS',
  MUSHROOMS = 'MUSHROOMS',
  DAIRY_EGGS = 'DAIRY_EGGS',
  HERBS_SPICES = 'HERBS_SPICES',
  OTHER = 'OTHER',
}

/** Trạng thái phân giải tên nguyên liệu. */
export enum ResolutionMatch {
  NONE = 'NONE',
  EXACT = 'EXACT',
  AMBIGUOUS = 'AMBIGUOUS',
}

/** Loại bài viết / nội dung (Content & Media). */
export enum PostType {
  RECIPE = 'RECIPE',
  BLOG = 'BLOG',
  VIDEO = 'VIDEO',
}

/** Trạng thái vòng đời bài viết (Content & Media, bám backend `PostStatus`). */
export enum PostStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  PUBLISHED = 'PUBLISHED',
  FLAGGED = 'FLAGGED',
  QUARANTINED = 'QUARANTINED',
  REJECTED = 'REJECTED',
  HIDDEN = 'HIDDEN',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
}

/** Độ khó của công thức nấu ăn. */
export enum RecipeDifficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

/** Nguồn phát video. */
export enum VideoSource {
  CLOUDINARY = 'CLOUDINARY',
  YOUTUBE = 'YOUTUBE',
}
