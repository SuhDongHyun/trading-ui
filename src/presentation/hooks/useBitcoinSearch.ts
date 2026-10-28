import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadBitcoinCandles, loadBitcoinOrderbook, loadBitcoinTrades } from '../../application/loadBitcoinDetails';
import { loadBitcoinMarket } from '../../application/loadBitcoinMarket';
import { loadBitcoinTicker } from '../../application/loadBitcoinTicker';
import {
  BITCOIN_QUOTES,
  type BitcoinCandle,
  type BitcoinCandlePeriod,
  type BitcoinCoin,
  type BitcoinOrderbook,
  type BitcoinOrderbookInstrument,
  type BitcoinQuote,
  type BitcoinTicker,
  type BitcoinTrade,
} from '../../domain/bitcoin';
import { filterBitcoinCoins, resolveBitcoinQuote, type BitcoinSort } from '../../domain/bitcoinSearch';
import { createFastApiBitcoinRepository } from '../../infrastructure/fastApiBitcoinRepository';

export type BitcoinDetailTab = 'chart' | 'orderbook' | 'trades';
export type BitcoinTradeSide = 'all' | 'BID' | 'ASK';

type BitcoinSearchState = {
  coins: BitcoinCoin[];
  quote: BitcoinQuote;
  query: string;
  cautionOnly: boolean;
  sort: BitcoinSort;
  selectedMarket: string;
  selectedCoin: BitcoinCoin | null;
  selectedTicker: BitcoinTicker | null;
  isLoading: boolean;
  isDetailLoading: boolean;
  marketLoaded: boolean;
  error: string | null;
  detailError: string | null;
  detailTab: BitcoinDetailTab;
  chartPeriod: BitcoinCandlePeriod;
  chartData: { market: string; period: BitcoinCandlePeriod; candles: BitcoinCandle[] } | null;
  isChartLoading: boolean;
  chartError: string | null;
  orderbookLevel: string;
  orderbookData: { market: string; level: string; instrument: BitcoinOrderbookInstrument; book: BitcoinOrderbook } | null;
  isOrderbookLoading: boolean;
  orderbookError: string | null;
  tradeSide: BitcoinTradeSide;
  tradesData: { market: string; trades: BitcoinTrade[] } | null;
  isTradesLoading: boolean;
  tradesError: string | null;
  resultsFor: (quote: BitcoinQuote) => BitcoinCoin[];
  updateQuery: (query: string) => void;
  updateQuote: (quote: BitcoinQuote) => void;
  updateCautionOnly: (enabled: boolean) => void;
  updateSort: (sort: BitcoinSort) => void;
  selectCoin: (market: string) => void;
  selectDetailTab: (tab: BitcoinDetailTab) => void;
  updateChartPeriod: (period: BitcoinCandlePeriod) => void;
  updateOrderbookLevel: (level: string) => void;
  updateTradeSide: (side: BitcoinTradeSide) => void;
};

export function useBitcoinSearch(): BitcoinSearchState {
  const repository = useMemo(() => createFastApiBitcoinRepository(), []);
  const [coins, setCoins] = useState<BitcoinCoin[]>([]);
  const [quote, setQuote] = useState<BitcoinQuote>('KRW');
  const [query, setQuery] = useState('');
  const [cautionOnly, setCautionOnly] = useState(false);
  const [sort, setSort] = useState<BitcoinSort>({ key: 'amount', direction: -1 });
  const [selectedMarket, setSelectedMarket] = useState('KRW-BTC');
  const [selectedTicker, setSelectedTicker] = useState<BitcoinTicker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [marketLoaded, setMarketLoaded] = useState(false);
  const [detailTab, setDetailTab] = useState<BitcoinDetailTab>('chart');
  const [chartPeriod, setChartPeriod] = useState<BitcoinCandlePeriod>('D');
  const [chartData, setChartData] = useState<BitcoinSearchState['chartData']>(null);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [orderbookLevel, setOrderbookLevel] = useState('0');
  const [orderbookData, setOrderbookData] = useState<BitcoinSearchState['orderbookData']>(null);
  const [isOrderbookLoading, setIsOrderbookLoading] = useState(false);
  const [orderbookError, setOrderbookError] = useState<string | null>(null);
  const [tradeSide, setTradeSide] = useState<BitcoinTradeSide>('all');
  const [tradesData, setTradesData] = useState<BitcoinSearchState['tradesData']>(null);
  const [isTradesLoading, setIsTradesLoading] = useState(false);
  const [tradesError, setTradesError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    loadBitcoinMarket(repository)
      .then((result) => {
        if (!active) return;
        setCoins(result);
        const hashMarket = readHashMarket();
        const hashCoin = hashMarket ? result.find((coin) => coin.market === hashMarket) : undefined;
        const defaultCoin = result.find((coin) => coin.market === 'KRW-BTC') ?? result[0];
        const initialCoin = hashCoin ?? defaultCoin;
        if (initialCoin) {
          setSelectedMarket(initialCoin.market);
          setQuote(initialCoin.quote);
        }
      })
      .catch((unknownError: unknown) => {
        if (active) setError(unknownError instanceof Error ? unknownError.message : '코인 목록을 불러오지 못했습니다.');
      })
      .finally(() => {
        if (active) {
          setMarketLoaded(true);
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [repository]);

  const selectedCoin = coins.find((coin) => coin.market === selectedMarket) ?? null;

  useEffect(() => {
    if (!marketLoaded || !selectedCoin) return undefined;
    let active = true;
    setSelectedTicker(null);
    setIsDetailLoading(true);
    setDetailError(null);

    loadBitcoinTicker(repository, selectedCoin.market)
      .then((ticker) => {
        if (active) setSelectedTicker(ticker);
      })
      .catch((unknownError: unknown) => {
        if (active) setDetailError(unknownError instanceof Error ? unknownError.message : '코인 시세를 불러오지 못했습니다.');
      })
      .finally(() => {
        if (active) setIsDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [marketLoaded, repository, selectedCoin]);

  useEffect(() => {
    if (!marketLoaded || !selectedCoin || detailTab !== 'chart') return undefined;
    let active = true;
    const controller = new AbortController();
    setIsChartLoading(true);
    setChartError(null);
    loadBitcoinCandles(repository, selectedCoin.market, chartPeriod, controller.signal)
      .then((candles) => {
        if (active) setChartData({ market: selectedCoin.market, period: chartPeriod, candles });
      })
      .catch((unknownError: unknown) => {
        if (active && !controller.signal.aborted) {
          setChartError(unknownError instanceof Error ? unknownError.message : '차트 데이터를 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (active) setIsChartLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [chartPeriod, detailTab, marketLoaded, repository, selectedCoin]);

  useEffect(() => {
    if (!marketLoaded || !selectedCoin || detailTab !== 'orderbook') return undefined;
    let active = true;
    const controller = new AbortController();
    setIsOrderbookLoading(true);
    setOrderbookError(null);
    loadBitcoinOrderbook(repository, selectedCoin.market, orderbookLevel, controller.signal)
      .then(({ instrument, book, level }) => {
        if (!active) return;
        setOrderbookData({ market: selectedCoin.market, level, instrument, book });
        if (level !== orderbookLevel) setOrderbookLevel(level);
      })
      .catch((unknownError: unknown) => {
        if (active && !controller.signal.aborted) {
          setOrderbookError(unknownError instanceof Error ? unknownError.message : '호가 정보를 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (active) setIsOrderbookLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [detailTab, marketLoaded, orderbookLevel, repository, selectedCoin]);

  useEffect(() => {
    if (!marketLoaded || !selectedCoin || detailTab !== 'trades') return undefined;
    let active = true;
    const controller = new AbortController();
    setIsTradesLoading(true);
    setTradesError(null);
    loadBitcoinTrades(repository, selectedCoin.market, controller.signal)
      .then((trades) => {
        if (active) setTradesData({ market: selectedCoin.market, trades });
      })
      .catch((unknownError: unknown) => {
        if (active && !controller.signal.aborted) {
          setTradesError(unknownError instanceof Error ? unknownError.message : '체결 정보를 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (active) setIsTradesLoading(false);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, [detailTab, marketLoaded, repository, selectedCoin]);

  const resultsFor = useCallback(
    (activeQuote: BitcoinQuote) => filterBitcoinCoins(coins, activeQuote, query, cautionOnly),
    [coins, query, cautionOnly],
  );

  const updateQuery = useCallback(
    (nextQuery: string) => {
      setQuery(nextQuery);
      setQuote((currentQuote) => resolveBitcoinQuote(coins, currentQuote, nextQuery, cautionOnly));
    },
    [coins, cautionOnly],
  );

  const updateQuote = useCallback((nextQuote: BitcoinQuote) => setQuote(nextQuote), []);

  const updateCautionOnly = useCallback(
    (enabled: boolean) => {
      setCautionOnly(enabled);
      setQuote((currentQuote) => resolveBitcoinQuote(coins, currentQuote, query, enabled));
    },
    [coins, query],
  );

  const selectCoin = useCallback(
    (market: string) => {
      const coin = coins.find((item) => item.market === market);
      if (!coin) return;
      setSelectedMarket(coin.market);
      setQuote(coin.quote);
      setOrderbookLevel('0');
      window.history.replaceState(null, '', `#${encodeURIComponent(coin.market)}`);
    },
    [coins],
  );

  return {
    coins,
    quote,
    query,
    cautionOnly,
    sort,
    selectedMarket,
    selectedCoin,
    selectedTicker,
    isLoading,
    isDetailLoading,
    error,
    detailError,
    marketLoaded,
    detailTab,
    chartPeriod,
    chartData,
    isChartLoading,
    chartError,
    orderbookLevel,
    orderbookData,
    isOrderbookLoading,
    orderbookError,
    tradeSide,
    tradesData,
    isTradesLoading,
    tradesError,
    resultsFor,
    updateQuery,
    updateQuote,
    updateCautionOnly,
    updateSort: setSort,
    selectCoin,
    selectDetailTab: setDetailTab,
    updateChartPeriod: setChartPeriod,
    updateOrderbookLevel: setOrderbookLevel,
    updateTradeSide: setTradeSide,
  };
}

function readHashMarket(): string | null {
  try {
    const market = decodeURIComponent(window.location.hash.slice(1));
    return market && BITCOIN_QUOTES.some((quote) => market.startsWith(`${quote}-`)) ? market : null;
  } catch {
    return null;
  }
}
