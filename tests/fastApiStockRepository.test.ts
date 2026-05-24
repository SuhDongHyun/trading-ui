import assert from 'node:assert/strict';
import { test } from 'node:test';
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
