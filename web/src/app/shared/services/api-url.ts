import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiUrlService {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);

  readonly value = resolveApiUrl(this.document, this.platformId);
}

export function resolveApiUrl(document: Document, platformId: object): string {
  const configuredUrl = readConfiguredApiUrl(document, platformId);
  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, '');
  }

  return '/api/v1';
}

export function readConfiguredApiUrl(
  document: Document,
  platformId: object,
): string | null {
  const runtimeConfig = globalThis as { __LEXIO_API_URL__?: string };
  if (runtimeConfig.__LEXIO_API_URL__) {
    return runtimeConfig.__LEXIO_API_URL__;
  }

  if (!isPlatformBrowser(platformId)) {
    return null;
  }

  const metaTag = document.querySelector('meta[name="lexio-api-url"]');
  return metaTag?.getAttribute('content')?.trim() || null;
}
