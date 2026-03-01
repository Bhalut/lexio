import path from 'node:path';

import { expect, Page, test } from '@playwright/test';

const seedPassword = process.env['LEXIO_SEED_PASSWORD'] || 'LexioDemo2026!';
const uploadFixturePath = path.resolve(
  process.cwd(),
  'web-e2e/src/fixtures/smoke-evidence.pdf',
);

const users = {
  admin: {
    email: 'carlos.mendoza@lexio.local',
    password: seedPassword,
  },
  operator: {
    email: 'ana.ramirez@lexio.local',
    password: seedPassword,
  },
  viewer: {
    email: 'sofia.ortiz@lexio.local',
    password: seedPassword,
  },
} as const;

test.describe.configure({ mode: 'serial' });

test.describe('Legal workspace smoke coverage', () => {
  test('logs in and resolves the first accessible case', async ({ page }) => {
    await loginToWorkspace(page, users.admin);

    await expect(page).toHaveURL(/\/cases\/[^/]+\/documents$/);
    await expect(page.getByTestId('current-user-menu')).toContainText(
      'Dr. Carlos Mendoza',
    );
  });

  test('keeps read-only users out of write flows', async ({ page }) => {
    await loginToWorkspace(page, users.viewer);

    await expect(page.getByTestId('open-upload-modal')).toBeDisabled();

    await page.getByTestId('tab-notes').click();
    await expect(page.getByTestId('note-input')).toBeDisabled();

    await page.getByTestId('tab-parties').click();
    await expect(page.getByTestId('add-party')).toBeDisabled();
  });

  test('creates a note for an assigned operator', async ({ page }) => {
    await loginToWorkspace(page, users.operator);

    const noteText = `Nota smoke ${Date.now()}`;
    await page.getByTestId('tab-notes').click();
    await page.getByTestId('note-input').fill(noteText);
    await page.getByTestId('note-submit').click();

    await expect(page.getByTestId('notes-list')).toContainText(noteText);
  });

  test('uploads a document delivery with legal metadata', async ({ page }) => {
    await loginToWorkspace(page, users.admin);

    await page.getByTestId('open-upload-modal').click();
    await expect(page.getByTestId('upload-modal')).toBeVisible();

    await page
      .getByTestId('upload-title-input')
      .fill(`Entrega smoke ${Date.now()}`);
    await page
      .getByTestId('upload-description-input')
      .fill('Carga automática de humo para validar documentos, categoría y fase.');
    await page
      .getByTestId('upload-category-select')
      .selectOption({ label: 'Pruebas documentales' });
    await page
      .getByTestId('upload-phase-select')
      .selectOption({ label: 'Fase probatoria' });
    await page
      .getByTestId('upload-file-input')
      .setInputFiles(uploadFixturePath);
    await page.getByTestId('upload-submit').click();

    await expect(page.getByTestId('workspace-toast')).toContainText(
      'Entrega registrada correctamente.',
    );
    await expect(page.getByText('smoke-evidence.pdf')).toBeVisible();
  });

  test('enforces assignment restrictions after an admin revokes access', async ({
    page,
  }) => {
    test.slow();
    const caseId = await loginToWorkspace(page, users.admin);

    await openUserAdmin(page);
    await page
      .getByTestId('user-admin-modal')
      .getByRole('button', { name: /Lic\. Ana Ramírez/i })
      .click();
    await page
      .getByTestId(`assignment-level-${caseId}`)
      .selectOption('EDITOR');
    await page.getByTestId(`save-assignment-${caseId}`).click();
    await expect(
      page.getByText('Asignación de expediente actualizada.'),
    ).toBeVisible();
    await page.getByTestId(`remove-assignment-${caseId}`).click();

    await expect(
      page.getByText('Asignación de expediente removida.'),
    ).toBeVisible();

    await logout(page);
    await loginWithoutWorkspace(page, users.operator);

    await expect(page.getByTestId('case-entry-title')).toHaveText(
      'No tienes expedientes asignados',
    );
  });
});

async function loginToWorkspace(
  page: Page,
  user: { email: string; password: string },
): Promise<string> {
  await page.goto('/');
  await expect(page.getByTestId('login-form')).toBeVisible();
  await page.getByTestId('login-email').fill(user.email);
  await page.getByTestId('login-password').fill(user.password);
  await page.getByTestId('login-submit').click();

  await page.waitForURL(/\/cases\/[^/]+\/documents$/);
  await page.waitForLoadState('networkidle');
  await expect(page.getByTestId('documents-workspace')).toBeVisible();
  return extractCaseId(page.url());
}

async function loginWithoutWorkspace(
  page: Page,
  user: { email: string; password: string },
): Promise<void> {
  await page.goto('/');
  await expect(page.getByTestId('login-form')).toBeVisible();
  await page.getByTestId('login-email').fill(user.email);
  await page.getByTestId('login-password').fill(user.password);
  await page.getByTestId('login-submit').click();
  await page.waitForLoadState('networkidle');
}

async function openUserAdmin(page: Page): Promise<void> {
  const manageUsersButton = page.getByTestId('open-user-admin');
  if (!(await manageUsersButton.isVisible().catch(() => false))) {
    await page.getByTestId('current-user-menu').click();
  }

  await page.getByTestId('open-user-admin').click();
  await expect(page.getByTestId('user-admin-modal')).toBeVisible();
}

async function logout(page: Page): Promise<void> {
  if (await page.getByTestId('login-form').isVisible().catch(() => false)) {
    return;
  }

  const userAdminModal = page.getByTestId('user-admin-modal');
  if (await userAdminModal.isVisible().catch(() => false)) {
    await userAdminModal.getByRole('button', { name: 'Cerrar' }).click();
    await expect(userAdminModal).toBeHidden();
  }

  const logoutButton = page.getByTestId('logout-button');
  if (!(await logoutButton.isVisible().catch(() => false))) {
    await page.getByTestId('current-user-menu').click();
  }

  await page.getByTestId('logout-button').click();
  await expect(page.getByTestId('login-form')).toBeVisible();
}

function extractCaseId(currentUrl: string): string {
  const caseMatch = currentUrl.match(/\/cases\/([^/]+)\/documents$/);
  if (!caseMatch) {
    throw new Error(`Could not extract case id from URL: ${currentUrl}`);
  }

  return caseMatch[1];
}
