import type {
  BitcoinCautionKey,
  BitcoinQuote,
  BitcoinRepository,
  BitcoinTicker,
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
  };
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
