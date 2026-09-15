import { PrismaClient } from '@prisma/client';

export interface Database {
  readonly client: PrismaClient;
  check(): Promise<void>;
  disconnect(): Promise<void>;
}

export class PrismaDatabase implements Database {
  constructor(readonly client: PrismaClient = new PrismaClient()) {}

  async check(): Promise<void> {
    await this.client.$queryRaw`SELECT 1`;
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }
}
