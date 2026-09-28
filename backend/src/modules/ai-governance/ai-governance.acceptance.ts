import 'dotenv/config';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { randomUUID } from 'node:crypto';
import { PrismaClient, Role } from '@prisma/client';
import pino from 'pino';
import { createApp } from '../../app.js';
import { loadConfig } from '../../config/env.js';
import { PrismaDatabase } from '../../database/database.js';
import { TokenService } from '../auth/token.service.js';
import { AiGovernanceService } from './ai-governance.service.js';
import { governAiProvider } from './ai-governance.providers.js';
import { aiCorrelationContext } from './ai-governance.context.js';
import { UnavailableAiProvider, type AiProvider } from '../chat/ai-provider.js';

async function main(): Promise<void> {
  const config = loadConfig();
  const db = new PrismaClient();
  const database = new PrismaDatabase(db);
  const governance = new AiGovernanceService(db, config);
  const [admin, member] = await Promise.all([
    db.user.findFirstOrThrow({
      where: { role: Role.ADMIN, status: 'ACTIVE' },
      select: { id: true, role: true },
    }),
    db.user.findFirstOrThrow({
      where: { role: Role.MEMBER, status: 'ACTIVE' },
      select: { id: true, role: true },
    }),
  ]);
  const tokens = new TokenService(config);
  const adminToken = (await tokens.issueAccessToken(admin)).token;
  const memberToken = (await tokens.issueAccessToken(member)).token;
  const server = createServer(createApp({ config, database, logger: pino({ level: 'silent' }) }));
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test listener');
  const base = `http://127.0.0.1:${address.port}/api/v1/admin/ai`;
  const marker = randomUUID();
  const startedAt = new Date();
  const provider = config.ai.provider;
  const original = await db.aiCapabilityControl.findUnique({
    where: { capability_provider: { capability: 'CHAT', provider } },
  });
  const auditIds: string[] = [];
  try {
    const get = (path: string, token?: string) =>
      fetch(`${base}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    assert.equal((await get('/health')).status, 401);
    assert.equal((await get('/health', memberToken)).status, 403);
    assert.equal((await get('/health', adminToken)).status, 200);

    await aiCorrelationContext.run(marker, async () => {
      await governance.record({
        capability: 'CHAT',
        provider: marker,
        status: 'SUCCESS',
        startedAt,
        inputTokens: 3,
        outputTokens: 4,
      });
      await governance.record({
        capability: 'CHAT',
        provider: marker,
        status: 'FAILED',
        errorClass: 'PROVIDER_UNAVAILABLE',
        startedAt,
      });
    });
    const pageResponse = await get(`/requests?provider=${marker}&limit=1&page=1`, adminToken);
    assert.equal(pageResponse.status, 200);
    const page = (await pageResponse.json()) as {
      data: Array<Record<string, unknown>>;
      meta: { total: number };
    };
    assert.equal(page.data.length, 1);
    assert.equal(page.meta.total, 2);
    assert.equal(page.data[0]?.redacted, true);
    assert.ok(!JSON.stringify(page).includes('promptHash'));
    const metrics = (await (await get(`/metrics?provider=${marker}`, adminToken)).json()) as {
      data: { providerUnavailable: number };
    };
    assert.equal(metrics.data.providerUnavailable, 1);
    await aiCorrelationContext.run(marker, async () =>
      assert.rejects(async () => {
        for await (const chunk of governAiProvider(
          new UnavailableAiProvider(config),
          governance,
          config,
        ).streamChat({ instructions: '', messages: [], signal: new AbortController().signal }))
          assert.fail(`Unexpected provider chunk: ${chunk.type}`);
      }),
    );
    const missingProviderMetrics = (await (
      await get('/metrics?provider=unavailable', adminToken)
    ).json()) as { data: { providerUnavailable: number } };
    assert.ok(missingProviderMetrics.data.providerUnavailable >= 1);

    const current = await db.aiCapabilityControl.findUnique({
      where: { capability_provider: { capability: 'CHAT', provider } },
    });
    const patch = (version: number, enabled: boolean) =>
      fetch(`${base}/features/CHAT`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          expectedVersion: version,
          enabled,
          reason: enabled ? 'RESTORE_SERVICE' : 'PLANNED_MAINTENANCE',
        }),
      });
    const changed = await patch(current?.version ?? 0, false);
    assert.equal(changed.status, 200);
    const changedBody = (await changed.json()) as { data: { version: number; enabled: boolean } };
    assert.equal(changedBody.data.enabled, false);
    assert.equal(await governance.allowed('CHAT', provider), false);
    assert.equal((await patch(current?.version ?? 0, true)).status, 409);
    const actionCount = await db.moderationAction.count();
    const fakeProvider: AiProvider = {
      name: provider,
      chatModel: config.ai.chatModel,
      async *streamChat() {
        await Promise.resolve();
        yield { type: 'complete', responseId: 'unused', inputTokens: null, outputTokens: null };
      },
      moderate: () => Promise.resolve({ flagged: true }),
      suggestRecipeNutritionFallback: () =>
        Promise.resolve({ stepMethods: [], yieldFactors: [], retentionFactors: [] }),
      suggestCustomMealNutritionFallback: () =>
        Promise.resolve({
          calories: null,
          proteinGrams: null,
          carbsGrams: null,
          fatGrams: null,
          fiberGrams: null,
          confidence: 0,
          uncertaintyNote: 'Không có ước tính.',
        }),
    };
    const governed = governAiProvider(fakeProvider, governance, config);
    await aiCorrelationContext.run(marker, async () =>
      assert.rejects(async () => {
        for await (const chunk of governed.streamChat({
          instructions: '',
          messages: [],
          signal: new AbortController().signal,
        })) {
          assert.fail(`Unexpected provider chunk: ${chunk.type}`);
        }
      }),
    );
    assert.equal(await db.moderationAction.count(), actionCount);
    const restored = await patch(changedBody.data.version, original?.enabled ?? true);
    assert.equal(restored.status, 200);
    const moderation = await aiCorrelationContext.run(marker, () =>
      governed.moderate('fixture', new AbortController().signal),
    );
    assert.equal(moderation.flagged, true);
    assert.equal(await db.moderationAction.count(), actionCount);
    assert.ok(
      !JSON.stringify(
        await (await get(`/requests?provider=${provider}`, adminToken)).json(),
      ).includes('fixture'),
    );
    const audits = await db.aiCapabilityControlAudit.findMany({
      where: { capability: 'CHAT', provider, actorId: admin.id, createdAt: { gte: startedAt } },
      select: { id: true, reason: true },
    });
    assert.ok(audits.length >= 2 && audits.every((row) => row.reason.length >= 10));
    auditIds.push(...audits.map((row) => row.id));
    assert.equal((await get(`/features/audit?provider=${provider}`, memberToken)).status, 403);
    const auditPage = (await (
      await get(`/features/audit?provider=${provider}&limit=1`, adminToken)
    ).json()) as { data: Array<{ reason: string }>; meta: { total: number } };
    assert.equal(auditPage.data.length, 1);
    assert.ok(auditPage.meta.total >= 2);
    assert.ok(['PLANNED_MAINTENANCE', 'RESTORE_SERVICE'].includes(auditPage.data[0]!.reason));

    const old = await db.aiGovernanceEvent.create({
      data: {
        capability: 'CHAT',
        provider: marker,
        correlationId: marker,
        status: 'SUCCESS',
        safetyOutcome: 'NONE',
        startedAt: new Date('2020-01-01'),
        completedAt: new Date('2020-01-01'),
        createdAt: new Date('2020-01-01'),
      },
    });
    await governance.cleanup(new Date('2021-01-01'));
    assert.equal(await db.aiGovernanceEvent.count({ where: { id: old.id } }), 0);
    console.info(
      'AI governance acceptance passed: RBAC, redaction, pagination, metrics, toggle/fallback, audit, stale version, retention and no auto sanction',
    );
  } finally {
    await db.aiGovernanceEvent.deleteMany({ where: { correlationId: marker } });
    if (auditIds.length)
      await db.aiCapabilityControlAudit.deleteMany({ where: { id: { in: auditIds } } });
    if (original)
      await db.aiCapabilityControl.update({
        where: { capability_provider: { capability: 'CHAT', provider } },
        data: { enabled: original.enabled, version: original.version },
      });
    else await db.aiCapabilityControl.deleteMany({ where: { capability: 'CHAT', provider } });
    server.close();
    await once(server, 'close');
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
