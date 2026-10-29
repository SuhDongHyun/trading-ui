import type { IndicatorSettings, StockChartData } from '../../domain/stock';
import { PriceChart } from './PriceChart';
import { IndicatorPanel } from './IndicatorPanel';

type ChartShellProps = {
  data: StockChartData | null;
  isLoading: boolean;
  settings: IndicatorSettings;
  onOpenSettings: () => void;
};

export function ChartShell({ data, isLoading, settings, onOpenSettings }: ChartShellProps) {
  return (
    <section className="chart-shell" aria-label="차트">
      <div className="chart-toolbar">
        <div className="tool-icons" aria-label="차트 도구">
          <button type="button" aria-label="설정" onClick={onOpenSettings}>
            ⚙
          </button>
        </div>
      </div>

      {isLoading && !data ? (
        <div className="chart-state" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden />
          <span>차트 데이터를 불러오는 중입니다.</span>
        </div>
      ) : null}
      {!isLoading && !data ? <div className="chart-state">조회할 종목과 기간을 입력하세요.</div> : null}

      {data ? (
        <>
          {isLoading ? (
            <div className="subtle-loading" role="status" aria-live="polite">
              <span className="loading-spinner small" aria-hidden />
              <span>새 설정으로 갱신 중</span>
            </div>
          ) : null}
          <PriceChart
            prices={data.prices}
            currentPrice={data.quote.currentPrice}
            priceDiffRate={data.quote.priceDiffRate}
            movingAverages={data.movingAverages}
            windows={settings.movingAverageWindows}
            onOpenSettings={onOpenSettings}
          />
          <IndicatorPanel
            title={`RSI(${settings.rsiWindow})`}
            secondaryTitle={`Signal(${settings.rsiSignalEmaWindow})`}
            mode="rsi"
            rsi={data.rsi}
            rsiSignal={data.rsiSignal}
            onOpenSettings={onOpenSettings}
          />
          <IndicatorPanel
            title={`MACD(${settings.macdShortWindow},${settings.macdLongWindow})`}
            secondaryTitle={`Signal(${settings.rsiSignalEmaWindow})`}
            mode="macd"
            macd={data.macd}
            macdSignal={data.macdSignal}
            onOpenSettings={onOpenSettings}
          />
        </>
      ) : null}
    </section>
  );
}
