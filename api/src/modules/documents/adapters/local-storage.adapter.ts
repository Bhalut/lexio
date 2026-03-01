import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';

import { StoragePort } from '../ports/storage.port';

@Injectable()
export class LocalStorageAdapter implements StoragePort {
  private readonly basePath: string;

  constructor(private readonly configService: ConfigService) {
    this.basePath = this.configService.get<string>(
      'storage.localPath',
      './var/storage',
    );
  }

  async save(key: string, buffer: Buffer): Promise<void> {
    const fullPath = path.join(this.basePath, key);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, buffer);
  }

  getUrl(key: string): string {
    return `/api/files/${key}`;
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.basePath, key);
    try {
      await fs.unlink(fullPath);
    } catch {
      // File may not exist, ignore
    }
  }
}
