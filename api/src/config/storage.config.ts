import { registerAs } from '@nestjs/config';

export const storageConfig = registerAs('storage', () => ({
  driver: process.env.STORAGE_DRIVER || 'local',
  localPath: process.env.STORAGE_LOCAL_PATH || './var/storage',
}));
