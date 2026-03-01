import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const SERVER_INFO_PATH = resolve(
  __dirname,
  '../../.tmp/api-e2e-server.json',
);

module.exports = async function () {
  if (!existsSync(SERVER_INFO_PATH)) {
    return;
  }

  const { pid } = JSON.parse(readFileSync(SERVER_INFO_PATH, 'utf8')) as {
    pid?: number;
  };

  if (pid) {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      // Ignore teardown errors if the process already stopped.
    }
  }

  rmSync(SERVER_INFO_PATH, { force: true });
  console.log('\nAPI E2E environment torn down.\n');
};
