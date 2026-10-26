import type { PrismaClient } from '@prisma/client';
import { CompositionService } from '../../src/modules/catalog/composition.service.js';
import { normalizeVietnameseText } from '../../src/modules/catalog/catalog.normalization.js';
import { ingredientDefinitions } from './ingredients.data.js';
import { allergenDefinitions } from './allergens.data.js';

// Explicit local demonstration assertions. Never infer completeness from absence of allergens.
const SIMPLE_NAMES = new Set([
  'dau ga',
  'dau lang',
  'dau den',
  'dau do',
  'dau xanh',
  'gao lut',
  'gao st25',
  'yen mach',
  'quinoa',
  'dau phong',
  'hat dieu',
  'hat chia',
  'hat sen',
  'hat bi',
  'me trang',
  'nam huong',
  'nam dui ga',
  'nam bao ngu',
  'nam rom',
  'nam kim cham',
  'moc nhi',
  'bong cai xanh',
  'cai thia',
  'cai bo xoi',
  'rau muong',
  'ca rot',
  'cu cai trang',
  'bi do',
  'ca chua',
  'ca tim',
  'kho qua',
  'bap ngot',
  'khoai lang',
  'khoai mon',
  'mang tay',
  'bo sap',
  'chuoi',
  'dua mat',
  'chanh tuoi',
  'hanh boaro',
  'hanh la',
  'ngo ri',
  'sa cay',
  'gung gia',
  'dau ha lan',
  'gia do',
  'dua leo',
  'dau bap',
  'xa lach',
  'khoai tay',
  'ot chuong do',
  'cu san',
  'bap cai',
  'dau que',
  'toi',
  'chanh day',
  'me chua',
  'cha la',
  'rau hung que',
  'rau hung lui',
  'ot',
  'tieu den',
  'nghe',
  'que',
  'muoi',
  'dau oliu',
]);

// Prepared foods asserted as single demo formulations. Allergen links stay on the ingredient
// definition (e.g. tofu → SOY, bread → GLUTEN); the scope states that brands may differ.
const PREPARED_SIMPLE_SCOPES = new Map([
  ['dau hu', 'Đậu hũ minh họa: đậu nành, nước, chất đông tụ.'],
  ['dau hu non', 'Đậu hũ non minh họa: đậu nành, nước, chất đông tụ.'],
  ['dau hu ky', 'Váng đậu minh họa: chỉ từ sữa đậu nành.'],
  ['suon non chay', 'Đạm đậu nành khô minh họa: bột đậu nành tách béo, không gia vị.'],
  ['tempeh', 'Tempeh minh họa: đậu nành lên men, không ngũ cốc trộn.'],
  ['chao trang', 'Chao minh họa: đậu hũ lên men, muối, rượu nếp.'],
  ['sua dau nanh', 'Sữa đậu nành minh họa: đậu nành, nước, không đường.'],
  ['sua bo', 'Sữa bò tươi nguyên chất minh họa, không phụ gia.'],
  ['men dinh duong', 'Men dinh dưỡng bất hoạt minh họa, không phụ gia.'],
  ['banh pho', 'Bánh phở minh họa: bột gạo, nước.'],
  ['bun tuoi', 'Bún minh họa: bột gạo, nước.'],
  ['mien dong', 'Miến minh họa: tinh bột dong, nước.'],
  ['banh mi', 'Bánh mì minh họa: bột mì, men, muối, nước; không sữa, không trứng.'],
  ['banh trang', 'Bánh tráng minh họa: bột gạo, bột năng, muối, nước.'],
  ['bo dau phong', 'Bơ đậu phộng minh họa: chỉ đậu phộng rang xay.'],
  ['hoa hoi', 'Hoa hồi khô nguyên cánh.'],
  ['nuoc tuong tamari', 'Tamari minh họa: đậu nành, muối, nước; công thức không lúa mì.'],
  ['nuoc tuong', 'Nước tương minh họa: đậu nành, lúa mì, muối, nước.'],
  ['tuong den', 'Tương hoisin minh họa: đậu nành, lúa mì, đường, tỏi, ớt, giấm.'],
  ['dau me', 'Dầu mè ép nguyên chất.'],
  ['dau hat cai', 'Dầu hạt cải tinh luyện nguyên chất.'],
  ['nuoc cot dua', 'Nước cốt dừa minh họa: cơm dừa, nước.'],
  ['duong', 'Đường mía tinh luyện.'],
  ['giam', 'Giấm gạo lên men minh họa: gạo, nước.'],
]);
const PREPARED_VERSION = 'composition-demo-2026-10-26';
// Spice blend expressed through existing reviewed SIMPLE spices so allergens propagate.
const CURRY_COMPONENTS = ['nghe', 'ot', 'tieu den', 'que', 'gung gia'];

export async function normalizeAllergyCatalog(prisma: PrismaClient, adminId: string) {
  const source = await prisma.foodDataSource.upsert({
    where: { code: 'COMPOSITION_DEMO_V1' },
    update: {},
    create: {
      code: 'COMPOSITION_DEMO_V1',
      name: 'Thành phần minh họa do dự án biên soạn',
      provider: 'MANUAL',
      licenseName: 'CC0-1.0',
      licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
      attribution:
        'Project-authored educational demo assertions and synthetic formulations; not branded product evidence or an allergy-safety certification.',
      defaultLocale: 'vi-VN',
      active: true,
    },
  });
  for (const definition of allergenDefinitions)
    await prisma.allergenDefinition.upsert({
      where: { code: definition.code },
      update: {
        label: definition.label,
        description: definition.description ?? null,
        active: true,
      },
      create: { ...definition },
    });
  const service = new CompositionService(prisma);
  let reviewed = 0;
  const assertSimple = async (
    ingredientId: string,
    normalizedName: string,
    canonicalName: string,
  ) => {
    const preparedScope = PREPARED_SIMPLE_SCOPES.get(normalizedName);
    if (!SIMPLE_NAMES.has(normalizedName) && !preparedScope) return false;
    const sourceVersion = preparedScope ? PREPARED_VERSION : 'composition-demo-2026-10-25';
    const current = await service.get(ingredientId);
    if (
      current.evidence &&
      typeof current.evidence === 'object' &&
      !Array.isArray(current.evidence) &&
      current.evidence.sourceId !== source.id
    )
      return false;
    if (
      current.complete &&
      current.evidence &&
      typeof current.evidence === 'object' &&
      !Array.isArray(current.evidence) &&
      current.evidence.sourceVersion === sourceVersion
    )
      return false;
    await service.save(ingredientId, adminId, {
      expectedVersion: current.version,
      status: 'COMPLETE',
      kind: 'SIMPLE',
      componentIds: [],
      evidence: {
        sourceId: source.id,
        sourceVersion,
        sourceRecordId: normalizedName,
        scope: preparedScope
          ? `${preparedScope} Không đại diện cho thương hiệu cụ thể.`
          : `Local demonstration: ${canonicalName}; no mixed preparation, packaging or brand claim.`,
      },
    });
    return true;
  };
  for (const definition of ingredientDefinitions) {
    const ingredient = await prisma.ingredient.findUnique({
      where: { normalizedName: definition.normalizedName },
    });
    if (!ingredient || ingredient.status !== 'ACTIVE') continue;
    // Normalize aliases and direct allergen links to the curated definitions in this targeted migration.
    for (const alias of new Set([definition.canonicalName, ...definition.aliases])) {
      const normalizedAlias = normalizeVietnameseText(alias);
      await prisma.ingredientAlias.upsert({
        where: { ingredientId_normalizedAlias: { ingredientId: ingredient.id, normalizedAlias } },
        update: {},
        create: {
          ingredientId: ingredient.id,
          alias,
          normalizedAlias,
          reviewStatus: 'APPROVED',
          sourceId: source.id,
          sourceRecordId: definition.normalizedName,
        },
      });
    }
    for (const allergenCode of definition.allergens)
      await prisma.ingredientAllergen.upsert({
        where: { ingredientId_allergenCode: { ingredientId: ingredient.id, allergenCode } },
        update: {},
        create: { ingredientId: ingredient.id, allergenCode },
      });
    if (await assertSimple(ingredient.id, definition.normalizedName, definition.canonicalName))
      reviewed++;
  }
  // Prepared foods created outside the curated definitions (e.g. scenario dairy).
  const definedNames = new Set(ingredientDefinitions.map((item) => item.normalizedName));
  for (const normalizedName of PREPARED_SIMPLE_SCOPES.keys()) {
    if (definedNames.has(normalizedName)) continue;
    const ingredient = await prisma.ingredient.findUnique({ where: { normalizedName } });
    if (ingredient?.status !== 'ACTIVE') continue;
    if (await assertSimple(ingredient.id, normalizedName, ingredient.canonicalName)) reviewed++;
  }
  const curry = await prisma.ingredient.findUnique({ where: { normalizedName: 'bot ca ri' } });
  const curryParts = await prisma.ingredient.findMany({
    where: { normalizedName: { in: CURRY_COMPONENTS }, status: 'ACTIVE' },
    select: { id: true },
  });
  if (curry?.status === 'ACTIVE' && curryParts.length === CURRY_COMPONENTS.length) {
    const current = await service.get(curry.id);
    const evidence =
      current.evidence && typeof current.evidence === 'object' && !Array.isArray(current.evidence)
        ? current.evidence
        : null;
    if (
      (!evidence || evidence.sourceId === source.id) &&
      !(current.complete && evidence?.sourceVersion === PREPARED_VERSION)
    ) {
      await service.save(curry.id, adminId, {
        expectedVersion: current.version,
        status: 'COMPLETE',
        kind: 'COMPOUND',
        componentIds: curryParts.map((item) => item.id),
        evidence: {
          sourceId: source.id,
          sourceVersion: PREPARED_VERSION,
          sourceRecordId: 'bot ca ri',
          scope:
            'Bột cà ri minh họa: nghệ, ớt, tiêu đen, quế, gừng. Không đại diện cho thương hiệu cụ thể.',
        },
      });
      reviewed++;
    }
  }
  const peanut = await prisma.ingredient.findUnique({ where: { normalizedName: 'dau phong' } });
  if (peanut?.status === 'ACTIVE') {
    let componentId = peanut.id;
    for (const [normalizedName, canonicalName] of [
      ['ho hop lac minh hoa', 'Hỗn hợp lạc minh họa (dữ liệu mô phỏng)'],
      ['sot abc minh hoa', 'Sốt ABC minh họa (dữ liệu mô phỏng)'],
    ]) {
      const parent = await prisma.ingredient.upsert({
        where: { normalizedName: normalizedName! },
        update: {},
        create: {
          canonicalName: canonicalName!,
          normalizedName: normalizedName!,
          foodGroup: 'OTHER',
          dietCompatibilities: {
            create: [
              { dietPattern: 'VEGAN', compatible: true },
              { dietPattern: 'LACTO_OVO', compatible: true },
            ],
          },
        },
      });
      if (parent.status !== 'ACTIVE') break;
      const current = await service.get(parent.id);
      if (
        current.evidence &&
        typeof current.evidence === 'object' &&
        !Array.isArray(current.evidence) &&
        current.evidence.sourceId !== source.id
      )
        break;
      if (!current.complete || current.componentIds[0] !== componentId)
        await service.save(parent.id, adminId, {
          expectedVersion: current.version,
          status: 'COMPLETE',
          kind: 'COMPOUND',
          componentIds: [componentId],
          evidence: {
            sourceId: source.id,
            sourceVersion: 'composition-demo-2026-10-25',
            sourceRecordId: normalizedName!,
            scope:
              'Synthetic test formulation only; not evidence about any commercial sauce or product.',
          },
        });
      componentId = parent.id;
    }
  }
  const catalog = await service.allergens();
  const canonicalCodes = new Map(catalog.map((item) => [item.code, item]));
  const nameCodes = new Map<string, Set<string>>();
  for (const item of catalog)
    for (const name of [item.code, item.label, ...item.searchTerms]) {
      const normalized = normalizeVietnameseText(name);
      nameCodes.set(normalized, new Set([...(nameCodes.get(normalized) ?? []), item.code]));
    }
  let normalizedSelections = 0;
  let unresolvedSelections = 0;
  for (const selection of await prisma.userAllergy.findMany()) {
    const direct = canonicalCodes.get(selection.allergenCode);
    const matches = new Set([
      ...(nameCodes.get(normalizeVietnameseText(selection.allergenCode)) ?? []),
      ...(selection.label ? (nameCodes.get(normalizeVietnameseText(selection.label)) ?? []) : []),
    ]);
    const target =
      direct ?? (matches.size === 1 ? canonicalCodes.get([...matches][0]!) : undefined);
    if (!target) {
      unresolvedSelections++;
      continue;
    }
    if (selection.allergenCode !== target.code) {
      const previous = await prisma.userAllergy.findUnique({
        where: {
          userId_allergenCode: { userId: selection.userId, allergenCode: target.code },
        },
      });
      const severityRank = { MILD: 1, MODERATE: 2, SEVERE: 3 };
      const severity =
        previous?.severity &&
        severityRank[previous.severity] >
          (selection.severity ? severityRank[selection.severity] : 0)
          ? previous.severity
          : selection.severity;
      await prisma.userAllergy.upsert({
        where: { userId_allergenCode: { userId: selection.userId, allergenCode: target.code } },
        update: {
          label: target.label,
          active: Boolean(previous?.active || selection.active),
          severity,
        },
        create: {
          userId: selection.userId,
          allergenCode: target.code,
          label: target.label,
          severity,
          active: selection.active,
        },
      });
      await prisma.userAllergy.delete({ where: { id: selection.id } });
      normalizedSelections++;
    } else if (selection.label !== target.label) {
      await prisma.userAllergy.update({
        where: { id: selection.id },
        data: { label: target.label },
      });
      normalizedSelections++;
    }
  }
  return { reviewed, normalizedSelections, unresolvedSelections, sourceCode: source.code };
}
