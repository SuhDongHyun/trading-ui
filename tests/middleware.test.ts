import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toApiProxyUrl } from '../middleware.ts';

test('toApiProxyUrl strips the /api prefix and keeps the query string', () => {
  const url = toApiProxyUrl(
    'https://trading-ui.vercel.app/api/stock_quote/daily?code=005930',
    'https://trading-api-gold.vercel.app',
  );

  assert.equal(url.href, 'https://trading-api-gold.vercel.app/stock_quote/daily?code=005930');
});

test('toApiProxyUrl ignores trailing slashes in the target', () => {
  const url = toApiProxyUrl('https://trading-ui.vercel.app/api/stock_quote', 'http://localhost:9999/');

  assert.equal(url.href, 'http://localhost:9999/stock_quote');
});
