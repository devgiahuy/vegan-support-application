# PROGRESS — Lịch sử & % hoàn thành theo task / chức năng

> File duy nhất để trả lời "xong bao nhiêu %". Agent BẮT BUỘC cập nhật sau mỗi task (xem `ARCHITECTURE.md` mục 7).
> Phạm vi MVP: xem `SRS_Vegan_Support_Application.md` PHỤ LỤC B.

## Cách tính % (thống nhất, tránh đoán mò)

Mỗi feature MVP = 100%, chia theo 7 bước scaffold (`ARCHITECTURE.md` mục 5):

| Bước                                                            | Trọng số |
| --------------------------------------------------------------- | -------- |
| UI route + components (loading/error/empty, tiếng Việt, shadcn) | 30%      |
| DTO + Model interfaces                                          | 10%      |
| Mapper (`pickField` + `safe*`, full field)                      | 20%      |
| API (`api-endpoints` + `api/*.api.ts`, không leak DTO)          | 15%      |
| Queries (Key Factory + hooks, invalidate)                       | 10%      |
| Form/schema + phân quyền/RBAC (nếu có)                          | 5%       |
| Verify (`tsc --noEmit`, `npm test`, `npm run build` + test tay) | 10%      |

- Chỉ tick % khi bước đó đã merge vào cây làm việc (không tính code nháp).
- Task docs (SRS/ARCHITECTURE) tính riêng: 100% = đã sửa + đã đọc lại file sau sửa.

## Bảng tổng (cập nhật sau mỗi task)

| #   | Task / Chức năng (MVP)                                                                | UC          | %    | Trạng thái | Ghi chú                                                       |
| --- | ------------------------------------------------------------------------------------- | ----------- | ---- | ---------- | ------------------------------------------------------------- |
| 0   | Nền tảng: shell, providers, axios/auth-token/server-fetch, mapper core, api-endpoints | —           | 60%  | Đang làm   | Còn thiếu Cloudinary + search Postgres                        |
| 1   | Auth UC-01 (login/register/Google, onboarding `dietSchool`)                           | UC-01       | 50%  | Đang làm   | UI có `/login`, `/onboarding`; thiếu API thật + OTP           |
| 2   | Blog/Post UC-02 + ảnh Cloudinary                                                      | UC-02       | 40%  | Đang làm   | UI `bai-viet/*` có; thiếu upload Cloudinary + Mapper/API thật |
| 3   | Comment/Vote UC-03                                                                    | UC-03       | 20%  | Chưa xong  | Mới có `comment-section` shared                               |
| 4   | Tìm kiếm UC-04 (Postgres, phân trang)                                                 | UC-04       | 30%  | Đang làm   | UI `/tim-kiem`, `/cong-thuc` có; thiếu API search thật        |
| 5   | Upload video UC-05 (Cloudinary ≤100MB)                                                | UC-05       | 30%  | Đang làm   | UI `/video/*` có; thiếu upload Cloudinary + BE                |
| 6   | Menu rule-based UC-06 (nhập tay)                                                      | UC-06       | 30%  | Đang làm   | UI `/ke-hoach-bua-an` có; thiếu API tính BMI/BMR              |
| 7   | Chatbot UC-07 (LLM trực tiếp + disclaimer)                                            | UC-07       | 20%  | Chưa xong  | UI `/tro-ly-ai` có; thiếu API LLM                             |
| 8   | Quán ăn UC-12 (Maps JS + Places, web)                                                 | UC-12       | 30%  | Đang làm   | UI `/ban-do` có; thiếu Places + seed 30 quán                  |
| 9   | Sức khỏe UC-13 (nhập tay)                                                             | UC-13       | 20%  | Chưa xong  | UI `/ho-so` có; thiếu API HealthProfile                       |
| 10  | Moderation tay UC-11 + Contributor UC-16/17 gọn                                       | UC-11/16/17 | 20%  | Chưa xong  | UI `/admin` có; thiếu review queue + duyệt role               |
| 11  | Docs: SRS v1.4 MVP, ARCHITECTURE mapper rule, PROGRESS + WORK-LOG                     | —           | 100% | Xong       | Ngày 2026-09-15                                               |

## Lịch sử cập nhật (mỗi dòng = 1 lần agent sửa %)

| Ngày (UTC) | Task                   | % cũ → % mới  | Lý do                                                                    |
| ---------- | ---------------------- | ------------- | ------------------------------------------------------------------------ |
| 2026-09-15 | Khởi tạo file PROGRESS | — → bảng trên | Seed lần đầu từ UI hiện có (mock); agent phải rà soát lại ở task kế tiếp |
