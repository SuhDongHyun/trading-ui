import type {
  DailyPrice,
  MacdPoint,
  MacdSignalPoint,
  MovingAveragePoint,
  RsiPoint,
  RsiSignalPoint,
  StockQuery,
  StockRepository,
} from '../domain/stock';
import { postJson } from './http';
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

export function createFastApiStockRepository(baseUrl = '/api'): StockRepository {
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
