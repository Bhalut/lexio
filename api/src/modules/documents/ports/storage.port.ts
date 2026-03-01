export const STORAGE_PORT = 'STORAGE_PORT';

export interface StoragePort {
  save(key: string, buffer: Buffer): Promise<void>;
  getUrl(key: string): string;
  delete(key: string): Promise<void>;
}
