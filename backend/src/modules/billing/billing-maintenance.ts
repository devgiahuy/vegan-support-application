import 'dotenv/config';
import { createPrismaClient } from '../../database/client.js';
import { loadConfig } from '../../config/env.js';
import { EntitlementService } from '../entitlements/entitlement.service.js';
import { BillingService } from './billing.service.js';

const prisma = createPrismaClient();
const config = loadConfig();
const entitlements = new EntitlementService(prisma, config);
const service = new BillingService(prisma, entitlements, config);
try {
  console.info('Recovered usage reservations:', await entitlements.recover());
  if (
    process.argv[2] === 'reconcile' &&
    config.billing.enabled &&
    config.billing.provider === 'payos'
  ) {
    const orders = await prisma.paymentOrder.findMany({
      where: {
        provider: 'payos',
        status: { not: 'PAID' },
        createdAt: { gt: new Date(Date.now() - 86400000) },
      },
      take: 100,
    });
    let confirmed = 0;
    for (const order of orders) {
      try {
        if ((await service.reconcile(order.ownerId, order.id, '127.0.0.1')).status === 'PAID')
          confirmed++;
      } catch {
        console.info('Order still unconfirmed:', order.id);
      }
    }
    console.info('Reconciled paid orders:', confirmed);
  }
} finally {
  await prisma.$disconnect();
}
