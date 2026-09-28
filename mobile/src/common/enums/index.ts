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

/**
 * Cơ sở nguyện vọng/xét duyệt Contributor hợp nhất (Phase 14, thay cho `ContributorType`
 * cũ đã bị backend loại bỏ). Chỉ mô tả căn cứ xét duyệt — mọi Contributor đã duyệt có
 * CÙNG một quyền hạn, KHÔNG dùng basis để phân cấp quyền (BL-01).
 * - `ORGANIZATION_AFFILIATION` / `PLATFORM_TRACK_RECORD`: người dùng tự khai khi đăng ký.
 * - `ADMIN_INVITED`: chỉ do Admin gán, không chọn được ở form đăng ký.
 */
export enum ContributorApprovalBasis {
  ORGANIZATION_AFFILIATION = 'ORGANIZATION_AFFILIATION',
  PLATFORM_TRACK_RECORD = 'PLATFORM_TRACK_RECORD',
  ADMIN_INVITED = 'ADMIN_INVITED',
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

/** Mức độ nghiêm trọng của dị ứng (`AllergyInput.severity`). */
export enum AllergySeverity {
  MILD = 'MILD',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
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

/** Trạng thái bình luận cộng đồng. */
export enum CommentStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

/** Mục tiêu tạo thực đơn tuần. */
export enum MealPlanGoal {
  MAINTAIN = 'MAINTAIN',
  LOSE = 'LOSE',
  GAIN = 'GAIN',
}

/** Bữa trong ngày của meal planner. */
export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
}

/** Chất lượng dữ liệu dinh dưỡng backend trả về cho thực đơn. */
export enum NutritionDataQuality {
  COMPLETE = 'COMPLETE',
  PARTIAL = 'PARTIAL',
  UNAVAILABLE = 'UNAVAILABLE',
}

/** Chủ sở hữu phiên chat AI. */
export enum ChatOwnerType {
  AUTHENTICATED = 'AUTHENTICATED',
  GUEST = 'GUEST',
}

/** Vai trò tin nhắn trong phiên chat. */
export enum ChatRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
}

/** Trạng thái tin nhắn theo OpenAPI AI Chat. */
export enum ChatMessageStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

/** Feedback cho câu trả lời assistant. */
export enum FeedbackValue {
  UP = 'UP',
  DOWN = 'DOWN',
}

/** Trạng thái quán chay (hiển thị công khai / chờ duyệt). */
export enum RestaurantStatus {
  PENDING = 'PENDING',
  PUBLISHED = 'PUBLISHED',
}
