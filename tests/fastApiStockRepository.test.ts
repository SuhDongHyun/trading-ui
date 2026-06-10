import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createFastApiStockRepository } from '../src/infrastructure/fastApiStockRepository.ts';
import { toQuote } from '../src/infrastructure/stockQuoteMapper.ts';

test('toQuote maps the stock name from the stock_quote response', () => {
  const quote = toQuote({
    market_name: 'KRX',
    code: '005930',
    name: '삼성전자',
    industry: '전기전자',
    per: 11.2,
    pbr: 1.1,
    eps: 6500,
    bps: 52000,
    open_price: 74000,
    current_price: 74800,
    previous_price: 73000,
    highest_price: 75200,
    lowest_price: 73500,
    upper_limit_price: 94900,
    lower_limit_price: 51100,
    current_volume: 12345678,
    previous_volume: 8765432,
    current_trading_value: 920000000000,
    price_diff: 1800,
    price_diff_rate: 2.47,
  });

  assert.equal(quote.name, '삼성전자');
  assert.equal(quote.code, '005930');
});

test('getNews posts the selected code and search date to the stock news API', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; body: unknown }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      body: JSON.parse(String(init?.body)),
    });
    return new Response(
      JSON.stringify([
        {
          title: '삼성전자, 신제품 공개',
          source: '연합뉴스',
          published_at: '2026-05-16T09:30:00+09:00',
        },
      ]),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  };

  try {
    const repository = createFastApiStockRepository('/api');

    const news = await repository.getNews('005930', '20260516');

    assert.deepEqual(requests, [
      {
        url: '/api/stock_news',
        body: {
          code: '005930',
          search_date: '20260516',
          search_time: '',
        },
      },
    ]);
    assert.deepEqual(news, [
      {
        title: '삼성전자, 신제품 공개',
        source: '연합뉴스',
        publishedAt: '2026-05-16T09:30:00+09:00',
      },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('getVixIndex posts the selected date range to the market indicator API', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; body: unknown }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      body: JSON.parse(String(init?.body)),
    });
    return new Response(
      JSON.stringify([
        {
          date: '20260515',
          value: 18.42,
        },
      ]),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  };

  try {
    const repository = createFastApiStockRepository('/api');

    const vix = await repository.getVixIndex('2026-04-16', '2026-05-16');

    assert.deepEqual(requests, [
      {
        url: '/api/market-indicator/vix-index',
        body: {
          start_date: '20260416',
          end_date: '20260516',
        },
      },
    ]);
    assert.deepEqual(vix, [
      {
        date: '20260515',
        value: 18.42,
      },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('getFearAndGreedIndex reads the current market sentiment indicator', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; method: string | undefined }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      method: init?.method,
    });
    return new Response(
      JSON.stringify({
        value: 64,
        condition: 'GREED',
        updated_at: '2026-05-16T08:30:00+09:00',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  };

  try {
    const repository = createFastApiStockRepository('/api');

    const fearAndGreed = await repository.getFearAndGreedIndex();

    assert.deepEqual(requests, [
      {
        url: '/api/market-indicator/fear-and-greed-index',
        method: 'GET',
      },
    ]);
    assert.deepEqual(fearAndGreed, {
      value: 64,
      condition: 'GREED',
      updatedAt: '2026-05-16T08:30:00+09:00',
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('getKorea10YearTreasuryYield posts the selected date range to the market indicator API', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; body: unknown }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      body: JSON.parse(String(init?.body)),
    });
    return new Response(JSON.stringify([{ date: '20260610', yield_rate: 3.11 }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const repository = createFastApiStockRepository('/api');

    const yields = await repository.getKorea10YearTreasuryYield('2026-05-10', '2026-06-10');

    assert.deepEqual(requests, [
      {
        url: '/api/market-indicator/treasury-yield/korea-10y',
        body: {
          start_date: '20260510',
          end_date: '20260610',
        },
      },
    ]);
    assert.deepEqual(yields, [{ date: '20260610', yieldRate: 3.11 }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('getUs10YearTreasuryYield posts the selected date range to the market indicator API', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; body: unknown }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      body: JSON.parse(String(init?.body)),
    });
    return new Response(JSON.stringify([{ date: '20260610', yield_rate: 4.28 }]), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  try {
    const repository = createFastApiStockRepository('/api');

    const yields = await repository.getUs10YearTreasuryYield('2026-05-10', '2026-06-10');

    assert.deepEqual(requests, [
      {
        url: '/api/market-indicator/treasury-yield/us-10y',
        body: {
          start_date: '20260510',
          end_date: '20260610',
        },
      },
    ]);
    assert.deepEqual(yields, [{ date: '20260610', yieldRate: 4.28 }]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('getSp500Index posts the selected date range to the market indicator API', async () => {
  const originalFetch = globalThis.fetch;
  const requests: Array<{ url: string; body: unknown }> = [];
  globalThis.fetch = async (input, init) => {
    requests.push({
      url: String(input),
      body: JSON.parse(String(init?.body)),
    });
    return new Response(
      JSON.stringify([
        {
          date: '20260610',
          open_price: 6020,
          high_price: 6060,
          low_price: 6000,
          close_price: 6042.7,
        },
      ]),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  };

  try {
    const repository = createFastApiStockRepository('/api');

    const sp500 = await repository.getSp500Index('2026-05-10', '2026-06-10');

    assert.deepEqual(requests, [
      {
        url: '/api/market-indicator/sp500-index',
        body: {
          start_date: '20260510',
          end_date: '20260610',
        },
      },
    ]);
    assert.deepEqual(sp500, [
      {
        date: '20260610',
        openPrice: 6020,
        highPrice: 6060,
        lowPrice: 6000,
        closePrice: 6042.7,
      },
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
