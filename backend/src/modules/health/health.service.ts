import type { Database } from '../../database/database.js';

export class HealthService {
  constructor(private readonly database: Database) {}

  async isDatabaseAvailable(): Promise<boolean> {
    try {
      await this.database.check();
      return true;
    } catch {
      return false;
    }
  }
}
