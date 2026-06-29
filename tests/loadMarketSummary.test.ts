import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadMarketSummary } from '../src/application/loadMarketSummary.ts';
import type { MarketIndicatorRepository } from '../src/domain/stock.ts';

test('loadMarketSummary loads fear and greed plus one month of market indexes, exchange rate, 10Y yields, and S&P 500', async () => {
  const calls: Array<{ method: string; startDate?: string; endDate?: string }> = [];
  const repository: MarketIndicatorRepository = {
    async getFearAndGreedIndex() {
      calls.push({ method: 'getFearAndGreedIndex' });
      return { value: 67, condition: 'GREED', updatedAt: '2026-06-10T08:30:00+09:00' };
    },
    async getVixIndex(startDate, endDate) {
      calls.push({ method: 'getVixIndex', startDate, endDate });
      return [{ date: '20260610', value: 14.82 }];
    },
    async getVkospiIndex(startDate, endDate) {
      calls.push({ method: 'getVkospiIndex', startDate, endDate });
      return [{ date: '20260610', openPrice: 32.4, highPrice: 34.1, lowPrice: 31.8, closePrice: 33.9, priceDiff: 1.2, priceDiffRate: 3.67 }];
    },
    async getUsdKrwExchangeRate(startDate, endDate) {
      calls.push({ method: 'getUsdKrwExchangeRate', startDate, endDate });
      return [{ date: '20260610', openPrice: 1382.5, highPrice: 1388.1, lowPrice: 1379.4, closePrice: 1385.2 }];
    },
    async getKospiIndex(startDate, endDate) {
      calls.push({ method: 'getKospiIndex', startDate, endDate });
      return [{ date: '20260610', openPrice: 2840.1, highPrice: 2862.3, lowPrice: 2833.8, closePrice: 2858.2, priceDiff: 18.1, priceDiffRate: 0.64, volume: 551000, tradingValue: 10420000 }];
    },
    async getKosdaqIndex(startDate, endDate) {
      calls.push({ method: 'getKosdaqIndex', startDate, endDate });
      return [{ date: '20260610', openPrice: 842.1, highPrice: 848.6, lowPrice: 838.4, closePrice: 846.8, priceDiff: -2.4, priceDiffRate: -0.28, volume: 901000, tradingValue: 8200000 }];
    },
    async getKorea10YearTreasuryYield(startDate, endDate) {
      calls.push({ method: 'getKorea10YearTreasuryYield', startDate, endDate });
      return [{ date: '20260610', yieldRate: 3.11 }];
    },
    async getUs10YearTreasuryYield(startDate, endDate) {
      calls.push({ method: 'getUs10YearTreasuryYield', startDate, endDate });
      return [{ date: '20260610', yieldRate: 4.28 }];
    },
    async getSp500Index(startDate, endDate) {
      calls.push({ method: 'getSp500Index', startDate, endDate });
      return [{ date: '20260610', openPrice: 6020, highPrice: 6060, lowPrice: 6000, closePrice: 6042.7 }];
    },
  };

  const summary = await loadMarketSummary(repository, new Date(2026, 5, 10));

  assert.deepEqual(calls, [
    { method: 'getFearAndGreedIndex' },
    { method: 'getVixIndex', startDate: '2026-05-10', endDate: '2026-06-10' },
    { method: 'getVkospiIndex', startDate: '2026-05-10', endDate: '2026-06-10' },
    { method: 'getUsdKrwExchangeRate', startDate: '2026-05-10', endDate: '2026-06-10' },
    { method: 'getKospiIndex', startDate: '2026-05-10', endDate: '2026-06-10' },
    { method: 'getKosdaqIndex', startDate: '2026-05-10', endDate: '2026-06-10' },
    { method: 'getKorea10YearTreasuryYield', startDate: '2026-05-10', endDate: '2026-06-10' },
    { method: 'getUs10YearTreasuryYield', startDate: '2026-05-10', endDate: '2026-06-10' },
    { method: 'getSp500Index', startDate: '2026-05-10', endDate: '2026-06-10' },
  ]);
  assert.deepEqual(summary, {
    startDate: '2026-05-10',
    endDate: '2026-06-10',
    fearAndGreed: { value: 67, condition: 'GREED', updatedAt: '2026-06-10T08:30:00+09:00' },
    vix: [{ date: '20260610', value: 14.82 }],
    vkospi: [{ date: '20260610', openPrice: 32.4, highPrice: 34.1, lowPrice: 31.8, closePrice: 33.9, priceDiff: 1.2, priceDiffRate: 3.67 }],
    usdKrwExchangeRate: [{ date: '20260610', openPrice: 1382.5, highPrice: 1388.1, lowPrice: 1379.4, closePrice: 1385.2 }],
    kospi: [{ date: '20260610', openPrice: 2840.1, highPrice: 2862.3, lowPrice: 2833.8, closePrice: 2858.2, priceDiff: 18.1, priceDiffRate: 0.64, volume: 551000, tradingValue: 10420000 }],
    kosdaq: [{ date: '20260610', openPrice: 842.1, highPrice: 848.6, lowPrice: 838.4, closePrice: 846.8, priceDiff: -2.4, priceDiffRate: -0.28, volume: 901000, tradingValue: 8200000 }],
    korea10YearTreasuryYield: [{ date: '20260610', yieldRate: 3.11 }],
    us10YearTreasuryYield: [{ date: '20260610', yieldRate: 4.28 }],
    sp500: [{ date: '20260610', openPrice: 6020, highPrice: 6060, lowPrice: 6000, closePrice: 6042.7 }],
  });
});

test('loadMarketSummary uses the selected date range when provided', async () => {
  const calls: Array<{ method: string; startDate?: string; endDate?: string }> = [];
  const repository: MarketIndicatorRepository = {
    async getFearAndGreedIndex() {
      calls.push({ method: 'getFearAndGreedIndex' });
      return { value: 41, condition: 'FEAR', updatedAt: '2026-06-10T08:30:00+09:00' };
    },
    async getVixIndex(startDate, endDate) {
      calls.push({ method: 'getVixIndex', startDate, endDate });
      return [];
    },
    async getVkospiIndex(startDate, endDate) {
      calls.push({ method: 'getVkospiIndex', startDate, endDate });
      return [];
    },
    async getUsdKrwExchangeRate(startDate, endDate) {
      calls.push({ method: 'getUsdKrwExchangeRate', startDate, endDate });
      return [];
    },
    async getKospiIndex(startDate, endDate) {
      calls.push({ method: 'getKospiIndex', startDate, endDate });
      return [];
    },
    async getKosdaqIndex(startDate, endDate) {
      calls.push({ method: 'getKosdaqIndex', startDate, endDate });
      return [];
    },
    async getKorea10YearTreasuryYield(startDate, endDate) {
      calls.push({ method: 'getKorea10YearTreasuryYield', startDate, endDate });
      return [];
    },
    async getUs10YearTreasuryYield(startDate, endDate) {
      calls.push({ method: 'getUs10YearTreasuryYield', startDate, endDate });
      return [];
    },
    async getSp500Index(startDate, endDate) {
      calls.push({ method: 'getSp500Index', startDate, endDate });
      return [];
    },
  };

  const summary = await loadMarketSummary(repository, {
    startDate: '2026-01-15',
    endDate: '2026-06-10',
  });

  assert.deepEqual(calls, [
    { method: 'getFearAndGreedIndex' },
    { method: 'getVixIndex', startDate: '2026-01-15', endDate: '2026-06-10' },
    { method: 'getVkospiIndex', startDate: '2026-01-15', endDate: '2026-06-10' },
    { method: 'getUsdKrwExchangeRate', startDate: '2026-01-15', endDate: '2026-06-10' },
    { method: 'getKospiIndex', startDate: '2026-01-15', endDate: '2026-06-10' },
    { method: 'getKosdaqIndex', startDate: '2026-01-15', endDate: '2026-06-10' },
    { method: 'getKorea10YearTreasuryYield', startDate: '2026-01-15', endDate: '2026-06-10' },
    { method: 'getUs10YearTreasuryYield', startDate: '2026-01-15', endDate: '2026-06-10' },
    { method: 'getSp500Index', startDate: '2026-01-15', endDate: '2026-06-10' },
  ]);
  assert.equal(summary.startDate, '2026-01-15');
  assert.equal(summary.endDate, '2026-06-10');
});
