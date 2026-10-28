import type {
  BitcoinCautionKey,
  BitcoinCandle,
  BitcoinCandlePeriod,
  BitcoinOrderbook,
  BitcoinOrderbookInstrument,
  BitcoinQuote,
  BitcoinRepository,
  BitcoinTicker,
  BitcoinTrade,
  BitcoinTradingPair,
} from '../domain/bitcoin';
import { postJson } from './http';

type TradingPairResponse = {
  market: string;
  korean_name: string;
  english_name: string;
  market_warning: string | null;
  market_event: {
    warning: boolean;
    caution: Partial<Record<BitcoinCautionKey, boolean>>;
  } | null;
};

type TickerResponse = {
  market: string;
  trade_date: string;
  trade_time: string;
  trade_date_kst: string;
  trade_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  prev_closing_price: number;
  change: 'EVEN' | 'RISE' | 'FALL';
  change_price: number;
  change_rate: number;
  signed_change_price: number;
  signed_change_rate: number;
  trade_volume: number;
  acc_trade_price: number;
  acc_trade_price_24h: number;
  acc_trade_volume: number;
  acc_trade_volume_24h: number;
  highest_52_week_price: number;
  highest_52_week_date: string;
  lowest_52_week_price: number;
  lowest_52_week_date: string;
};

type CandleResponse = {
  market: string;
  candle_date_time_kst: string;
  opening_price: number;
  high_price: number;
  low_price: number;
  trade_price: number;
  candle_acc_trade_volume: number;
};

type OrderbookInstrumentResponse = {
  market: string;
  quote_currency: string;
  tick_size: string;
  supported_levels: string[];
};

type OrderbookResponse = {
  market: string;
  timestamp: number;
  total_ask_size: number;
  total_bid_size: number;
  level: number;
  orderbook_units: Array<{
    ask_price: number;
    ask_size: number;
    bid_price: number;
    bid_size: number;
  }>;
};

type TradeResponse = {
  market: string;
  trade_date_utc: string;
  trade_time_utc: string;
  trade_date_kst?: string;
  trade_time_kst?: string;
  timestamp: number;
  trade_price: number;
  trade_volume: number;
  prev_closing_price: number;
  change_price: number;
  ask_bid: 'ASK' | 'BID';
  sequential_id: number;
};

export function createFastApiBitcoinRepository(baseUrl = '/api'): BitcoinRepository {
  return {
    async getTradingPairs(isDetails) {
      const response = await postJson<TradingPairResponse[], { is_details: boolean }>(
        `${baseUrl}/bitcoin/trading-pairs`,
        { is_details: isDetails },
      );
      return response.map(toBitcoinTradingPair);
    },
    async getQuoteTickers(quoteCurrencies) {
      const response = await postJson<TickerResponse[], { quote_currencies: BitcoinQuote[] }>(
        `${baseUrl}/bitcoin/ticker/quote`,
        { quote_currencies: quoteCurrencies },
      );
      return response.map(toBitcoinTicker);
    },
    async getTicker(markets) {
      const response = await postJson<TickerResponse[], { markets: string[] }>(
        `${baseUrl}/bitcoin/ticker`,
        { markets },
      );
      return response.map(toBitcoinTicker);
    },
    async getCandles(market, period, count, signal) {
      const path = candlePath(period);
      const response = await postJson<CandleResponse[], { market: string; count: number }>(
        `${baseUrl}${path}`,
        { market, count },
        signal,
      );
      return response.map(toBitcoinCandle);
    },
    async getOrderbookInstruments(markets, signal) {
      const response = await postJson<OrderbookInstrumentResponse[], { markets: string[] }>(
        `${baseUrl}/bitcoin/orderbook/instruments`,
        { markets },
        signal,
      );
      return response.map(toBitcoinOrderbookInstrument);
    },
    async getOrderbook(market, level, signal) {
      const response = await postJson<OrderbookResponse[], { markets: string[]; level: string }>(
        `${baseUrl}/bitcoin/orderbook`,
        { markets: [market], level },
        signal,
      );
      return response.map(toBitcoinOrderbook);
    },
    async getTrades(market, count, signal) {
      const response = await postJson<TradeResponse[], { market: string; count: number }>(
        `${baseUrl}/bitcoin/trades`,
        { market, count },
        signal,
      );
      return response.map(toBitcoinTrade);
    },
  };
}

export function toBitcoinCandle(response: CandleResponse): BitcoinCandle {
  return {
    market: response.market,
    dateTimeKst: response.candle_date_time_kst,
    openingPrice: response.opening_price,
    highPrice: response.high_price,
    lowPrice: response.low_price,
    tradePrice: response.trade_price,
    accumulatedTradeVolume: response.candle_acc_trade_volume,
  };
}

export function toBitcoinOrderbookInstrument(response: OrderbookInstrumentResponse): BitcoinOrderbookInstrument {
  return {
    market: response.market,
    quoteCurrency: response.quote_currency,
    tickSize: Number(response.tick_size),
    supportedLevels: response.supported_levels,
  };
}

export function toBitcoinOrderbook(response: OrderbookResponse): BitcoinOrderbook {
  return {
    market: response.market,
    timestamp: response.timestamp,
    totalAskSize: response.total_ask_size,
    totalBidSize: response.total_bid_size,
    level: response.level,
    units: response.orderbook_units.map((unit) => ({
      askPrice: unit.ask_price,
      askSize: unit.ask_size,
      bidPrice: unit.bid_price,
      bidSize: unit.bid_size,
    })),
  };
}

export function toBitcoinTrade(response: TradeResponse): BitcoinTrade {
  return {
    market: response.market,
    tradeDateUtc: response.trade_date_utc,
    tradeTimeUtc: response.trade_time_utc,
    tradeDateKst: response.trade_date_kst,
    tradeTimeKst: response.trade_time_kst,
    timestamp: response.timestamp,
    tradePrice: response.trade_price,
    tradeVolume: response.trade_volume,
    previousClosingPrice: response.prev_closing_price,
    changePrice: response.change_price,
    side: response.ask_bid,
    sequentialId: response.sequential_id,
  };
}

function candlePath(period: BitcoinCandlePeriod): string {
  switch (period) {
    case 'm15': return '/bitcoin/candles/minutes/15';
    case 'm60': return '/bitcoin/candles/minutes/60';
    case 'D': return '/bitcoin/candles/days';
    case 'W': return '/bitcoin/candles/weeks';
    case 'M': return '/bitcoin/candles/months';
  }
}

export function toBitcoinTradingPair(response: TradingPairResponse): BitcoinTradingPair {
  const [quoteValue, symbol = ''] = response.market.split('-', 2);
  const caution = response.market_event?.caution;
  const cautions = (Object.keys(caution ?? {}) as BitcoinCautionKey[]).filter((key) => caution?.[key]);
  return {
    market: response.market,
    koreanName: response.korean_name,
    englishName: response.english_name,
    quote: isBitcoinQuote(quoteValue) ? quoteValue : 'KRW',
    symbol,
    warning: response.market_event?.warning ?? false,
    cautions,
  };
}

export function toBitcoinTicker(response: TickerResponse): BitcoinTicker {
  return {
    market: response.market,
    tradeDate: response.trade_date,
    tradeTime: response.trade_time,
    tradeDateKst: response.trade_date_kst,
    tradeTimeKst: response.trade_time_kst,
    openingPrice: response.opening_price,
    highPrice: response.high_price,
    lowPrice: response.low_price,
    tradePrice: response.trade_price,
    previousClosingPrice: response.prev_closing_price,
    change: response.change,
    changePrice: response.change_price,
    changeRate: response.change_rate,
    signedChangePrice: response.signed_change_price,
    signedChangeRate: response.signed_change_rate,
    tradeVolume: response.trade_volume,
    accumulatedTradePrice: response.acc_trade_price,
    accumulatedTradePrice24h: response.acc_trade_price_24h,
    accumulatedTradeVolume: response.acc_trade_volume,
    accumulatedTradeVolume24h: response.acc_trade_volume_24h,
    highest52WeekPrice: response.highest_52_week_price,
    highest52WeekDate: response.highest_52_week_date,
    lowest52WeekPrice: response.lowest_52_week_price,
    lowest52WeekDate: response.lowest_52_week_date,
  };
}

function isBitcoinQuote(value: string): value is BitcoinQuote {
  return value === 'KRW' || value === 'BTC' || value === 'USDT';
}
