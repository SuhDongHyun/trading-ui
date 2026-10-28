import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getInitialBitcoinMarket, getInitialPage, shouldFallbackFromInvalidBitcoinHash } from '../src/presentation/pageRouting.ts';

test('a supported market hash selects the coin page synchronously', () => {
  assert.equal(getInitialPage('#KRW-ETH'), 'bitcoin');
  assert.equal(getInitialPage('#BTC-BTC'), 'bitcoin');
  assert.equal(getInitialBitcoinMarket('#USDT-BTC'), 'USDT-BTC');
  assert.equal(getInitialBitcoinMarket('#KRW%2DETH'), 'KRW-ETH');
});

test('non-market and malformed hashes preserve the default page', () => {
  assert.equal(getInitialPage(''), 'summary');
  assert.equal(getInitialPage('#OTHER-BTC'), 'summary');
  assert.equal(getInitialBitcoinMarket('#%E0%A4%A'), null);
});

test('only an unresolved invalid hash falls back when the user has not navigated', () => {
  assert.equal(shouldFallbackFromInvalidBitcoinHash('KRW-MISSING', ['KRW-BTC'], false), true);
  assert.equal(shouldFallbackFromInvalidBitcoinHash('KRW-BTC', ['KRW-BTC'], false), false);
  assert.equal(shouldFallbackFromInvalidBitcoinHash('KRW-MISSING', ['KRW-BTC'], true), false);
  assert.equal(shouldFallbackFromInvalidBitcoinHash(null, ['KRW-BTC'], false), false);
});
