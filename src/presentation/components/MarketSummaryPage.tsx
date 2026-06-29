import { useState, type FormEvent, type PointerEvent } from 'react';
import type { MarketSummaryDateRange } from '../../application/loadMarketSummary';
import {
  createDateAxisTicks,
  createPaddedValueAxis,
  getPriceChangeTone,
  type MarketSummaryData,
  type MarketIndexPoint,
  type MarketOhlcPoint,
  type Sp500IndexPoint,
  type TreasuryYieldPoint,
  type VolatilityIndexPoint,
} from '../../domain/stock';
import {
  findNearestChartPointerIndex,
  shouldClearTooltipOnPointerEnd,
  shouldClearTooltipOnPointerLeave,
} from '../chartTooltipInteraction';
import { formatCompact, formatDateLabel, formatNumber, formatSignedNumber } from '../format';
import { FearGreedGauge } from './FearGreedGauge';

type MarketSummaryPageProps = {
  data: MarketSummaryData | null;
  dateRange: MarketSummaryDateRange;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
  onDateRangeChange: (dateRange: MarketSummaryDateRange) => void;
};

const LINE_WIDTH = 900;
const LINE_HEIGHT = 220;
const LINE_PADDING = { top: 14, right: 104, bottom: 24, left: 28 };
const CANDLE_WIDTH = 900;
const CANDLE_HEIGHT = 260;
const CANDLE_PADDING = { top: 22, right: 112, bottom: 32, left: 28 };
const VOLUME_CHART_WIDTH = 900;
const VOLUME_CHART_HEIGHT = 260;
const VOLUME_CHART_PADDING = { top: 22, right: 92, bottom: 32, left: 58 };
const SUMMARY_TOOLTIP_WIDTH = 168;
const SUMMARY_TOOLTIP_HEIGHT = 110;
const SUMMARY_TOOLTIP_SCALE = 2;
const TREASURY_TOOLTIP_SCALE = 1;

export function MarketSummaryPage({
  data,
  dateRange,
  isLoading,
  error,
  onRefresh,
  onDateRangeChange,
}: MarketSummaryPageProps) {
  const latestVix = data?.vix.at(-1);
  const latestKoreaYield = data?.korea10YearTreasuryYield.at(-1);
  const latestUsYield = data?.us10YearTreasuryYield.at(-1);
  const latestSp500 = data?.sp500.at(-1);
  const latestVkospi = data?.vkospi.at(-1);
  const latestUsdKrw = data?.usdKrwExchangeRate.at(-1);
  const latestKospi = data?.kospi.at(-1);
  const latestKosdaq = data?.kosdaq.at(-1);
  const sharedDateAxisDates = data ? getSharedSummaryDateAxisDates(data) : undefined;

  return (
    <section className="summary-page" aria-label="시장 요약">
      <header className="summary-header">
        <div>
          <h1>Summary</h1>
          <p>{data ? `${formatDateLabel(data.startDate)} - ${formatDateLabel(data.endDate)}` : '최근 한 달 시장 지표'}</p>
        </div>
        <form
          className="summary-date-form"
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            onRefresh();
          }}
        >
          <label>
            시작일
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(event) => onDateRangeChange({ ...dateRange, startDate: event.target.value })}
            />
          </label>
          <label>
            종료일
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(event) => onDateRangeChange({ ...dateRange, endDate: event.target.value })}
            />
          </label>
          <button type="submit" disabled={isLoading}>
            {isLoading ? '조회 중' : '조회'}
          </button>
          <button type="button" onClick={onRefresh} disabled={isLoading}>
            새로고침
          </button>
        </form>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      {isLoading && !data ? (
        <div className="chart-state" role="status" aria-live="polite">
          <span className="loading-spinner" aria-hidden />
          <span>시장 요약 데이터를 불러오는 중입니다.</span>
        </div>
      ) : null}

      {data ? (
        <>
          {isLoading ? (
            <div className="subtle-loading summary-loading" role="status" aria-live="polite">
              <span className="loading-spinner small" aria-hidden />
              <span>갱신 중</span>
            </div>
          ) : null}

          <div className="summary-overview">
            <article className="summary-gauge-card" aria-label="공포탐욕지수">
              <h2>공포탐욕지수</h2>
              <FearGreedGauge index={data.fearAndGreed} />
            </article>
            <div className="summary-metrics">
              <SummaryMetric title="VIX Index" value={latestVix ? latestVix.value.toFixed(2) : '-'} />
              <SummaryMetric title="VKOSPI" value={latestVkospi ? latestVkospi.closePrice.toFixed(2) : '-'} detail={latestVkospi ? formatMarketIndexChange(latestVkospi) : undefined} tone={latestVkospi ? getPriceChangeTone(latestVkospi.priceDiffRate) : undefined} />
              <SummaryMetric title="S&P 500" value={latestSp500 ? formatNumber(latestSp500.closePrice) : '-'} />
              <SummaryMetric title="USD/KRW" value={latestUsdKrw ? formatNumber(latestUsdKrw.closePrice) : '-'} />
              <SummaryMetric title="KOSPI" value={latestKospi ? formatNumber(latestKospi.closePrice) : '-'} detail={latestKospi ? formatMarketIndexChange(latestKospi) : undefined} tone={latestKospi ? getPriceChangeTone(latestKospi.priceDiffRate) : undefined} />
              <SummaryMetric title="KOSDAQ" value={latestKosdaq ? formatNumber(latestKosdaq.closePrice) : '-'} detail={latestKosdaq ? formatMarketIndexChange(latestKosdaq) : undefined} tone={latestKosdaq ? getPriceChangeTone(latestKosdaq.priceDiffRate) : undefined} />
              <SummaryMetric title="한국 10년 국채 수익률" value={latestKoreaYield ? `${latestKoreaYield.yieldRate.toFixed(2)}%` : '-'} />
              <SummaryMetric title="미국 10년 국채 수익률" value={latestUsYield ? `${latestUsYield.yieldRate.toFixed(2)}%` : '-'} />
            </div>
          </div>

          <div className="summary-chart-grid">
            <MarketLineChart
              title="VIX Index"
              points={data.vix}
              xAxisDates={sharedDateAxisDates}
              getValue={(point) => point.value}
              formatValue={(value) => value.toFixed(2)}
              color="#1f9aa8"
            />
            <MarketCandlestickChart title="VKOSPI" points={data.vkospi} xAxisDates={sharedDateAxisDates} formatValue={(value) => value.toFixed(2)} />
            <Sp500CandlestickChart points={data.sp500} xAxisDates={sharedDateAxisDates} />
            <MarketCandlestickChart title="USD/KRW" points={data.usdKrwExchangeRate} xAxisDates={sharedDateAxisDates} formatValue={formatNumber} />
            <MarketIndexVolumeChart title="KOSPI" points={data.kospi} xAxisDates={sharedDateAxisDates} color="#d9284c" />
            <MarketIndexVolumeChart title="KOSDAQ" points={data.kosdaq} xAxisDates={sharedDateAxisDates} color="#3574d4" />
            <TreasuryYieldChart
              korea={data.korea10YearTreasuryYield}
              us={data.us10YearTreasuryYield}
            />
          </div>
        </>
      ) : null}
    </section>
  );
}

function getSharedSummaryDateAxisDates(data: MarketSummaryData): string[] | undefined {
  const dateSources = [data.vkospi, data.usdKrwExchangeRate, data.kospi, data.kosdaq, data.sp500];
  return dateSources.find((points) => points.length > 0)?.map((point) => point.date);
}

function SummaryMetric({
  title,
  value,
  detail,
  tone = 'neutral',
}: {
  title: string;
  value: string;
  detail?: string;
  tone?: 'up' | 'down' | 'neutral';
}) {
  return (
    <article className="summary-metric-card">
      <span>{title}</span>
      <strong>{value}</strong>
      {detail ? <small className={`summary-metric-detail ${tone}`}>{detail}</small> : null}
    </article>
  );
}

function formatMarketIndexChange(point: Pick<MarketIndexPoint | VolatilityIndexPoint, 'priceDiff' | 'priceDiffRate'>) {
  return `${formatSignedNumber(point.priceDiff)} ${point.priceDiffRate >= 0 ? '+' : ''}${point.priceDiffRate.toFixed(2)}%`;
}

function MarketLineChart<TPoint extends { date: string }>({
  title,
  points,
  xAxisDates,
  getValue,
  formatValue,
  color,
}: {
  title: string;
  points: TPoint[];
  xAxisDates?: string[];
  getValue: (point: TPoint) => number;
  formatValue: (value: number) => string;
  color: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <section className="summary-chart-card">
        <SummaryChartHeader title={title} />
        <div className="chart-state compact-state">표시할 데이터가 없습니다.</div>
      </section>
    );
  }

  const values = points.map(getValue);
  const axis = createPaddedValueAxis(values, { count: 5, paddingRatio: 0.08, roundTo: 0.1 });
  const scaleY = (value: number) => {
    const ratio = (value - axis.min) / (axis.max - axis.min);
    return LINE_HEIGHT - LINE_PADDING.bottom - ratio * (LINE_HEIGHT - LINE_PADDING.top - LINE_PADDING.bottom);
  };
  const xFor = (index: number) =>
    LINE_PADDING.left + (index / Math.max(points.length - 1, 1)) * (LINE_WIDTH - LINE_PADDING.left - LINE_PADDING.right);
  const dateAxisDates = xAxisDates?.length ? xAxisDates : points.map((point) => point.date);
  const xForDateTick = (index: number) =>
    LINE_PADDING.left + (index / Math.max(dateAxisDates.length - 1, 1)) * (LINE_WIDTH - LINE_PADDING.left - LINE_PADDING.right);
  const ticks = createDateAxisTicks(dateAxisDates, 6);
  const hoveredPoint = hoverIndex === null ? null : points[hoverIndex];
  const handlePointerMove = (event: PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setHoverIndex(findNearestChartPointerIndex(event.clientX, bounds, points.length));
  };
  const handlePointerLeave = (event: PointerEvent<SVGRectElement>) => {
    if (shouldClearTooltipOnPointerLeave(event.pointerType)) {
      setHoverIndex(null);
    }
  };
  const handlePointerEnd = (event: PointerEvent<SVGRectElement>) => {
    if (shouldClearTooltipOnPointerEnd(event.pointerType)) {
      setHoverIndex(null);
    }
  };

  return (
    <section className="summary-chart-card">
      <SummaryChartHeader title={title} />
      <svg className="summary-line-chart" viewBox={`0 0 ${LINE_WIDTH} ${LINE_HEIGHT}`} role="img" aria-label={`${title} 차트`}>
        <SummaryGrid width={LINE_WIDTH} height={LINE_HEIGHT} padding={LINE_PADDING} />
        {axis.ticks.map((tick) => (
          <text key={tick} x={LINE_WIDTH - LINE_PADDING.right + 14} y={scaleY(tick) + 4} className="axis-label summary-axis-label">
            {formatValue(tick)}
          </text>
        ))}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.8"
          points={points.map((point, index) => `${xFor(index)},${scaleY(getValue(point))}`).join(' ')}
        />
        {ticks.map((tick, tickIndex) => (
          <text
            key={`${tick.date}-${tick.index}`}
            x={xForDateTick(tick.index)}
            y={LINE_HEIGHT - 8}
            textAnchor={tickIndex === 0 ? 'start' : tickIndex === ticks.length - 1 ? 'end' : 'middle'}
            className="axis-label summary-date-label"
          >
            {formatDateLabel(tick.date)}
          </text>
        ))}
        <rect
          x={LINE_PADDING.left}
          y={LINE_PADDING.top}
          width={LINE_WIDTH - LINE_PADDING.left - LINE_PADDING.right}
          height={LINE_HEIGHT - LINE_PADDING.top - LINE_PADDING.bottom}
          fill="transparent"
          onPointerDown={handlePointerMove}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerLeave}
        />
        {hoveredPoint ? (
          <SummaryValueTooltip
            x={xFor(hoverIndex ?? 0)}
            y={scaleY(getValue(hoveredPoint))}
            date={hoveredPoint.date}
            rows={[{ label: title, value: formatValue(getValue(hoveredPoint)), color }]}
            width={SUMMARY_TOOLTIP_WIDTH}
            chartWidth={LINE_WIDTH}
            chartHeight={LINE_HEIGHT}
            visualScale={SUMMARY_TOOLTIP_SCALE}
          />
        ) : null}
      </svg>
    </section>
  );
}

function MarketIndexVolumeChart({
  title,
  points,
  xAxisDates,
  color,
}: {
  title: string;
  points: MarketIndexPoint[];
  xAxisDates?: string[];
  color: string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <section className="summary-chart-card">
        <SummaryChartHeader title={title} />
        <div className="chart-state compact-state">표시할 데이터가 없습니다.</div>
      </section>
    );
  }

  const priceValues = points.map((point) => point.closePrice);
  const tradingValues = points.map((point) => point.tradingValue);
  const priceAxis = createPaddedValueAxis(priceValues, { count: 5, paddingRatio: 0.08, roundTo: 1 });
  const tradingAxis = createPaddedValueAxis(tradingValues, { count: 5, paddingRatio: 0.12, includeZero: true });
  const chartLeft = VOLUME_CHART_PADDING.left;
  const chartRight = VOLUME_CHART_WIDTH - VOLUME_CHART_PADDING.right;
  const chartTop = VOLUME_CHART_PADDING.top;
  const chartBottom = VOLUME_CHART_HEIGHT - VOLUME_CHART_PADDING.bottom;
  const scalePriceY = (value: number) => {
    const ratio = (value - priceAxis.min) / (priceAxis.max - priceAxis.min);
    return chartBottom - ratio * (chartBottom - chartTop);
  };
  const scaleTradingY = (value: number) => {
    const ratio = (value - tradingAxis.min) / (tradingAxis.max - tradingAxis.min);
    return chartBottom - ratio * (chartBottom - chartTop);
  };
  const xFor = (index: number) => chartLeft + (index / Math.max(points.length - 1, 1)) * (chartRight - chartLeft);
  const barWidth = Math.max(5, Math.min(18, (chartRight - chartLeft) / points.length / 1.4));
  const dateAxisDates = xAxisDates?.length ? xAxisDates : points.map((point) => point.date);
  const xForDateTick = (index: number) => chartLeft + (index / Math.max(dateAxisDates.length - 1, 1)) * (chartRight - chartLeft);
  const ticks = createDateAxisTicks(dateAxisDates, 6);
  const hoveredPoint = hoverIndex === null ? null : points[hoverIndex];
  const handlePointerMove = (event: PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setHoverIndex(findNearestChartPointerIndex(event.clientX, bounds, points.length));
  };
  const handlePointerLeave = (event: PointerEvent<SVGRectElement>) => {
    if (shouldClearTooltipOnPointerLeave(event.pointerType)) {
      setHoverIndex(null);
    }
  };
  const handlePointerEnd = (event: PointerEvent<SVGRectElement>) => {
    if (shouldClearTooltipOnPointerEnd(event.pointerType)) {
      setHoverIndex(null);
    }
  };

  return (
    <section className="summary-chart-card">
      <SummaryChartHeader title={title} />
      <div className="summary-legend-row volume-legend-row">
        <span style={{ color }}>● 지수</span>
        <span className="gold-text">■ 거래대금</span>
      </div>
      <svg className="summary-candle-chart" viewBox={`0 0 ${VOLUME_CHART_WIDTH} ${VOLUME_CHART_HEIGHT}`} role="img" aria-label={`${title} 지수와 거래대금 차트`}>
        <SummaryGrid width={VOLUME_CHART_WIDTH} height={VOLUME_CHART_HEIGHT} padding={VOLUME_CHART_PADDING} />
        {priceAxis.ticks.map((tick) => (
          <text key={`price-${tick}`} x={VOLUME_CHART_PADDING.left - 12} y={scalePriceY(tick) + 4} textAnchor="end" className="axis-label summary-axis-label">
            {formatNumber(tick)}
          </text>
        ))}
        {tradingAxis.ticks.map((tick) => (
          <text key={`trading-${tick}`} x={VOLUME_CHART_WIDTH - VOLUME_CHART_PADDING.right + 14} y={scaleTradingY(tick) + 4} className="axis-label summary-axis-label summary-volume-axis-label">
            {formatCompact(tick)}
          </text>
        ))}
        {points.map((point, index) => {
          const x = xFor(index);
          const y = scaleTradingY(point.tradingValue);
          return (
            <rect
              key={`${point.date}-volume`}
              x={x - barWidth / 2}
              y={y}
              width={barWidth}
              height={chartBottom - y}
              fill="#e3ad28"
              opacity="0.36"
              rx="2"
            />
          );
        })}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="2.8"
          points={points.map((point, index) => `${xFor(index)},${scalePriceY(point.closePrice)}`).join(' ')}
        />
        {ticks.map((tick, tickIndex) => (
          <text
            key={`${tick.date}-${tick.index}`}
            x={xForDateTick(tick.index)}
            y={VOLUME_CHART_HEIGHT - 8}
            textAnchor={tickIndex === 0 ? 'start' : tickIndex === ticks.length - 1 ? 'end' : 'middle'}
            className="axis-label summary-date-label"
          >
            {formatDateLabel(tick.date)}
          </text>
        ))}
        <rect
          x={chartLeft}
          y={chartTop}
          width={chartRight - chartLeft}
          height={chartBottom - chartTop}
          fill="transparent"
          onPointerDown={handlePointerMove}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerLeave}
        />
        {hoveredPoint ? (
          <SummaryValueTooltip
            x={xFor(hoverIndex ?? 0)}
            y={scalePriceY(hoveredPoint.closePrice)}
            date={hoveredPoint.date}
            rows={[
              { label: '종가', value: formatNumber(hoveredPoint.closePrice), color },
              { label: '등락', value: formatMarketIndexChange(hoveredPoint), color: getPriceChangeTone(hoveredPoint.priceDiffRate) === 'up' ? '#d9284c' : '#3574d4' },
              { label: '거래량', value: formatCompact(hoveredPoint.volume), color: '#7b8088' },
              { label: '거래대금', value: formatCompact(hoveredPoint.tradingValue), color: '#c58b24' },
            ]}
            width={190}
            chartWidth={VOLUME_CHART_WIDTH}
            chartHeight={VOLUME_CHART_HEIGHT}
            visualScale={SUMMARY_TOOLTIP_SCALE}
          />
        ) : null}
      </svg>
    </section>
  );
}

function MarketCandlestickChart({
  title,
  points,
  xAxisDates,
  formatValue,
}: {
  title: string;
  points: MarketOhlcPoint[];
  xAxisDates?: string[];
  formatValue: (value: number) => string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <section className="summary-chart-card">
        <SummaryChartHeader title={title} />
        <div className="chart-state compact-state">표시할 데이터가 없습니다.</div>
      </section>
    );
  }

  const values = points.flatMap((point) => [point.highPrice, point.lowPrice]);
  const axis = createPaddedValueAxis(values, { count: 5, paddingRatio: 0.08, roundTo: 0.1 });
  const scaleY = (value: number) => {
    const ratio = (value - axis.min) / (axis.max - axis.min);
    return CANDLE_HEIGHT - CANDLE_PADDING.bottom - ratio * (CANDLE_HEIGHT - CANDLE_PADDING.top - CANDLE_PADDING.bottom);
  };
  const xFor = (index: number) =>
    CANDLE_PADDING.left + (index / Math.max(points.length - 1, 1)) * (CANDLE_WIDTH - CANDLE_PADDING.left - CANDLE_PADDING.right);
  const candleWidth = Math.max(6, Math.min(18, (CANDLE_WIDTH - CANDLE_PADDING.left - CANDLE_PADDING.right) / points.length / 1.2));
  const dateAxisDates = xAxisDates?.length ? xAxisDates : points.map((point) => point.date);
  const xForDateTick = (index: number) =>
    CANDLE_PADDING.left + (index / Math.max(dateAxisDates.length - 1, 1)) * (CANDLE_WIDTH - CANDLE_PADDING.left - CANDLE_PADDING.right);
  const ticks = createDateAxisTicks(dateAxisDates, 6);
  const hoveredPoint = hoverIndex === null ? null : points[hoverIndex];
  const handlePointerMove = (event: PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setHoverIndex(findNearestChartPointerIndex(event.clientX, bounds, points.length));
  };
  const handlePointerLeave = (event: PointerEvent<SVGRectElement>) => {
    if (shouldClearTooltipOnPointerLeave(event.pointerType)) {
      setHoverIndex(null);
    }
  };
  const handlePointerEnd = (event: PointerEvent<SVGRectElement>) => {
    if (shouldClearTooltipOnPointerEnd(event.pointerType)) {
      setHoverIndex(null);
    }
  };

  return (
    <section className="summary-chart-card">
      <SummaryChartHeader title={title} />
      <svg className="summary-candle-chart" viewBox={`0 0 ${CANDLE_WIDTH} ${CANDLE_HEIGHT}`} role="img" aria-label={`${title} 캔들 차트`}>
        <SummaryGrid width={CANDLE_WIDTH} height={CANDLE_HEIGHT} padding={CANDLE_PADDING} />
        {axis.ticks.map((tick) => (
          <text key={tick} x={CANDLE_WIDTH - CANDLE_PADDING.right + 14} y={scaleY(tick) + 5} className="axis-label summary-axis-label">
            {formatValue(tick)}
          </text>
        ))}
        {points.map((point, index) => {
          const x = xFor(index);
          const isUp = point.closePrice >= point.openPrice;
          const color = isUp ? '#d9284c' : '#3574d4';
          const bodyTop = scaleY(Math.max(point.openPrice, point.closePrice));
          const bodyBottom = scaleY(Math.min(point.openPrice, point.closePrice));
          const bodyHeight = Math.max(3, bodyBottom - bodyTop);
          return (
            <g key={`${point.date}-${index}`}>
              <line x1={x} x2={x} y1={scaleY(point.highPrice)} y2={scaleY(point.lowPrice)} stroke={color} strokeWidth="2" />
              <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={color} rx="1" />
            </g>
          );
        })}
        {ticks.map((tick, tickIndex) => (
          <text
            key={`${tick.date}-${tick.index}`}
            x={xForDateTick(tick.index)}
            y={CANDLE_HEIGHT - 8}
            textAnchor={tickIndex === 0 ? 'start' : tickIndex === ticks.length - 1 ? 'end' : 'middle'}
            className="axis-label summary-date-label"
          >
            {formatDateLabel(tick.date)}
          </text>
        ))}
        <rect
          x={CANDLE_PADDING.left}
          y={CANDLE_PADDING.top}
          width={CANDLE_WIDTH - CANDLE_PADDING.left - CANDLE_PADDING.right}
          height={CANDLE_HEIGHT - CANDLE_PADDING.top - CANDLE_PADDING.bottom}
          fill="transparent"
          onPointerDown={handlePointerMove}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerLeave}
        />
        {hoveredPoint ? (
          <SummaryValueTooltip
            x={xFor(hoverIndex ?? 0)}
            y={scaleY(hoveredPoint.closePrice)}
            date={hoveredPoint.date}
            rows={[
              { label: '종가', value: formatValue(hoveredPoint.closePrice), color: '#16191e' },
              { label: '시가', value: formatValue(hoveredPoint.openPrice), color: '#7b8088' },
              { label: '고가', value: formatValue(hoveredPoint.highPrice), color: '#d9284c' },
              { label: '저가', value: formatValue(hoveredPoint.lowPrice), color: '#3574d4' },
            ]}
            width={SUMMARY_TOOLTIP_WIDTH}
            chartWidth={CANDLE_WIDTH}
            chartHeight={CANDLE_HEIGHT}
            visualScale={SUMMARY_TOOLTIP_SCALE}
          />
        ) : null}
      </svg>
    </section>
  );
}

function TreasuryYieldChart({ korea, us }: { korea: TreasuryYieldPoint[]; us: TreasuryYieldPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const values = [...korea, ...us].map((point) => point.yieldRate);
  if (values.length === 0) {
    return (
      <section className="summary-chart-card wide-chart-card">
        <SummaryChartHeader title="국채 10년 수익률" />
        <div className="chart-state compact-state">표시할 데이터가 없습니다.</div>
      </section>
    );
  }

  const axis = createPaddedValueAxis(values, { count: 5, paddingRatio: 0.08, roundTo: 0.1 });
  const scaleY = (value: number) => {
    const ratio = (value - axis.min) / (axis.max - axis.min);
    return LINE_HEIGHT - LINE_PADDING.bottom - ratio * (LINE_HEIGHT - LINE_PADDING.top - LINE_PADDING.bottom);
  };
  const dates = korea.length >= us.length ? korea.map((point) => point.date) : us.map((point) => point.date);
  const xFor = (index: number, length: number) =>
    LINE_PADDING.left + (index / Math.max(length - 1, 1)) * (LINE_WIDTH - LINE_PADDING.left - LINE_PADDING.right);
  const ticks = createDateAxisTicks(dates, 6);
  const koreaByDate = new Map(korea.map((point) => [point.date, point]));
  const usByDate = new Map(us.map((point) => [point.date, point]));
  const hoveredDate = hoverIndex === null ? null : dates[hoverIndex];
  const hoveredKorea = hoveredDate ? koreaByDate.get(hoveredDate) : null;
  const hoveredUs = hoveredDate ? usByDate.get(hoveredDate) : null;
  const hoveredValues = [hoveredKorea?.yieldRate, hoveredUs?.yieldRate].filter((value): value is number => typeof value === 'number');
  const tooltipY = hoveredValues.length
    ? scaleY(hoveredValues.reduce((sum, value) => sum + value, 0) / hoveredValues.length)
    : LINE_PADDING.top;
  const handlePointerMove = (event: PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setHoverIndex(findNearestChartPointerIndex(event.clientX, bounds, dates.length));
  };
  const handlePointerLeave = (event: PointerEvent<SVGRectElement>) => {
    if (shouldClearTooltipOnPointerLeave(event.pointerType)) {
      setHoverIndex(null);
    }
  };
  const handlePointerEnd = (event: PointerEvent<SVGRectElement>) => {
    if (shouldClearTooltipOnPointerEnd(event.pointerType)) {
      setHoverIndex(null);
    }
  };

  return (
    <section className="summary-chart-card wide-chart-card">
      <SummaryChartHeader title="국채 10년 수익률" />
      <div className="summary-legend-row">
        <span className="legend-button red-text">● 한국 10년</span>
        <span className="legend-button blue-text">● 미국 10년</span>
      </div>
      <svg className="summary-line-chart" viewBox={`0 0 ${LINE_WIDTH} ${LINE_HEIGHT}`} role="img" aria-label="국채 10년 수익률 차트">
        <SummaryGrid width={LINE_WIDTH} height={LINE_HEIGHT} padding={LINE_PADDING} />
        {axis.ticks.map((tick) => (
          <text key={tick} x={LINE_WIDTH - LINE_PADDING.right + 14} y={scaleY(tick) + 4} className="axis-label summary-axis-label">
            {tick.toFixed(1)}%
          </text>
        ))}
        <polyline
          fill="none"
          stroke="#d9284c"
          strokeWidth="2.8"
          points={korea.map((point, index) => `${xFor(index, korea.length)},${scaleY(point.yieldRate)}`).join(' ')}
        />
        <polyline
          fill="none"
          stroke="#3574d4"
          strokeWidth="2.8"
          points={us.map((point, index) => `${xFor(index, us.length)},${scaleY(point.yieldRate)}`).join(' ')}
        />
        {ticks.map((tick, tickIndex) => (
          <text
            key={`${tick.date}-${tick.index}`}
            x={xFor(tick.index, dates.length)}
            y={LINE_HEIGHT - 8}
            textAnchor={tickIndex === 0 ? 'start' : tickIndex === ticks.length - 1 ? 'end' : 'middle'}
            className="axis-label summary-date-label"
          >
            {formatDateLabel(tick.date)}
          </text>
        ))}
        <rect
          x={LINE_PADDING.left}
          y={LINE_PADDING.top}
          width={LINE_WIDTH - LINE_PADDING.left - LINE_PADDING.right}
          height={LINE_HEIGHT - LINE_PADDING.top - LINE_PADDING.bottom}
          fill="transparent"
          onPointerDown={handlePointerMove}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerLeave}
        />
        {hoveredDate ? (
          <SummaryValueTooltip
            x={xFor(hoverIndex ?? 0, dates.length)}
            y={tooltipY}
            date={hoveredDate}
            rows={[
              ...(hoveredKorea ? [{ label: '한국 10년', value: `${hoveredKorea.yieldRate.toFixed(2)}%`, color: '#d9284c' }] : []),
              ...(hoveredUs ? [{ label: '미국 10년', value: `${hoveredUs.yieldRate.toFixed(2)}%`, color: '#3574d4' }] : []),
            ]}
            width={SUMMARY_TOOLTIP_WIDTH}
            chartWidth={LINE_WIDTH}
            chartHeight={LINE_HEIGHT}
            visualScale={TREASURY_TOOLTIP_SCALE}
          />
        ) : null}
      </svg>
    </section>
  );
}

function Sp500CandlestickChart({ points, xAxisDates }: { points: Sp500IndexPoint[]; xAxisDates?: string[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (points.length === 0) {
    return (
      <section className="summary-chart-card">
        <SummaryChartHeader title="S&P 500" />
        <div className="chart-state compact-state">표시할 S&P 500 데이터가 없습니다.</div>
      </section>
    );
  }

  const values = points.flatMap((point) => [point.highPrice, point.lowPrice]);
  const axis = createPaddedValueAxis(values, { count: 5, paddingRatio: 0.08, roundTo: 10 });
  const scaleY = (value: number) => {
    const ratio = (value - axis.min) / (axis.max - axis.min);
    return CANDLE_HEIGHT - CANDLE_PADDING.bottom - ratio * (CANDLE_HEIGHT - CANDLE_PADDING.top - CANDLE_PADDING.bottom);
  };
  const xFor = (index: number) =>
    CANDLE_PADDING.left + (index / Math.max(points.length - 1, 1)) * (CANDLE_WIDTH - CANDLE_PADDING.left - CANDLE_PADDING.right);
  const candleWidth = Math.max(6, Math.min(18, (CANDLE_WIDTH - CANDLE_PADDING.left - CANDLE_PADDING.right) / points.length / 1.2));
  const dateAxisDates = xAxisDates?.length ? xAxisDates : points.map((point) => point.date);
  const xForDateTick = (index: number) =>
    CANDLE_PADDING.left + (index / Math.max(dateAxisDates.length - 1, 1)) * (CANDLE_WIDTH - CANDLE_PADDING.left - CANDLE_PADDING.right);
  const ticks = createDateAxisTicks(dateAxisDates, 6);
  const hoveredPoint = hoverIndex === null ? null : points[hoverIndex];
  const handlePointerMove = (event: PointerEvent<SVGRectElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    setHoverIndex(findNearestChartPointerIndex(event.clientX, bounds, points.length));
  };
  const handlePointerLeave = (event: PointerEvent<SVGRectElement>) => {
    if (shouldClearTooltipOnPointerLeave(event.pointerType)) {
      setHoverIndex(null);
    }
  };
  const handlePointerEnd = (event: PointerEvent<SVGRectElement>) => {
    if (shouldClearTooltipOnPointerEnd(event.pointerType)) {
      setHoverIndex(null);
    }
  };

  return (
    <section className="summary-chart-card">
      <SummaryChartHeader title="S&P 500" />
      <svg className="summary-candle-chart" viewBox={`0 0 ${CANDLE_WIDTH} ${CANDLE_HEIGHT}`} role="img" aria-label="S&P 500 캔들 차트">
        <SummaryGrid width={CANDLE_WIDTH} height={CANDLE_HEIGHT} padding={CANDLE_PADDING} />
        {axis.ticks.map((tick) => (
          <text key={tick} x={CANDLE_WIDTH - CANDLE_PADDING.right + 14} y={scaleY(tick) + 5} className="axis-label summary-axis-label">
            {formatNumber(tick)}
          </text>
        ))}
        {points.map((point, index) => {
          const x = xFor(index);
          const isUp = point.closePrice >= point.openPrice;
          const color = isUp ? '#ef4055' : '#4f7ee8';
          const bodyTop = scaleY(Math.max(point.openPrice, point.closePrice));
          const bodyBottom = scaleY(Math.min(point.openPrice, point.closePrice));
          const bodyHeight = Math.max(3, bodyBottom - bodyTop);
          return (
            <g key={`${point.date}-${index}`}>
              <line x1={x} x2={x} y1={scaleY(point.highPrice)} y2={scaleY(point.lowPrice)} stroke={color} strokeWidth="2" />
              <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={color} rx="1" />
            </g>
          );
        })}
        {ticks.map((tick, tickIndex) => (
          <text
            key={`${tick.date}-${tick.index}`}
            x={xForDateTick(tick.index)}
            y={CANDLE_HEIGHT - 8}
            textAnchor={tickIndex === 0 ? 'start' : tickIndex === ticks.length - 1 ? 'end' : 'middle'}
            className="axis-label summary-date-label"
          >
            {formatDateLabel(tick.date)}
          </text>
        ))}
        <rect
          x={CANDLE_PADDING.left}
          y={CANDLE_PADDING.top}
          width={CANDLE_WIDTH - CANDLE_PADDING.left - CANDLE_PADDING.right}
          height={CANDLE_HEIGHT - CANDLE_PADDING.top - CANDLE_PADDING.bottom}
          fill="transparent"
          onPointerDown={handlePointerMove}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerLeave}
        />
        {hoveredPoint ? (
          <SummaryValueTooltip
            x={xFor(hoverIndex ?? 0)}
            y={scaleY(hoveredPoint.closePrice)}
            date={hoveredPoint.date}
            rows={[
              { label: '종가', value: formatNumber(hoveredPoint.closePrice), color: '#16191e' },
              { label: '시가', value: formatNumber(hoveredPoint.openPrice), color: '#7b8088' },
              { label: '고가', value: formatNumber(hoveredPoint.highPrice), color: '#ef4055' },
              { label: '저가', value: formatNumber(hoveredPoint.lowPrice), color: '#4f7ee8' },
            ]}
            width={SUMMARY_TOOLTIP_WIDTH}
            chartWidth={CANDLE_WIDTH}
            chartHeight={CANDLE_HEIGHT}
            visualScale={SUMMARY_TOOLTIP_SCALE}
          />
        ) : null}
      </svg>
    </section>
  );
}

function SummaryChartHeader({ title, meta }: { title: string; meta?: string }) {
  return (
    <div className="summary-chart-header">
      <h2>{title}</h2>
      {meta ? <span>{meta}</span> : null}
    </div>
  );
}

function SummaryValueTooltip({
  x,
  y,
  date,
  rows,
  width,
  chartWidth,
  chartHeight,
  visualScale = 1,
}: {
  x: number;
  y: number;
  date: string;
  rows: { label: string; value: string; color: string }[];
  width: number;
  chartWidth: number;
  chartHeight: number;
  visualScale?: number;
}) {
  const scaledWidth = width * visualScale;
  const scaledHeight = Math.min(SUMMARY_TOOLTIP_HEIGHT * visualScale, chartHeight - 16);
  const rowHeight = 18 * visualScale;
  const inset = 10 * visualScale;
  const preferredX = x > chartWidth / 2 ? x - scaledWidth - 12 : x + 12;
  const tooltipX = clamp(preferredX, 8, Math.max(8, chartWidth - scaledWidth - 8));
  const tooltipY = clamp(y - scaledHeight / 2, 8, Math.max(8, chartHeight - scaledHeight - 8));

  return (
    <g className="summary-chart-tooltip" pointerEvents="none">
      <line x1={x} x2={x} y1="0" y2={chartHeight} stroke="#111827" strokeDasharray="4 4" opacity="0.26" />
      <g transform={`translate(${tooltipX} ${tooltipY})`}>
        <rect width={scaledWidth} height={scaledHeight} rx={6 * visualScale} fill="#111827" opacity="0.94" />
        <text x={inset} y={18 * visualScale} fill="#d1d5db" fontSize={12 * visualScale} fontWeight="800">
          {formatDateLabel(date)}
        </text>
        {rows.map((row, index) => (
          <text
            key={`${row.label}-${index}`}
            x={inset}
            y={38 * visualScale + index * rowHeight}
            fill="#fff"
            fontSize={13 * visualScale}
            fontWeight="850"
          >
            <tspan fill={row.color}>●</tspan>
            <tspan dx={6 * visualScale}>{row.label}</tspan>
            <tspan dx={8 * visualScale}>{row.value}</tspan>
          </text>
        ))}
      </g>
    </g>
  );
}

function SummaryGrid({
  width,
  height,
  padding,
}: {
  width: number;
  height: number;
  padding: { top: number; right: number; bottom: number; left: number };
}) {
  return (
    <g aria-hidden="true">
      {[0, 1, 2, 3, 4].map((line) => {
        const y = padding.top + (line / 4) * (height - padding.top - padding.bottom);
        return <line key={`h-${line}`} x1="0" x2={width} y1={y} y2={y} stroke="#eeeeee" strokeWidth="1" />;
      })}
      {[0, 1, 2, 3].map((line) => {
        const x = padding.left + (line / 3) * (width - padding.left - padding.right);
        return <line key={`v-${line}`} x1={x} x2={x} y1="0" y2={height} stroke="#f0f0f0" strokeWidth="1" />;
      })}
    </g>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
