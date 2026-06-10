import { useState } from 'react';
import { ChartShell } from './components/ChartShell';
import { IndicatorSettingsModal } from './components/IndicatorSettingsModal';
import { MarketSummaryPage } from './components/MarketSummaryPage';
import { NewsList } from './components/NewsList';
import { QueryBar } from './components/QueryBar';
import { QuoteHeader } from './components/QuoteHeader';
import { useMarketSummary } from './hooks/useMarketSummary';
import { useStockChart } from './hooks/useStockChart';

type ActiveTab = 'chart' | 'news';
type ActivePage = 'summary' | 'stock';

export function App() {
  const { query, settings, data, isLoading, error, search, updateSettings } = useStockChart();
  const summary = useMarketSummary();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chart');
  const [activePage, setActivePage] = useState<ActivePage>('summary');

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
            onClick={() => setActivePage('summary')}
          >
            Summary
          </button>
          <button
            type="button"
            className={activePage === 'stock' ? 'active' : undefined}
            onClick={() => setActivePage('stock')}
          >
            주식 검색
          </button>
        </div>
      </nav>

      <section className="trading-app" aria-label="주식 차트 조회">
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

        {activePage === 'stock' ? (
          <>
            <QueryBar query={query} onSearch={search} />
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
                period={query.period}
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
