import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { app } from '../src/server.js';

let server;
let baseUrl;
const advertisedBaseUrl = (process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`).replace(/\/$/, '');

before(async () => {
  server = createServer(app);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
  if (server?.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function request(path, options) {
  return fetch(`${baseUrl}${path}`, options);
}

test('links API creates and lists links with the documented fields', async () => {
  const customCode = `route-${Date.now().toString(36)}`;
  const response = await request('/api/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com/article?q=one', customCode }),
  });

  assert.equal(response.status, 201);
  const { data: link } = await response.json();
  assert.deepEqual(Object.keys(link).sort(), [
    'clicks', 'createdAt', 'id', 'originalUrl', 'shortCode', 'shortUrl',
  ]);
  assert.equal(link.originalUrl, 'https://example.com/article?q=one');
  assert.equal(link.shortCode, customCode);
  assert.equal(link.shortUrl, `${advertisedBaseUrl}/${customCode}`);
  assert.equal(link.clicks, 0);
  assert.ok(link.id);
  assert.equal(Number.isNaN(Date.parse(link.createdAt)), false);

  const listResponse = await request('/api/links');
  assert.equal(listResponse.status, 200);
  const { data: links } = await listResponse.json();
  assert.ok(links.some((item) => item.id === link.id));
});

test('links API generates a short code when customCode is omitted', async () => {
  const response = await request('/api/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com/generated' }),
  });

  assert.equal(response.status, 201);
  const { data: link } = await response.json();
  assert.ok(link.shortCode);
  assert.equal(link.shortUrl, `${advertisedBaseUrl}/${link.shortCode}`);
});

test('metadata lookup and redirect return the link and increment clicks', async () => {
  const customCode = `click-${Date.now().toString(36)}`;
  const createResponse = await request('/api/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com/destination', customCode }),
  });
  const { data: created } = await createResponse.json();

  const metadataResponse = await request(`/api/links/${customCode}`);
  assert.equal(metadataResponse.status, 200);
  assert.deepEqual((await metadataResponse.json()).data, created);

  const redirectResponse = await request(`/${customCode}`, { redirect: 'manual' });
  assert.equal(redirectResponse.status, 302);
  assert.equal(redirectResponse.headers.get('location'), 'https://example.com/destination');

  const updatedResponse = await request(`/api/links/${customCode}`);
  assert.equal((await updatedResponse.json()).data.clicks, 1);
});

test('invalid and duplicate create requests return error envelopes', async () => {
  const missingUrl = await request('/api/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(missingUrl.status, 400);
  assert.equal(typeof (await missingUrl.json()).error, 'string');

  const invalidUrl = await request('/api/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'javascript:alert(1)' }),
  });
  assert.equal(invalidUrl.status, 400);
  assert.equal(typeof (await invalidUrl.json()).error, 'string');

  const customCode = `dupe-${Date.now().toString(36)}`;
  const create = () => request('/api/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com', customCode }),
  });
  assert.equal((await create()).status, 201);
  const duplicate = await create();
  assert.equal(duplicate.status, 409);
  assert.equal(typeof (await duplicate.json()).error, 'string');
});

test('unknown links and malformed JSON return 404 and 400 errors', async () => {
  const missingMetadata = await request('/api/links/no-such-link');
  assert.equal(missingMetadata.status, 404);
  assert.equal(typeof (await missingMetadata.json()).error, 'string');

  const missingRedirect = await request('/no-such-link');
  assert.equal(missingRedirect.status, 404);
  assert.equal(typeof (await missingRedirect.json()).error, 'string');

  const malformedJson = await request('/api/links', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
  assert.equal(malformedJson.status, 400);
  assert.equal(typeof (await malformedJson.json()).error, 'string');
});
