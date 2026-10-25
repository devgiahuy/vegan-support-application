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
]);

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
    if (!SIMPLE_NAMES.has(definition.normalizedName)) continue;
    const current = await service.get(ingredient.id);
    if (
      current.evidence &&
      typeof current.evidence === 'object' &&
      !Array.isArray(current.evidence) &&
      current.evidence.sourceId !== source.id
    )
      continue;
    if (
      current.complete &&
      current.evidence &&
      typeof current.evidence === 'object' &&
      !Array.isArray(current.evidence) &&
      current.evidence.sourceVersion === 'composition-demo-2026-10-25'
    )
      continue;
    await service.save(ingredient.id, adminId, {
      expectedVersion: current.version,
      status: 'COMPLETE',
      kind: 'SIMPLE',
      componentIds: [],
      evidence: {
        sourceId: source.id,
        sourceVersion: 'composition-demo-2026-10-25',
        sourceRecordId: definition.normalizedName,
        scope: `Local demonstration: ${definition.canonicalName}; no mixed preparation, packaging or brand claim.`,
      },
    });
    reviewed++;
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
