/**
 * Nạp danh sách quán chay nội bộ từ một file JSON (mặc định `prisma/seed-data/restaurants.demo.json`).
 *
 * - Mặc định chỉ KIỂM TRA (dry-run) và in kế hoạch; thêm `--apply` mới ghi vào database.
 * - Chạy lại nhiều lần không tạo trùng: mỗi quán có id cố định suy ra từ tên + địa chỉ đã chuẩn hóa.
 * - Quán được nạp ở trạng thái APPROVED, nguồn ADMIN, người duyệt là tài khoản Admin của seed.
 * - `note` trong file được lưu vào `reviewReason` và nhật ký `restaurant_audit` để truy ra nguồn dữ liệu.
 *
 * Dùng: `npm run db:import-restaurants` (kiểm tra) hoặc `npm run db:import-restaurants -- --apply`.
 */
import 'dotenv/config';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { RestaurantSource, RestaurantStatus } from '@prisma/client';
import { createPrismaClient } from '../src/database/client.js';

const ALLERGEN_CODES = new Set(['GLUTEN', 'PEANUT', 'TREE_NUT', 'SOY', 'SESAME', 'MILK', 'EGG']);
const DIET_TAGS = new Set(['VEGAN', 'LACTO_OVO', 'BUDDHIST', 'CHRISTIAN']);

interface RestaurantRow {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  categories: string[];
  dietTags: string[];
  allergenFreeCodes: string[];
  excludedIngredients: string[];
  checkedAt: string;
  note: string;
}

/** Cùng cách chuẩn hóa với `RestaurantService` để việc phát hiện trùng khớp nhau. */
function normalize(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** UUID ổn định (dạng v5) suy ra từ nội dung, để chạy lại không tạo bản ghi mới. */
function stableUuid(seed: string): string {
  const bytes = createHash('sha1').update(`veggieconnect-restaurant:${seed}`).digest().subarray(0, 16);
  bytes[6] = (bytes[6]! & 0x0f) | 0x50;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string' && item.trim().length > 0);
}

function validate(row: unknown, index: number): { row: RestaurantRow | null; problems: string[] } {
  const problems: string[] = [];
  const label = `#${index + 1}`;
  if (typeof row !== 'object' || row === null) return { row: null, problems: [`${label}: không phải đối tượng`] };
  const r = row as Record<string, unknown>;
  const text = (key: string, min: number, max: number) => {
    const value = r[key];
    if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) {
      problems.push(`${label}: "${key}" phải là chuỗi ${min}-${max} ký tự`);
      return '';
    }
    return value.trim();
  };
  const name = text('name', 2, 180);
  const address = text('address', 5, 500);
  const latitude = r.latitude;
  const longitude = r.longitude;
  if (typeof latitude !== 'number' || !Number.isFinite(latitude) || latitude < -90 || latitude > 90)
    problems.push(`${label} (${name}): "latitude" không hợp lệ`);
  if (typeof longitude !== 'number' || !Number.isFinite(longitude) || longitude < -180 || longitude > 180)
    problems.push(`${label} (${name}): "longitude" không hợp lệ`);
  if (typeof latitude === 'number' && typeof longitude === 'number' && (latitude < 8 || latitude > 24 || longitude < 102 || longitude > 110))
    problems.push(`${label} (${name}): toạ độ nằm ngoài Việt Nam (có thể bị đảo lat/lng)`);
  for (const key of ['categories', 'dietTags', 'allergenFreeCodes', 'excludedIngredients'] as const) {
    if (!isStringArray(r[key])) problems.push(`${label} (${name}): "${key}" phải là mảng chuỗi`);
  }
  const dietTags = isStringArray(r.dietTags) ? r.dietTags : [];
  const allergens = isStringArray(r.allergenFreeCodes) ? r.allergenFreeCodes : [];
  for (const tag of dietTags) if (!DIET_TAGS.has(tag)) problems.push(`${label} (${name}): dietTag "${tag}" không hợp lệ`);
  for (const code of allergens)
    if (!ALLERGEN_CODES.has(code)) problems.push(`${label} (${name}): mã dị ứng "${code}" không hợp lệ`);
  const checkedAt = r.checkedAt;
  if (typeof checkedAt !== 'string' || Number.isNaN(new Date(checkedAt).getTime()))
    problems.push(`${label} (${name}): "checkedAt" phải là ngày hợp lệ (YYYY-MM-DD)`);
  const note = typeof r.note === 'string' ? r.note.trim() : '';
  if (!note) problems.push(`${label} (${name}): thiếu "note" ghi nguồn dữ liệu`);
  if (problems.length > 0) return { row: null, problems };
  return {
    row: {
      name,
      address,
      latitude: latitude as number,
      longitude: longitude as number,
      categories: (r.categories as string[]).map((item) => item.trim()),
      dietTags,
      allergenFreeCodes: allergens,
      excludedIngredients: (r.excludedIngredients as string[]).map(normalize).filter(Boolean),
      checkedAt: checkedAt as string,
      note,
    },
    problems,
  };
}

async function main() {
  const apply = process.argv.includes('--apply');
  const fileArg = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
  const file = resolve(fileArg ?? 'prisma/seed-data/restaurants.demo.json');
  const raw = JSON.parse(readFileSync(file, 'utf8')) as unknown;
  if (!Array.isArray(raw)) throw new Error('File phải là một mảng JSON các quán.');

  const rows: RestaurantRow[] = [];
  const problems: string[] = [];
  raw.forEach((item, index) => {
    const result = validate(item, index);
    problems.push(...result.problems);
    if (result.row) rows.push(result.row);
  });

  const seen = new Map<string, string>();
  for (const row of rows) {
    const key = `${normalize(row.name)}|${normalize(row.address)}`;
    const previous = seen.get(key);
    if (previous) problems.push(`Trùng tên và địa chỉ trong file: "${row.name}" (và "${previous}")`);
    seen.set(key, row.name);
  }

  console.info(`Đọc ${raw.length} quán từ ${file}`);
  if (problems.length > 0) {
    console.error(`Có ${problems.length} lỗi, chưa nạp gì:`);
    for (const problem of problems) console.error(` - ${problem}`);
    process.exitCode = 1;
    return;
  }

  const prisma = createPrismaClient();
  try {
    const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com').toLowerCase();
    const admin = await prisma.user.findUnique({ where: { email: adminEmail } });
    if (!admin) throw new Error(`Không tìm thấy tài khoản Admin ${adminEmail}. Hãy chạy seed trước.`);

    let created = 0;
    let updated = 0;
    const skipped: string[] = [];
    for (const row of rows) {
      const normalizedName = normalize(row.name);
      const normalizedAddress = normalize(row.address);
      const id = stableUuid(`${normalizedName}|${normalizedAddress}`);
      const existingSame = await prisma.restaurant.findFirst({
        where: { normalizedName, normalizedAddress, status: { not: RestaurantStatus.REJECTED } },
      });
      if (existingSame && existingSame.id !== id) {
        skipped.push(`${row.name} (đã có bản ghi khác cùng tên và địa chỉ)`);
        continue;
      }
      const checkedAt = new Date(row.checkedAt);
      const data = {
        name: row.name,
        normalizedName,
        address: row.address,
        normalizedAddress,
        latitude: row.latitude,
        longitude: row.longitude,
        categories: row.categories,
        dietTags: row.dietTags,
        allergenFreeCodes: row.allergenFreeCodes,
        excludedIngredients: row.excludedIngredients,
        source: RestaurantSource.ADMIN,
        status: RestaurantStatus.APPROVED,
        reviewerId: admin.id,
        reviewedAt: checkedAt,
        reviewReason: row.note.slice(0, 1000),
        dataCheckedAt: checkedAt,
      };
      if (existingSame) updated += 1;
      else created += 1;
      if (!apply) continue;
      await prisma.restaurant.upsert({ where: { id }, update: data, create: { id, ...data } });
      await prisma.restaurantAudit.upsert({
        where: { id: stableUuid(`audit:${id}`) },
        update: { reason: row.note.slice(0, 1000) },
        create: {
          id: stableUuid(`audit:${id}`),
          restaurantId: id,
          actorId: admin.id,
          action: 'APPROVED',
          reason: row.note.slice(0, 1000),
        },
      });
    }

    console.info(
      `${apply ? 'ĐÃ NẠP' : 'KIỂM TRA (chưa ghi)'}: tạo mới ${created}, cập nhật ${updated}, bỏ qua ${skipped.length}.`,
    );
    for (const item of skipped) console.info(` - bỏ qua: ${item}`);
    if (!apply) console.info('Thêm --apply để ghi vào database.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
