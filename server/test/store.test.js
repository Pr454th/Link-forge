import test from 'node:test';
import assert from 'node:assert/strict';
import { createLinkStore } from '../src/store.js';

test('store creates, retrieves, lists, and counts link clicks', () => {
  const store = createLinkStore({ baseUrl: 'https://short.example' });
  const link = store.create('https://example.com/path', 'unit-test');

  assert.deepEqual(link, {
    id: link.id,
    originalUrl: 'https://example.com/path',
    shortCode: 'unit-test',
    shortUrl: 'https://short.example/unit-test',
    clicks: 0,
    createdAt: link.createdAt,
  });
  assert.ok(link.id);
  assert.equal(Number.isNaN(Date.parse(link.createdAt)), false);
  assert.deepEqual(store.get('unit-test'), link);
  assert.deepEqual(store.list(), [link]);

  const clicked = store.recordClick('unit-test');
  assert.equal(clicked.clicks, 1);
  assert.equal(store.get('unit-test').clicks, 1);
  assert.equal(link.clicks, 0, 'returned link objects do not mutate stored state');
});

test('store creates a unique code when no custom code is supplied', () => {
  const store = createLinkStore({ baseUrl: 'http://localhost:3000' });
  const first = store.create('https://example.com/one');
  const second = store.create('https://example.com/two');

  assert.ok(first.shortCode);
  assert.ok(second.shortCode);
  assert.notEqual(first.shortCode, second.shortCode);
  assert.equal(first.shortUrl, `http://localhost:3000/${first.shortCode}`);
});

test('store rejects duplicate codes and returns undefined for unknown codes', () => {
  const store = createLinkStore({ baseUrl: 'http://localhost:3000' });
  store.create('https://example.com/one', 'duplicate');

  assert.equal(store.create('https://example.com/two', 'duplicate'), undefined);
  assert.equal(store.get('missing'), undefined);
  assert.equal(store.recordClick('missing'), undefined);
});
