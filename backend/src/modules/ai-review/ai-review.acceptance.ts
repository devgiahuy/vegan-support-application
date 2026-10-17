import { createPrismaClient } from '../../database/client.js';
import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  AiArtifactType,
  AiArtifactVisibility,
  AiVerificationConclusion,
  ChatMessageRole,
  ChatMessageStatus,
  ContributorApprovalBasis,
  PostType,
  RecognitionJobStatus,
  ReceiptJobStatus,
  Role,
} from '@prisma/client';
import { AppError } from '../../common/errors/app-error.js';
import { AiReviewRepository } from './ai-review.repository.js';
import { AiReviewService } from './ai-review.service.js';

const prefix = 'phase23-acceptance-';
const prisma = createPrismaClient();

async function cleanupArtifacts(ownerId: string): Promise<void> {
  const artifacts = await prisma.aiArtifact.findMany({
    where: { ownerId, title: { startsWith: prefix } },
    select: { id: true, verifications: { select: { id: true } } },
  });
  const artifactIds = artifacts.map((artifact) => artifact.id);
  const verificationIds = artifacts.flatMap((artifact) =>
    artifact.verifications.map((verification) => verification.id),
  );
  if (verificationIds.length) {
    await prisma.aiVerificationAdminAction.deleteMany({
      where: {
        OR: [
          { verificationId: { in: verificationIds } },
          { replacementVerificationId: { in: verificationIds } },
        ],
      },
    });
  }
  if (artifactIds.length)
    await prisma.aiArtifact.deleteMany({ where: { id: { in: artifactIds } } });
}

async function main(): Promise<void> {
  const service = new AiReviewService(new AiReviewRepository(prisma));
  const owner = await prisma.user.findUniqueOrThrow({ where: { email: 'member@example.com' } });
  const admin = await prisma.user.findUniqueOrThrow({ where: { email: 'admin@example.com' } });
  const extraReviewer = await prisma.user.upsert({
    where: { email: 'phase23-statistics-reviewer@example.com' },
    update: { role: Role.ADMIN, status: 'ACTIVE' },
    create: {
      email: 'phase23-statistics-reviewer@example.com',
      passwordHash: 'acceptance-only-not-a-login-credential',
      displayName: 'Phase 23 statistics reviewer',
      role: Role.ADMIN,
    },
  });
  const contributors = await prisma.contributorProfile.findMany({
    where: { revokedAt: null, user: { role: Role.CONTRIBUTOR } },
    include: { user: true },
  });
  const byBasis = new Map(contributors.map((profile) => [profile.approvalBasis, profile.user]));
  const platform = byBasis.get(ContributorApprovalBasis.PLATFORM_TRACK_RECORD);
  const organization = byBasis.get(ContributorApprovalBasis.ORGANIZATION_AFFILIATION);
  const invited = byBasis.get(ContributorApprovalBasis.ADMIN_INVITED);
  assert(
    platform && organization && invited,
    'all three approved Contributor bases must be seeded',
  );

  const ids = {
    session: randomUUID(),
    guestSession: randomUUID(),
    post: randomUUID(),
    revision: randomUUID(),
    recognition: randomUUID(),
    receipt: randomUUID(),
  };
  const privatePromptMarker = 'PRIVATE_PROFILE_CONTEXT_DO_NOT_EXPOSE';
  await cleanupArtifacts(owner.id);
  await prisma.receiptJob.deleteMany({
    where: { ownerId: owner.id, idempotencyKey: { startsWith: prefix } },
  });
  await prisma.recognitionJob.deleteMany({
    where: { ownerId: owner.id, idempotencyKey: { startsWith: prefix } },
  });
  await prisma.post.deleteMany({ where: { authorId: owner.id, slug: { startsWith: prefix } } });
  await prisma.chatSession.deleteMany({ where: { title: { startsWith: prefix } } });
  try {
    await prisma.chatSession.create({
      data: {
        id: ids.session,
        userId: owner.id,
        title: `${prefix}chat`,
      },
    });
    const privateRequest = await prisma.chatMessage.create({
      data: {
        sessionId: ids.session,
        role: ChatMessageRole.USER,
        status: ChatMessageStatus.COMPLETED,
        content: privatePromptMarker,
        idempotencyKey: `${prefix}chat-request`,
        payloadHash: 'd'.repeat(64),
        completedAt: new Date(),
      },
    });
    const chatAnswer = await prisma.chatMessage.create({
      data: {
        sessionId: ids.session,
        role: ChatMessageRole.ASSISTANT,
        status: ChatMessageStatus.COMPLETED,
        content: 'A balanced vegan plate can combine tofu, vegetables, and whole grains.',
        requestMessageId: privateRequest.id,
        completedAt: new Date(),
      },
    });
    await prisma.chatSession.create({
      data: {
        id: ids.guestSession,
        guestIdHash: 'f'.repeat(64),
        title: `${prefix}guest`,
        expiresAt: new Date(Date.now() + 60_000),
      },
    });
    const guestRequest = await prisma.chatMessage.create({
      data: {
        sessionId: ids.guestSession,
        role: ChatMessageRole.USER,
        status: ChatMessageStatus.COMPLETED,
        content: 'Guest private prompt',
        idempotencyKey: `${prefix}guest-request`,
        payloadHash: 'e'.repeat(64),
        completedAt: new Date(),
      },
    });
    const guestAnswer = await prisma.chatMessage.create({
      data: {
        sessionId: ids.guestSession,
        role: ChatMessageRole.ASSISTANT,
        status: ChatMessageStatus.COMPLETED,
        content: 'Guest answer',
        requestMessageId: guestRequest.id,
        completedAt: new Date(),
      },
    });
    await assert.rejects(
      () =>
        service.create(owner.id, {
          type: AiArtifactType.CHAT_ANSWER,
          sourceId: guestAnswer.id,
          title: `${prefix}guest`,
          summary: 'Guest output must remain ineligible.',
          authorAnonymous: true,
        }),
      (error: unknown) =>
        error instanceof AppError && error.code === 'AI_ARTIFACT_SOURCE_NOT_ELIGIBLE',
    );

    await prisma.post.create({
      data: {
        id: ids.post,
        authorId: owner.id,
        type: PostType.RECIPE,
        slug: `${prefix}${ids.post}`,
        revisions: {
          create: {
            id: ids.revision,
            version: 1,
            title: 'Acceptance tofu bowl',
            normalizedTitle: 'acceptance tofu bowl',
            body: 'Acceptance body',
            normalizedBody: 'acceptance body',
            createdById: owner.id,
            nutritionEstimates: {
              create: {
                version: 1,
                calculationVersion: 'acceptance-v1',
                recipeFingerprint: 'a'.repeat(64),
                servings: 2,
                totalRawGrams: 400,
                totalCookedGrams: 360,
                totalNutrients: [],
                perServingNutrients: [
                  {
                    nutrientCode: 'PROTEIN',
                    nutrientName: 'Protein',
                    unit: 'g',
                    amount: 20,
                    origin: 'CANONICAL_CALCULATED',
                    confidence: 0.9,
                    min: 18,
                    max: 22,
                  },
                ],
                sourceVersions: [],
                assumptions: [],
                uncoveredIngredients: [],
                confidence: 0.9,
                uncertainty: { partial: false },
                disclaimer: 'Educational estimate only.',
              },
            },
          },
        },
      },
    });
    const estimate = await prisma.recipeNutritionEstimate.findFirstOrThrow({
      where: { revisionId: ids.revision },
    });
    await prisma.recognitionJob.create({
      data: {
        id: ids.recognition,
        ownerId: owner.id,
        status: RecognitionJobStatus.READY,
        provider: 'private-provider',
        modelId: 'private-model',
        templateVersion: 'private-template',
        idempotencyKey: `${prefix}recognition`,
        requestHash: 'b'.repeat(64),
        attemptCount: 1,
        candidates: {
          create: {
            detectedName: 'Tofu',
            normalizedName: 'tofu',
            quantity: 200,
            unit: 'g',
            confidence: 0.9,
          },
        },
      },
    });
    await prisma.receiptJob.create({
      data: {
        id: ids.receipt,
        ownerId: owner.id,
        status: ReceiptJobStatus.READY,
        provider: 'private-receipt-provider',
        modelId: 'private-receipt-model',
        templateVersion: 'private-receipt-template',
        idempotencyKey: `${prefix}receipt`,
        requestHash: 'c'.repeat(64),
        merchantName: 'Private Merchant',
        attemptCount: 1,
      },
    });
    const receiptInput = await prisma.receiptInput.create({
      data: {
        jobId: ids.receipt,
        assetId: '22000000-0000-4000-8000-000000000001',
        position: 0,
        status: 'PROCESSED',
      },
    });
    await prisma.receiptCandidate.create({
      data: {
        jobId: ids.receipt,
        inputId: receiptInput.id,
        lineText: 'TOFU 200G',
        detectedName: 'Tofu',
        normalizedName: 'tofu',
        quantity: 200,
        unit: 'g',
        confidence: 0.88,
      },
    });

    const sourceInputs = [
      [AiArtifactType.CHAT_ANSWER, chatAnswer.id],
      [AiArtifactType.RECIPE_NUTRITION, estimate.id],
      [AiArtifactType.FRIDGE_RECOGNITION, ids.recognition],
      [AiArtifactType.RECEIPT_EXTRACTION, ids.receipt],
    ] as const;
    const artifacts: Array<Awaited<ReturnType<AiReviewService['create']>>> = [];
    for (const [type, sourceId] of sourceInputs) {
      const draft = await service.create(owner.id, {
        type,
        sourceId,
        title: `${prefix}${type}`,
        summary: `Public-safe ${type} summary.`,
        authorAnonymous: true,
      });
      const shared = await service.updateVisibility(owner.id, draft.id, {
        visibility: AiArtifactVisibility.PUBLIC,
        expectedLifecycleVersion: draft.lifecycle.version,
      });
      artifacts.push(
        await service.submit(owner.id, draft.id, {
          expectedLifecycleVersion: shared.lifecycle.version,
        }),
      );
    }
    assert.equal(artifacts.length, 4);
    const [chatArtifact, nutritionArtifact, recognitionArtifact, receiptArtifact] = artifacts as [
      (typeof artifacts)[number],
      (typeof artifacts)[number],
      (typeof artifacts)[number],
      (typeof artifacts)[number],
    ];
    await assert.rejects(
      () =>
        service.create(owner.id, {
          type: AiArtifactType.CHAT_ANSWER,
          sourceId: chatAnswer.id,
          title: `${prefix}duplicate`,
          summary: 'Duplicate source version.',
          authorAnonymous: true,
        }),
      (error: unknown) => error instanceof AppError && error.code === 'AI_ARTIFACT_ALREADY_SAVED',
    );
    await assert.rejects(
      () =>
        service.verify({ userId: owner.id, role: Role.CONTRIBUTOR }, chatArtifact.id, {
          expectedArtifactVersion: chatArtifact.version,
          conclusion: AiVerificationConclusion.VERIFIED,
          scope: 'Self review',
          evidenceNote: 'Must be rejected.',
        }),
      (error: unknown) => error instanceof AppError && error.code === 'SELF_VERIFICATION_FORBIDDEN',
    );

    const canonicalBefore = await prisma.ingredientFoodProfile.count();
    const platformResult = await service.verify(
      { userId: platform.id, role: Role.CONTRIBUTOR },
      chatArtifact.id,
      {
        expectedArtifactVersion: chatArtifact.version,
        conclusion: AiVerificationConclusion.VERIFIED,
        scope: 'General educational answer',
        evidenceNote: 'Consistent with the cited balanced-plate guidance.',
      },
    );
    const organizationResult = await service.verify(
      { userId: organization.id, role: Role.CONTRIBUTOR },
      nutritionArtifact.id,
      {
        expectedArtifactVersion: nutritionArtifact.version,
        conclusion: AiVerificationConclusion.CORRECTION_NEEDED,
        scope: 'Per-serving protein estimate',
        evidenceNote: 'Serving assumptions need clearer qualification.',
        correction: 'Label the amount as an estimate and retain its uncertainty range.',
      },
    );
    await service.verify({ userId: invited.id, role: Role.CONTRIBUTOR }, recognitionArtifact.id, {
      expectedArtifactVersion: recognitionArtifact.version,
      conclusion: AiVerificationConclusion.VERIFIED,
      scope: 'Recognized ingredient identity only',
      evidenceNote: 'The result supports tofu identity without asserting freshness safety.',
    });
    await assert.rejects(
      () =>
        service.verify({ userId: platform.id, role: Role.CONTRIBUTOR }, receiptArtifact.id, {
          expectedArtifactVersion: receiptArtifact.version + 1,
          conclusion: AiVerificationConclusion.VERIFIED,
          scope: 'Receipt line identity',
          evidenceNote: 'Stale artifact version must fail.',
        }),
      (error: unknown) =>
        error instanceof AppError && error.code === 'AI_ARTIFACT_VERSION_CONFLICT',
    );
    const concurrent = await Promise.allSettled([
      service.verify({ userId: platform.id, role: Role.CONTRIBUTOR }, receiptArtifact.id, {
        expectedArtifactVersion: receiptArtifact.version,
        conclusion: AiVerificationConclusion.VERIFIED,
        scope: 'Receipt line identity',
        evidenceNote: 'The extracted product identity is plausible.',
      }),
      service.verify({ userId: organization.id, role: Role.CONTRIBUTOR }, receiptArtifact.id, {
        expectedArtifactVersion: receiptArtifact.version,
        conclusion: AiVerificationConclusion.REJECTED,
        scope: 'Receipt line identity',
        evidenceNote: 'Concurrent alternative opinion.',
      }),
    ]);
    assert.equal(
      concurrent.filter((result) => result.status === 'fulfilled').length,
      2,
      'distinct eligible reviewers may hold simultaneous effective verifications',
    );

    const receiptRecord = await prisma.aiArtifact.findUniqueOrThrow({
      where: { id: receiptArtifact.id },
      include: { verifications: true },
    });
    const activeReviewerIds = new Set(
      receiptRecord.verifications
        .filter((verification) => verification.status === 'ACTIVE')
        .map((verification) => verification.reviewerId),
    );
    for (const reviewer of [platform, organization, invited, admin, extraReviewer]) {
      if (activeReviewerIds.has(reviewer.id)) continue;
      await service.verify({ userId: reviewer.id, role: reviewer.role }, receiptArtifact.id, {
        expectedArtifactVersion: receiptArtifact.version,
        conclusion: AiVerificationConclusion.VERIFIED,
        scope: 'Thống kê kiểm chứng hiệu lực',
        evidenceNote: 'Bằng chứng kiểm thử xác nhận ý kiến độc lập của người kiểm chứng.',
      });
    }
    const fiveVerifierPage = await service.listPublic({ page: 1, limit: 50 });
    const fiveVerifierArtifact = fiveVerifierPage.data.find(
      (artifact) => artifact.id === receiptArtifact.id,
    );
    assert(fiveVerifierArtifact);
    assert.deepEqual(fiveVerifierArtifact.statistics, {
      verificationCount: 5,
      verifiedByUserCount: 5,
    });

    const adminVerification = await prisma.aiVerification.findFirstOrThrow({
      where: { artifactId: receiptArtifact.id, reviewerId: admin.id, status: 'ACTIVE' },
    });
    const adminOverride = await service.adminAction(admin.id, adminVerification.id, {
      action: 'OVERRIDE',
      expectedVersion: adminVerification.version,
      reason: 'Kiểm thử thay thế ý kiến nhưng vẫn giữ nguyên một người kiểm chứng.',
      conclusion: AiVerificationConclusion.VERIFIED,
      scope: 'Thống kê kiểm chứng hiệu lực sau thay thế',
      evidenceNote: 'Bản thay thế có hiệu lực; bản cũ chỉ còn trong lịch sử kiểm toán.',
      correction: null,
    });
    assert.deepEqual(adminOverride.artifact.statistics, {
      verificationCount: 5,
      verifiedByUserCount: 5,
    });
    const revoked = await service.adminAction(admin.id, adminOverride.verification.id, {
      action: 'REVOKE',
      expectedVersion: adminOverride.verification.version,
      reason: 'Kiểm thử bản ghi bị thu hồi không còn được tính.',
    });
    assert.deepEqual(revoked.artifact.statistics, {
      verificationCount: 4,
      verifiedByUserCount: 4,
    });

    const originalBefore = await prisma.aiVerification.findUniqueOrThrow({
      where: { id: organizationResult.verification.id },
    });
    const override = await service.adminAction(admin.id, organizationResult.verification.id, {
      action: 'OVERRIDE',
      expectedVersion: organizationResult.verification.version,
      reason: 'Admin reviewed the evidence and narrowed the conclusion.',
      conclusion: AiVerificationConclusion.VERIFIED,
      scope: 'Per-serving protein estimate with uncertainty label',
      evidenceNote: 'Accepted only within the displayed uncertainty range.',
      correction: null,
    });
    assert.equal(
      override.verification.supersedes?.verificationId,
      organizationResult.verification.id,
    );
    const originalAfter = await prisma.aiVerification.findUniqueOrThrow({
      where: { id: organizationResult.verification.id },
    });
    assert.equal(
      originalAfter.evidenceNote,
      originalBefore.evidenceNote,
      'Admin override must not rewrite original evidence',
    );
    assert.equal(
      originalAfter.correction,
      originalBefore.correction,
      'Admin override must not rewrite original correction',
    );

    const hidden = await service.updateVisibility(owner.id, chatArtifact.id, {
      visibility: AiArtifactVisibility.PRIVATE,
      expectedLifecycleVersion: platformResult.artifact.lifecycle.version,
    });
    assert.equal(
      hidden.verificationHistory.length,
      1,
      'unsharing must preserve verification audit',
    );
    const publicPage = await service.listPublic({ page: 1, limit: 50 });
    assert(
      !publicPage.data.some((artifact) => artifact.id === hidden.id),
      'unshared artifact must disappear publicly',
    );
    const publicText = JSON.stringify(publicPage);
    for (const forbidden of [
      privatePromptMarker,
      'private-provider',
      'private-model',
      'Private Merchant',
      'ownerId',
      'sourceId',
      'provider',
      'modelId',
      'reviewerId',
      extraReviewer.id,
    ]) {
      assert(!publicText.includes(forbidden), `public DTO leaked ${forbidden}`);
    }
    assert.equal(
      await prisma.ingredientFoodProfile.count(),
      canonicalBefore,
      'verification must not promote canonical food data',
    );
    console.info(
      'Phase 23 acceptance/privacy flow passed: four eligible source types, guest exclusion, strict public DTO, all Contributor bases, self/concurrent/stale conflicts, immutable correction audit, unshare retention, Admin override, and no canonical promotion.',
    );
  } finally {
    await cleanupArtifacts(owner.id);
    await prisma.receiptJob.deleteMany({
      where: { ownerId: owner.id, idempotencyKey: { startsWith: prefix } },
    });
    await prisma.recognitionJob.deleteMany({
      where: { ownerId: owner.id, idempotencyKey: { startsWith: prefix } },
    });
    await prisma.post.deleteMany({ where: { authorId: owner.id, slug: { startsWith: prefix } } });
    await prisma.chatSession.deleteMany({ where: { title: { startsWith: prefix } } });
    await prisma.user.deleteMany({ where: { email: 'phase23-statistics-reviewer@example.com' } });
  }
}

try {
  await main();
} finally {
  await prisma.$disconnect();
}
