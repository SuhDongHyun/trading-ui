import { useState, type PointerEvent } from 'react';
import {
  findNearestDataIndex,
  findPriceExtremes,
  createPaddedValueAxis,
  getPriceChangeTone,
  type DailyPrice,
  type MovingAverageSeries,
  type PriceExtreme,
} from '../../domain/stock';
import { formatDateLabel, formatNumber } from '../format';

type PriceChartProps = {
  prices: DailyPrice[];
  currentPrice: number;
  priceDiffRate: number;
  movingAverages: MovingAverageSeries[];
  windows: number[];
  onOpenSettings: () => void;
};

const WIDTH = 900;
const HEIGHT = 430;
const PADDING = { top: 32, right: 132, bottom: 44, left: 30 };
const COLORS = ['#ef4b3d', '#b35dc0', '#5f98c5', '#8cb35d'];

export function PriceChart({ prices, currentPrice, priceDiffRate, movingAverages, windows, onOpenSettings }: PriceChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (prices.length === 0) {
    return <div className="chart-state compact-state">표시할 가격 데이터가 없습니다.</div>;
  }

  const values = [
    currentPrice,
    ...prices.flatMap((price) => [price.highPrice, price.lowPrice]),
    ...movingAverages.flatMap((series) => series.points.map((point) => point.movingAverage)),
  ];
  const { scale, ticks } = createScale(values, HEIGHT, PADDING.top, PADDING.bottom);
  const xFor = (index: number) =>
    PADDING.left + (index / Math.max(prices.length - 1, 1)) * (WIDTH - PADDING.left - PADDING.right);
  const candleWidth = Math.max(6, Math.min(20, (WIDTH - PADDING.left - PADDING.right) / prices.length / 1.15));
  const latest = prices.at(-1);
  const priceTone = getPriceChangeTone(priceDiffRate);
  const quoteColor = priceTone === 'down' ? '#4f7ee8' : '#ef4055';
  const extremes = findPriceExtremes(prices, currentPrice);
  const hoveredPrice = hoverIndex === null ? null : prices[hoverIndex];
  const chartWidth = WIDTH - PADDING.left - PADDING.right;

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const point = toSvgPoint(event, WIDTH, HEIGHT);
    setHoverIndex(findNearestDataIndex(point.x, prices.length, PADDING.left, chartWidth));
  }

  return (
    <div className="chart-block price-block">
      <div className="legend-row">
        <button type="button" className="legend-button strong" onClick={onOpenSettings}>
          가격(수정)
        </button>
        {windows.map((window, index) => (
          <button
            key={window}
            type="button"
            className="legend-button"
            style={{ color: COLORS[index % COLORS.length] }}
            onClick={onOpenSettings}
          >
            ● {window}
          </button>
        ))}
      </div>

      <svg
        className="price-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="가격 차트"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setHoverIndex(null)}
      >
        <Grid width={WIDTH} height={HEIGHT} padding={PADDING} />
        <PriceAxis ticks={ticks} scale={scale} />
        {prices.map((price, index) => {
          const x = xFor(index);
          const isUp = price.closePrice >= price.openPrice;
          const bodyTop = scale(Math.max(price.openPrice, price.closePrice));
          const bodyBottom = scale(Math.min(price.openPrice, price.closePrice));
          const bodyHeight = Math.max(3, bodyBottom - bodyTop);
          return (
            <g key={`${price.date}-${index}`}>
              <line
                x1={x}
                x2={x}
                y1={scale(price.highPrice)}
                y2={scale(price.lowPrice)}
                stroke={isUp ? '#ef4055' : '#4f7ee8'}
                strokeWidth="2"
              />
              <rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={isUp ? '#ef4055' : '#4f7ee8'}
                rx="1"
              />
            </g>
          );
        })}

        {movingAverages.map((series, index) => (
          <polyline
            key={series.window}
            fill="none"
            stroke={COLORS[index % COLORS.length]}
            strokeWidth="2"
            points={series.points
              .map((point) => {
                const priceIndex = prices.findIndex((price) => price.date === point.date);
                return priceIndex >= 0 ? `${xFor(priceIndex)},${scale(point.movingAverage)}` : '';
              })
              .filter(Boolean)
              .join(' ')}
          />
        ))}

        {extremes ? (
          <>
            <ExtremeMarker
              extreme={extremes.high}
              kind="high"
              x={xFor(prices.findIndex((price) => price.date === extremes.high.date))}
              y={scale(extremes.high.value)}
            />
            <ExtremeMarker
              extreme={extremes.low}
              kind="low"
              x={xFor(prices.findIndex((price) => price.date === extremes.low.date))}
              y={scale(extremes.low.value)}
            />
          </>
        ) : null}

        {latest ? (
          <>
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right + 10}
              y1={scale(currentPrice)}
              y2={scale(currentPrice)}
              stroke={quoteColor}
              strokeWidth="1"
              strokeDasharray="4 4"
            />
            <g transform={`translate(${WIDTH - PADDING.right + 12} ${scale(currentPrice) - 24})`}>
              <path d="M0 24 L14 0 H96 A6 6 0 0 1 102 6 V42 A6 6 0 0 1 96 48 H14 Z" fill={quoteColor} />
              <text x="24" y="21" fill="#fff" fontSize="16" fontWeight="800">
                {formatNumber(currentPrice)}
              </text>
              <text x="24" y="39" fill="#fff" fontSize="13">
                {priceDiffRate >= 0 ? '+' : ''}
                {priceDiffRate.toFixed(2)}%
              </text>
            </g>
          </>
        ) : null}

        {hoveredPrice !== null && hoverIndex !== null ? (
          <PriceTooltip
            price={hoveredPrice}
            movingAverages={movingAverages}
            windows={windows}
            x={xFor(hoverIndex)}
            y={scale(hoveredPrice.closePrice)}
          />
        ) : null}
      </svg>
    </div>
  );
}

type Padding = typeof PADDING;

function Grid({ width, height, padding }: { width: number; height: number; padding: Padding }) {
  const lines = [0, 1, 2, 3, 4];
  return (
    <g>
      {lines.map((line) => {
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

function PriceAxis({ ticks, scale }: { ticks: number[]; scale: (value: number) => number }) {
  return (
    <g aria-hidden="true">
      {ticks.map((tick) => (
        <text key={tick} x={WIDTH - PADDING.right + 16} y={scale(tick) + 5} className="axis-label price-axis-label">
          {formatNumber(tick)}
        </text>
      ))}
    </g>
  );
}

function ExtremeMarker({
  extreme,
  kind,
  x,
  y,
}: {
  extreme: PriceExtreme;
  kind: 'high' | 'low';
  x: number;
  y: number;
}) {
  const isHigh = kind === 'high';
  const color = isHigh ? '#ef4055' : '#4f7ee8';
  const labelWidth = 144;
  const labelX = clamp(x + (isHigh ? 10 : -labelWidth - 10), PADDING.left, WIDTH - PADDING.right - labelWidth);
  const labelY = clamp(y + (isHigh ? -42 : 12), PADDING.top + 4, HEIGHT - PADDING.bottom - 42);
  const percent = `${extreme.percentDiff >= 0 ? '+' : ''}${extreme.percentDiff.toFixed(2)}%`;

  return (
    <g>
      <circle cx={x} cy={y} r="4" fill={color} stroke="#ffffff" strokeWidth="2" />
      <line x1={x} x2={labelX + (isHigh ? 0 : labelWidth)} y1={y} y2={labelY + 20} stroke={color} strokeWidth="1.5" />
      <g transform={`translate(${labelX} ${labelY})`}>
        <rect width={labelWidth} height="40" rx="4" fill="#ffffff" stroke={color} strokeWidth="1.5" />
        <text x="8" y="16" fill={color} fontSize="13" fontWeight="800">
          {isHigh ? '최고' : '최저'} {formatNumber(extreme.value)}
        </text>
        <text x="8" y="32" fill="#555b64" fontSize="12" fontWeight="700">
          {formatDateLabel(extreme.date)} / {percent}
        </text>
      </g>
    </g>
  );
}

function PriceTooltip({
  price,
  movingAverages,
  windows,
  x,
  y,
}: {
  price: DailyPrice;
  movingAverages: MovingAverageSeries[];
  windows: number[];
  x: number;
  y: number;
}) {
  const tooltipWidth = 172;
  const averages = windows
    .map((window) => {
      const point = movingAverages.find((series) => series.window === window)?.points.find((item) => item.date === price.date);
      return point ? `MA${window} ${formatNumber(point.movingAverage)}` : null;
    })
    .filter(Boolean);
  const tooltipHeight = 90 + averages.length * 16;
  const tooltipX = clamp(x + 14, PADDING.left, WIDTH - PADDING.right - tooltipWidth);
  const tooltipY = clamp(y - tooltipHeight / 2, PADDING.top, HEIGHT - PADDING.bottom - tooltipHeight);

  return (
    <g className="chart-tooltip">
      <line x1={x} x2={x} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} stroke="#1f2937" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx={x} cy={y} r="4" fill="#111827" stroke="#ffffff" strokeWidth="2" />
      <g transform={`translate(${tooltipX} ${tooltipY})`}>
        <rect width={tooltipWidth} height={tooltipHeight} rx="6" fill="#111827" opacity="0.94" />
        <text x="10" y="20" fill="#ffffff" fontSize="13" fontWeight="800">
          {formatDateLabel(price.date)}
        </text>
        <text x="10" y="40" fill="#d1d5db" fontSize="12">시 {formatNumber(price.openPrice)}</text>
        <text x="92" y="40" fill="#d1d5db" fontSize="12">고 {formatNumber(price.highPrice)}</text>
        <text x="10" y="58" fill="#d1d5db" fontSize="12">저 {formatNumber(price.lowPrice)}</text>
        <text x="92" y="58" fill="#d1d5db" fontSize="12">종 {formatNumber(price.closePrice)}</text>
        <text x="10" y="78" fill="#d1d5db" fontSize="12">거래량 {formatNumber(price.accumulatedVolume)}</text>
        {averages.map((average, index) => (
          <text key={average} x="10" y={98 + index * 16} fill="#d1d5db" fontSize="12">
            {average}
          </text>
        ))}
      </g>
    </g>
  );
}

function createScale(values: number[], height: number, top: number, bottom: number) {
  const axis = createPaddedValueAxis(values, { count: 5, paddingRatio: 0.08, roundTo: 1000 });
  const scale = (value: number) => {
    const ratio = (value - axis.min) / (axis.max - axis.min);
    return height - bottom - ratio * (height - top - bottom);
  };
  return {
    scale,
    ticks: axis.ticks,
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function toSvgPoint(event: PointerEvent<SVGSVGElement>, width: number, height: number) {
  const rect = event.currentTarget.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * width,
    y: ((event.clientY - rect.top) / rect.height) * height,
  };
}
