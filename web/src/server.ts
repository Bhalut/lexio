import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { createServer } from 'node:http';
import { dirname, resolve } from 'node:path';
import { Readable } from 'node:stream';
import { fileURLToPath } from 'node:url';

const serverEntryPath = fileURLToPath(import.meta.url);
const serverDistFolder = dirname(serverEntryPath);
const browserDistFolder = resolve(serverDistFolder, '../browser');
const apiProxyUrl = process.env['LEXIO_API_PROXY_URL'] || 'http://127.0.0.1:3000';

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use('/api/v1', async (req, res, next) => {
  try {
    const targetUrl = new URL(req.originalUrl, apiProxyUrl);
    const headers = new Headers();

    for (const [key, value] of Object.entries(req.headers)) {
      if (!value || key === 'host' || key === 'content-length') {
        continue;
      }

      headers.set(key, Array.isArray(value) ? value.join(', ') : value);
    }

    const requestInit = {
      method: req.method,
      headers,
      body:
        req.method === 'GET' || req.method === 'HEAD'
          ? undefined
          : (req as unknown as BodyInit),
      duplex: 'half',
    } as RequestInit & { duplex: 'half' };

    const response = await fetch(targetUrl, requestInit);

    const setCookies = response.headers.getSetCookie?.() ?? [];
    if (setCookies.length > 0) {
      res.setHeader('set-cookie', setCookies);
    }

    response.headers.forEach((value, key) => {
      if (key === 'set-cookie' || key === 'transfer-encoding') {
        return;
      }

      res.setHeader(key, value);
    });

    res.status(response.status);

    if (!response.body) {
      res.end();
      return;
    }

    Readable.fromWeb(
      response.body as unknown as import('node:stream/web').ReadableStream,
    ).pipe(res);
  } catch (error) {
    next(error);
  }
});

app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

app.use('/**', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

export const reqHandler = createNodeRequestHandler(app);

if (process.argv[1] && resolve(process.argv[1]) === serverEntryPath) {
  const host = process.env['HOST'] || '0.0.0.0';
  const port = Number(process.env['PORT'] || '4000');
  const server = createServer((req, res) => reqHandler(req, res));

  server.listen(port, host, () => {
    console.log(`Lexio SSR listening on http://${host}:${port}`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
