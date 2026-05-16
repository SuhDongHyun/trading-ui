import type {
  IndicatorSettings,
  MovingAverageSeries,
  StockChartData,
  StockQuery,
  StockRepository,
} from '../domain/stock';

export async function loadStockChart(
  repository: StockRepository,
  query: StockQuery,
  settings: IndicatorSettings,
): Promise<StockChartData> {
  const [quote, prices, movingAverages, rsi, rsiSignal, macd, macdSignal] = await Promise.all([
    repository.getQuote({ market: query.market, code: query.code }),
    repository.getDailyPrices(query),
    loadMovingAverages(repository, query, settings.movingAverageWindows),
    repository.getRsi(query, settings.rsiWindow),
    repository.getRsiSignal(query, settings.rsiWindow, settings.rsiSignalEmaWindow),
    repository.getMacd(query, settings.macdShortWindow, settings.macdLongWindow),
    repository.getMacdSignal(
      query,
      settings.macdShortWindow,
      settings.macdLongWindow,
      settings.rsiSignalEmaWindow,
    ),
  ]);

  return {
    quote,
    prices,
    movingAverages,
    rsi,
    rsiSignal,
    macd,
    macdSignal,
  };
}

async function loadMovingAverages(
  repository: StockRepository,
  query: StockQuery,
  windows: number[],
): Promise<MovingAverageSeries[]> {
  const uniqueWindows = [...new Set(windows)].filter((window) => Number.isFinite(window) && window > 0);
  const results = await Promise.all(
    uniqueWindows.map(async (window) => ({
      window,
      points: await repository.getMovingAverage(query, window),
    })),
  );
  return results;
}
