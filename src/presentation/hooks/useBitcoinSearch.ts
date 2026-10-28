import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadBitcoinMarket } from '../../application/loadBitcoinMarket';
import { loadBitcoinTicker } from '../../application/loadBitcoinTicker';
import { BITCOIN_QUOTES, type BitcoinCoin, type BitcoinQuote, type BitcoinRepository, type BitcoinTicker } from '../../domain/bitcoin';
import { filterBitcoinCoins, resolveBitcoinQuote, type BitcoinSort } from '../../domain/bitcoinSearch';
import { createFastApiBitcoinRepository } from '../../infrastructure/fastApiBitcoinRepository';

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
  resultsFor: (quote: BitcoinQuote) => BitcoinCoin[];
  updateQuery: (query: string) => void;
  updateQuote: (quote: BitcoinQuote) => void;
  updateCautionOnly: (enabled: boolean) => void;
  updateSort: (sort: BitcoinSort) => void;
  selectCoin: (market: string) => void;
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
    resultsFor,
    updateQuery,
    updateQuote,
    updateCautionOnly,
    updateSort: setSort,
    selectCoin,
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
