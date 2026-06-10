export type Period = 'D' | 'W' | 'M' | 'Y';
export type Market = 'J' | 'NX' | 'UN';

export type StockQuery = {
  market: Market;
  code: string;
  startDate: string;
  endDate: string;
  period: Period;
  adjustedPrice: boolean;
};

export type IndicatorSettings = {
  movingAverageWindows: number[];
  rsiWindow: number;
  rsiSignalEmaWindow: number;
  macdShortWindow: number;
  macdLongWindow: number;
};

export type StockQuote = {
  marketName: string;
  code: string;
  name: string;
  industry: string;
  per: number;
  pbr: number;
  eps: number;
  bps: number;
  openPrice: number;
  currentPrice: number;
  previousPrice: number;
  highestPrice: number;
  lowestPrice: number;
  upperLimitPrice: number;
  lowerLimitPrice: number;
  currentVolume: number;
  previousVolume: number;
  currentTradingValue: number;
  priceDiff: number;
  priceDiffRate: number;
};

export type DailyPrice = {
  date: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
  accumulatedVolume: number;
  accumulatedTradingValue: number;
  priceDiff: number;
  priceDiffSign: string;
  changeFlag: string;
};

export type MovingAveragePoint = {
  date: string;
  movingAverage: number;
};

export type MovingAverageSeries = {
  window: number;
  points: MovingAveragePoint[];
};

export type RsiPoint = {
  date: string;
  rsi: number;
};

export type RsiSignalPoint = {
  date: string;
  rsiEma: number;
  signal: 'buy' | 'sell' | 'neutral' | string;
};

export type MacdPoint = {
  date: string;
  macd: number;
};

export type MacdSignalPoint = {
  date: string;
  macdEma: number;
  signal: 'buy' | 'sell' | 'neutral' | string;
};

export type StockNewsItem = {
  title: string;
  source: string;
  publishedAt: string;
};

export type VixIndexPoint = {
  date: string;
  value: number;
};

export type FearAndGreedIndex = {
  value: number;
  condition: string;
  updatedAt: string;
};

export type TreasuryYieldPoint = {
  date: string;
  yieldRate: number;
};

export type Sp500IndexPoint = {
  date: string;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  closePrice: number;
};

export type MarketSummaryData = {
  startDate: string;
  endDate: string;
  fearAndGreed: FearAndGreedIndex | null;
  vix: VixIndexPoint[];
  korea10YearTreasuryYield: TreasuryYieldPoint[];
  us10YearTreasuryYield: TreasuryYieldPoint[];
  sp500: Sp500IndexPoint[];
};

export type StockChartData = {
  quote: StockQuote;
  prices: DailyPrice[];
  movingAverages: MovingAverageSeries[];
  rsi: RsiPoint[];
  rsiSignal: RsiSignalPoint[];
  macd: MacdPoint[];
  macdSignal: MacdSignalPoint[];
  news: StockNewsItem[];
};

export type StockRepository = {
  getQuote(query: Pick<StockQuery, 'market' | 'code'>): Promise<StockQuote>;
  getDailyPrices(query: StockQuery): Promise<DailyPrice[]>;
  getMovingAverage(query: StockQuery, window: number): Promise<MovingAveragePoint[]>;
  getRsi(query: StockQuery, rsiWindow: number): Promise<RsiPoint[]>;
  getRsiSignal(
    query: StockQuery,
    rsiWindow: number,
    emaWindow: number,
  ): Promise<RsiSignalPoint[]>;
  getMacd(query: StockQuery, shortWindow: number, longWindow: number): Promise<MacdPoint[]>;
  getMacdSignal(
    query: StockQuery,
    shortWindow: number,
    longWindow: number,
    emaWindow: number,
  ): Promise<MacdSignalPoint[]>;
  getNews(code: string, searchDate: string): Promise<StockNewsItem[]>;
};

export type MarketIndicatorRepository = {
  getVixIndex(startDate: string, endDate: string): Promise<VixIndexPoint[]>;
  getFearAndGreedIndex(): Promise<FearAndGreedIndex | null>;
  getKorea10YearTreasuryYield(startDate: string, endDate: string): Promise<TreasuryYieldPoint[]>;
  getUs10YearTreasuryYield(startDate: string, endDate: string): Promise<TreasuryYieldPoint[]>;
  getSp500Index(startDate: string, endDate: string): Promise<Sp500IndexPoint[]>;
};

export type PriceExtreme = {
  date: string;
  value: number;
  percentDiff: number;
};

export type PriceExtremes = {
  low: PriceExtreme;
  high: PriceExtreme;
};

export type DateAxisTick = {
  date: string;
  index: number;
};

export type PaddedValueAxisOptions = {
  count: number;
  paddingRatio?: number;
  roundTo?: number;
  includeZero?: boolean;
  symmetricAroundZero?: boolean;
};

export type PaddedValueAxis = {
  min: number;
  max: number;
  ticks: number[];
};

export function createDefaultQuery(today = new Date()): StockQuery {
  const endDate = formatDateInput(today);
  const start = new Date(today);
  start.setMonth(start.getMonth() - 1);

  return {
    market: 'J',
    code: '005930',
    startDate: formatDateInput(start),
    endDate,
    period: 'D',
    adjustedPrice: true,
  };
}

export function findPriceExtremes(prices: DailyPrice[], currentPrice: number): PriceExtremes | null {
  if (prices.length === 0 || currentPrice === 0) {
    return null;
  }

  const low = prices.reduce((lowest, price) => (price.lowPrice < lowest.lowPrice ? price : lowest), prices[0]);
  const high = prices.reduce((highest, price) => (price.highPrice > highest.highPrice ? price : highest), prices[0]);

  return {
    low: {
      date: low.date,
      value: low.lowPrice,
      percentDiff: ((low.lowPrice - currentPrice) / currentPrice) * 100,
    },
    high: {
      date: high.date,
      value: high.highPrice,
      percentDiff: ((high.highPrice - currentPrice) / currentPrice) * 100,
    },
  };
}

export function findNearestDataIndex(x: number, length: number, left: number, chartWidth: number): number {
  if (length <= 1) {
    return 0;
  }

  const ratio = (x - left) / chartWidth;
  const unclampedIndex = Math.round(ratio * (length - 1));
  return Math.min(Math.max(unclampedIndex, 0), length - 1);
}

export function createDateAxisTicks(dates: string[], maxTicks: number): DateAxisTick[] {
  if (dates.length === 0 || maxTicks <= 0) {
    return [];
  }

  const tickCount = Math.min(maxTicks, dates.length);
  if (tickCount === 1) {
    return [{ date: dates[0], index: 0 }];
  }

  const lastIndex = dates.length - 1;
  const seen = new Set<number>();
  return Array.from({ length: tickCount }, (_, tickIndex) => Math.round((lastIndex * tickIndex) / (tickCount - 1)))
    .filter((index) => {
      if (seen.has(index)) {
        return false;
      }
      seen.add(index);
      return true;
    })
    .map((index) => ({ date: dates[index], index }));
}

export function createValueAxisTicks(min: number, max: number, count: number, roundTo = 1): number[] {
  if (count <= 0) {
    return [];
  }
  if (count === 1 || min === max) {
    return [max];
  }

  const step = (max - min) / (count - 1);
  return Array.from({ length: count }, (_, index) => {
    if (index === 0) {
      return max;
    }
    if (index === count - 1) {
      return min;
    }

    const value = max - step * index;
    const rounded = roundHalfAwayFromZero(value / roundTo) * roundTo;
    return Math.abs(rounded) < 0.000001 ? 0 : rounded;
  });
}

export function createPaddedValueAxis(values: number[], options: PaddedValueAxisOptions): PaddedValueAxis {
  const safeValues = values.filter(Number.isFinite);
  const rawMin = safeValues.length > 0 ? Math.min(...safeValues) : 0;
  const rawMax = safeValues.length > 0 ? Math.max(...safeValues) : 0;
  const zeroAwareMin = options.includeZero ? Math.min(rawMin, 0) : rawMin;
  const zeroAwareMax = options.includeZero ? Math.max(rawMax, 0) : rawMax;
  const spread = zeroAwareMax - zeroAwareMin || 1;
  const paddingRatio = options.paddingRatio ?? 0.12;
  let min = zeroAwareMin - spread * paddingRatio;
  let max = zeroAwareMax + spread * paddingRatio;

  if (options.symmetricAroundZero) {
    const absoluteMax = Math.max(Math.abs(min), Math.abs(max));
    min = -absoluteMax;
    max = absoluteMax;
  }
  const tickDomain = createTickDomain(
    options.symmetricAroundZero ? min : zeroAwareMin,
    options.symmetricAroundZero ? max : zeroAwareMax,
    options.roundTo,
    options.symmetricAroundZero,
  );

  return {
    min,
    max,
    ticks: Array.from(new Set(createValueAxisTicks(tickDomain.min, tickDomain.max, options.count, options.roundTo))).filter(
      (tick) => tick >= min && tick <= max,
    ),
  };
}

export function createRsiReferenceLines(min: number, max: number): number[] {
  return [30, 70].filter((value) => value >= min && value <= max);
}

export function createMacdValueAxis(values: number[]): PaddedValueAxis {
  const absoluteMax = Math.max(1, ...values.map((value) => Math.abs(value)));
  return createPaddedValueAxis(values, {
    count: 5,
    paddingRatio: 0.12,
    includeZero: true,
    symmetricAroundZero: false,
    roundTo: createMagnitudeAxisStep(absoluteMax),
  });
}

export function createMagnitudeAxisStep(maxAbsoluteValue: number): number {
  const safeValue = Math.abs(maxAbsoluteValue);
  if (safeValue < 10) {
    return 1;
  }

  return 10 ** Math.floor(Math.log10(safeValue));
}

export function getPriceChangeTone(priceDiffRate: number): 'up' | 'down' {
  return priceDiffRate < 0 ? 'down' : 'up';
}

export const DEFAULT_QUERY: StockQuery = createDefaultQuery();

export const DEFAULT_INDICATOR_SETTINGS: IndicatorSettings = {
  movingAverageWindows: [5, 20, 60, 120],
  rsiWindow: 14,
  rsiSignalEmaWindow: 9,
  macdShortWindow: 12,
  macdLongWindow: 26,
};

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(Math.abs(value)) : Math.round(value);
}

function createTickDomain(min: number, max: number, roundTo = 1, symmetricAroundZero = false) {
  if (symmetricAroundZero) {
    const absoluteMax = Math.ceil(Math.max(Math.abs(min), Math.abs(max)) / roundTo) * roundTo;
    return { min: -absoluteMax, max: absoluteMax };
  }

  return {
    min: Math.floor(min / roundTo) * roundTo,
    max: Math.ceil(max / roundTo) * roundTo,
  };
}
