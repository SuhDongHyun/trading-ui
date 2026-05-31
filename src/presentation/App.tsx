import { useState } from 'react';
import { ChartShell } from './components/ChartShell';
import { IndicatorSettingsModal } from './components/IndicatorSettingsModal';
import { NewsList } from './components/NewsList';
import { QueryBar } from './components/QueryBar';
import { QuoteHeader } from './components/QuoteHeader';
import { useStockChart } from './hooks/useStockChart';

type ActiveTab = 'chart' | 'news';

export function App() {
  const { query, settings, data, isLoading, error, search, updateSettings } = useStockChart();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('chart');

  return (
    <main className="app-shell">
      <section className="trading-app" aria-label="주식 차트 조회">
        <QueryBar query={query} onSearch={search} />
        <QuoteHeader quote={data?.quote} fearAndGreed={data?.fearAndGreed} code={query.code} market={query.market} />

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
