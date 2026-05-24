import type { StockQuote } from '../domain/stock';

export type QuoteResponse = {
  market_name: string;
  code: string;
  name: string;
  industry: string;
  per: number;
  pbr: number;
  eps: number;
  bps: number;
  open_price: number;
  current_price: number;
  previous_price: number;
  highest_price: number;
  lowest_price: number;
  upper_limit_price: number;
  lower_limit_price: number;
  current_volume: number;
  previous_volume: number;
  current_trading_value: number;
  price_diff: number;
  price_diff_rate: number;
};

export function toQuote(response: QuoteResponse): StockQuote {
  return {
    marketName: response.market_name,
    code: response.code,
    name: response.name,
    industry: response.industry,
    per: response.per,
    pbr: response.pbr,
    eps: response.eps,
    bps: response.bps,
    openPrice: response.open_price,
    currentPrice: response.current_price,
    previousPrice: response.previous_price,
    highestPrice: response.highest_price,
    lowestPrice: response.lowest_price,
    upperLimitPrice: response.upper_limit_price,
    lowerLimitPrice: response.lower_limit_price,
    currentVolume: response.current_volume,
    previousVolume: response.previous_volume,
    currentTradingValue: response.current_trading_value,
    priceDiff: response.price_diff,
    priceDiffRate: response.price_diff_rate,
  };
}
