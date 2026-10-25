import type { SeedImageCredit } from './recipes.data.js';

export interface SeedHandbookDefinition {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  categorySlug: string;
  authorEmail: string;
  tags: string[];
  /** `null` when no suitably licensed cover exists yet (see docs/SEED_NUTRITION_RECIPE_DATA.md). */
  coverMedia: {
    publicId: string;
    secureUrl: string;
    width: number;
    height: number;
    bytes: number;
    credit?: SeedImageCredit;
  } | null;
}

// Numbers quoted in the articles match the NASEM DRI values seeded in nutrients.data.ts and the
// USDA FoodData Central SR Legacy values seeded in ingredients.data.ts.
export const handbookDefinitions: readonly SeedHandbookDefinition[] = [
  {
    slug: 'cam-nang-bo-sung-vitamin-b12',
    title: 'Vitamin B12 Cho Người Ăn Thuần Chay: Nhu Cầu, Nguồn Và Cách Bổ Sung',
    excerpt:
      'Vì sao người ăn thuần chay cần chủ động bổ sung B12, nhu cầu mỗi ngày là bao nhiêu và chọn nguồn nào cho đáng tin.',
    body: `Vitamin B12 (cobalamin) cần cho quá trình tạo hồng cầu, tổng hợp DNA và duy trì hệ thần kinh. B12 do vi khuẩn tổng hợp; thực phẩm thực vật chưa bổ sung gần như không chứa B12 có hoạt tính. Trong bảng USDA FoodData Central, đậu hũ, gạo lứt, rau xanh và các loại đậu đều ghi B12 bằng 0.

### 1. Nhu cầu khuyến nghị
- Người trưởng thành 19–50 tuổi: 2,4 mcg/ngày (RDA của Viện Hàn lâm Khoa học Hoa Kỳ – NASEM).
- Phụ nữ mang thai: 2,6 mcg/ngày; cho con bú: 2,8 mcg/ngày.
- Cơ thể dự trữ B12 ở gan nên triệu chứng thiếu có thể xuất hiện sau vài năm; thiếu kéo dài gây thiếu máu hồng cầu to và tổn thương thần kinh khó hồi phục.

### 2. Những nguồn không đáng tin
- Tảo spirulina, rong biển nori và nhiều thực phẩm lên men chủ yếu chứa các dạng tương tự B12 (pseudo-B12) không có hoạt tính ở người.
- Rau chưa rửa kỹ hay nước giếng không phải nguồn ổn định và không an toàn.

### 3. Nguồn nên dùng
1. **Thực phẩm tăng cường:** sữa thực vật, ngũ cốc ăn sáng hoặc men dinh dưỡng có ghi "bổ sung vitamin B12" trên nhãn. Hàm lượng khác nhau theo từng hãng, cần đọc bảng thành phần.
2. **Viên bổ sung:** dạng cyanocobalamin là dạng được nghiên cứu nhiều và bền nhất. Vì khả năng hấp thu giảm khi liều lớn, các khuyến nghị cho người thuần chay thường dùng một liều nhỏ hằng ngày hoặc một liều lớn hơn vài lần mỗi tuần; hãy hỏi bác sĩ hoặc chuyên gia dinh dưỡng để chọn liều phù hợp.
3. **Theo dõi:** người ăn thuần chay lâu năm, người trên 50 tuổi hoặc dùng metformin, thuốc giảm tiết axit dạ dày nên kiểm tra B12 định kỳ theo chỉ định của bác sĩ.

### Nguồn tham khảo
- NASEM (1998). Dietary Reference Intakes for Thiamin, Riboflavin, Niacin, Vitamin B6, Folate, Vitamin B12, Pantothenic Acid, Biotin, and Choline.
- NIH Office of Dietary Supplements. Vitamin B12 – Fact Sheet for Health Professionals.
- Watanabe F. et al. (2014). Vitamin B12-containing plant food sources for vegetarians. Nutrients 6(5):1861–1873.`,
    categorySlug: 'vi-chat-thiet-yeu',
    authorEmail: 'org.contributor@example.com',
    tags: ['vitamin b12', 'vi chất', 'thuần chay', 'người mới'],
    coverMedia: {
      publicId: 'commons/nutritional-yeast-in-bag',
      secureUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/Nutritional_Yeast_in_Bag_%2832664238868%29.jpg/1280px-Nutritional_Yeast_in_Bag_%2832664238868%29.jpg',
      width: 1280,
      height: 854,
      bytes: 204770,
      credit: {
        title: 'File:Nutritional Yeast in Bag (32664238868).jpg',
        author: 'Tony Webster',
        license: 'CC BY 2.0',
        licenseUrl: 'https://creativecommons.org/licenses/by/2.0/',
        sourceUrl:
          'https://commons.wikimedia.org/wiki/File:Nutritional_Yeast_in_Bag_(32664238868).jpg',
      },
    },
  },
  {
    slug: 'toi-uu-nguon-dam-thuc-vat',
    title: 'Đạm Thực Vật: Ăn Bao Nhiêu Và Phối Hợp Đậu, Ngũ Cốc Thế Nào',
    excerpt:
      'Nhu cầu protein của người trưởng thành, lượng đạm trong các thực phẩm chay quen thuộc và cách phối hợp trong ngày.',
    body: `Người ăn chay hoàn toàn có thể đủ protein nếu ăn đủ năng lượng và đa dạng nhóm đậu, ngũ cốc, hạt.

### 1. Cần bao nhiêu protein?
- RDA của NASEM: 0,8 g protein cho mỗi kg cân nặng mỗi ngày, tương đương khoảng 56 g với nam và 46 g với nữ có cân nặng tham chiếu.
- Một số chuyên gia gợi ý người ăn thuần chay nhắm cao hơn một chút (khoảng 0,9–1,0 g/kg) vì độ tiêu hóa của đạm thực vật thấp hơn đạm động vật đôi chút.

### 2. Lượng đạm trong thực phẩm chay quen thuộc (USDA, 100 g phần ăn được)
| Thực phẩm | Protein |
|---|---|
| Đậu hũ (đậu phụ thường) | 8,1 g |
| Tempeh | 20,3 g |
| Đậu lăng đỏ khô | 23,9 g |
| Đậu gà khô | 20,5 g |
| Đậu phộng | 25,8 g |
| Hạt bí | 30,2 g |
| Yến mạch cán | 13,2 g |
| Gạo lứt (sống) | 7,5 g |

Lưu ý đậu khô và gạo nở ra 2–3 lần khi nấu, nên lượng đạm trong 100 g đồ đã nấu thấp hơn.

### 3. Phối hợp đậu và ngũ cốc
Đậu đỗ giàu lysine nhưng ít methionine, ngũ cốc thì ngược lại. Không cần ăn chung trong một bữa: chỉ cần trong ngày có cả hai nhóm, cơ thể sẽ dùng nguồn axit amin từ các bữa khác nhau. Gợi ý: cơm gạo lứt với đậu hũ kho, cháo yến mạch rắc hạt bí, bánh mì kẹp pate đậu gà.

### Nguồn tham khảo
- NASEM (2005). Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids.
- Young VR, Pellett PL (1994). Plant proteins in relation to human protein and amino acid nutrition. Am J Clin Nutr 59(5 Suppl):1203S–1212S.
- Melina V, Craig W, Levin S (2016). Position of the Academy of Nutrition and Dietetics: Vegetarian Diets. J Acad Nutr Diet 116(12):1970–1980.
- USDA FoodData Central, SR Legacy (2018).`,
    categorySlug: 'kien-thuc-protein',
    authorEmail: 'org.contributor@example.com',
    tags: ['protein', 'đạm thực vật', 'đậu đỗ', 'ngũ cốc'],
    coverMedia: {
      publicId: 'commons/assorted-legumes-liat-portal',
      secureUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Liat_Portal_for_Foodie_Disorder_-_Assorted_Legumes.jpg/1280px-Liat_Portal_for_Foodie_Disorder_-_Assorted_Legumes.jpg',
      width: 1280,
      height: 1707,
      bytes: 361971,
      credit: {
        title: 'File:Liat Portal for Foodie Disorder - Assorted Legumes.jpg',
        author: 'Liat Portal (HaJunkiyada)',
        license: 'CC BY-SA 4.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
        sourceUrl:
          'https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Assorted_Legumes.jpg',
      },
    },
  },
  {
    slug: 'bi-quyet-meal-prep-7-ngay',
    title: 'Chuẩn Bị Bữa Chay Cho Cả Tuần (Meal Prep): Cách Làm Và Bảo Quản',
    excerpt:
      'Nấu sẵn nền tinh bột, đậu và nước sốt vào cuối tuần, chia hộp và bảo quản đúng nhiệt độ để ăn ngon cả tuần.',
    body: `Meal prep giúp tiết kiệm thời gian nhưng chỉ hiệu quả khi chọn món hợp để để lâu và bảo quản đúng cách.

### 1. Nấu sẵn theo thành phần, không nấu sẵn cả món
- **Tinh bột:** gạo lứt, quinoa nấu một mẻ lớn; để nguội nhanh rồi cho vào tủ lạnh.
- **Đạm:** đậu gà, đậu đen, đậu lăng luộc chín tới; đậu hũ, tempeh áp chảo hoặc nướng.
- **Rau củ:** bí đỏ, cà rốt, khoai lang, ớt chuông nướng giữ được 3–4 ngày; rau lá non nên để sống, trộn khi ăn.
- **Sốt:** sốt mè, sốt chanh dây dầu ô liu, sốt tương đậu phộng đựng riêng để rau không bị úng.

### 2. Bảo quản an toàn
- Làm nguội đồ ăn nấu chín và cho vào tủ lạnh trong vòng 2 giờ; ngăn mát giữ ở 4°C hoặc thấp hơn.
- Đồ đã nấu nên dùng trong 3–4 ngày. Phần cho cuối tuần nên cấp đông (-18°C) và rã đông trong ngăn mát.
- Cơm để nguội lâu ở nhiệt độ phòng có nguy cơ nhiễm vi khuẩn *Bacillus cereus*; hâm nóng thật kỹ trước khi ăn và không hâm lại nhiều lần.
- Dùng hộp kín, dán nhãn ngày nấu.

### 3. Một thực đơn mẫu
- Chủ nhật nấu: gạo lứt, quinoa, đậu gà, đậu hũ áp chảo, rau củ nướng, sốt chanh dây.
- Bữa trưa: quinoa đậu gà rau củ nướng; cơm lứt tempeh bông cải.
- Bữa tối giữa tuần (nấu nhanh): phở xào nấm đậu hũ, cà tím kho đậu hũ.

### Nguồn tham khảo
- USDA Food Safety and Inspection Service. Leftovers and Food Safety.
- FDA. Refrigerator & Freezer Storage Chart.`,
    categorySlug: 'bi-quyet-bao-quan-meal-prep',
    authorEmail: 'platform.contributor@example.com',
    tags: ['meal prep', 'bảo quản', 'an toàn thực phẩm', 'tiết kiệm thời gian'],
    coverMedia: {
      publicId: 'seed/handbooks/meal-prep-cover',
      secureUrl: '/seed/handbooks/meal-prep-cover.jpg',
      width: 1200,
      height: 675,
      bytes: 39996,
    },
  },
  {
    slug: 'phan-biet-cac-truong-phai-an-chay',
    title: 'Các Kiểu Ăn Chay Và Cách Chuyển Đổi Từ Từ',
    excerpt:
      'Phân biệt thuần chay, chay trứng sữa, ăn chay theo Phật giáo và ăn chay kỳ; gợi ý lộ trình chuyển đổi nhẹ nhàng.',
    body: `"Ăn chay" có nhiều cách hiểu. Biết rõ mình theo kiểu nào giúp chọn món và kiểm tra nguyên liệu dễ hơn.

### 1. Các kiểu ăn chay phổ biến
- **Thuần chay (vegan):** không dùng thịt, cá, hải sản, trứng, sữa, mật ong và các thành phần từ động vật.
- **Chay trứng sữa (lacto-ovo):** không ăn thịt cá nhưng dùng trứng và sữa.
- **Chay theo Phật giáo:** ngoài việc không ăn thịt cá, nhiều người còn kiêng ngũ vị tân – hành, tỏi, hẹ, kiệu và hành boaro (tỏi tây). Ứng dụng đánh dấu các nguyên liệu này để bạn lọc món.
- **Ăn chay kỳ:** ăn chay vào ngày rằm, mùng một hoặc vài ngày cố định trong tháng.

### 2. Lộ trình chuyển đổi gợi ý
1. Bắt đầu với 1–2 bữa chay mỗi tuần bằng những món quen: canh chua chay, đậu hũ kho, phở chay.
2. Thay dần thịt bằng đậu hũ, tempeh, nấm và các loại đậu để giữ đủ đạm.
3. Học đọc nhãn: nước mắm, bột nêm, bánh kẹo có thể chứa thành phần động vật; nước tương và tương đen thường chứa đậu nành và lúa mì.
4. Với thuần chay, bổ sung vitamin B12 ngay từ đầu (xem cẩm nang về B12).
5. Lắng nghe cơ thể: tăng chất xơ từ từ và uống đủ nước để tránh đầy bụng.

### 3. Lưu ý về dị ứng
Chế độ ăn chay thường dùng nhiều đậu nành, đậu phộng, hạt, mè và gluten – đều là nhóm gây dị ứng phổ biến. Hãy khai báo dị ứng trong hồ sơ để ứng dụng loại các món có nguyên liệu tương ứng.

### Nguồn tham khảo
- Melina V, Craig W, Levin S (2016). Position of the Academy of Nutrition and Dietetics: Vegetarian Diets. J Acad Nutr Diet 116(12):1970–1980.`,
    categorySlug: 'van-hoa-am-thuc-chay',
    authorEmail: 'invited.contributor@example.com',
    tags: ['người mới', 'thuần chay', 'chay phật giáo', 'ngũ vị tân'],
    coverMedia: {
      publicId: 'commons/saigon-vegetarian-food',
      secureUrl:
        'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Saigon_Vegetarian_food.jpg/1280px-Saigon_Vegetarian_food.jpg',
      width: 1280,
      height: 848,
      bytes: 172417,
      credit: {
        title: 'File:Saigon Vegetarian food.jpg',
        author: 'Takeaway',
        license: 'CC BY-SA 3.0',
        licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/',
        sourceUrl: 'https://commons.wikimedia.org/wiki/File:Saigon_Vegetarian_food.jpg',
      },
    },
  },
  {
    slug: 'sat-canxi-kem-omega-3-nguoi-an-chay',
    title: 'Sắt, Canxi, Kẽm Và Omega-3 Trong Bữa Ăn Chay',
    excerpt:
      'Bốn vi chất người ăn chay cần để ý: nhu cầu, thực phẩm chay giàu chất đó và mẹo tăng hấp thu.',
    body: `Ngoài B12, người ăn chay nên để ý thêm sắt, canxi, kẽm và omega-3 (ALA). Số liệu dưới đây lấy từ USDA FoodData Central (tính trên 100 g) và nhu cầu khuyến nghị của NASEM cho người 19–50 tuổi.

### 1. Sắt
- Nhu cầu: nam 8 mg/ngày, nữ 18 mg/ngày. Sắt trong thực vật là sắt non-heme, hấp thu kém hơn; NASEM lưu ý người ăn chay có thể cần gấp khoảng 1,8 lần.
- Nguồn: đậu lăng đỏ khô (7,4 mg), đậu hũ (5,4 mg), hạt bí (8,8 mg), hạt chia (7,7 mg), cải bó xôi (2,7 mg).
- Mẹo: ăn kèm rau quả giàu vitamin C (ớt chuông, bông cải xanh, cà chua, cam) trong cùng bữa; uống trà, cà phê cách xa bữa ăn.

### 2. Canxi
- Nhu cầu: 1.000 mg/ngày.
- Nguồn: đậu hũ làm bằng canxi sulfat (350 mg), hạt chia (631 mg), mè (975 mg), cải thìa (105 mg), sữa thực vật có bổ sung canxi.
- Cải bó xôi nhiều canxi nhưng chứa oxalat nên hấp thu kém; cải thìa và các loại cải ít oxalat hấp thu tốt hơn.

### 3. Kẽm
- Nhu cầu: nam 11 mg, nữ 8 mg/ngày.
- Nguồn: hạt bí (7,8 mg), hạt điều (5,8 mg), đậu gà khô (2,8 mg), yến mạch (3,6 mg).
- Ngâm, ủ nảy mầm hoặc lên men (tempeh) giúp giảm phytate, tăng hấp thu kẽm và sắt.

### 4. Omega-3 (ALA)
- Nhu cầu đủ (AI): nam 1,6 g, nữ 1,1 g/ngày.
- Nguồn: hạt chia (17,8 g/100 g – một muỗng canh khoảng 12 g đã đủ nhu cầu), hạt óc chó, hạt lanh, dầu hạt cải.
- Cơ thể chuyển ALA thành EPA/DHA với tỉ lệ thấp; người cần nhiều DHA (mang thai, cho con bú) có thể hỏi bác sĩ về dầu tảo.

### Nguồn tham khảo
- NASEM (2001). Dietary Reference Intakes for Vitamin A, Vitamin K, Arsenic, Boron, Chromium, Copper, Iodine, Iron, Manganese, Molybdenum, Nickel, Silicon, Vanadium, and Zinc.
- NASEM (2011). Dietary Reference Intakes for Calcium and Vitamin D.
- Hallberg L, Brune M, Rossander L (1989). Iron absorption in man: ascorbic acid and dose-dependent inhibition by phytate. Am J Clin Nutr 49(1):140–144.
- USDA FoodData Central, SR Legacy (2018).`,
    categorySlug: 'vi-chat-thiet-yeu',
    authorEmail: 'org.contributor@example.com',
    tags: ['sắt', 'canxi', 'kẽm', 'omega-3'],
    coverMedia: null,
  },
] as const;
