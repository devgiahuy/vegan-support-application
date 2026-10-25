import type { Prisma, PrismaClient } from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { loadIngredientSafetyCatalog, MAX_COMPOSITION_DEPTH } from './ingredient-safety.js';
import type { CompositionInput } from './composition.schemas.js';

export class CompositionService {
  constructor(private readonly prisma: PrismaClient) {}

  sources() {
    return this.prisma.foodDataSource.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, licenseName: true, attribution: true },
    });
  }

  async allergens() {
    const definitions = await this.prisma.allergenDefinition.findMany({
      where: { active: true },
      orderBy: { label: 'asc' },
      include: {
        ingredients: {
          where: { ingredient: { status: 'ACTIVE' } },
          include: {
            ingredient: { include: { aliases: { where: { reviewStatus: 'APPROVED' } } } },
          },
        },
      },
    });
    return definitions.map((definition) => ({
      code: definition.code,
      label: definition.label,
      description: definition.description,
      searchTerms: [
        ...new Set([
          definition.label,
          ...definition.ingredients.flatMap(({ ingredient }) => [
            ingredient.canonicalName,
            ingredient.normalizedName,
            ...ingredient.aliases.map((alias) => alias.alias),
          ]),
        ]),
      ],
    }));
  }

  async get(id: string) {
    const [catalog, audit] = await Promise.all([
      loadIngredientSafetyCatalog(this.prisma),
      this.prisma.ingredientCompositionAudit.findMany({
        where: { ingredientId: id },
        orderBy: { version: 'desc' },
        take: 20,
      }),
    ]);
    const ingredient = catalog.byId.get(id);
    if (!ingredient) throw this.error(404, 'NOT_FOUND', 'Không tìm thấy nguyên liệu');
    const closure = catalog.closure(id);
    return {
      ingredientId: id,
      status: ingredient.compositionStatus,
      kind: ingredient.compositionKind,
      version: ingredient.compositionVersion,
      componentIds: ingredient.components.map((edge) => edge.componentId).sort(),
      components: ingredient.components.map((edge) => ({
        id: edge.componentId,
        name:
          catalog.byId.get(edge.componentId)?.canonicalName ??
          'Thành phần không còn trong danh mục',
        active: catalog.byId.get(edge.componentId)?.status === 'ACTIVE',
      })),
      evidence: ingredient.compositionEvidence,
      complete: closure.complete,
      inferredAllergenCodes: [
        ...new Set(
          closure.nodes.flatMap((node) => node.allergens.map((entry) => entry.allergenCode)),
        ),
      ].sort(),
      audit: audit.map((entry) => ({
        version: entry.version,
        actorId: entry.actorId,
        snapshot: entry.snapshot,
        createdAt: entry.createdAt.toISOString(),
      })),
    };
  }

  async save(id: string, actorId: string, input: CompositionInput) {
    await this.prisma.$transaction(async (tx) => {
      // All graph mutations write this same document before reading graph state.
      // Mongo write conflicts retry the entire transaction against a fresh graph.
      await tx.catalogGraphState.upsert({
        where: { id: 'ingredient-composition' },
        create: { id: 'ingredient-composition', version: 1 },
        update: { version: { increment: 1 } },
      });
      const current = await tx.ingredient.findUnique({ where: { id } });
      if (!current || current.status !== 'ACTIVE')
        throw this.error(404, 'NOT_FOUND', 'Không tìm thấy nguyên liệu đang hoạt động');
      if (current.compositionVersion !== input.expectedVersion)
        throw this.error(
          409,
          'INGREDIENT_COMPOSITION_CONFLICT',
          'Dữ liệu đã thay đổi. Vui lòng tải lại.',
        );
      if (input.componentIds.includes(id))
        throw this.error(
          400,
          'INGREDIENT_COMPOSITION_CYCLE',
          'Nguyên liệu không thể chứa chính nó',
        );
      const catalog = await loadIngredientSafetyCatalog(tx);
      for (const componentId of input.componentIds) {
        if (catalog.byId.get(componentId)?.status !== 'ACTIVE')
          throw this.error(
            400,
            'INVALID_INGREDIENT_COMPONENT',
            'Thành phần không tồn tại hoặc đã ngừng dùng',
          );
      }
      const children = new Map(
        catalog.ingredients.map((item) => [
          item.id,
          item.id === id ? input.componentIds : item.components.map((edge) => edge.componentId),
        ]),
      );
      const heights = new Map<string, number>();
      const visit = (nodeId: string, path: Set<string>): number => {
        if (path.has(nodeId))
          throw this.error(400, 'INGREDIENT_COMPOSITION_CYCLE', 'Quan hệ thành phần tạo vòng lặp');
        const cached = heights.get(nodeId);
        if (cached !== undefined) return cached;
        const next = new Set(path).add(nodeId);
        const height = Math.max(
          0,
          ...(children.get(nodeId) ?? []).map((child) => visit(child, next) + 1),
        );
        if (height > MAX_COMPOSITION_DEPTH)
          throw this.error(
            400,
            'INGREDIENT_COMPOSITION_DEPTH',
            'Quan hệ thành phần vượt giới hạn 32 cấp',
          );
        heights.set(nodeId, height);
        return height;
      };
      // Validate ancestors too: adding a deep subtree must not push its parents over the bound.
      for (const root of children.keys()) visit(root, new Set());
      let evidence: Prisma.InputJsonObject | null = null;
      if (input.evidence) {
        const source = await tx.foodDataSource.findUnique({
          where: { id: input.evidence.sourceId },
        });
        if (!source?.active)
          throw this.error(
            400,
            'INVALID_COMPOSITION_SOURCE',
            'Nguồn dữ liệu không tồn tại hoặc đã ngừng dùng',
          );
        evidence = {
          ...input.evidence,
          sourceCode: source.code,
          licenseName: source.licenseName,
          attribution: source.attribution,
          reviewedById: actorId,
          reviewedAt: new Date().toISOString(),
        };
      }
      const version = current.compositionVersion + 1;
      await tx.ingredientComponent.deleteMany({ where: { ingredientId: id } });
      if (input.componentIds.length)
        await tx.ingredientComponent.createMany({
          data: input.componentIds.map((componentId) => ({ ingredientId: id, componentId })),
        });
      await tx.ingredient.update({
        where: { id },
        data: {
          compositionStatus: input.status,
          compositionKind: input.kind,
          compositionEvidence: evidence,
          compositionVersion: version,
        },
      });
      await tx.ingredientCompositionAudit.create({
        data: {
          ingredientId: id,
          actorId,
          version,
          snapshot: {
            status: input.status,
            kind: input.kind,
            componentIds: input.componentIds,
            evidence: evidence ?? null,
          },
        },
      });
    });
    return this.get(id);
  }

  private error(statusCode: number, code: string, message: string) {
    return new AppError({ statusCode, code, message });
  }
}
