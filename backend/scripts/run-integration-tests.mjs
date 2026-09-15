import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createServer } from 'node:net';

function commandExists(command) {
  return spawnSync(command, ['--version'], { stdio: 'ignore' }).status === 0;
}

function run(command, args, environment) {
  const result = spawnSync(command, args, { env: environment, stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${command} exited with status ${String(result.status)}`);
  }
}

async function reservePort() {
  return await new Promise((resolve, reject) => {
    const server = createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        server.close();
        reject(new Error('Could not reserve a PostgreSQL test port'));
        return;
      }
      const { port } = address;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

const externalTestUrl = process.env.TEST_DATABASE_URL;
let clusterDirectory;
let temporaryServerStarted = false;

try {
  let databaseUrl = externalTestUrl;

  if (databaseUrl) {
    const databaseName = new URL(databaseUrl).pathname.slice(1);
    if (!/test/i.test(databaseName)) {
      throw new Error('TEST_DATABASE_URL must reference a database whose name contains "test".');
    }
  }

  if (!databaseUrl) {
    for (const command of ['initdb', 'pg_ctl', 'createdb']) {
      if (!commandExists(command)) {
        throw new Error(
          `TEST_DATABASE_URL is not set and ${command} is unavailable. ` +
            'Install PostgreSQL client/server binaries or provide a dedicated test database.',
        );
      }
    }

    clusterDirectory = mkdtempSync(join(tmpdir(), 'vegan-support-postgres-'));
    const port = await reservePort();
    run(
      'initdb',
      [
        '--pgdata',
        clusterDirectory,
        '--auth=trust',
        '--username=postgres',
        '--no-locale',
        '--encoding=UTF8',
      ],
      process.env,
    );
    run(
      'pg_ctl',
      [
        '--pgdata',
        clusterDirectory,
        '--options',
        `-p ${String(port)} -h 127.0.0.1 -k ${clusterDirectory}`,
        '--wait',
        'start',
      ],
      process.env,
    );
    temporaryServerStarted = true;
    run(
      'createdb',
      ['--host=127.0.0.1', `--port=${String(port)}`, '--username=postgres', 'vegan_support_test'],
      process.env,
    );
    databaseUrl = `postgresql://postgres@127.0.0.1:${String(port)}/vegan_support_test?schema=public`;
  }

  const testEnvironment = {
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: databaseUrl,
    TEST_DATABASE_URL: databaseUrl,
    LOG_LEVEL: 'silent',
  };

  run('prisma', ['migrate', 'deploy'], testEnvironment);
  run('prisma', ['db', 'seed'], testEnvironment);
  run('vitest', ['run', '--config', 'vitest.integration.config.ts'], testEnvironment);
} finally {
  if (temporaryServerStarted && clusterDirectory) {
    spawnSync('pg_ctl', ['--pgdata', clusterDirectory, '--wait', '--mode=fast', 'stop'], {
      stdio: 'inherit',
    });
  }
  if (clusterDirectory?.startsWith(join(tmpdir(), 'vegan-support-postgres-'))) {
    rmSync(clusterDirectory, { recursive: true, force: true });
  }
}
