import { useEffect, useMemo, useRef } from 'react';
import type { BitcoinCautionKey, BitcoinCoin, BitcoinQuote, BitcoinTicker } from '../../domain/bitcoin';
import { filterBitcoinCoins, isChosungQuery, sortBitcoinCoins, toBitcoinSort, type BitcoinSortKey } from '../../domain/bitcoinSearch';
import {
  bitcoinDirection,
  formatBitcoinAmount,
  formatBitcoinDate,
  formatBitcoinPrice,
  formatBitcoinRate,
  formatBitcoinSignedPrice,
  formatBitcoinTradeTime,
  formatBitcoinVolume,
} from '../bitcoinFormat';
import type { useBitcoinSearch } from '../hooks/useBitcoinSearch';

type BitcoinSearchPageProps = ReturnType<typeof useBitcoinSearch>;

const CAUTION_LABELS: Record<BitcoinCautionKey, string> = {
  PRICE_FLUCTUATIONS: '가격 급등락',
  TRADING_VOLUME_SOARING: '거래량 급등',
  DEPOSIT_AMOUNT_SOARING: '입금량 급등',
  GLOBAL_PRICE_DIFFERENCES: '글로벌 시세 차이',
  CONCENTRATION_OF_SMALL_ACCOUNTS: '소수 계정 집중',
};

const QUOTES: BitcoinQuote[] = ['KRW', 'BTC', 'USDT'];
const SORT_HEADERS: Array<{ key: BitcoinSortKey; label: string }> = [
  { key: 'name', label: '코인명' },
  { key: 'price', label: '현재가' },
  { key: 'rate', label: '전일대비' },
  { key: 'amount', label: '거래대금' },
];

export function BitcoinSearchPage(props: BitcoinSearchPageProps) {
  const searchRef = useRef<HTMLInputElement>(null);
  const {
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
    resultsFor,
    updateQuery,
    updateQuote,
    updateCautionOnly,
    updateSort,
    selectCoin,
  } = props;

  const visibleCoins = useMemo(() => sortBitcoinCoins(resultsFor(quote), sort), [resultsFor, quote, sort]);
  const quoteCounts = useMemo(
    () => Object.fromEntries(QUOTES.map((item) => [item, filterBitcoinCoins(coins, item, query, cautionOnly).length])) as Record<BitcoinQuote, number>,
    [coins, query, cautionOnly],
  );

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target;
      if (target instanceof HTMLElement && target.closest('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener('keydown', focusSearch);
    return () => document.removeEventListener('keydown', focusSearch);
  }, []);

  const chooseFirstResult = () => {
    if (visibleCoins[0]) selectCoin(visibleCoins[0].market);
  };

  return (
    <>
      <aside className="coin-market" aria-label="코인 목록">
        <div className="coin-market-head">
          <label className="search-field">
            <svg className="search-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="8.5" cy="8.5" r="5.5" />
              <path d="m13 13 4 4" strokeLinecap="round" />
            </svg>
            <input
              ref={searchRef}
              type="search"
              value={query}
              autoComplete="off"
              placeholder="코인명·심볼·초성 (비트, BTC, ㅂㅌ)"
              aria-label="코인 검색"
              onChange={(event) => updateQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  chooseFirstResult();
                }
              }}
            />
            <kbd aria-hidden="true">/</kbd>
          </label>

          <div className="segmented" role="tablist" aria-label="마켓">
            {QUOTES.map((item) => (
              <button
                key={item}
                type="button"
                role="tab"
                className={item === quote ? 'active' : undefined}
                aria-selected={item === quote}
                onClick={() => updateQuote(item)}
              >
                {item}<small>{quoteCounts[item]}</small>
              </button>
            ))}
          </div>

          <div className="market-head-meta">
            <span>{query ? `"${query}" 검색 결과 ${visibleCoins.length}개` : `${quote} 마켓 ${visibleCoins.length}개`}</span>
            <label className="filter-check">
              <input type="checkbox" checked={cautionOnly} onChange={(event) => updateCautionOnly(event.target.checked)} />
              유의·주의 종목만
            </label>
          </div>
        </div>

        <div className="coin-list-header" aria-label="정렬 기준">
          {SORT_HEADERS.map(({ key, label }) => {
            const isSorted = sort.key === key;
            return (
              <button
                key={key}
                type="button"
                className={isSorted ? 'sorted' : undefined}
                aria-label={`${label} 기준 정렬`}
                aria-sort={isSorted ? (sort.direction === 1 ? 'ascending' : 'descending') : 'none'}
                onClick={() => updateSort(toBitcoinSort(key, sort))}
              >
                {label}{isSorted ? (sort.direction === 1 ? ' ▲' : ' ▼') : ''}
              </button>
            );
          })}
        </div>

        <div className="coin-list" role="listbox" aria-label="검색 결과" aria-busy={isLoading}>
          {isLoading ? (
            <div className="list-state" role="status"><span className="loading-spinner small" aria-hidden />코인 목록을 불러오는 중입니다.</div>
          ) : error ? (
            <div className="list-empty" role="alert"><strong>코인 목록을 불러오지 못했습니다</strong><span>{error}</span></div>
          ) : visibleCoins.length === 0 ? (
            <div className="list-empty"><strong>일치하는 코인이 없습니다</strong><span>다른 마켓 탭이나 영문 심볼로 검색해 보세요.</span></div>
          ) : (
            visibleCoins.map((coin) => (
              <BitcoinCoinRow
                key={coin.market}
                coin={coin}
                query={query}
                selected={coin.market === selectedMarket}
                onSelect={() => selectCoin(coin.market)}
              />
            ))
          )}
        </div>
      </aside>

      <div className="coin-detail">
        {selectedCoin ? (
          <BitcoinQuoteHeader coin={selectedCoin} ticker={selectedTicker} isLoading={isDetailLoading} error={detailError} />
        ) : (
          <div className="coin-detail-state" role={error ? 'alert' : 'status'}>
            {error ? '코인 시세를 표시할 수 없습니다.' : '표시할 코인이 없습니다.'}
          </div>
        )}
      </div>
    </>
  );
}

function BitcoinCoinRow({ coin, query, selected, onSelect }: { coin: BitcoinCoin; query: string; selected: boolean; onSelect: () => void }) {
  const tone = bitcoinDirection(coin.signedChangePrice);
  return (
    <button type="button" role="option" className={`coin-row${selected ? ' selected' : ''}`} aria-selected={selected} onClick={onSelect}>
      <span className="coin-name">
        <b>
          <span><Highlight text={coin.koreanName} query={query} /></span>
          {coin.warning ? <span className="chip warn tiny">유의</span> : coin.cautions.length ? <span className="chip caution tiny">주의</span> : null}
        </b>
        <small><Highlight text={coin.symbol} query={query} />/{coin.quote}</small>
      </span>
      <span className={`num ${tone}`}>{formatBitcoinPrice(coin.tradePrice, coin.quote)}</span>
      <span className={`num cell-stack ${tone}`}>
        {formatBitcoinRate(coin.signedChangeRate)}
        <small>{formatBitcoinSignedPrice(coin.signedChangePrice, coin.quote)}</small>
      </span>
      <span className="num amount">{formatBitcoinAmount(coin.accumulatedTradePrice24h, coin.quote)}</span>
    </button>
  );
}

function BitcoinQuoteHeader({ coin, ticker, isLoading, error }: { coin: BitcoinCoin; ticker: BitcoinTicker | null; isLoading: boolean; error: string | null }) {
  const activeTicker = ticker?.market === coin.market ? ticker : null;
  const cautions = coin.cautions.map((key) => <span key={key} className="chip caution">주의 · {CAUTION_LABELS[key]}</span>);

  return (
    <header className="quote-header coin-quote-header" aria-live="polite">
      <div className="quote-topline">
        <div className="quote-title-group">
          <span className="coin-avatar" aria-hidden="true">{coin.symbol.slice(0, 4)}</span>
          <div>
            <h1>{coin.koreanName}</h1>
            <p className="quote-sub">{coin.market} | {coin.englishName} | {coin.quote} 마켓</p>
          </div>
        </div>
        <div className="quote-actions">
          {coin.warning ? <span className="chip warn">투자유의</span> : null}
          {cautions}
          <span className="market-pill">{coin.quote}</span>
        </div>
      </div>

      {activeTicker ? <BitcoinTickerDetails coin={coin} ticker={activeTicker} /> : (
        <div className="coin-detail-state" role={error ? 'alert' : 'status'}>
          {error ? `시세를 불러오지 못했습니다: ${error}` : isLoading ? <><span className="loading-spinner small" aria-hidden />시세를 불러오는 중입니다.</> : '시세 정보가 없습니다.'}
        </div>
      )}
    </header>
  );
}

function BitcoinTickerDetails({ coin, ticker }: { coin: BitcoinCoin; ticker: BitcoinTicker }) {
  const direction = bitcoinDirection(ticker.signedChangePrice);
  const range = ticker.highest52WeekPrice - ticker.lowest52WeekPrice;
  const position = Math.min(100, Math.max(0, range > 0 ? ((ticker.tradePrice - ticker.lowest52WeekPrice) / range) * 100 : 50));
  return (
    <>
      <div className="quote-summary">
        <div className="coin-current-price">
          <strong className={`price ${direction}`}>{formatBitcoinPrice(ticker.tradePrice, coin.quote)}<small>{coin.quote}</small></strong>
          <span className={`diff ${direction}`}>
            {direction === 'up' ? '▲' : direction === 'down' ? '▼' : '–'} {formatBitcoinSignedPrice(ticker.signedChangePrice, coin.quote)} {formatBitcoinRate(ticker.signedChangeRate)}
          </span>
        </div>
        <dl className="quote-metrics">
          <div><dt>고가</dt><dd className="up">{formatBitcoinPrice(ticker.highPrice, coin.quote)}</dd></div>
          <div><dt>저가</dt><dd className="down">{formatBitcoinPrice(ticker.lowPrice, coin.quote)}</dd></div>
          <div><dt>전일종가</dt><dd>{formatBitcoinPrice(ticker.previousClosingPrice, coin.quote)}</dd></div>
          <div><dt>24h 거래대금</dt><dd>{formatBitcoinAmount(ticker.accumulatedTradePrice24h, coin.quote)} {coin.quote === 'KRW' ? '' : coin.quote}</dd></div>
          <div><dt>24h 거래량</dt><dd>{formatBitcoinVolume(ticker.accumulatedTradeVolume24h)} {coin.symbol}</dd></div>
          <div><dt>시가</dt><dd>{formatBitcoinPrice(ticker.openingPrice, coin.quote)}</dd></div>
        </dl>
      </div>
      <div className="range-row" aria-label="52주 가격 범위">
        <span className="range-end"><small>52주 최저 · {formatBitcoinDate(ticker.lowest52WeekDate)}</small><b>{formatBitcoinPrice(ticker.lowest52WeekPrice, coin.quote)}</b></span>
        <div className="range-track"><span className="range-marker" style={{ left: `${position}%` }} title={`현재가 위치 ${position.toFixed(0)}%`} /></div>
        <span className="range-end"><small>52주 최고 · {formatBitcoinDate(ticker.highest52WeekDate)}</small><b>{formatBitcoinPrice(ticker.highest52WeekPrice, coin.quote)}</b></span>
      </div>
      <div className="quote-meta">최근 체결 {formatBitcoinTradeTime(ticker.tradeDateKst, ticker.tradeTimeKst)} KST</div>
    </>
  );
}

function Highlight({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim();
  if (!trimmed || isChosungQuery(trimmed)) return text;
  const start = text.toLocaleLowerCase().indexOf(trimmed.toLocaleLowerCase());
  if (start < 0) return text;
  return <>{text.slice(0, start)}<mark>{text.slice(start, start + trimmed.length)}</mark>{text.slice(start + trimmed.length)}</>;
}
