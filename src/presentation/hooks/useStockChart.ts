import { useCallback, useMemo, useState } from 'react';
import { loadStockChart } from '../../application/loadStockChart';
import {
  DEFAULT_INDICATOR_SETTINGS,
  DEFAULT_QUERY,
  type IndicatorSettings,
  type StockChartData,
  type StockQuery,
} from '../../domain/stock';
import { createFastApiStockRepository } from '../../infrastructure/fastApiStockRepository';

type StockChartState = {
  query: StockQuery;
  settings: IndicatorSettings;
  data: StockChartData | null;
  isLoading: boolean;
  error: string | null;
  search: (nextQuery: StockQuery) => void;
  updateSettings: (nextSettings: IndicatorSettings) => void;
};

export function useStockChart(): StockChartState {
  const repository = useMemo(() => createFastApiStockRepository(), []);
  const [query, setQuery] = useState<StockQuery>(DEFAULT_QUERY);
  const [settings, setSettings] = useState<IndicatorSettings>(DEFAULT_INDICATOR_SETTINGS);
  const [data, setData] = useState<StockChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(
    async (activeQuery: StockQuery, activeSettings: IndicatorSettings) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await loadStockChart(repository, activeQuery, activeSettings);
        setData(result);
      } catch (unknownError) {
        setError(unknownError instanceof Error ? unknownError.message : '데이터를 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    },
    [repository],
  );

  const search = useCallback(
    (nextQuery: StockQuery) => {
      setQuery(nextQuery);
      setData(null);
      void refresh(nextQuery, settings);
    },
    [refresh, settings],
  );

  const updateSettings = useCallback(
    (nextSettings: IndicatorSettings) => {
      setSettings(nextSettings);
      if (data) {
        void refresh(query, nextSettings);
      }
    },
    [data, query, refresh],
  );

  return {
    query,
    settings,
    data,
    isLoading,
    error,
    search,
    updateSettings,
  };
}
