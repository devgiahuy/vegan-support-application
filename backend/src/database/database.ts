import { PrismaClient } from '@prisma/client';

export interface Database {
  check(): Promise<void>;
  disconnect(): Promise<void>;
}

export class PrismaDatabase implements Database {
  constructor(private readonly client: PrismaClient = new PrismaClient()) {}

  async check(): Promise<void> {
    await this.client.$queryRaw`SELECT 1`;
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }
}
