import { nxE2EPreset } from '@nx/playwright/preset';
import { workspaceRoot } from '@nx/devkit';
import { defineConfig, devices } from '@playwright/test';

const e2eHost = process.env['E2E_HOST'] || '127.0.0.1';
const apiPort = process.env['API_E2E_PORT'] || '3100';
const webPort = process.env['WEB_E2E_PORT'] || '4300';
const baseURL = process.env['BASE_URL'] || `http://${e2eHost}:${webPort}`;
const databaseUrl =
  process.env['DATABASE_URL'] ||
  `postgresql://postgres:postgres@${e2eHost}:5432/lexio_e2e`;
const seedPassword = process.env['LEXIO_SEED_PASSWORD'] || 'LexioDemo2026!';

const apiEnv = {
  ...process.env,
  NX_DAEMON: 'false',
  PORT: apiPort,
  DATABASE_URL: databaseUrl,
  AUTH_MODE: 'LOCAL',
  AUTH_APP_URL: baseURL,
  AUTH_POST_LOGIN_URL: `${baseURL}/`,
  AUTH_POST_LOGOUT_URL: `${baseURL}/`,
  CORS_ALLOWED_ORIGINS: `${baseURL},http://localhost:${webPort}`,
  LEXIO_SEED_PASSWORD: seedPassword,
};

export default defineConfig({
  ...nxE2EPreset(__filename, { testDir: './src' }),
  fullyParallel: false,
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: `pnpm migration:run && pnpm seed && pnpm nx build api && PORT=${apiPort} node dist/api/main.js`,
      url: `http://${e2eHost}:${apiPort}/api/v1/health`,
      cwd: workspaceRoot,
      env: apiEnv,
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: `pnpm nx build web && HOST=${e2eHost} PORT=${webPort} node dist/web/server/server.mjs`,
      url: baseURL,
      cwd: workspaceRoot,
      env: {
        ...process.env,
        NX_DAEMON: 'false',
        NG_ALLOWED_HOSTS: `${e2eHost},localhost,127.0.0.1`,
        LEXIO_API_PROXY_URL: `http://${e2eHost}:${apiPort}`,
      },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
