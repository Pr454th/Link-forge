import express from 'express';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLinkStore } from './store.js';

const app = express();
const port = Number.parseInt(process.env.PORT || '3000', 10);
const baseUrl = (process.env.BASE_URL || `http://localhost:${port}`).replace(/\/$/, '');
const links = createLinkStore({ baseUrl });

app.use(express.json({ limit: '16kb' }));

app.get('/api/links', (_request, response) => {
  response.json({ data: links.list() });
});

app.post('/api/links', (request, response) => {
  const { url, customCode } = request.body || {};
  if (typeof url !== 'string' || !url.trim()) {
    return response.status(400).json({ error: 'A URL is required.' });
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url.trim());
  } catch {
    return response.status(400).json({ error: 'Enter a valid absolute URL.' });
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    return response.status(400).json({ error: 'Only HTTP and HTTPS URLs are supported.' });
  }

  let normalizedCode;
  if (customCode !== undefined && customCode !== '') {
    if (typeof customCode !== 'string' || !/^[A-Za-z0-9_-]{3,32}$/.test(customCode)) {
      return response.status(400).json({
        error: 'Custom codes must be 3–32 characters using letters, numbers, hyphens, or underscores.',
      });
    }
    normalizedCode = customCode;
  }

  const link = links.create(parsedUrl.toString(), normalizedCode);
  if (!link) return response.status(409).json({ error: 'That short code is already in use.' });
  return response.status(201).json({ data: link });
});

app.get('/api/links/:code', (request, response) => {
  const link = links.get(request.params.code);
  if (!link) return response.status(404).json({ error: 'Short link not found.' });
  return response.json({ data: link });
});

app.get('/:code', (request, response) => {
  const link = links.recordClick(request.params.code);
  if (!link) return response.status(404).json({ error: 'Short link not found.' });
  return response.redirect(302, link.originalUrl);
});

app.use((_request, response) => {
  response.status(404).json({ error: 'Route not found.' });
});

app.use((error, _request, response, _next) => {
  if (error instanceof SyntaxError && 'body' in error) {
    return response.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  console.error(error);
  return response.status(500).json({ error: 'An unexpected server error occurred.' });
});

export { app };

const isMainModule = process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1]);
if (isMainModule) {
  app.listen(port, () => {
    console.log(`Link Forge API listening on ${baseUrl}`);
  });
}
