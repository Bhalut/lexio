import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_PORT = '3102';
const DEFAULT_DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:5432/lexio_e2e';
const SERVER_INFO_PATH = resolve(
  __dirname,
  '../../.tmp/api-e2e-server.json',
);

async function waitForApiHealth(host: string, port: string): Promise<void> {
  const healthUrl = `http://${host}:${port}/api/v1/health`;
  const startedAt = Date.now();
  const timeoutMs = 60_000;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until the API responds or we hit the timeout.
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 1_000));
  }

  throw new Error(`API health check timed out at ${healthUrl}`);
}

module.exports = async function () {
  const workspaceRoot = resolve(__dirname, '../../..');
  const host = process.env.HOST ?? DEFAULT_HOST;
  const port = process.env.PORT ?? DEFAULT_PORT;
  const env = {
    ...process.env,
    HOST: host,
    PORT: port,
    AUTH_MODE: process.env.AUTH_MODE ?? 'LOCAL',
    DATABASE_URL: process.env.DATABASE_URL ?? DEFAULT_DATABASE_URL,
  };

  console.log('\nSetting up API E2E environment...\n');

  execFileSync('pnpm', ['migration:run'], {
    cwd: workspaceRoot,
    env,
    stdio: 'inherit',
  });
  execFileSync('pnpm', ['seed'], {
    cwd: workspaceRoot,
    env,
    stdio: 'inherit',
  });

  const child = spawn('node', ['dist/api/main.js'], {
    cwd: workspaceRoot,
    env,
    stdio: 'ignore',
    detached: true,
  });
  child.unref();

  mkdirSync(dirname(SERVER_INFO_PATH), { recursive: true });
  writeFileSync(
    SERVER_INFO_PATH,
    JSON.stringify({ host, port, pid: child.pid }, null, 2),
  );

  await waitForApiHealth(host, port);
};
