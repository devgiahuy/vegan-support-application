# Prompt — Phase 13: Restaurants & Google Maps

Triển khai Phase 13 trong repository `/Users/thienel/hhnthienn/fptu/sem8/wdp/vegan-support-application`; session không phụ thuộc lịch sử chat.

Đọc `AGENTS.md`, BL-02/10 trong implementation plan, phase map, Profile/Auth code, OpenAPI và integration guide. Xác minh phases 01 và 02. Kiểm tra git status.

## Mục tiêu

Triển khai restaurant catalog hybrid với Google Places/Geocoding, nearby/search ranking, Member submission và Admin review.

## Scope bắt buộc

- Models/migrations: restaurants, source metadata, field overrides, menu tags/diet compatibility, submissions/review audit.
- Canonical internal restaurant record; dedupe bằng googlePlaceId hoặc normalized name + proximity.
- Nearby 5 km; cho phép client yêu cầu 10/20 km trong giới hạn; tính distance ổn định.
- Food search ranking: tag match → diet compatibility → open now → distance → rating.
- General ranking: distance → verified → open now → rating.
- Google adapter cho Places/Geocoding với timeout/cache/quota failure; server key không lộ client.
- Có provider fake/local cho development; live provider path optional theo secret.
- User submission pending; Admin approve/reject reason.
- Google source/fetchedAt và manual field override rõ; không silent overwrite.
- Khi provider lỗi, trả internal result + `externalDataUnavailable=true`.
- Endpoints nearby/search/detail/submit/geocode/Admin review.

## Acceptance

- Xử lý đầy đủ distance/ranking/dedupe/source precedence/provider failure, invalid coordinates, ownership/Admin review và dietary filtering.
- Không cache/lưu Google data trái với provider policy; ghi rõ strategy trong technical docs nếu cần.
- OpenAPI/integration guide/changelog/phase record cập nhật.
- Lint/typecheck/build pass.

Không triển khai native GPS; backend chỉ nhận coordinate/address theo contract.

Commit duy nhất:

```text
feat(restaurants): add location and maps integration
```

Final báo hash, provider/cache strategy, endpoint READY, gate và live-provider status.
