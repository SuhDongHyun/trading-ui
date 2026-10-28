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

export type BitcoinRepository = {
  getTradingPairs(isDetails: boolean): Promise<BitcoinTradingPair[]>;
  getQuoteTickers(quoteCurrencies: BitcoinQuote[]): Promise<BitcoinTicker[]>;
  getTicker(markets: string[]): Promise<BitcoinTicker[]>;
};
