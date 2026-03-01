import axios, { AxiosError } from 'axios';

const FormData = require('form-data');

const API_URL = '/api/v1';
const SEED_PASSWORD = process.env.LEXIO_SEED_PASSWORD || 'LexioDemo2026!';
const ADMIN_EMAIL = 'carlos.mendoza@lexio.local';

function getSessionCookie(setCookieHeader?: string[]): string {
  const cookie = setCookieHeader?.find((value) => value.startsWith('lexio_session='));
  if (!cookie) {
    throw new Error('Session cookie was not returned by the API.');
  }

  return cookie.split(';')[0];
}

async function loginAsAdmin(): Promise<string> {
  const response = await axios.post(`${API_URL}/auth/sessions`, {
    email: ADMIN_EMAIL,
    password: SEED_PASSWORD,
  });

  expect(response.status).toBe(201);
  return getSessionCookie(response.headers['set-cookie'] as string[] | undefined);
}

async function getFirstCaseId(cookie: string): Promise<string> {
  const response = await axios.get(`${API_URL}/cases`, {
    headers: { Cookie: cookie },
  });

  expect(response.status).toBe(200);
  expect(Array.isArray(response.data)).toBe(true);
  expect(response.data.length).toBeGreaterThan(0);
  return response.data[0].id as string;
}

describe('Lexio API v1', () => {
  let sessionCookie = '';
  let caseId = '';

  beforeAll(async () => {
    sessionCookie = await loginAsAdmin();
    caseId = await getFirstCaseId(sessionCookie);
  });

  describe('Auth routes', () => {
    it('returns the current user for an active session', async () => {
      const response = await axios.get(`${API_URL}/users/me`, {
        headers: { Cookie: sessionCookie },
      });

      expect(response.status).toBe(200);
      expect(response.data).toMatchObject({
        email: ADMIN_EMAIL,
      });
    });

    it('clears the current session', async () => {
      const cookie = await loginAsAdmin();
      const logoutResponse = await axios.delete(`${API_URL}/auth/sessions/current`, {
        headers: { Cookie: cookie },
      });

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.data).toMatchObject({ success: true });

      try {
        await axios.get(`${API_URL}/users/me`, {
          headers: { Cookie: cookie },
        });
        fail('Expected 401 after deleting the session');
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(401);
      }
    });
  });

  describe('Cases routes', () => {
    it('returns 400 for an invalid case UUID', async () => {
      try {
        await axios.get(`${API_URL}/cases/not-a-uuid`, {
          headers: { Cookie: sessionCookie },
        });
        fail('Expected 400 error');
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(400);
      }
    });

    it('returns 404 for a non-existent case', async () => {
      try {
        await axios.get(
          `${API_URL}/cases/00000000-0000-0000-0000-000000000000`,
          {
            headers: { Cookie: sessionCookie },
          },
        );
        fail('Expected 404 error');
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(404);
      }
    });
  });

  describe('Document deliveries routes', () => {
    it('returns 400 for an invalid caseId', async () => {
      try {
        await axios.get(`${API_URL}/cases/bad-id/document-deliveries`, {
          headers: { Cookie: sessionCookie },
        });
        fail('Expected 400 error');
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(400);
      }
    });

    it('returns 404 for a non-existent case', async () => {
      try {
        await axios.get(
          `${API_URL}/cases/00000000-0000-0000-0000-000000000000/document-deliveries`,
          {
            headers: { Cookie: sessionCookie },
          },
        );
        fail('Expected 404 error');
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(404);
      }
    });

    it('returns 400 when no files are uploaded', async () => {
      const form = new FormData();
      form.append('title', 'Test delivery');
      form.append('description', 'Test description');
      form.append('category', 'Pruebas documentales');
      form.append('relatedPhase', 'Fase probatoria');

      try {
        await axios.post(`${API_URL}/cases/${caseId}/document-deliveries`, form, {
          headers: {
            ...form.getHeaders(),
            Cookie: sessionCookie,
          },
        });
        fail('Expected 400 error');
      } catch (error: unknown) {
        const axiosError = error as AxiosError;
        expect(axiosError.response?.status).toBe(400);
      }
    });

    it('rejects unsupported MIME types', async () => {
      const form = new FormData();
      form.append('title', 'Test delivery');
      form.append('description', 'Test description');
      form.append('category', 'Pruebas documentales');
      form.append('relatedPhase', 'Fase probatoria');
      form.append('files', Buffer.from('#!/bin/bash\necho hack'), {
        filename: 'malicious.sh',
        contentType: 'application/x-sh',
      });

      try {
        await axios.post(`${API_URL}/cases/${caseId}/document-deliveries`, form, {
          headers: {
            ...form.getHeaders(),
            Cookie: sessionCookie,
          },
        });
        fail('Expected 400 error');
      } catch (error: unknown) {
        const axiosError = error as AxiosError<{ message: string }>;
        expect(axiosError.response?.status).toBe(400);
        expect(axiosError.response?.data?.message).toContain(
          'Unsupported file type',
        );
      }
    });

    it('successfully uploads a PDF delivery', async () => {
      const form = new FormData();
      form.append('title', `E2E delivery ${Date.now()}`);
      form.append('description', 'Created by API E2E test');
      form.append('category', 'Pruebas documentales');
      form.append('relatedPhase', 'Fase probatoria');
      form.append('files', Buffer.from('%PDF-1.4 fake content'), {
        filename: 'test-document.pdf',
        contentType: 'application/pdf',
      });

      const response = await axios.post(
        `${API_URL}/cases/${caseId}/document-deliveries`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Cookie: sessionCookie,
          },
        },
      );

      expect(response.status).toBe(201);
      expect(response.data).toMatchObject({
        description: 'Created by API E2E test',
        caseId,
        category: 'Pruebas documentales',
        relatedPhase: 'Fase probatoria',
      });
      expect(response.data.documents).toHaveLength(1);
      expect(response.data.documents[0]).toMatchObject({
        originalName: 'test-document.pdf',
        mimeType: 'application/pdf',
      });
      expect(response.data.documents[0].checksum).toHaveLength(64);
    });

    it('uploads multiple files in one delivery', async () => {
      const form = new FormData();
      form.append('title', `Multi-file delivery ${Date.now()}`);
      form.append('description', 'Two files in one delivery');
      form.append('category', 'Correspondencia del caso');
      form.append('relatedPhase', 'Alegatos');
      form.append('files', Buffer.from('%PDF content 1'), {
        filename: 'file1.pdf',
        contentType: 'application/pdf',
      });
      form.append('files', Buffer.from('image data'), {
        filename: 'photo.png',
        contentType: 'image/png',
      });

      const response = await axios.post(
        `${API_URL}/cases/${caseId}/document-deliveries`,
        form,
        {
          headers: {
            ...form.getHeaders(),
            Cookie: sessionCookie,
          },
        },
      );

      expect(response.status).toBe(201);
      expect(response.data.documents).toHaveLength(2);
    });

    it('lists deliveries in descending order', async () => {
      const response = await axios.get(
        `${API_URL}/cases/${caseId}/document-deliveries`,
        {
          headers: { Cookie: sessionCookie },
        },
      );

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBe(true);
      expect(response.data.length).toBeGreaterThanOrEqual(2);

      for (let index = 1; index < response.data.length; index += 1) {
        const previous = new Date(response.data[index - 1].createdAt).getTime();
        const current = new Date(response.data[index].createdAt).getTime();
        expect(previous).toBeGreaterThanOrEqual(current);
      }
    });
  });
});
