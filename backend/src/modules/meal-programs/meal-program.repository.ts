import {
  MealProgramAnalysisStatus,
  MealProgramMutationType,
  MealProgramProjectionStatus,
  MealProgramStatus,
  MealProgramWeekStatus,
  type MealGoal,
  Prisma,
  type PrismaClient,
} from '@prisma/client';

const programInclude = {
  weeks: {
    include: { alternatives: { orderBy: { rank: 'asc' } } },
    orderBy: { weekIndex: 'asc' },
  },
  analyses: { orderBy: { version: 'desc' }, take: 1 },
} satisfies Prisma.MealProgramInclude;

export type MealProgramRecord = Prisma.MealProgramGetPayload<{ include: typeof programInclude }>;
export type MealProgramAnalysisRecord = Prisma.MealProgramAnalysisGetPayload<Record<string, never>>;

export class MealProgramVersionConflictError extends Error {}
export class MealProgramIdempotencyConflictError extends Error {}
export class MealProgramAlternativeNotFoundError extends Error {}

export class MealProgramRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findOwned(userId: string, id: string): Promise<MealProgramRecord | null> {
    return this.prisma.mealProgram.findFirst({ where: { id, userId }, include: programInclude });
  }

  findByIdempotency(userId: string, idempotencyKey: string): Promise<MealProgramRecord | null> {
    return this.prisma.mealProgram.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include: programInclude,
    });
  }

  findMutation(userId: string, idempotencyKey: string) {
    return this.prisma.mealProgramMutation.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
    });
  }

  async list(userId: string, page: number, limit: number, status?: MealProgramStatus) {
    const where = { userId, ...(status ? { status } : {}) };
    const [records, total] = await this.prisma.$transaction([
      this.prisma.mealProgram.findMany({
        where,
        include: programInclude,
        orderBy: [{ startDate: 'desc' }, { createdAt: 'desc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.mealProgram.count({ where }),
    ]);
    return { records, total };
  }

  async create(data: {
    userId: string;
    title: string;
    goal: MealGoal;
    startDate: Date;
    timezone: string;
    horizonWeeks: number;
    idempotencyKey: string;
    payloadHash: string;
    generationParameters: Prisma.InputJsonValue;
    weeks: Array<{ weekIndex: number; weekStart: Date }>;
  }): Promise<MealProgramRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "users" WHERE "id" = ${data.userId}::uuid FOR UPDATE
      `;
      const existing = await transaction.mealProgram.findUnique({
        where: {
          userId_idempotencyKey: { userId: data.userId, idempotencyKey: data.idempotencyKey },
        },
        include: programInclude,
      });
      if (existing) {
        if (existing.payloadHash !== data.payloadHash)
          throw new MealProgramIdempotencyConflictError();
        return existing;
      }
      return transaction.mealProgram.create({
        data: {
          userId: data.userId,
          title: data.title,
          goal: data.goal,
          startDate: data.startDate,
          timezone: data.timezone,
          horizonWeeks: data.horizonWeeks,
          idempotencyKey: data.idempotencyKey,
          payloadHash: data.payloadHash,
          generationParameters: data.generationParameters,
          weeks: { create: data.weeks },
        },
        include: programInclude,
      });
    });
  }

  async addGeneratedAlternative(
    programId: string,
    weekIndex: number,
    rank: number,
    mealPlanId: string,
    seed: string,
    snapshot: Prisma.InputJsonValue,
  ): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const week = await transaction.mealProgramWeek.findUniqueOrThrow({
        where: { mealProgramId_weekIndex: { mealProgramId: programId, weekIndex } },
      });
      await transaction.mealProgramWeekAlternative.upsert({
        where: { weekId_rank: { weekId: week.id, rank } },
        update: { mealPlanId, seed, snapshot },
        create: { weekId: week.id, mealPlanId, rank, seed, snapshot },
      });
      await transaction.mealProgramWeek.update({
        where: { id: week.id },
        data: {
          status: MealProgramWeekStatus.READY,
          selectedAlternativeRank: week.selectedAlternativeRank ?? rank,
          failure: Prisma.DbNull,
        },
      });
    });
  }

  async recordWeekFailure(programId: string, weekIndex: number, failure: Prisma.InputJsonValue) {
    const week = await this.prisma.mealProgramWeek.findUniqueOrThrow({
      where: { mealProgramId_weekIndex: { mealProgramId: programId, weekIndex } },
      include: { alternatives: { select: { id: true } } },
    });
    if (week.alternatives.length) return;
    await this.prisma.mealProgramWeek.update({
      where: { id: week.id },
      data: { status: MealProgramWeekStatus.FAILED, failure },
    });
  }

  async updateAlternativeSnapshot(id: string, snapshot: Prisma.InputJsonValue): Promise<void> {
    await this.prisma.mealProgramWeekAlternative.update({ where: { id }, data: { snapshot } });
  }

  async finalizeGeneration(programId: string): Promise<MealProgramRecord> {
    const weeks = await this.prisma.mealProgramWeek.findMany({
      where: { mealProgramId: programId },
    });
    const ready = weeks.filter((week) => week.status === MealProgramWeekStatus.READY).length;
    const status =
      ready === weeks.length
        ? MealProgramStatus.DRAFT
        : ready === 0
          ? MealProgramStatus.FAILED
          : MealProgramStatus.PARTIAL;
    const failures = weeks
      .filter((week) => week.status === MealProgramWeekStatus.FAILED)
      .map((week) => ({ weekIndex: week.weekIndex, failure: week.failure }));
    return this.prisma.mealProgram.update({
      where: { id: programId },
      data: { status, failureSummary: failures.length ? failures : Prisma.DbNull },
      include: programInclude,
    });
  }

  async updateMetadata(data: {
    userId: string;
    programId: string;
    expectedVersion: number;
    idempotencyKey: string;
    payloadHash: string;
    title: string;
  }) {
    return this.mutate(data, MealProgramMutationType.UPDATE_METADATA, async (transaction) => {
      await transaction.mealProgram.update({
        where: { id: data.programId },
        data: { title: data.title },
      });
    });
  }

  async selectAlternative(data: {
    userId: string;
    programId: string;
    expectedVersion: number;
    idempotencyKey: string;
    payloadHash: string;
    weekIndex: number;
    alternativeRank: number;
  }) {
    return this.mutate(data, MealProgramMutationType.SELECT_ALTERNATIVE, async (transaction) => {
      const week = await transaction.mealProgramWeek.findUnique({
        where: {
          mealProgramId_weekIndex: { mealProgramId: data.programId, weekIndex: data.weekIndex },
        },
        include: { alternatives: { where: { rank: data.alternativeRank }, select: { id: true } } },
      });
      if (!week?.alternatives.length) throw new MealProgramAlternativeNotFoundError();
      await transaction.mealProgramWeek.update({
        where: { id: week.id },
        data: {
          selectedAlternativeRank: data.alternativeRank,
          projectionStatus: MealProgramProjectionStatus.CURRENT,
        },
      });
      await this.invalidateFrom(transaction, data.programId, data.weekIndex);
    });
  }

  async appendRegeneratedAlternative(data: {
    userId: string;
    programId: string;
    expectedVersion: number;
    idempotencyKey: string;
    payloadHash: string;
    weekIndex: number;
    rank: number;
    mealPlanId: string;
    seed: string;
    snapshot: Prisma.InputJsonValue;
    selectGenerated: boolean;
  }) {
    return this.mutate(data, MealProgramMutationType.REGENERATE_WEEK, async (transaction) => {
      const week = await transaction.mealProgramWeek.findUniqueOrThrow({
        where: {
          mealProgramId_weekIndex: { mealProgramId: data.programId, weekIndex: data.weekIndex },
        },
      });
      await transaction.mealProgramWeekAlternative.create({
        data: {
          weekId: week.id,
          mealPlanId: data.mealPlanId,
          rank: data.rank,
          seed: data.seed,
          snapshot: data.snapshot,
        },
      });
      await transaction.mealProgramWeek.update({
        where: { id: week.id },
        data: {
          status: MealProgramWeekStatus.READY,
          failure: Prisma.DbNull,
          ...(data.selectGenerated ? { selectedAlternativeRank: data.rank } : {}),
        },
      });
      await this.invalidateFrom(transaction, data.programId, data.weekIndex);
    });
  }

  async touchReanalysis(data: {
    userId: string;
    programId: string;
    expectedVersion: number;
    idempotencyKey: string;
    payloadHash: string;
  }) {
    return this.mutate(data, MealProgramMutationType.REANALYZE, async (transaction) => {
      await transaction.mealProgramAnalysis.updateMany({
        where: { mealProgramId: data.programId, status: MealProgramAnalysisStatus.CURRENT },
        data: { status: MealProgramAnalysisStatus.STALE },
      });
    });
  }

  async confirm(data: {
    userId: string;
    programId: string;
    expectedVersion: number;
    idempotencyKey: string;
    payloadHash: string;
  }) {
    return this.mutate(data, MealProgramMutationType.CONFIRM, async (transaction) => {
      await transaction.mealProgram.update({
        where: { id: data.programId },
        data: { status: MealProgramStatus.CONFIRMED, confirmedAt: new Date() },
      });
    });
  }

  async saveAnalysis(data: {
    programId: string;
    inputFingerprint: string;
    invalidatedFromWeekIndex: number | null;
    warnings: Prisma.InputJsonValue;
    nutritionSummary: Prisma.InputJsonValue;
    weeklyAnalyses: Prisma.InputJsonValue;
  }): Promise<MealProgramAnalysisRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "meal_programs" WHERE "id" = ${data.programId}::uuid FOR UPDATE
      `;
      const latest = await transaction.mealProgramAnalysis.findFirst({
        where: { mealProgramId: data.programId },
        orderBy: { version: 'desc' },
        select: { version: true },
      });
      await transaction.mealProgramAnalysis.updateMany({
        where: { mealProgramId: data.programId, status: MealProgramAnalysisStatus.CURRENT },
        data: { status: MealProgramAnalysisStatus.STALE },
      });
      const created = await transaction.mealProgramAnalysis.create({
        data: {
          mealProgramId: data.programId,
          version: (latest?.version ?? 0) + 1,
          inputFingerprint: data.inputFingerprint,
          invalidatedFromWeekIndex: data.invalidatedFromWeekIndex,
          warnings: data.warnings,
          nutritionSummary: data.nutritionSummary,
          weeklyAnalyses: data.weeklyAnalyses,
        },
      });
      await transaction.mealProgramWeek.updateMany({
        where: { mealProgramId: data.programId },
        data: { projectionStatus: MealProgramProjectionStatus.CURRENT },
      });
      return created;
    });
  }

  private async mutate<
    T extends {
      userId: string;
      programId: string;
      expectedVersion: number;
      idempotencyKey: string;
      payloadHash: string;
    },
  >(
    data: T,
    type: MealProgramMutationType,
    apply: (transaction: Prisma.TransactionClient) => Promise<void>,
  ): Promise<MealProgramRecord> {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.$queryRaw<Array<{ id: string }>>`
        SELECT "id" FROM "meal_programs" WHERE "id" = ${data.programId}::uuid FOR UPDATE
      `;
      const existing = await transaction.mealProgramMutation.findUnique({
        where: {
          userId_idempotencyKey: { userId: data.userId, idempotencyKey: data.idempotencyKey },
        },
      });
      if (existing) {
        if (existing.payloadHash !== data.payloadHash)
          throw new MealProgramIdempotencyConflictError();
        return transaction.mealProgram.findFirstOrThrow({
          where: { id: existing.mealProgramId, userId: data.userId },
          include: programInclude,
        });
      }
      const updated = await transaction.mealProgram.updateMany({
        where: { id: data.programId, userId: data.userId, version: data.expectedVersion },
        data: { version: { increment: 1 } },
      });
      if (!updated.count) throw new MealProgramVersionConflictError();
      await apply(transaction);
      await transaction.mealProgramMutation.create({
        data: {
          userId: data.userId,
          mealProgramId: data.programId,
          type,
          idempotencyKey: data.idempotencyKey,
          payloadHash: data.payloadHash,
          resultingVersion: data.expectedVersion + 1,
        },
      });
      return transaction.mealProgram.findUniqueOrThrow({
        where: { id: data.programId },
        include: programInclude,
      });
    });
  }

  private async invalidateFrom(
    transaction: Prisma.TransactionClient,
    programId: string,
    weekIndex: number,
  ) {
    await transaction.mealProgramAnalysis.updateMany({
      where: { mealProgramId: programId, status: MealProgramAnalysisStatus.CURRENT },
      data: { status: MealProgramAnalysisStatus.STALE },
    });
    await transaction.mealProgramWeek.updateMany({
      where: { mealProgramId: programId, weekIndex: { gt: weekIndex } },
      data: { projectionStatus: MealProgramProjectionStatus.STALE },
    });
  }
}
