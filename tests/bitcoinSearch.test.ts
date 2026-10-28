import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { BitcoinCoin } from '../src/domain/bitcoin.ts';
import { filterBitcoinCoins, matchesBitcoinCoin, resolveBitcoinQuote, sortBitcoinCoins, toBitcoinSort, toChosung } from '../src/domain/bitcoinSearch.ts';
import { formatBitcoinAmount, formatBitcoinPrice, formatBitcoinRate, formatBitcoinTradeTime, formatBitcoinVolume } from '../src/presentation/bitcoinFormat.ts';

function coin(overrides: Partial<BitcoinCoin> = {}): BitcoinCoin {
  const base: BitcoinCoin = {
    market: 'KRW-BTC',
    koreanName: '비트코인',
    englishName: 'Bitcoin',
    quote: 'KRW',
    symbol: 'BTC',
    warning: false,
    cautions: [],
    chosung: toChosung('비트코인'),
    tradeDate: '20261028',
    tradeTime: '145413',
    tradeDateKst: '20261028',
    tradeTimeKst: '235413',
    openingPrice: 100,
    highPrice: 120,
    lowPrice: 90,
    tradePrice: 110,
    previousClosingPrice: 105,
    change: 'RISE',
    changePrice: 5,
    changeRate: 5 / 105,
    signedChangePrice: 5,
    signedChangeRate: 5 / 105,
    tradeVolume: 0.5,
    accumulatedTradePrice: 100000000,
    accumulatedTradePrice24h: 100000000,
    accumulatedTradeVolume: 10,
    accumulatedTradeVolume24h: 10,
    highest52WeekPrice: 200,
    highest52WeekDate: '2026-01-01',
    lowest52WeekPrice: 50,
    lowest52WeekDate: '2025-01-01',
  };
  return { ...base, ...overrides };
}

test('bitcoin search matches Korean names, English names, symbols, market codes, and initial consonants', () => {
  const bitcoin = coin();
  assert.equal(matchesBitcoinCoin(bitcoin, '비트'), true);
  assert.equal(matchesBitcoinCoin(bitcoin, 'bitcoin'), true);
  assert.equal(matchesBitcoinCoin(bitcoin, 'BTC'), true);
  assert.equal(matchesBitcoinCoin(bitcoin, 'KRW-BT'), true);
  assert.equal(matchesBitcoinCoin(bitcoin, 'ㅂㅌㅋㅇ'), true);
  assert.equal(matchesBitcoinCoin(bitcoin, 'ㅇㅌㅋ'), false);
  assert.equal(toChosung('비트코인 BTC'), 'ㅂㅌㅋㅇ BTC');
});

test('quote filtering applies the caution-only filter and search can switch to another market', () => {
  const krw = coin();
  const btc = coin({ market: 'BTC-ETH', koreanName: '이더리움', englishName: 'Ethereum', quote: 'BTC', symbol: 'ETH', chosung: toChosung('이더리움') });
  const warned = coin({ market: 'KRW-X', koreanName: '테스트', symbol: 'X', warning: true, chosung: toChosung('테스트') });
  assert.deepEqual(filterBitcoinCoins([krw, btc, warned], 'KRW', '', true), [warned]);
  assert.equal(resolveBitcoinQuote([krw, btc], 'KRW', 'Ethereum', false), 'BTC');
  assert.equal(resolveBitcoinQuote([krw, btc], 'KRW', 'no-match', false), 'KRW');
});

test('bitcoin coin sorting uses name, price, rate, and 24-hour trading value directions', () => {
  const lowAmount = coin({ market: 'KRW-A', koreanName: '가나다', tradePrice: 100, signedChangeRate: -0.1, accumulatedTradePrice24h: 10 });
  const highAmount = coin({ market: 'KRW-B', koreanName: '마바사', tradePrice: 200, signedChangeRate: 0.1, accumulatedTradePrice24h: 20 });
  assert.deepEqual(sortBitcoinCoins([lowAmount, highAmount], { key: 'amount', direction: -1 }), [highAmount, lowAmount]);
  assert.deepEqual(sortBitcoinCoins([lowAmount, highAmount], { key: 'name', direction: 1 }), [lowAmount, highAmount]);
  assert.deepEqual(sortBitcoinCoins([lowAmount, highAmount], { key: 'price', direction: -1 }), [highAmount, lowAmount]);
  assert.deepEqual(sortBitcoinCoins([lowAmount, highAmount], { key: 'rate', direction: 1 }), [lowAmount, highAmount]);
  assert.deepEqual(toBitcoinSort('amount', { key: 'amount', direction: -1 }), { key: 'amount', direction: 1 });
  assert.deepEqual(toBitcoinSort('name', { key: 'amount', direction: -1 }), { key: 'name', direction: 1 });
});

test('bitcoin formatting follows quote precision and compact amount rules', () => {
  assert.equal(formatBitcoinPrice(108223000, 'KRW'), '108,223,000');
  assert.equal(formatBitcoinPrice(0.00001234, 'BTC'), '0.00001234');
  assert.equal(formatBitcoinPrice(2.34567, 'USDT'), '2.346');
  assert.equal(formatBitcoinAmount(1250000000000, 'KRW'), '1.25조');
  assert.equal(formatBitcoinAmount(120000000, 'KRW'), '1억');
  assert.equal(formatBitcoinAmount(123.456, 'BTC'), '123.46');
  assert.equal(formatBitcoinRate(0.01234), '+1.23%');
  assert.equal(formatBitcoinVolume(0.123456789), '0.12345679');
  assert.equal(formatBitcoinTradeTime('20261028', '235413'), '2026.10.28 23:54:13');
});
