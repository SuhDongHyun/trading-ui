import type { MarketIndicatorRepository, MarketSummaryData } from '../domain/stock';

export type MarketSummaryDateRange = {
  startDate: string;
  endDate: string;
};

export async function loadMarketSummary(
  repository: MarketIndicatorRepository,
  rangeOrToday: MarketSummaryDateRange | Date = new Date(),
): Promise<MarketSummaryData> {
  const { startDate, endDate } = rangeOrToday instanceof Date ? createDefaultMarketSummaryDateRange(rangeOrToday) : rangeOrToday;

  const [fearAndGreed, vix, korea10YearTreasuryYield, us10YearTreasuryYield, sp500] = await Promise.all([
    repository.getFearAndGreedIndex(),
    repository.getVixIndex(startDate, endDate),
    repository.getKorea10YearTreasuryYield(startDate, endDate),
    repository.getUs10YearTreasuryYield(startDate, endDate),
    repository.getSp500Index(startDate, endDate),
  ]);

  return {
    startDate,
    endDate,
    fearAndGreed,
    vix,
    korea10YearTreasuryYield,
    us10YearTreasuryYield,
    sp500,
  };
}

export function createDefaultMarketSummaryDateRange(today = new Date()): MarketSummaryDateRange {
  const endDate = formatDateInput(today);
  const start = new Date(today);
  start.setMonth(start.getMonth() - 1);

  return {
    startDate: formatDateInput(start),
    endDate,
  };
}

function formatDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
