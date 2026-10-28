import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFastApiBitcoinRepository } from '../src/infrastructure/fastApiBitcoinRepository.ts';

const ticker = {
  market: 'KRW-BTC',
  trade_date: '20261028',
  trade_time: '145413',
  trade_date_kst: '20261028',
  trade_time_kst: '235413',
  opening_price: 107808000,
  high_price: 110000000,
  low_price: 107500000,
  trade_price: 108223000,
  prev_closing_price: 107809000,
  change: 'RISE',
  change_price: 414000,
  change_rate: 0.00384,
  signed_change_price: 414000,
  signed_change_rate: 0.00384,
  trade_volume: 0.00005544,
  acc_trade_price: 53882280813,
  acc_trade_price_24h: 69864909778,
  acc_trade_volume: 495,
  acc_trade_volume_24h: 644,
  highest_52_week_price: 166201000,
  highest_52_week_date: '2025-10-30',
  lowest_52_week_price: 88342000,
  lowest_52_week_date: '2026-08-14',
};

test('Bitcoin repository posts the requested API payloads and maps pair and ticker responses', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; body: unknown }> = [];
  const responses: unknown[] = [
    [{
      market: 'KRW-BTC',
      korean_name: '비트코인',
      english_name: 'Bitcoin',
      market_warning: null,
      market_event: {
        warning: true,
        caution: {
          PRICE_FLUCTUATIONS: false,
          TRADING_VOLUME_SOARING: true,
          DEPOSIT_AMOUNT_SOARING: false,
          GLOBAL_PRICE_DIFFERENCES: false,
          CONCENTRATION_OF_SMALL_ACCOUNTS: false,
        },
      },
    }],
    [ticker],
    [ticker],
  ];
  globalThis.fetch = async (input, init) => {
    requests.push({ url: String(input), body: JSON.parse(String(init?.body)) });
    return new Response(JSON.stringify(responses.shift()), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const repository = createFastApiBitcoinRepository('/api');
    const pairs = await repository.getTradingPairs(true);
    const quotes = await repository.getQuoteTickers(['KRW', 'BTC', 'USDT']);
    const selected = await repository.getTicker(['KRW-BTC']);

    assert.deepEqual(requests, [
      { url: '/api/bitcoin/trading-pairs', body: { is_details: true } },
      { url: '/api/bitcoin/ticker/quote', body: { quote_currencies: ['KRW', 'BTC', 'USDT'] } },
      { url: '/api/bitcoin/ticker', body: { markets: ['KRW-BTC'] } },
    ]);
    assert.deepEqual(pairs[0], {
      market: 'KRW-BTC', koreanName: '비트코인', englishName: 'Bitcoin', quote: 'KRW', symbol: 'BTC',
      warning: true, cautions: ['TRADING_VOLUME_SOARING'],
    });
    assert.deepEqual(quotes[0], {
      market: 'KRW-BTC', tradeDate: '20261028', tradeTime: '145413', tradeDateKst: '20261028', tradeTimeKst: '235413',
      openingPrice: 107808000, highPrice: 110000000, lowPrice: 107500000, tradePrice: 108223000,
      previousClosingPrice: 107809000, change: 'RISE', changePrice: 414000, changeRate: 0.00384,
      signedChangePrice: 414000, signedChangeRate: 0.00384, tradeVolume: 0.00005544,
      accumulatedTradePrice: 53882280813, accumulatedTradePrice24h: 69864909778,
      accumulatedTradeVolume: 495, accumulatedTradeVolume24h: 644,
      highest52WeekPrice: 166201000, highest52WeekDate: '2025-10-30', lowest52WeekPrice: 88342000,
      lowest52WeekDate: '2026-08-14',
    });
    assert.deepEqual(selected, quotes);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
