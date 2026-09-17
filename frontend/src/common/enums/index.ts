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

/** Quyết định kiểm duyệt nội dung (Content Review). */
export enum ReviewDecision {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

/** Trạng thái mục trong hàng chờ kiểm duyệt (backend PostRevisionStatus subset). */
export enum ReviewItemStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  FLAGGED = 'FLAGGED',
  QUARANTINED = 'QUARANTINED',
}

/** Độ ưu tiên xử lý kiểm duyệt. */
export enum ModerationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

/** Mục tiêu thực đơn tuần (`GenerateMealPlanRequest.goal`). */
export enum MealPlanGoal {
  MAINTAIN = 'MAINTAIN',
  LOSE = 'LOSE',
  GAIN = 'GAIN',
}

/** Chất lượng dữ liệu dinh dưỡng của thực đơn (`MealPlanResponse.nutritionDataQuality`). */
export enum NutritionDataQuality {
  COMPLETE = 'COMPLETE',
  PARTIAL = 'PARTIAL',
  UNAVAILABLE = 'UNAVAILABLE',
}

/** Bữa trong ngày của ô thực đơn. */
export enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
}

/** Vai trò tin nhắn chat. */
export enum ChatRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
}

/** Trạng thái tin nhắn chat (`COMPLETE` từ BE; `STREAMING`/`FAILED` chỉ ở local). */
export enum ChatMessageStatus {
  COMPLETE = 'COMPLETE',
  STREAMING = 'STREAMING',
  FAILED = 'FAILED',
}

/** Giá trị đánh giá câu trả lời (`ChatFeedbackRequest.value`). */
export enum FeedbackValue {
  UP = 'UP',
  DOWN = 'DOWN',
}

/** Loại sở hữu phiên chat. */
export enum ChatOwnerType {
  AUTHENTICATED = 'AUTHENTICATED',
  GUEST = 'GUEST',
}

/** Loại behavior event (`CreateBehaviorEventRequest.type`). */
export enum BehaviorEventType {
  SEARCH = 'SEARCH',
  VIEW_RECIPE = 'VIEW_RECIPE',
  BOOKMARK = 'BOOKMARK',
  RATE = 'RATE',
  CHAT_TOPIC = 'CHAT_TOPIC',
  ACCEPT_MEAL = 'ACCEPT_MEAL',
  SWAP_MEAL = 'SWAP_MEAL',
  REJECT_MEAL = 'REJECT_MEAL',
}

/** Trạng thái bình luận cộng đồng. */
export enum CommentStatus {
  VISIBLE = 'VISIBLE',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
}

/** Loại mục tiêu bị báo cáo (user-facing, khác enum admin). */
export enum ReportTargetKind {
  POST = 'POST',
  COMMENT = 'COMMENT',
}

/** Mã lý do báo cáo vi phạm (`createModerationReport.reasonCode`). */
export enum ReportReasonCode {
  SPAM = 'SPAM',
  HARMFUL_HEALTH = 'HARMFUL_HEALTH',
  HARASSMENT = 'HARASSMENT',
  MISINFORMATION = 'MISINFORMATION',
  COPYRIGHT = 'COPYRIGHT',
  OTHER = 'OTHER',
}

/** Quyết định kiểm duyệt báo cáo (`resolveModerationReportAdmin.decision`). */
export enum ModerationDecision {
  NO_VIOLATION = 'NO_VIOLATION',
  WARN = 'WARN',
  HIDE = 'HIDE',
  RESTORE = 'RESTORE',
  DEMOTE = 'DEMOTE',
  BAN = 'BAN',
}

/** Trạng thái báo cáo kiểm duyệt. */
export enum ReportStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
}

/** Loại mục tiêu bị báo cáo. */
export enum ReportTargetType {
  POST = 'POST',
  COMMENT = 'COMMENT',
}
