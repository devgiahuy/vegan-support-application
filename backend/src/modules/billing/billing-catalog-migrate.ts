import 'dotenv/config';
import { createPrismaClient } from '../../database/client.js';
import { seedBillingProducts } from './billing.catalog.js';

const prisma = createPrismaClient();
try {
  await seedBillingProducts(prisma);
  console.info('Billing catalog updated; existing orders and subscriptions are unchanged.');
} finally {
  await prisma.$disconnect();
}
