import { registerAs } from '@nestjs/config';

export const storageConfig = registerAs('storage', () => ({
  driver: process.env.STORAGE_DRIVER || 'local',
  localPath: process.env.STORAGE_LOCAL_PATH || './var/storage',
  publicBaseUrl: normalizeStoragePublicBaseUrl(
    process.env.STORAGE_PUBLIC_BASE_URL,
  ),
}));

function normalizeStoragePublicBaseUrl(
  value: string | undefined,
): string | null {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return null;
  }

  return trimmedValue.replace(/\/+$/, '');
}
