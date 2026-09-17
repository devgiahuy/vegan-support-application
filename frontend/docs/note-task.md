Đã làm (FE gọi API thật):

Feature UC % Nội dung
Auth UC-01 95% register/login/refresh/logout + /users/me, RBAC, AuthGuard
Hồ sơ + Sức khỏe + Diet UC-13 90% profile, BMI/BMR/TDEE, diet preview/preferences/schedule, avatar upload
Catalog UC-04 75% categories tree, ingredients search/resolve, admin CRUD + alias (13 endpoints)
Content/Media UC-02/05 85/80% recipe/post/video scaffold live-shape, review queue, admin + contributor dashboards
Meal Planner UC-06 95% generate/list/detail/swap/delete (spec 007)
Chat AI UC-07 95% 5 endpoint private + SSE stream + feedback (spec 008)
Recommendations — 90% home/consent/behavior-events + hook fire-and-forget (spec 009)
Nền tảng — — rename routes tiếng Anh, hero Remotion, logo, auth UI redesign
Chưa làm:

Nhóm Trạng thái BE Ghi chú

- Community (11: comments, vote, rating, bookmark) PLANNED Chưa gọi endpoint nào
- Moderation-admin (6) + POST /reports PLANNED Chưa làm
- Contributors nộp/đơn + admin duyệt (4) PLANNED Chưa làm

- DELETE behavior-history PLANNED Ngoài phạm vi 009
- Restaurants/Places BE chưa có endpoint UI mock
- Search Postgres, notifications, AI governance PLANNED Chưa làm
  Nợ chung: test tay trình duyệt MP/AC/RC/VP/VC/VS (gates tự động đều xanh: tsc 0 lỗi, test 137/137, build pass).
