import type {
  DailyPrice,
  MacdPoint,
  MacdSignalPoint,
  FearAndGreedIndex,
  MarketIndicatorRepository,
  MovingAveragePoint,
  RsiPoint,
  RsiSignalPoint,
  Sp500IndexPoint,
  StockNewsItem,
  StockQuery,
  StockRepository,
  TreasuryYieldPoint,
  VixIndexPoint,
} from '../domain/stock';
import { getJson, postJson } from './http';
import { toQuote, type QuoteResponse } from './stockQuoteMapper';

type ApiStockQuery = {
  market: string;
  code: string;
  start_date: string;
  end_date: string;
  period: string;
  adjusted_price: boolean;
};

type DailyPriceResponse = {
  date: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
  accumulated_volume: number;
  accumulated_trading_value: number;
  price_diff: number;
  price_diff_sign: string;
  change_flag: string;
};

type MovingAverageResponse = {
  date: string;
  moving_average: number;
};

type RsiResponse = {
  date: string;
  rsi: number;
};

type RsiSignalResponse = {
  date: string;
  rsi_ema: number;
  signal: string;
};

type MacdResponse = {
  date: string;
  macd: number;
};

type MacdSignalResponse = {
  date: string;
  macd_ema: number;
  signal: string;
};

type StockNewsResponse = {
  title: string;
  source: string;
  published_at: string;
};

type VixIndexResponse = {
  date: string;
  value: number;
};

type FearAndGreedIndexResponse = {
  value: number;
  condition: string;
  updated_at: string;
};

type TreasuryYieldResponse = {
  date: string;
  yield_rate: number;
};

type Sp500IndexResponse = {
  date: string;
  open_price: number;
  high_price: number;
  low_price: number;
  close_price: number;
};

export function createFastApiStockRepository(baseUrl = '/api'): StockRepository & MarketIndicatorRepository {
  return {
    async getQuote(query) {
      const response = await postJson<QuoteResponse, typeof query>(`${baseUrl}/stock_quote`, query);
      return toQuote(response);
    },
    async getDailyPrices(query) {
      const response = await postJson<DailyPriceResponse[], ApiStockQuery>(
        `${baseUrl}/stock_quote/daily`,
        toApiStockQuery(query),
      );
      return response.map(toDailyPrice);
    },
    async getMovingAverage(query, window) {
      const response = await postJson<MovingAverageResponse[], ApiStockQuery & { window: number }>(
        `${baseUrl}/stock_quote/daily/moving-average`,
        { ...toApiStockQuery(query), window },
      );
      return response.map(toMovingAverage);
    },
    async getRsi(query, rsiWindow) {
      const response = await postJson<RsiResponse[], ApiStockQuery & { rsi_window: number }>(
        `${baseUrl}/stock_quote/indicator/rsi`,
        { ...toApiStockQuery(query), rsi_window: rsiWindow },
      );
      return response.map(toRsi);
    },
    async getRsiSignal(query, rsiWindow, emaWindow) {
      const response = await postJson<
        RsiSignalResponse[],
        ApiStockQuery & { rsi_window: number; ema_window: number }
      >(`${baseUrl}/stock_quote/indicator/rsi-signal`, {
        ...toApiStockQuery(query),
        rsi_window: rsiWindow,
        ema_window: emaWindow,
      });
      return response.map(toRsiSignal);
    },
    async getMacd(query, shortWindow, longWindow) {
      const response = await postJson<
        MacdResponse[],
        ApiStockQuery & { ema_short_window: number; ema_long_window: number }
      >(`${baseUrl}/stock_quote/indicator/macd`, {
        ...toApiStockQuery(query),
        ema_short_window: shortWindow,
        ema_long_window: longWindow,
      });
      return response.map(toMacd);
    },
    async getMacdSignal(query, shortWindow, longWindow, emaWindow) {
      const response = await postJson<
        MacdSignalResponse[],
        ApiStockQuery & { ema_short_window: number; ema_long_window: number; ema_window: number }
      >(`${baseUrl}/stock_quote/indicator/macd-signal`, {
        ...toApiStockQuery(query),
        ema_short_window: shortWindow,
        ema_long_window: longWindow,
        ema_window: emaWindow,
      });
      return response.map(toMacdSignal);
    },
    async getNews(code, searchDate) {
      const response = await postJson<
        StockNewsResponse[],
        { code: string; search_date: string; search_time: string }
      >(`${baseUrl}/stock_news`, {
        code,
        search_date: searchDate,
        search_time: '',
      });
      return response.map(toStockNewsItem);
    },
    async getVixIndex(startDate, endDate) {
      const response = await postJson<VixIndexResponse[], { start_date: string; end_date: string }>(
        `${baseUrl}/market-indicator/vix-index`,
        {
          start_date: normalizeDate(startDate),
          end_date: normalizeDate(endDate),
        },
      );
      return response.map(toVixIndexPoint);
    },
    async getFearAndGreedIndex() {
      const response = await getJson<FearAndGreedIndexResponse>(`${baseUrl}/market-indicator/fear-and-greed-index`);
      return toFearAndGreedIndex(response);
    },
    async getKorea10YearTreasuryYield(startDate, endDate) {
      const response = await postJson<TreasuryYieldResponse[], { start_date: string; end_date: string }>(
        `${baseUrl}/market-indicator/treasury-yield/korea-10y`,
        {
          start_date: normalizeDate(startDate),
          end_date: normalizeDate(endDate),
        },
      );
      return response.map(toTreasuryYieldPoint);
    },
    async getUs10YearTreasuryYield(startDate, endDate) {
      const response = await postJson<TreasuryYieldResponse[], { start_date: string; end_date: string }>(
        `${baseUrl}/market-indicator/treasury-yield/us-10y`,
        {
          start_date: normalizeDate(startDate),
          end_date: normalizeDate(endDate),
        },
      );
      return response.map(toTreasuryYieldPoint);
    },
    async getSp500Index(startDate, endDate) {
      const response = await postJson<Sp500IndexResponse[], { start_date: string; end_date: string }>(
        `${baseUrl}/market-indicator/sp500-index`,
        {
          start_date: normalizeDate(startDate),
          end_date: normalizeDate(endDate),
        },
      );
      return response.map(toSp500IndexPoint);
    },
  };
}

function toApiStockQuery(query: StockQuery): ApiStockQuery {
  return {
    market: query.market,
    code: query.code,
    start_date: normalizeDate(query.startDate),
    end_date: normalizeDate(query.endDate),
    period: query.period,
    adjusted_price: query.adjustedPrice,
  };
}

function normalizeDate(date: string): string {
  return date.replaceAll('-', '');
}

function toDailyPrice(response: DailyPriceResponse): DailyPrice {
  return {
    date: response.date,
    openPrice: response.open_price,
    highPrice: response.high_price,
    lowPrice: response.low_price,
    closePrice: response.close_price,
    accumulatedVolume: response.accumulated_volume,
    accumulatedTradingValue: response.accumulated_trading_value,
    priceDiff: response.price_diff,
    priceDiffSign: response.price_diff_sign,
    changeFlag: response.change_flag,
  };
}

function toMovingAverage(response: MovingAverageResponse): MovingAveragePoint {
  return {
    date: response.date,
    movingAverage: response.moving_average,
  };
}

function toRsi(response: RsiResponse): RsiPoint {
  return {
    date: response.date,
    rsi: response.rsi,
  };
}

function toRsiSignal(response: RsiSignalResponse): RsiSignalPoint {
  return {
    date: response.date,
    rsiEma: response.rsi_ema,
    signal: response.signal,
  };
}

function toMacd(response: MacdResponse): MacdPoint {
  return {
    date: response.date,
    macd: response.macd,
  };
}

function toMacdSignal(response: MacdSignalResponse): MacdSignalPoint {
  return {
    date: response.date,
    macdEma: response.macd_ema,
    signal: response.signal,
  };
}

function toStockNewsItem(response: StockNewsResponse): StockNewsItem {
  return {
    title: response.title,
    source: response.source,
    publishedAt: response.published_at,
  };
}

function toVixIndexPoint(response: VixIndexResponse): VixIndexPoint {
  return {
    date: response.date,
    value: response.value,
  };
}

function toFearAndGreedIndex(response: FearAndGreedIndexResponse): FearAndGreedIndex {
  return {
    value: response.value,
    condition: response.condition,
    updatedAt: response.updated_at,
  };
}

function toTreasuryYieldPoint(response: TreasuryYieldResponse): TreasuryYieldPoint {
  return {
    date: response.date,
    yieldRate: response.yield_rate,
  };
}

function toSp500IndexPoint(response: Sp500IndexResponse): Sp500IndexPoint {
  return {
    date: response.date,
    openPrice: response.open_price,
    highPrice: response.high_price,
    lowPrice: response.low_price,
    closePrice: response.close_price,
  };
}
