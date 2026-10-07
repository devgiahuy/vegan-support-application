import { createPrismaClient } from './client.js';
import type { PrismaClient } from '@prisma/client';

export interface Database {
  readonly client: PrismaClient;
  check(): Promise<void>;
  disconnect(): Promise<void>;
}

export class PrismaDatabase implements Database {
  constructor(readonly client: PrismaClient = createPrismaClient()) {}

  async check(): Promise<void> {
    const hello = await this.client.$runCommandRaw({ hello: 1 });
    if (!hello.setName && hello.msg !== 'isdbgrid')
      throw new Error('MongoDB replica set or sharded cluster required');
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }
}
