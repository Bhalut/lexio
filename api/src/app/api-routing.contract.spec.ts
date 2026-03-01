import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('API routing contract', () => {
  const openApiPath = resolve(
    __dirname,
    '../../../docs/specs/openapi.yaml',
  );
  const openApi = readFileSync(openApiPath, 'utf8');

  it('documents the versioned public server URL', () => {
    expect(openApi).toContain('url: http://localhost:3000/api/v1');
  });

  it('documents the current route surface', () => {
    expect(openApi).toContain('/auth/sessions:');
    expect(openApi).toContain('/auth/password-resets:');
    expect(openApi).toContain('/auth/password-resets/confirm:');
    expect(openApi).toContain('/auth/oidc/authorize:');
    expect(openApi).toContain('/auth/oidc/callback:');
    expect(openApi).toContain('/users/me:');
    expect(openApi).toContain('/cases/{caseId}/document-deliveries:');
    expect(openApi).toContain('/cases/{caseId}/activities:');
    expect(openApi).toContain('/users/{userId}/case-assignments/events:');
  });

  it('does not expose deprecated route names', () => {
    expect(openApi).not.toContain('/document-batches');
    expect(openApi).not.toContain('/auth/password-reset/request');
    expect(openApi).not.toContain('/auth/password-reset/confirm');
    expect(openApi).not.toContain('/users/{userId}/reset-password');
    expect(openApi).not.toContain('/cases/{caseId}/activity');
  });
});
