import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadMarketSummary } from '../src/application/loadMarketSummary.ts';
import type { MarketIndicatorRepository } from '../src/domain/stock.ts';

test('loadMarketSummary loads fear and greed plus one month of VIX, 10Y yields, and S&P 500', async () => {
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
    { method: 'getKorea10YearTreasuryYield', startDate: '2026-05-10', endDate: '2026-06-10' },
    { method: 'getUs10YearTreasuryYield', startDate: '2026-05-10', endDate: '2026-06-10' },
    { method: 'getSp500Index', startDate: '2026-05-10', endDate: '2026-06-10' },
  ]);
  assert.deepEqual(summary, {
    startDate: '2026-05-10',
    endDate: '2026-06-10',
    fearAndGreed: { value: 67, condition: 'GREED', updatedAt: '2026-06-10T08:30:00+09:00' },
    vix: [{ date: '20260610', value: 14.82 }],
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
    { method: 'getKorea10YearTreasuryYield', startDate: '2026-01-15', endDate: '2026-06-10' },
    { method: 'getUs10YearTreasuryYield', startDate: '2026-01-15', endDate: '2026-06-10' },
    { method: 'getSp500Index', startDate: '2026-01-15', endDate: '2026-06-10' },
  ]);
  assert.equal(summary.startDate, '2026-01-15');
  assert.equal(summary.endDate, '2026-06-10');
});
