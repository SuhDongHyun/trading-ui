import { useState } from 'react';
import { ChartShell } from './components/ChartShell';
import { IndicatorSettingsModal } from './components/IndicatorSettingsModal';
import { QueryBar } from './components/QueryBar';
import { QuoteHeader } from './components/QuoteHeader';
import { useStockChart } from './hooks/useStockChart';

export function App() {
  const { query, settings, data, isLoading, error, search, updateSettings } = useStockChart();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <main className="app-shell">
      <section className="trading-app" aria-label="주식 차트 조회">
        <QueryBar query={query} onSearch={search} />
        <QuoteHeader quote={data?.quote} code={query.code} market={query.market} />

        <nav className="tab-row" aria-label="주식 정보 탭">
          <span className="active">차트</span>
        </nav>

        {error ? <div className="error-banner">{error}</div> : null}

        <ChartShell
          data={data}
          isLoading={isLoading}
          settings={settings}
          period={query.period}
          onOpenSettings={() => setSettingsOpen(true)}
        />
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
