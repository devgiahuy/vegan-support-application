# 3. Câu hỏi hội đồng và tình huống lỗi

Tự nói đáp án thành tiếng trước khi mở cột gợi ý. Câu trả lời tốt có một quy tắc backend, một thay đổi trạng thái và một giới hạn thực tế. Dùng [bản luồng](02_LUONG_NGHIEP_VU.md) để mở file source tương ứng.

## Quyền và nội dung

| # | Câu hội đồng có thể hỏi | Trả lời 30–45 giây |
|---:|---|---|
| 1 | Đăng ký chọn “muốn làm Contributor” đã được đăng bài tự do chưa? | Chưa. User vẫn là `MEMBER`, đơn ở `PENDING`; Admin duyệt thủ công rồi backend đổi role. |
| 2 | Ba `approvalBasis` khác nhau về quyền thế nào? | Không khác. Chúng chỉ lưu căn cứ duyệt và audit. |
| 3 | Contributor có tự xuất bản bài nếu AI không gắn cờ không? | Theo source hiện tại, không. Submit luôn thành `PENDING_REVIEW`; Admin quyết định. Tài liệu BUSINESS_RULES cũ có câu trái với source/SRS. |
| 4 | Vì sao sửa bài đã public không đổi trực tiếp bài đang xem? | Bản public là revision đã duyệt. Edit tạo draft revision mới; bản cũ còn public tới khi duyệt replacement. |
| 5 | Admin có thể tự duyệt nội dung/tạo tác của mình không? | Các luồng review có guard theo actor. Với AI artifact, owner tự verify bị cấm rõ bằng `SELF_VERIFICATION_FORBIDDEN`; cần chỉ đúng rule của từng loại review khi mở code. |
| 6 | AI thấy spam hoặc có 5 report thì tự xóa bài không? | Không. Signal/report có thể tăng mức ưu tiên hoặc tạm ẩn theo policy cụ thể, nhưng quyết định vi phạm/xóa cuối cùng phải có Admin và audit; không hard-delete tự động. |
| 7 | Mỗi người vote nhiều lần để tăng điểm? | Backend dùng uniqueness/idempotency và quyền; client animation/toast không quyết định số vote. |

## Chế độ ăn, dinh dưỡng, thực đơn

| # | Câu hỏi | Trả lời 30–45 giây |
|---:|---|---|
| 8 | User dị ứng đậu phộng nhưng gợi ý hành vi thích món có đậu phộng? | Backend loại món phạm dị ứng trước khi tính điểm. Không có bước ranking nào được phép đưa món đó trở lại. |
| 9 | Tắt một tradition rule có tắt luôn dị ứng không? | Không. Dị ứng/exclusion có ưu tiên riêng và không bị tradition override. |
| 10 | Lịch chay định kỳ khác trường chay thế nào? | Rule theo tradition áp cho ngày lịch được xác nhận theo local date; `ALWAYS` áp liên tục. Với lịch thiếu/khó hiểu, yêu cầu xác nhận thay vì đoán. |
| 11 | Một nguyên liệu chưa chuẩn hóa có được cho vào planner? | Candidate generator hiện yêu cầu recipe `mealPlannerEligible`, calories > 0 và ingredient có canonical ID; món thiếu chuẩn hóa không được chọn để generate plan. Dữ liệu thiếu vẫn phải hiển thị là unknown ở nơi phù hợp, không biến thành 0. |
| 12 | Tạo plan có chắc 21 món không? | Backend tạo 21 **slot** cho 7 ngày × 3 bữa. Slot không có món hard-compatible giữ `UNFILLED` và reason; không phá allergy để lấp chỗ trống. |
| 13 | `targetCalories` từ đâu? | Backend tính từ TDEE đã lưu và goal factor theo config; response trả target/snapshot. Frontend hiển thị target backend, không tự nhân công thức khác. |
| 14 | Đổi món hoặc thêm món làm analysis cũ thế nào? | Plan/version thay đổi làm analysis theo fingerprint cũ stale; lấy lại hoặc phân tích lại. ExpectedVersion/idempotency bảo vệ concurrent edit. |
| 15 | Kết quả nutrition thiếu vitamin B12 nhưng UI hiện 0 có đúng không? | Không. Thiếu dữ liệu phải là “chưa biết”/coverage thấp. Hiện `recipe.mapper.ts` còn default null thành 0, đây là gap frontend cần sửa trước demo dinh dưỡng. |
| 16 | 70 g chất xơ/ngày là giới hạn y khoa? | Không. Đó là ngưỡng thận trọng trong UI hiện tại, có giải thích uống nước; không phải hard constraint hay chẩn đoán. |
| 17 | AI ước lượng dinh dưỡng có được ghi đè dữ liệu chuẩn? | Không. Giá trị AI có origin/assumptions/confidence riêng; canonical data giữ source, license, version và chỉ thay qua quy trình review. |

## Pantry, upload, ảnh tủ lạnh và hóa đơn

| # | Câu hỏi | Trả lời 30–45 giây |
|---:|---|---|
| 18 | Vì sao upload ảnh cần reserve rồi mới commit? | Để giữ quota an toàn khi upload đồng thời; commit dùng kết quả thật, hủy/hết hạn giải phóng phần dự phòng. |
| 19 | Hủy job quét ảnh có hoàn dung lượng ảnh đã commit không? | Không tự động. Asset đã commit tiếp tục được tính và có lifecycle/xóa riêng. |
| 20 | AI nhận ra 2 quả cà chua từ hai góc ảnh, Pantry cộng thành 4? | Không. Candidate cùng identity được gộp và giữ evidence; số lượng không cộng dồn vì có thể là cùng vật được chụp hai lần. User kiểm tra trước confirm. |
| 21 | Hai ảnh hóa đơn chụp cùng dòng thì có mua hai lần? | Backend gộp dòng lặp giữa ảnh; dòng lặp ngay trong cùng một ảnh vẫn có thể là hai dòng hợp lệ. Người dùng rà soát trước confirm. |
| 22 | Provider nhận diện một ảnh lỗi, ảnh khác thành công? | Job có partial status, cho xem phần có được, retry ảnh lỗi theo policy và giữ chỉnh sửa tay. Không khẳng định kết quả đã hoàn hảo. |
| 23 | Có thể thêm ảnh sau khi đã confirm không? | Không. Add-images chỉ cho job chưa confirm và state cho phép; backend chặn state/cap/ownership. |
| 24 | Thêm ảnh trong khi user đang sửa candidate thì sao? | Merge chỉ cập nhật proposal chưa được user sửa; edit/reject có ưu tiên. UI cần giữ form state đang nhập và tải version mới trước confirm. |
| 25 | User chọn candidate thiếu số lượng hoặc đơn vị? | Backend từ chối confirm candidate chưa đủ dữ liệu; UI cần yêu cầu sửa hoặc bỏ chọn, không tự đoán. |
| 26 | Tồn kho đủ trên hóa đơn cũ nhưng hôm nay đã ăn hết thì shopping gap trừ thế nào? | Dựa trên số dư Pantry hiện tại sau các adjustment, không suy từ hóa đơn lịch sử. |
| 27 | Không có conversion “bó” sang gram thì xử lý shopping list ra sao? | Trả unresolved/conversion assumption; không lấy phép trừ sai rồi báo đủ hàng. |
| 28 | Ảnh nhìn có vẻ rau còn tươi, hệ thống bảo đảm an toàn không? | Không. Chỉ ghi quan sát/uncertainty từ ảnh, không chứng nhận an toàn thực phẩm. |

## AI, địa điểm, thanh toán và vận hành

| # | Câu hỏi | Trả lời 30–45 giây |
|---:|---|---|
| 29 | Chat AI mất kết nối giữa câu, có trừ lượt không? | Chỉ câu hoàn tất theo policy mới tính lượt; failure/fallback release reservation tương ứng. Kiểm tra ledger nếu hội đồng yêu cầu chứng minh. |
| 30 | Contributor xác minh một output AI có biến nó thành chuẩn khoa học không? | Không. Verification là ý kiến có evidence, scope, version và audit; promotion vào canonical data là quyết định review riêng. |
| 31 | Vì sao không đưa raw prompt/ảnh hóa đơn vào màn Admin AI? | Quyền riêng tư: log chỉ metadata đã che PII; Admin thấy metrics/signal và thao tác có version/audit. |
| 32 | Google/SerpApi gọi đây là quán chay, có thể kết luận phù hợp dị ứng? | Không. Nhãn provider không phải bằng chứng dietary safety; chỉ dữ liệu nội bộ đã rà soát mới dùng cho hard filtering. |
| 33 | User từ chối location permission thì còn tìm quán được không? | Có thể dùng địa chỉ/tọa độ do user nhập rõ ràng; không tự theo dõi vị trí liên tục. |
| 34 | Thông báo có push/realtime chưa? | Chỉ in-app list, unread count và mark read theo contract hiện tại; không tuyên bố push/email/realtime. |
| 35 | Người dùng về từ payOS với query `success=true` thì cộng credit? | Không. Return chỉ hiển thị. Webhook/query ký hợp lệ, đúng order/số tiền và transaction backend mới grant một lần. |
| 36 | payOS trên dev là tiền giả? | Không. payOS không có sandbox độc lập trong scope này; checkout có thể chuyển tiền thật. Thiếu credentials thì chức năng mua bị tắt. |
| 37 | Hai webhook cùng một order có được cộng hai gói? | Không. Settlement/grant phải idempotent, giao dịch/ledger bảo vệ một lần. |
| 38 | Mua gói có tăng dung lượng ảnh hoặc quyền Contributor? | Không. Gói chỉ tăng các allowance được snapshot (chat/scan/Pantry capacity), không tăng media storage hay role. |

## Cách xử lý khi demo gặp lỗi ngay trước hội đồng

| Hiện tượng | Nói và làm ngay | Điều không nên khẳng định |
|---|---|---|
| 401 hoặc refresh lỗi | Cho thấy session hết hạn; đăng nhập lại tài khoản demo, kiểm tra backend. | “Phân quyền backend bị bỏ qua.” |
| `*_VERSION_CONFLICT` | Tải lại bản mới, so sánh rồi thao tác lại với version hiện hành. | “Cứ bấm lại cùng payload là đủ.” |
| `*_STATE_CONFLICT` | Mở trạng thái job/revision hiện tại, chỉ thao tác khi state cho phép. | “API lỗi ngẫu nhiên.” |
| Provider AI/scan không trả kết quả | Nêu Phase 21/22 `IN_PROGRESS`, xem job/error code và dùng ca dữ liệu đã chuẩn bị. | “AI đã được kiểm chứng tốt trên ảnh thật.” |
| Thiếu profile nên plan bị chặn | Hoàn tất health/diet profile rồi generate lại. | “Planner sẽ đoán số đo.” |
| Không có recipe hợp lệ | Chỉ ra `UNFILLED`/reason và hard constraints; chọn bộ dữ liệu seed khác để minh họa. | “Hệ thống sẽ tự bỏ dị ứng.” |
| Thanh toán chưa xác minh | Xem order `PENDING`, không cộng quyền lợi; giải thích webhook/reconcile. | “Return URL đủ để settle.” |
| Frontend báo thành công khi backend offline | Nêu đây là lỗi fallback fixture hiện tồn tại, không nói dữ liệu đã lưu. Dùng API/DB kiểm tra và ghi lỗi cần sửa. | “Toast success chứng minh backend thành công.” |

## Bài tập tự kiểm tra

1. Vẽ bằng tay 3 state machine: content revision, upload reservation, scan confirmation.
2. Giải thích khác biệt giữa **hard constraint**, **warning**, **recommendation score** bằng một món có allergen và một món vượt mục tiêu calo.
3. Giải thích khác biệt giữa **quota lưu trữ**, **credit scan**, **sức chứa Pantry**.
4. Chỉ vào code vị trí backend kiểm tra self-verification, content submit, diet filter và settlement.
5. Tập trả lời 38 câu ở trên trong 60 giây/câu; đánh dấu câu không thể giải thích mà không nhìn tài liệu để ôn lại buổi sau.
