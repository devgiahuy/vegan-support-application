# Dữ liệu seed: dinh dưỡng, công thức, cẩm nang và video

**Cập nhật:** 2026-10-26 · **Phạm vi:** `backend/prisma/seed-data/` — `nutrients.data.ts`, `ingredients.data.ts`, `recipes.data.ts`, `custom-meals.data.ts`, `media-assets.data.ts`, `composition.data.ts`, `handbooks.data.ts`, `videos.data.ts`, `seeder.ts`.

## 1. Nguồn dữ liệu

| Dữ liệu | Nguồn | Giấy phép | Phiên bản / mã nguồn trong DB |
|---|---|---|---|
| Giá trị dinh dưỡng / 100 g nguyên liệu | [USDA FoodData Central](https://fdc.nal.usda.gov/) — SR Legacy, file `FoodData_Central_sr_legacy_food_csv_2018-04` | Public domain / CC0 1.0 | `USDA_FDC`, `SR Legacy 2018-04`, import batch `seed-sr-legacy-2018-04` |
| Quy đổi đơn vị (muỗng canh, quả, cốc…) | Bảng `food_portion` cùng bản SR Legacy (`USDA_PORTION`); vài mục là ước lượng bếp gia đình (`HOUSEHOLD_ESTIMATE`, chất lượng ESTIMATED) | Public domain | như trên |
| Nhu cầu khuyến nghị (RDA/AI/UL/CDRR) | NASEM Dietary Reference Intakes (1997–2019), bảng tóm tắt NIH ODS; người lớn 19–50 tuổi theo giới | Số liệu tham chiếu công khai, ghi nguồn NASEM | `NASEM_DRI`, `NASEM DRI 1997-2019` |
| Quy tắc kết hợp thực phẩm (2 quy tắc tư vấn, không lọc món) | Hallberg et al. 1989 (vitamin C – sắt non-heme); Young & Pellett 1994, Melina et al. 2016 (đạm thực vật bổ sung trong ngày) | Tóm tắt do dự án viết, CC0 | `PROJECT_DEMO_V1`, `2.0` |
| Ảnh bìa công thức | Wikimedia Commons (xem mục 4) | CC0 / CC BY / CC BY-SA | — |

Ghi chú:
- Giá trị được chép nguyên từ USDA, không làm tròn. Nguyên liệu `match: 'PROXY'` dùng bản ghi USDA gần nhất (ghi rõ lý do trong `note`) và lưu chất lượng ESTIMATED.
- Nguyên liệu không có bản ghi công khai (tàu hũ ky, bánh tráng, nấm rơm tươi, hoa hồi, men dinh dưỡng, hạt nêm nấm) **không có hồ sơ dinh dưỡng**; khi tính món sẽ hiện là nguyên liệu chưa bao phủ. Men dinh dưỡng phải lấy B12 theo nhãn từng hãng.
- Không dùng số liệu Bảng thành phần thực phẩm Việt Nam 2017 vì chưa xác nhận quyền số hóa (theo `docs/FOOD_DATA_SOURCES.md`).
- Giá trị DRI được chép từ bảng NASEM; trang NIH ODS chặn truy cập tự động nên chưa đối chiếu lại trực tiếp — nên kiểm tra lại một lượt khi rà soát.
- Omega-3 lấy ALA (USDA 1404); nếu thiếu thì dùng PUFA 18:3 tổng (USDA 1270) và ghi trong `nutrientNotes`. Folate dùng DFE (1190), thiếu thì folate thực phẩm (1187).

## 2. Những gì đã thay đổi

- **Nguyên liệu (91, trước là 58):** giữ nguyên toàn bộ `normalizedName` cũ (kể cả `nam huong`, `hanh boaro`, `hanh la` mà `users.data.ts` dùng, và các tên pantry/seed.ts dùng); đổi tên chuẩn về tên chung (bỏ "Bình Phước", "ST25", "034"…); sửa alias sai (`xì dầu` chuyển từ tamari sang nước tương thường; bỏ `cơm trắng`/`chén cơm` khỏi gạo sống). Thêm 33 nguyên liệu cần cho công thức thật: muối, đường, dầu hạt cải, dầu ô liu, nước tương, tương đen, bơ đậu phộng, sữa đậu nành, giá, đậu bắp, dưa leo, xà lách, khoai tây, ớt chuông, củ sắn, bắp cải, đậu que, đậu Hà Lan, tỏi, chanh dây, me, chà là, húng quế, húng lủi, ớt, tiêu, nghệ, bột cà ri, quế, hoa hồi, bánh mì, bánh tráng, giấm.
- **Dị ứng:** gắn theo nguyên liệu (SOY cho đậu nành và chế phẩm; PEANUT cho đậu phộng, bơ đậu phộng; TREE_NUT cho hạt điều; SESAME cho mè, dầu mè; GLUTEN cho yến mạch, bánh mì, nước tương thường, tương đen). Ngũ vị tân (hành lá, hành boaro, tỏi) gắn cảnh báo Phật giáo.
- **Nutrients:** 22 vi chất theo đúng đơn vị USDA; đổi tên Vitamin A (RAE), Folate (DFE), Đường tổng số. Bỏ "RDA năng lượng" (năng lượng không có RDA; meal planner dùng TDEE).
- **Công thức (25, giữ nguyên slug):** viết lại định lượng thật (gạo, đậu ghi khối lượng khô), các bước nấu, khẩu phần; bỏ các tuyên bố sức khỏe trong tiêu đề ("an thần", "dưỡng nhan", "detox"). Calo, macro, mã dị ứng, cảnh báo truyền thống và tương thích chế độ ăn **được seeder tự tính từ danh mục nguyên liệu**, không còn nhập tay. Nội dung mới được đăng thành revision mới (giữ lịch sử revision cũ).
- **Ước tính dinh dưỡng món:** `CANONICAL_CALCULATED`, cộng từ nguyên liệu sống, chưa áp hệ số hao hụt nấu; ghi nguồn từng FDC ID, giả định, nguyên liệu chưa bao phủ, sai số ±15 %.
- **Custom meals:** 3 món mẫu với số liệu khớp tổng USDA; bỏ đậu phộng khỏi món của `member@example.com` (user này dị ứng đậu phộng).
- **Thành phần (composition):** thêm 22 nguyên liệu đơn vào whitelist demo (tổng 66).
- **Dữ liệu cũ:** hồ sơ `PROJECT_DEMO_V1` v1.0 (`profile-*`), DRI cũ (`ref-*`) và quy tắc tương tác v1.0 được đánh dấu SUPERSEDED, không xóa. Hồ sơ demo `demo-tofu-raw`/`demo-broccoli-raw` của `prisma/seed.ts` không đổi (nằm ngoài phạm vi), nhưng hồ sơ USDA mới có `effectiveFrom` muộn hơn nên được ưu tiên khi tính.
- **Frontend:** thêm `upload.wikimedia.org` vào `next.config.ts` và `src/lib/safe-image.ts`.

## 3. Ánh xạ nguyên liệu → USDA

| normalizedName | FDC ID | Khớp | Mô tả USDA |
|---|---|---|---|
| dau hu | 172476 | EXACT | Tofu, raw, regular, prepared with calcium sulfate |
| dau hu non | 172449 | EXACT | Tofu, soft, prepared with calcium sulfate and magnesium chloride (nigari) |
| dau hu ky | — | không có hồ sơ |  |
| dau ga | 173756 | EXACT | Chickpeas (garbanzo beans, bengal gram), mature seeds, raw |
| dau lang | 174284 | EXACT | Lentils, pink or red, raw |
| dau den | 173734 | PROXY | Beans, black, mature seeds, raw |
| dau do | 173727 | EXACT | Beans, adzuki, mature seeds, raw |
| dau xanh | 174256 | PROXY | Mung beans, mature seeds, raw |
| suon non chay | 174275 | PROXY | Soy flour, defatted |
| tempeh | 174272 | EXACT | Tempeh |
| chao trang | 174305 | EXACT | Tofu, salted and fermented (fuyu), prepared with calcium sulfate |
| sua dau nanh | 172446 | EXACT | Soymilk, original and vanilla, unfortified |
| dau ha lan | 170419 | EXACT | Peas, green, raw |
| gao lut | 169703 | EXACT | Rice, brown, long-grain, raw (Includes foods for USDA's Food Distribution Program) |
| gao st25 | 169756 | EXACT | Rice, white, long-grain, regular, raw, unenriched |
| yen mach | 173904 | EXACT | Cereals, oats, regular and quick, not fortified, dry |
| quinoa | 168874 | EXACT | Quinoa, uncooked |
| banh pho | 168914 | PROXY | Rice noodles, cooked |
| bun tuoi | 168914 | PROXY | Rice noodles, cooked |
| mien dong | 174258 | PROXY | Noodles, chinese, cellophane or long rice (mung beans), dehydrated |
| banh mi | 172675 | PROXY | Bread, french or vienna (includes sourdough) |
| banh trang | — | không có hồ sơ |  |
| dau phong | 172430 | EXACT | Peanuts, all types, raw |
| bo dau phong | 172470 | EXACT | Peanut butter, smooth style, without salt |
| hat dieu | 170162 | EXACT | Nuts, cashew nuts, raw |
| hat chia | 170554 | EXACT | Seeds, chia seeds, dried |
| hat sen | 168591 | EXACT | Seeds, lotus seeds, raw |
| hat bi | 170556 | EXACT | Seeds, pumpkin and squash seed kernels, dried |
| me trang | 170150 | EXACT | Seeds, sesame seeds, whole, dried |
| nam huong | 169242 | EXACT | Mushrooms, shiitake, raw |
| nam dui ga | 168580 | PROXY | Mushrooms, oyster, raw |
| nam bao ngu | 168580 | EXACT | Mushrooms, oyster, raw |
| nam rom | — | không có hồ sơ |  |
| nam kim cham | 169382 | EXACT | Mushrooms, enoki, raw |
| moc nhi | 168581 | EXACT | Fungi, Cloud ears, dried |
| bong cai xanh | 170379 | EXACT | Broccoli, raw |
| cai thia | 170390 | EXACT | Cabbage, chinese (pak-choi), raw |
| cai bo xoi | 168462 | EXACT | Spinach, raw |
| rau muong | 169301 | EXACT | Water convolvulus,raw |
| ca rot | 170393 | EXACT | Carrots, raw |
| cu cai trang | 168451 | EXACT | Radishes, oriental, raw |
| bi do | 168448 | EXACT | Pumpkin, raw |
| ca chua | 170457 | EXACT | Tomatoes, red, ripe, raw, year round average |
| ca tim | 169228 | EXACT | Eggplant, raw |
| kho qua | 168393 | EXACT | Balsam-pear (bitter gourd), pods, raw |
| bap ngot | 169998 | EXACT | Corn, sweet, yellow, raw |
| khoai lang | 168482 | EXACT | Sweet potato, raw, unprepared (Includes foods for USDA's Food Distribution Program) |
| khoai mon | 169308 | EXACT | Taro, raw |
| mang tay | 168389 | EXACT | Asparagus, raw |
| bo sap | 171707 | PROXY | Avocados, raw, Florida |
| dua leo | 168409 | EXACT | Cucumber, with peel, raw |
| gia do | 169957 | EXACT | Mung beans, mature seeds, sprouted, raw |
| dau bap | 169260 | EXACT | Okra, raw |
| xa lach | 169249 | EXACT | Lettuce, green leaf, raw |
| khoai tay | 170026 | EXACT | Potatoes, flesh and skin, raw |
| ot chuong do | 170108 | EXACT | Peppers, sweet, red, raw |
| cu san | 170073 | EXACT | Yambean (jicama), raw |
| bap cai | 169975 | EXACT | Cabbage, raw |
| dau que | 169961 | EXACT | Beans, snap, green, raw |
| toi | 169230 | EXACT | Garlic, raw |
| chuoi | 173944 | EXACT | Bananas, raw |
| dua mat | 169124 | EXACT | Pineapple, raw, all varieties |
| chanh tuoi | 168155 | EXACT | Limes, raw |
| chanh day | 169108 | EXACT | Passion-fruit, (granadilla), purple, raw |
| me chua | 167763 | EXACT | Tamarinds, raw |
| cha la | 168191 | EXACT | Dates, medjool |
| hanh boaro | 169246 | EXACT | Leeks, (bulb and lower leaf-portion), raw |
| hanh la | 170005 | EXACT | Onions, spring or scallions (includes tops and bulb), raw |
| ngo ri | 169997 | EXACT | Coriander (cilantro) leaves, raw |
| sa cay | 168573 | EXACT | Lemon grass (citronella), raw |
| gung gia | 169231 | EXACT | Ginger root, raw |
| rau hung que | 172232 | PROXY | Basil, fresh |
| rau hung lui | 173475 | PROXY | Spearmint, fresh |
| ot | 170106 | EXACT | Peppers, hot chili, red, raw |
| tieu den | 170931 | EXACT | Spices, pepper, black |
| nghe | 172231 | EXACT | Spices, turmeric, ground |
| bot ca ri | 170924 | EXACT | Spices, curry powder |
| que | 171320 | PROXY | Spices, cinnamon, ground |
| hoa hoi | — | không có hồ sơ |  |
| men dinh duong | — | không có hồ sơ |  |
| nuoc tuong tamari | 174278 | EXACT | Soy sauce made from soy (tamari) |
| nuoc tuong | 174277 | EXACT | Soy sauce made from soy and wheat (shoyu) |
| tuong den | 172886 | EXACT | Sauce, hoisin, ready-to-serve |
| hat nem nam | — | không có hồ sơ |  |
| dau me | 171016 | EXACT | Oil, sesame, salad or cooking |
| dau hat cai | 172336 | EXACT | Oil, canola |
| dau oliu | 171413 | EXACT | Oil, olive, salad or cooking |
| nuoc cot dua | 170172 | EXACT | Nuts, coconut milk, raw (liquid expressed from grated meat and water) |
| muoi | 173468 | EXACT | Salt, table |
| duong | 169655 | EXACT | Sugars, granulated |
| giam | 172237 | PROXY | Vinegar, distilled |

## 4. Ảnh công thức

### Ảnh đã dùng từ Wikimedia Commons (đã xem trực tiếp, đúng món chay)

Ảnh CC BY / CC BY-SA cần hiển thị ghi công (tác giả + giấy phép) nếu đưa ra công khai; dữ liệu ghi công nằm trong `coverMedia.credit` của `recipes.data.ts` (hiện frontend chưa hiển thị).

| Công thức | File Commons | Tác giả | Giấy phép |
|---|---|---|---|
| `pho-chay-ha-noi` | [Tofu noodle soup (Phở chay) - Pho Hanoi Authentic 2024-12-01.jpg](https://commons.wikimedia.org/wiki/File:Tofu_noodle_soup_(Ph%E1%BB%9F_chay)_-_Pho_Hanoi_Authentic_2024-12-01.jpg) | Andy Li | CC0 |
| `goi-cuon-chay-ngu-sac` | [Gỏi Cuốn Chay Vietnamese Fresh Vegetarian Spring Roll 2019-1599.jpg](https://commons.wikimedia.org/wiki/File:G%E1%BB%8Fi_Cu%E1%BB%91n_Chay_Vietnamese_Fresh_Vegetarian_Spring_Roll_2019-1599.jpg) | Paul R. Burley | CC BY-SA 4.0 |
| `banh-mi-chay-pate-nam` | [Bánh mì đậu hũ.jpg](https://commons.wikimedia.org/wiki/File:B%C3%A1nh_m%C3%AC_%C4%91%E1%BA%ADu_h%C5%A9.jpg) (bánh mì chay đậu hũ, minh họa) | Nguyentrongphu | CC BY-SA 4.0 |
| `sinh-to-xanh-cai-bo-xoi-chuoi` | [Green smoothie.jpg](https://commons.wikimedia.org/wiki/File:Green_smoothie.jpg) | Joanna Slodownik | CC BY 2.0 |
| `ca-tim-kho-dau-hu-com-lut` | [Eggplant with tofu 01.jpg](https://commons.wikimedia.org/wiki/File:Eggplant_with_tofu_01.jpg) | FBenjr123 | CC BY-SA 4.0 |
| `com-dau-lang-ca-tim-nuong` | [Curried Lentils with Potatoes on Rice (3899524434).jpg](https://commons.wikimedia.org/wiki/File:Curried_Lentils_with_Potatoes_on_Rice_(3899524434).jpg) (minh họa đậu lăng với cơm) | Mack Male | CC BY-SA 2.0 |

### Danh sách ảnh cần lấy thủ công

Trường cần cập nhật là `coverMedia` (`secureUrl`, `publicId`, `width`, `height`, `bytes`, và `credit` nếu là ảnh giấy phép mở) trong `backend/prisma/seed-data/recipes.data.ts`; nếu lưu file local thì đặt vào `frontend/public/seed/recipes/` và thêm mục tương ứng trong `media-assets.data.ts`.

| Công thức (slug) | Tình trạng hiện tại | Gợi ý từ khóa tìm ảnh |
|---|---|---|
| `com-chien-trai-dua` | **Đã có** (người dùng cung cấp, 2026-10-26) | "cơm chiên dứa chay", "vegan pineapple fried rice cashew" |
| `yen-mach-qua-dem-chuoi-chia` | **Đã có** (người dùng cung cấp, 2026-10-26) | "overnight oats banana chia jar", "yến mạch ngâm chuối" |
| `chao-quinoa-bi-do-hat-bi` | **Đã có** (người dùng cung cấp, 2026-10-26) | "pumpkin quinoa porridge", "cháo bí đỏ quinoa" |
| `com-lut-dau-hu-cai-bo-xoi-bua-sang` | **Đã có** (người dùng cung cấp, 2026-10-26) | "brown rice tofu spinach bowl", "cơm lứt đậu hũ" |
| `chao-hat-sen-dau-do-yen-mach` | **Đã có** (người dùng cung cấp, 2026-10-26) | "chè đậu đỏ hạt sen", "red bean lotus seed porridge" |
| `com-lut-tempeh-bong-cai` | **Đã có** (người dùng cung cấp, 2026-10-26) | "tempeh broccoli brown rice bowl" |
| `pho-xao-nam-dau-hu-cai-thia` | **Đã có** (người dùng cung cấp, 2026-10-26) | "phở xào chay", "vegan stir fried rice noodles tofu bok choy" |
| `ham-dau-den-bi-do-quinoa` | **Đã có** (người dùng cung cấp, 2026-10-26) | "black bean pumpkin stew quinoa" |
| `com-tempeh-mang-tay-nam` | **Đã có** (người dùng cung cấp, 2026-10-26) | "tempeh asparagus mushroom rice" |
| `bun-bo-hue-chay` | Ảnh local cũ, **chưa rõ nguồn/giấy phép** (giống ảnh chụp màn hình video) | "bún bò Huế chay", "vegetarian bun bo hue" |
| `ca-ri-chay-khoai-nam` | Ảnh local cũ, chưa rõ nguồn | "cà ri chay nước cốt dừa", "vietnamese vegetarian curry sweet potato" |
| `nam-dong-co-kho-tieu` | Ảnh local cũ, chưa rõ nguồn | "nấm đông cô kho", "braised shiitake mushrooms vegan" |
| `canh-chua-chay-nam-bo` | Ảnh local cũ, chưa rõ nguồn | "canh chua chay", "vegetarian canh chua tofu okra" |
| `sup-bi-do-kem-dua` | Ảnh local cũ, chưa rõ nguồn, độ phân giải thấp (586×341) | "pumpkin coconut soup pumpkin seeds" |
| `chao-yen-mach-nam-huong` | Ảnh local cũ, chưa rõ nguồn | "oat congee shiitake", "cháo yến mạch nấm" |
| `salad-bo-dau-ga` | Ảnh local cũ, chưa rõ nguồn | "chickpea avocado salad passion fruit" |
| `sua-hat-sen-dau-do` | Ảnh local cũ, chưa rõ nguồn | "sữa hạt sen đậu đỏ", "lotus seed red bean milk" |
| `quinoa-dau-ga-rau-cu-nuong` | **Đã có** (người dùng cung cấp, 2026-10-26) | "roasted vegetable quinoa chickpea bowl" |
| `ca-ri-dau-hu-khoai-lang-com` | **Đã có** (người dùng cung cấp, 2026-10-26) | "tofu sweet potato curry rice" |

Ảnh nguyên liệu: danh mục nguyên liệu hiện không có trường ảnh nên không cần lấy.

## 5. Cẩm nang và video (cập nhật 2026-10-26)

### Cẩm nang (5 bài, `handbooks.data.ts`)
Viết lại nội dung dựa trên nguồn có trích dẫn; mọi con số khớp dữ liệu USDA và DRI NASEM đã seed. Giữ 4 slug cũ (comment/bookmark trong `community.data.ts` vẫn trỏ đúng), thêm 1 bài.

| Slug | Nội dung | Nguồn chính |
|---|---|---|
| `cam-nang-bo-sung-vitamin-b12` | Nhu cầu B12, nguồn không đáng tin (pseudo-B12), thực phẩm tăng cường, viên bổ sung | NASEM 1998, NIH ODS, Watanabe 2014 |
| `toi-uu-nguon-dam-thuc-vat` | RDA protein, bảng đạm thực phẩm chay (USDA), phối hợp đậu – ngũ cốc trong ngày | NASEM 2005, Young & Pellett 1994, Melina 2016 |
| `bi-quyet-meal-prep-7-ngay` | Nấu sẵn theo thành phần, bảo quản 4°C/-18°C, 3–4 ngày | USDA FSIS, FDA |
| `phan-biet-cac-truong-phai-an-chay` | Thuần chay, chay trứng sữa, chay Phật giáo (ngũ vị tân), lộ trình chuyển đổi, dị ứng | Melina 2016 |
| `sat-canxi-kem-omega-3-nguoi-an-chay` (mới) | Nhu cầu và nguồn sắt, canxi, kẽm, ALA; mẹo tăng hấp thu | NASEM 2001/2011, Hallberg 1989, USDA |

### Video (7 video YouTube công khai, `videos.data.ts`)
Bỏ các `youtubeId` giả và file mp4 local; mỗi video là link YouTube thật đã kiểm tra qua YouTube oEmbed, ảnh bìa là thumbnail của chính YouTube (`i.ytimg.com/vi/<id>/hqdefault.jpg`). Ứng dụng chỉ lưu link và mô tả, không lưu lại video.

| Slug | Video | Kênh | Thời lượng |
|---|---|---|---|
| `video-nuoc-dung-pho-chay` | [o0ZzxoezMqI](https://www.youtube.com/watch?v=o0ZzxoezMqI) Phở chay – bí quyết nước dùng | Dzoãn Cẩm Vân | 18:26 |
| `video-15-phut-bua-toi-chay` | [A3XbRsGffI0](https://www.youtube.com/watch?v=A3XbRsGffI0) Đậu hũ xào sả ớt nấm rơm | TÚ LÊ MIỀN TÂY | 7:09 |
| `video-sua-hat-sen-dau-do` | [5Yuko8btRrY](https://www.youtube.com/watch?v=5Yuko8btRrY) Sữa hạt sen | TÚ LÊ MIỀN TÂY | 7:37 |
| `video-bun-hue-chay` (mới) | [3t9-zaDhA1o](https://www.youtube.com/watch?v=3t9-zaDhA1o) Bún Huế chay | Ghiền nấu ăn | 9:34 |
| `video-ca-ri-chay` (mới) | [LIahLgoRtuo](https://www.youtube.com/watch?v=LIahLgoRtuo) Cà ri chay 30 phút | Ghiền nấu ăn | 7:38 |
| `video-an-chay-truong-thieu-chat-gi` (mới) | [i7yrc9zT84U](https://www.youtube.com/watch?v=i7yrc9zT84U) Ăn chay trường thiếu chất gì | Video AloBacsi | 17:28 |
| `video-lieu-vitamin-b12` (mới) | [wY4vEBilWN4](https://www.youtube.com/watch?v=wY4vEBilWN4) The Optimal Vitamin B12 Dosage for Adults | NutritionFacts.org | 5:57 |

Lưu ý: slug `video-15-phut-bua-toi-chay` giữ nguyên để không đổi URL, nhưng nội dung giờ là món đậu hũ xào nhanh.

### Ảnh bìa cẩm nang từ Wikimedia Commons

| Cẩm nang | File Commons | Tác giả | Giấy phép |
|---|---|---|---|
| `cam-nang-bo-sung-vitamin-b12` | [Nutritional Yeast in Bag (32664238868).jpg](https://commons.wikimedia.org/wiki/File:Nutritional_Yeast_in_Bag_(32664238868).jpg) | Tony Webster | CC BY 2.0 |
| `toi-uu-nguon-dam-thuc-vat` | [Liat Portal for Foodie Disorder - Assorted Legumes.jpg](https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Assorted_Legumes.jpg) | Liat Portal (HaJunkiyada) | CC BY-SA 4.0 |
| `phan-biet-cac-truong-phai-an-chay` | [Saigon Vegetarian food.jpg](https://commons.wikimedia.org/wiki/File:Saigon_Vegetarian_food.jpg) | Takeaway | CC BY-SA 3.0 |

### Cần lấy thủ công (cẩm nang/video)

| Mục | Trường | Tình trạng | Gợi ý từ khóa |
|---|---|---|---|
| `sat-canxi-kem-omega-3-nguoi-an-chay` | `coverMedia` trong `handbooks.data.ts` | **Đã có** (người dùng cung cấp, `cdn.diag.vn`, 2026-10-26) | "iron rich plant foods", "đậu lăng hạt bí cải bó xôi", "chia seeds sesame tofu" |
| `bi-quyet-meal-prep-7-ngay` | `coverMedia` | **Đã có** (người dùng cung cấp, `weeknightbite.com`, 2026-10-26) | "vegan meal prep containers", "hộp cơm chay chuẩn bị trước" |

Video: không có mục cần lấy thủ công. Các file mp4 cũ trong `frontend/public/seed/videos/` không còn được seed tham chiếu (giữ nguyên trên đĩa); có thể xóa nếu không dùng cho mục đích khác.

## 6. Kiểm tra đã chạy

- `npm run seed` chạy 2 lần liên tiếp thành công; lần 2 không tạo revision hay ước tính mới (idempotent) cho công thức, cẩm nang và video.
- Backend `npm run lint`, `npm run typecheck`, `npm run build`; `git diff --check`.
