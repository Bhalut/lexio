import { ConfigService } from '@nestjs/config';

import { LocalStorageAdapter } from './local-storage.adapter';

describe('LocalStorageAdapter', () => {
  it('returns a relative file URL when no public base URL is configured', () => {
    const adapter = new LocalStorageAdapter(
      createConfigService({
        'storage.localPath': './var/storage',
        'storage.publicBaseUrl': null,
      }),
    );

    expect(adapter.getUrl('case-1/delivery-1/file.pdf')).toBe(
      '/api/files/case-1/delivery-1/file.pdf',
    );
  });

  it('returns an absolute file URL when a public base URL is configured', () => {
    const adapter = new LocalStorageAdapter(
      createConfigService({
        'storage.localPath': './var/storage',
        'storage.publicBaseUrl': 'https://cdn.lexio.app/files/',
      }),
    );

    expect(adapter.getUrl('/case-1/delivery-1/file.pdf')).toBe(
      'https://cdn.lexio.app/files/case-1/delivery-1/file.pdf',
    );
  });
});

function createConfigService(
  values: Record<string, string | null>,
): ConfigService {
  return {
    get: (key: string, defaultValue?: string | null) =>
      values[key] ?? defaultValue ?? null,
  } as ConfigService;
}
