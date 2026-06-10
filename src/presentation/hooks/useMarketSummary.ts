import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createDefaultMarketSummaryDateRange,
  loadMarketSummary,
  type MarketSummaryDateRange,
} from '../../application/loadMarketSummary';
import type { MarketSummaryData } from '../../domain/stock';
import { createFastApiStockRepository } from '../../infrastructure/fastApiStockRepository';

type MarketSummaryState = {
  data: MarketSummaryData | null;
  dateRange: MarketSummaryDateRange;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  updateDateRange: (dateRange: MarketSummaryDateRange) => void;
};

export function useMarketSummary(): MarketSummaryState {
  const repository = useMemo(() => createFastApiStockRepository(), []);
  const [dateRange, setDateRange] = useState(() => createDefaultMarketSummaryDateRange());
  const [data, setData] = useState<MarketSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async (range: MarketSummaryDateRange) => {
    if (range.startDate > range.endDate) {
      setError('시작일은 종료일보다 늦을 수 없습니다.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await loadMarketSummary(repository, range);
      setData(result);
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : '시장 요약 데이터를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  const refresh = useCallback(async () => {
    await fetchSummary(dateRange);
  }, [dateRange, fetchSummary]);

  useEffect(() => {
    void fetchSummary(dateRange);
  }, [fetchSummary]);

  return {
    data,
    dateRange,
    isLoading,
    error,
    refresh: () => {
      void refresh();
    },
    updateDateRange: setDateRange,
  };
}
