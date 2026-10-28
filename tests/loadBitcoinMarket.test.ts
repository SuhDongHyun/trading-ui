import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadBitcoinMarket } from '../src/application/loadBitcoinMarket.ts';
import { loadBitcoinTicker } from '../src/application/loadBitcoinTicker.ts';
import type { BitcoinRepository, BitcoinTicker, BitcoinTradingPair } from '../src/domain/bitcoin.ts';

test('loadBitcoinMarket requests detailed pairs and all quote tickers, then joins them by market', async () => {
  const calls: string[] = [];
  const pair: BitcoinTradingPair = {
    market: 'KRW-BTC', koreanName: '비트코인', englishName: 'Bitcoin', quote: 'KRW', symbol: 'BTC', warning: false, cautions: [],
  };
  const ticker: BitcoinTicker = {
    market: 'KRW-BTC', tradeDate: '20261028', tradeTime: '145413', tradeDateKst: '20261028', tradeTimeKst: '235413',
    openingPrice: 100, highPrice: 110, lowPrice: 90, tradePrice: 105, previousClosingPrice: 100, change: 'RISE',
    changePrice: 5, changeRate: 0.05, signedChangePrice: 5, signedChangeRate: 0.05, tradeVolume: 1,
    accumulatedTradePrice: 1000, accumulatedTradePrice24h: 2000, accumulatedTradeVolume: 20,
    accumulatedTradeVolume24h: 30, highest52WeekPrice: 150, highest52WeekDate: '2026-01-01',
    lowest52WeekPrice: 50, lowest52WeekDate: '2025-01-01',
  };
  const repository: BitcoinRepository = {
    async getTradingPairs(isDetails) {
      calls.push(`pairs:${isDetails}`);
      return [pair];
    },
    async getQuoteTickers(quotes) {
      calls.push(`quotes:${quotes.join(',')}`);
      return [ticker, { ...ticker, market: 'KRW-NO-PAIR' }];
    },
    async getTicker() {
      return [];
    },
  };

  const coins = await loadBitcoinMarket(repository);

  assert.deepEqual(calls, ['pairs:true', 'quotes:KRW,BTC,USDT']);
  assert.equal(coins.length, 1);
  assert.deepEqual(coins[0], { ...pair, ...ticker, chosung: 'ㅂㅌㅋㅇ' });
});

test('loadBitcoinTicker requests the selected market and returns its ticker', async () => {
  const calls: string[][] = [];
  const ticker: BitcoinTicker = {
    market: 'BTC-ETH', tradeDate: '20261028', tradeTime: '145413', tradeDateKst: '20261028', tradeTimeKst: '235413',
    openingPrice: 0.03, highPrice: 0.031, lowPrice: 0.029, tradePrice: 0.0305, previousClosingPrice: 0.03, change: 'RISE',
    changePrice: 0.0005, changeRate: 0.016, signedChangePrice: 0.0005, signedChangeRate: 0.016, tradeVolume: 1,
    accumulatedTradePrice: 2, accumulatedTradePrice24h: 3, accumulatedTradeVolume: 50,
    accumulatedTradeVolume24h: 60, highest52WeekPrice: 0.05, highest52WeekDate: '2026-01-01',
    lowest52WeekPrice: 0.02, lowest52WeekDate: '2025-01-01',
  };
  const repository: BitcoinRepository = {
    async getTradingPairs() { return []; },
    async getQuoteTickers() { return []; },
    async getTicker(markets) {
      calls.push(markets);
      return [{ ...ticker, market: 'KRW-BTC' }, ticker];
    },
  };

  assert.deepEqual(await loadBitcoinTicker(repository, 'BTC-ETH'), ticker);
  assert.deepEqual(calls, [['BTC-ETH']]);
});

test('loadBitcoinTicker reports when the selected market is missing from the response', async () => {
  const repository: BitcoinRepository = {
    async getTradingPairs() { return []; },
    async getQuoteTickers() { return []; },
    async getTicker() { return []; },
  };

  await assert.rejects(loadBitcoinTicker(repository, 'KRW-BTC'), /선택한 코인의 시세 정보를 찾을 수 없습니다/);
});
