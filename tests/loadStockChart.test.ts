import assert from 'node:assert/strict';
import { test } from 'node:test';
import { loadStockChart } from '../src/application/loadStockChart.ts';
import type { IndicatorSettings, StockQuery, StockRepository } from '../src/domain/stock.ts';

test('loadStockChart uses the selected market for candle prices and moving averages', async () => {
  const calls: Array<{ method: string; market?: string }> = [];
  const repository: StockRepository = {
    async getQuote(query) {
      calls.push({ method: 'getQuote', market: query.market });
      return {
        marketName: 'KRX',
        code: query.code,
        name: '삼성전자',
        industry: '',
        per: 0,
        pbr: 0,
        eps: 0,
        bps: 0,
        openPrice: 0,
        currentPrice: 196500,
        previousPrice: 0,
        highestPrice: 0,
        lowestPrice: 0,
        upperLimitPrice: 0,
        lowerLimitPrice: 0,
        currentVolume: 0,
        previousVolume: 0,
        currentTradingValue: 0,
        priceDiff: 0,
        priceDiffRate: 0,
      };
    },
    async getDailyPrices(query) {
      calls.push({ method: 'getDailyPrices', market: query.market });
      return [];
    },
    async getMovingAverage(query) {
      calls.push({ method: 'getMovingAverage', market: query.market });
      return [];
    },
    async getRsi(query) {
      calls.push({ method: 'getRsi', market: query.market });
      return [];
    },
    async getRsiSignal(query) {
      calls.push({ method: 'getRsiSignal', market: query.market });
      return [];
    },
    async getMacd(query) {
      calls.push({ method: 'getMacd', market: query.market });
      return [];
    },
    async getMacdSignal(query) {
      calls.push({ method: 'getMacdSignal', market: query.market });
      return [];
    },
    async getNews() {
      return [];
    },
    async getVixIndex() {
      return [];
    },
    async getFearAndGreedIndex() {
      return null;
    },
  };
  const query: StockQuery = {
    market: 'J',
    code: '005930',
    startDate: '2026-04-07',
    endDate: '2026-05-16',
    period: 'D',
    adjustedPrice: true,
  };
  const settings: IndicatorSettings = {
    movingAverageWindows: [5],
    rsiWindow: 14,
    rsiSignalEmaWindow: 9,
    macdShortWindow: 12,
    macdLongWindow: 26,
  };

  await loadStockChart(repository, query, settings);

  assert.deepEqual(calls.filter((call) => call.method === 'getDailyPrices'), [
    { method: 'getDailyPrices', market: 'J' },
  ]);
  assert.deepEqual(calls.filter((call) => call.method === 'getMovingAverage'), [
    { method: 'getMovingAverage', market: 'J' },
  ]);
});

test('loadStockChart includes MACD signal data using the selected MACD and signal windows', async () => {
  const calls: Array<{ method: string; shortWindow?: number; longWindow?: number; emaWindow?: number }> = [];
  const repository: StockRepository = {
    async getQuote(query) {
      return {
        marketName: 'KRX',
        code: query.code,
        name: '삼성전자',
        industry: '',
        per: 0,
        pbr: 0,
        eps: 0,
        bps: 0,
        openPrice: 0,
        currentPrice: 196500,
        previousPrice: 0,
        highestPrice: 0,
        lowestPrice: 0,
        upperLimitPrice: 0,
        lowerLimitPrice: 0,
        currentVolume: 0,
        previousVolume: 0,
        currentTradingValue: 0,
        priceDiff: 0,
        priceDiffRate: 0,
      };
    },
    async getDailyPrices() {
      return [];
    },
    async getMovingAverage() {
      return [];
    },
    async getRsi() {
      return [];
    },
    async getRsiSignal() {
      return [];
    },
    async getMacd(_query, shortWindow, longWindow) {
      calls.push({ method: 'getMacd', shortWindow, longWindow });
      return [{ date: '20260515', macd: 1.4 }];
    },
    async getMacdSignal(_query, shortWindow, longWindow, emaWindow) {
      calls.push({ method: 'getMacdSignal', shortWindow, longWindow, emaWindow });
      return [{ date: '20260515', macdEma: 1.2, signal: 'buy' }];
    },
    async getNews() {
      return [];
    },
    async getVixIndex() {
      return [];
    },
    async getFearAndGreedIndex() {
      return null;
    },
  };
  const query: StockQuery = {
    market: 'J',
    code: '005930',
    startDate: '2026-04-07',
    endDate: '2026-05-16',
    period: 'D',
    adjustedPrice: true,
  };
  const settings: IndicatorSettings = {
    movingAverageWindows: [5],
    rsiWindow: 14,
    rsiSignalEmaWindow: 7,
    macdShortWindow: 10,
    macdLongWindow: 24,
  };

  const data = await loadStockChart(repository, query, settings);

  assert.deepEqual(calls, [
    { method: 'getMacd', shortWindow: 10, longWindow: 24 },
    { method: 'getMacdSignal', shortWindow: 10, longWindow: 24, emaWindow: 7 },
  ]);
  assert.deepEqual(data.macdSignal, [{ date: '20260515', macdEma: 1.2, signal: 'buy' }]);
});

test('loadStockChart includes news for the selected code and end date', async () => {
  const calls: Array<{ method: string; code?: string; searchDate?: string }> = [];
  const repository: StockRepository = {
    async getQuote(query) {
      return {
        marketName: 'KRX',
        code: query.code,
        name: '삼성전자',
        industry: '',
        per: 0,
        pbr: 0,
        eps: 0,
        bps: 0,
        openPrice: 0,
        currentPrice: 196500,
        previousPrice: 0,
        highestPrice: 0,
        lowestPrice: 0,
        upperLimitPrice: 0,
        lowerLimitPrice: 0,
        currentVolume: 0,
        previousVolume: 0,
        currentTradingValue: 0,
        priceDiff: 0,
        priceDiffRate: 0,
      };
    },
    async getDailyPrices() {
      return [];
    },
    async getMovingAverage() {
      return [];
    },
    async getRsi() {
      return [];
    },
    async getRsiSignal() {
      return [];
    },
    async getMacd() {
      return [];
    },
    async getMacdSignal() {
      return [];
    },
    async getNews(code, searchDate) {
      calls.push({ method: 'getNews', code, searchDate });
      return [
        {
          title: '삼성전자, 신제품 공개',
          source: '연합뉴스',
          publishedAt: '2026-05-16T09:30:00+09:00',
        },
      ];
    },
    async getVixIndex() {
      return [];
    },
    async getFearAndGreedIndex() {
      return null;
    },
  };
  const query: StockQuery = {
    market: 'J',
    code: '005930',
    startDate: '2026-04-07',
    endDate: '2026-05-16',
    period: 'D',
    adjustedPrice: true,
  };
  const settings: IndicatorSettings = {
    movingAverageWindows: [5],
    rsiWindow: 14,
    rsiSignalEmaWindow: 7,
    macdShortWindow: 10,
    macdLongWindow: 24,
  };

  const data = await loadStockChart(repository, query, settings);

  assert.deepEqual(calls, [{ method: 'getNews', code: '005930', searchDate: '20260516' }]);
  assert.deepEqual(data.news, [
    {
      title: '삼성전자, 신제품 공개',
      source: '연합뉴스',
      publishedAt: '2026-05-16T09:30:00+09:00',
    },
  ]);
});

test('loadStockChart includes market indicators for the selected date range', async () => {
  const calls: Array<{ method: string; startDate?: string; endDate?: string }> = [];
  const repository: StockRepository = {
    async getQuote(query) {
      return {
        marketName: 'KRX',
        code: query.code,
        name: '삼성전자',
        industry: '',
        per: 0,
        pbr: 0,
        eps: 0,
        bps: 0,
        openPrice: 0,
        currentPrice: 196500,
        previousPrice: 0,
        highestPrice: 0,
        lowestPrice: 0,
        upperLimitPrice: 0,
        lowerLimitPrice: 0,
        currentVolume: 0,
        previousVolume: 0,
        currentTradingValue: 0,
        priceDiff: 0,
        priceDiffRate: 0,
      };
    },
    async getDailyPrices() {
      return [];
    },
    async getMovingAverage() {
      return [];
    },
    async getRsi() {
      return [];
    },
    async getRsiSignal() {
      return [];
    },
    async getMacd() {
      return [];
    },
    async getMacdSignal() {
      return [];
    },
    async getNews() {
      return [];
    },
    async getVixIndex(startDate, endDate) {
      calls.push({ method: 'getVixIndex', startDate, endDate });
      return [{ date: '20260515', value: 18.42 }];
    },
    async getFearAndGreedIndex() {
      calls.push({ method: 'getFearAndGreedIndex' });
      return { value: 64, condition: 'GREED', updatedAt: '2026-05-16T08:30:00+09:00' };
    },
  };
  const query: StockQuery = {
    market: 'J',
    code: '005930',
    startDate: '2026-04-07',
    endDate: '2026-05-16',
    period: 'D',
    adjustedPrice: true,
  };
  const settings: IndicatorSettings = {
    movingAverageWindows: [5],
    rsiWindow: 14,
    rsiSignalEmaWindow: 7,
    macdShortWindow: 10,
    macdLongWindow: 24,
  };

  const data = await loadStockChart(repository, query, settings);

  assert.deepEqual(calls, [
    { method: 'getVixIndex', startDate: '2026-04-07', endDate: '2026-05-16' },
    { method: 'getFearAndGreedIndex' },
  ]);
  assert.deepEqual(data.vix, [{ date: '20260515', value: 18.42 }]);
  assert.deepEqual(data.fearAndGreed, { value: 64, condition: 'GREED', updatedAt: '2026-05-16T08:30:00+09:00' });
});
