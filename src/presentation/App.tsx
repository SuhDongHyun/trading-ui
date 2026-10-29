import { useEffect, useState } from 'react';
import { BitcoinSearchPage } from './components/BitcoinSearchPage';
import { ChartShell } from './components/ChartShell';
import { IndicatorSettingsModal } from './components/IndicatorSettingsModal';
import { MarketSummaryPage } from './components/MarketSummaryPage';
import { NewsList } from './components/NewsList';
import { QueryBar } from './components/QueryBar';
import { QuoteHeader } from './components/QuoteHeader';
import { useMarketSummary } from './hooks/useMarketSummary';
import { useStockChart } from './hooks/useStockChart';
import { useBitcoinSearch } from './hooks/useBitcoinSearch';
import { getInitialBitcoinMarket, getInitialPage, shouldFallbackFromInvalidBitcoinHash, type AppPage } from './pageRouting';

type ActiveTab = 'chart' | 'news';

export function App() {
  const { query, settings, data, stockOptions, isStockListLoading, isLoading, error, search, updateSettings } = useStockChart();
  const summary = useMarketSummary();
  const bitcoin = useBitcoinSearch();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chart');
  const [initialHashMarket] = useState(() => getInitialBitcoinMarket(window.location.hash));
  const [activePage, setActivePage] = useState<AppPage>(() => getInitialPage(window.location.hash));
  const [userNavigated, setUserNavigated] = useState(false);
  const [stockInput, setStockInput] = useState(query.code);

  useEffect(() => {
    if (!bitcoin.marketLoaded || bitcoin.error) return;
    const availableMarkets = bitcoin.coins.map((coin) => coin.market);
    if (shouldFallbackFromInvalidBitcoinHash(initialHashMarket, availableMarkets, userNavigated)) {
      setActivePage('summary');
    }
  }, [bitcoin.coins, bitcoin.marketLoaded, initialHashMarket, userNavigated]);

  const navigatePage = (page: AppPage) => {
    setUserNavigated(true);
    setActivePage(page);
  };

  return (
    <main className="app-shell">
      <nav className="page-nav" aria-label="페이지 전환">
        <div>
          <strong>Trading UI</strong>
          <span>시장 요약과 종목 검색</span>
        </div>
        <div className="page-tabs">
          <button
            type="button"
            className={activePage === 'summary' ? 'active' : undefined}
            onClick={() => navigatePage('summary')}
          >
            Summary
          </button>
          <button
            type="button"
            className={activePage === 'stock' ? 'active' : undefined}
            onClick={() => navigatePage('stock')}
          >
            주식 검색
          </button>
          <button
            type="button"
            className={activePage === 'bitcoin' ? 'active' : undefined}
            onClick={() => navigatePage('bitcoin')}
          >
            코인 검색
          </button>
        </div>
      </nav>

      <section className={activePage === 'bitcoin' ? 'trading-app coin-app' : 'trading-app'} aria-label={activePage === 'bitcoin' ? '코인 검색' : '주식 차트 조회'}>
        {activePage === 'summary' ? (
          <MarketSummaryPage
            data={summary.data}
            dateRange={summary.dateRange}
            isLoading={summary.isLoading}
            error={summary.error}
            onRefresh={summary.refresh}
            onDateRangeChange={summary.updateDateRange}
          />
        ) : null}

        {activePage === 'bitcoin' ? <BitcoinSearchPage {...bitcoin} /> : null}

        {activePage === 'stock' ? (
          <>
            <QueryBar
              query={query}
              stockInput={stockInput}
              stockOptions={stockOptions}
              isStockListLoading={isStockListLoading}
              onStockInputChange={setStockInput}
              onSearch={search}
            />
            <QuoteHeader quote={data?.quote} code={query.code} market={query.market} />

            <nav className="tab-row" aria-label="주식 정보 탭">
              <button type="button" className={activeTab === 'chart' ? 'active' : undefined} onClick={() => setActiveTab('chart')}>
                차트
              </button>
              <button type="button" className={activeTab === 'news' ? 'active' : undefined} onClick={() => setActiveTab('news')}>
                뉴스
              </button>
            </nav>

            {error ? <div className="error-banner">{error}</div> : null}

            {activeTab === 'chart' ? (
              <ChartShell
                data={data}
                isLoading={isLoading}
                settings={settings}
                onOpenSettings={() => setSettingsOpen(true)}
              />
            ) : null}
            {activeTab === 'news' ? <NewsList news={data?.news} isLoading={isLoading} /> : null}
          </>
        ) : null}
      </section>

      <IndicatorSettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onApply={(nextSettings) => {
          updateSettings(nextSettings);
          setSettingsOpen(false);
        }}
      />
    </main>
  );
}
