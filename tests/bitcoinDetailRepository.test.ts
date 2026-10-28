import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFastApiBitcoinRepository } from '../src/infrastructure/fastApiBitcoinRepository.ts';

test('Bitcoin detail repository maps candle, orderbook instrument, orderbook, and trade responses', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; body: unknown }> = [];
  const candle = {
    market: 'KRW-BTC', candle_date_time_kst: '2026-10-28T09:00:00', opening_price: 100, high_price: 120,
    low_price: 90, trade_price: 110, candle_acc_trade_volume: 12.5,
  };
  const responses: unknown[] = [
    [candle], [candle], [candle], [candle], [candle],
    [{ market: 'KRW-BTC', quote_currency: 'KRW', tick_size: '1000', supported_levels: ['0', '10000'] }],
    [{
      market: 'KRW-BTC', timestamp: 123, total_ask_size: 5, total_bid_size: 6, level: 10000,
      orderbook_units: [{ ask_price: 110, ask_size: 2, bid_price: 100, bid_size: 3 }],
    }],
    [{
      market: 'KRW-BTC', trade_date_utc: '2026-10-28', trade_time_utc: '14:30:00', trade_date_kst: '2026-10-28', trade_time_kst: '23:30:00', timestamp: 456,
      trade_price: 110, trade_volume: 0.5, prev_closing_price: 100, change_price: 10, ask_bid: 'BID', sequential_id: 7,
    }],
  ];
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify(responses.shift()), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const repository = createFastApiBitcoinRepository('/api');
    for (const period of ['m15', 'm60', 'D', 'W', 'M'] as const) {
      assert.deepEqual(await repository.getCandles('KRW-BTC', period, 80), [{
        market: 'KRW-BTC', dateTimeKst: '2026-10-28T09:00:00', openingPrice: 100, highPrice: 120,
        lowPrice: 90, tradePrice: 110, accumulatedTradeVolume: 12.5,
      }]);
    }
    assert.deepEqual(await repository.getOrderbookInstruments(['KRW-BTC']), [{
      market: 'KRW-BTC', quoteCurrency: 'KRW', tickSize: 1000, supportedLevels: ['0', '10000'],
    }]);
    assert.deepEqual(await repository.getOrderbook('KRW-BTC', '10000'), [{
      market: 'KRW-BTC', timestamp: 123, totalAskSize: 5, totalBidSize: 6, level: 10000,
      units: [{ askPrice: 110, askSize: 2, bidPrice: 100, bidSize: 3 }],
    }]);
    assert.deepEqual(await repository.getTrades('KRW-BTC', 30), [{
      market: 'KRW-BTC', tradeDateUtc: '2026-10-28', tradeTimeUtc: '14:30:00', tradeDateKst: '2026-10-28', tradeTimeKst: '23:30:00',
      timestamp: 456, tradePrice: 110, tradeVolume: 0.5, previousClosingPrice: 100, changePrice: 10, side: 'BID', sequentialId: 7,
    }]);

    assert.deepEqual(requests, [
      { url: '/api/bitcoin/candles/minutes/15', body: { market: 'KRW-BTC', count: 80 } },
      { url: '/api/bitcoin/candles/minutes/60', body: { market: 'KRW-BTC', count: 80 } },
      { url: '/api/bitcoin/candles/days', body: { market: 'KRW-BTC', count: 80 } },
      { url: '/api/bitcoin/candles/weeks', body: { market: 'KRW-BTC', count: 80 } },
      { url: '/api/bitcoin/candles/months', body: { market: 'KRW-BTC', count: 80 } },
      { url: '/api/bitcoin/orderbook/instruments', body: { markets: ['KRW-BTC'] } },
      { url: '/api/bitcoin/orderbook', body: { markets: ['KRW-BTC'], level: '10000' } },
      { url: '/api/bitcoin/trades', body: { market: 'KRW-BTC', count: 30 } },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
