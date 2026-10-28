export const BITCOIN_QUOTES = ['KRW', 'BTC', 'USDT'] as const;

export type BitcoinQuote = (typeof BITCOIN_QUOTES)[number];

export type BitcoinCautionKey =
  | 'PRICE_FLUCTUATIONS'
  | 'TRADING_VOLUME_SOARING'
  | 'DEPOSIT_AMOUNT_SOARING'
  | 'GLOBAL_PRICE_DIFFERENCES'
  | 'CONCENTRATION_OF_SMALL_ACCOUNTS';

export type BitcoinTradingPair = {
  market: string;
  koreanName: string;
  englishName: string;
  quote: BitcoinQuote;
  symbol: string;
  warning: boolean;
  cautions: BitcoinCautionKey[];
};

export type BitcoinTicker = {
  market: string;
  tradeDate: string;
  tradeTime: string;
  tradeDateKst: string;
  tradeTimeKst: string;
  openingPrice: number;
  highPrice: number;
  lowPrice: number;
  tradePrice: number;
  previousClosingPrice: number;
  change: 'EVEN' | 'RISE' | 'FALL';
  changePrice: number;
  changeRate: number;
  signedChangePrice: number;
  signedChangeRate: number;
  tradeVolume: number;
  accumulatedTradePrice: number;
  accumulatedTradePrice24h: number;
  accumulatedTradeVolume: number;
  accumulatedTradeVolume24h: number;
  highest52WeekPrice: number;
  highest52WeekDate: string;
  lowest52WeekPrice: number;
  lowest52WeekDate: string;
};

export type BitcoinCoin = BitcoinTradingPair & BitcoinTicker & {
  chosung: string;
};

export type BitcoinCandlePeriod = 'm15' | 'm60' | 'D' | 'W' | 'M';

export type BitcoinCandle = {
  market: string;
  dateTimeKst: string;
  openingPrice: number;
  highPrice: number;
  lowPrice: number;
  tradePrice: number;
  accumulatedTradeVolume: number;
};

export type BitcoinOrderbookInstrument = {
  market: string;
  quoteCurrency: string;
  tickSize: number;
  supportedLevels: string[];
};

export type BitcoinOrderbookUnit = {
  askPrice: number;
  askSize: number;
  bidPrice: number;
  bidSize: number;
};

export type BitcoinOrderbook = {
  market: string;
  timestamp: number;
  totalAskSize: number;
  totalBidSize: number;
  level: number;
  units: BitcoinOrderbookUnit[];
};

export type BitcoinTrade = {
  market: string;
  tradeDateUtc: string;
  tradeTimeUtc: string;
  tradeDateKst?: string;
  tradeTimeKst?: string;
  timestamp: number;
  tradePrice: number;
  tradeVolume: number;
  previousClosingPrice: number;
  changePrice: number;
  side: 'ASK' | 'BID';
  sequentialId: number;
};

export type BitcoinRepository = {
  getTradingPairs(isDetails: boolean): Promise<BitcoinTradingPair[]>;
  getQuoteTickers(quoteCurrencies: BitcoinQuote[]): Promise<BitcoinTicker[]>;
  getTicker(markets: string[]): Promise<BitcoinTicker[]>;
  getCandles(market: string, period: BitcoinCandlePeriod, count: number, signal?: AbortSignal): Promise<BitcoinCandle[]>;
  getOrderbookInstruments(markets: string[], signal?: AbortSignal): Promise<BitcoinOrderbookInstrument[]>;
  getOrderbook(market: string, level: string, signal?: AbortSignal): Promise<BitcoinOrderbook[]>;
  getTrades(market: string, count: number, signal?: AbortSignal): Promise<BitcoinTrade[]>;
};
