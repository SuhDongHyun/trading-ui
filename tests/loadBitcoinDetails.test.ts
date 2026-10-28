import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadBitcoinCandles, loadBitcoinOrderbook, loadBitcoinTrades } from '../src/application/loadBitcoinDetails.ts';
import type { BitcoinRepository } from '../src/domain/bitcoin.ts';

test('loadBitcoinCandles applies period counts and sorts API candles chronologically', async () => {
  const calls: Array<{ market: string; period: string; count: number }> = [];
  const repository = {
    async getCandles(market: string, period: string, count: number) {
      calls.push({ market, period, count });
      return [
        { market, dateTimeKst: '2026-10-28T09:00:00', openingPrice: 2, highPrice: 2, lowPrice: 2, tradePrice: 2, accumulatedTradeVolume: 1 },
        { market, dateTimeKst: '2026-10-27T09:00:00', openingPrice: 1, highPrice: 1, lowPrice: 1, tradePrice: 1, accumulatedTradeVolume: 1 },
      ];
    },
  } as unknown as BitcoinRepository;

  const candles = await loadBitcoinCandles(repository, 'KRW-BTC', 'D');
  assert.deepEqual(calls, [{ market: 'KRW-BTC', period: 'D', count: 90 }]);
  assert.deepEqual(candles.map((candle) => candle.dateTimeKst), ['2026-10-27T09:00:00', '2026-10-28T09:00:00']);
});

test('loadBitcoinOrderbook requests only supported aggregation levels and falls back to zero', async () => {
  const calls: string[] = [];
  const repository = {
    async getOrderbookInstruments(markets: string[]) {
      calls.push(`instruments:${markets.join(',')}`);
      return [{ market: 'KRW-BTC', quoteCurrency: 'KRW', tickSize: 1000, supportedLevels: ['0', '10000'] }];
    },
    async getOrderbook(market: string, level: string) {
      calls.push(`book:${market}:${level}`);
      return [{ market, timestamp: 1, totalAskSize: 2, totalBidSize: 3, level: Number(level), units: [] }];
    },
  } as unknown as BitcoinRepository;

  const loaded = await loadBitcoinOrderbook(repository, 'KRW-BTC', '50000');
  assert.equal(loaded.level, '0');
  assert.deepEqual(calls, ['instruments:KRW-BTC', 'book:KRW-BTC:0']);
});

test('loadBitcoinTrades requests thirty items and sorts newest first', async () => {
  const calls: Array<{ market: string; count: number }> = [];
  const repository = {
    async getTrades(market: string, count: number) {
      calls.push({ market, count });
      return [
        { market, timestamp: 1, sequentialId: 1 },
        { market, timestamp: 3, sequentialId: 3 },
        { market, timestamp: 2, sequentialId: 2 },
      ];
    },
  } as unknown as BitcoinRepository;

  const trades = await loadBitcoinTrades(repository, 'KRW-BTC');
  assert.deepEqual(calls, [{ market: 'KRW-BTC', count: 30 }]);
  assert.deepEqual(trades.map((trade) => trade.sequentialId), [3, 2, 1]);
});
