import { useState, type PointerEvent } from 'react';
import {
  createDateAxisTicks,
  createMacdValueAxis,
  createPaddedValueAxis,
  createRsiReferenceLines,
} from '../../domain/stock';
import type { MacdPoint, MacdSignalPoint, RsiPoint, RsiSignalPoint } from '../../domain/stock';
import {
  findNearestSvgChartPointerIndex,
  placeTooltipAwayFromPointer,
  shouldClearTooltipOnPointerEnd,
  shouldClearTooltipOnPointerLeave,
} from '../chartTooltipInteraction';
import { formatDateLabel, formatNumber } from '../format';

type IndicatorPanelProps = {
  title: string;
  secondaryTitle?: string;
  mode: 'rsi' | 'macd';
  rsi?: RsiPoint[];
  rsiSignal?: RsiSignalPoint[];
  macd?: MacdPoint[];
  macdSignal?: MacdSignalPoint[];
  showDateAxis?: boolean;
  onOpenSettings: () => void;
};

const WIDTH = 900;
const HEIGHT = 170;
const PADDING = { top: 24, right: 128, bottom: 24, left: 30 };
const VALUE_MARKER_HEIGHT = 36;

export function IndicatorPanel({
  title,
  secondaryTitle,
  mode,
  rsi = [],
  rsiSignal = [],
  macd = [],
  macdSignal = [],
  showDateAxis = false,
  onOpenSettings,
}: IndicatorPanelProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const primary = mode === 'rsi' ? rsi.map((point) => ({ date: point.date, value: point.rsi })) : macd.map((point) => ({ date: point.date, value: point.macd }));
  const secondary =
    mode === 'rsi'
      ? rsiSignal.map((point) => ({ date: point.date, value: point.rsiEma, signal: point.signal }))
      : macdSignal.map((point) => ({ date: point.date, value: point.macdEma, signal: point.signal }));
  const values = [...primary.map((point) => point.value), ...secondary.map((point) => point.value)];
  const { scale, ticks, referenceLines } = createScale(values, mode);
  const xFor = (index: number, length: number) =>
    PADDING.left + (index / Math.max(length - 1, 1)) * (WIDTH - PADDING.left - PADDING.right);
  const latest = primary.at(-1);
  const hoveredPoint = hoverIndex === null ? null : primary[hoverIndex];
  const hoveredSecondary = hoveredPoint ? secondary.find((point) => point.date === hoveredPoint.date) : undefined;
  const dateTicks = createDateAxisTicks(primary.map((point) => point.date), 6);

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (primary.length === 0) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    setHoverIndex(findNearestSvgChartPointerIndex(event.clientX, bounds, WIDTH, primary.length, PADDING.left, WIDTH - PADDING.left - PADDING.right));
  }

  function handlePointerLeave(event: PointerEvent<SVGSVGElement>) {
    if (shouldClearTooltipOnPointerLeave(event.pointerType)) {
      setHoverIndex(null);
    }
  }

  function handlePointerEnd(event: PointerEvent<SVGSVGElement>) {
    if (shouldClearTooltipOnPointerEnd(event.pointerType)) {
      setHoverIndex(null);
    }
  }

  return (
    <div className="chart-block indicator-block">
      <div className="legend-row compact">
        <button type="button" className="legend-button orange" onClick={onOpenSettings}>
          ● {title}
        </button>
        {secondaryTitle ? (
          <button type="button" className="legend-button blue-text" onClick={onOpenSettings}>
            ● {secondaryTitle}
          </button>
        ) : null}
      </div>
      <svg
        className="indicator-chart"
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`${title} 차트`}
        onPointerDown={handlePointerMove}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onPointerLeave={handlePointerLeave}
      >
        <line x1="0" x2={WIDTH} y1={PADDING.top} y2={PADDING.top} stroke="#f0f0f0" />
        <line x1="0" x2={WIDTH} y1={HEIGHT - PADDING.bottom} y2={HEIGHT - PADDING.bottom} stroke="#eeeeee" />
        <ValueAxis ticks={ticks} scale={scale} mode={mode} />
        {mode === 'rsi'
          ? referenceLines.map((value) => (
              <line
                key={value}
                x1={PADDING.left}
                x2={WIDTH - PADDING.right}
                y1={scale(value)}
                y2={scale(value)}
                stroke="#999999"
                strokeWidth="1"
              />
            ))
          : null}
        {mode === 'macd' ? (
          <line
            x1={PADDING.left}
            x2={WIDTH - PADDING.right}
            y1={scale(0)}
            y2={scale(0)}
            stroke="#bbbbbb"
            strokeWidth="1"
          />
        ) : null}
        <polyline
          fill="none"
          stroke="#cc725d"
          strokeWidth="2"
          points={primary.map((point, index) => `${xFor(index, primary.length)},${scale(point.value)}`).join(' ')}
        />
        {secondary.length > 0 ? (
          <polyline
            fill="none"
            stroke="#77a6bd"
            strokeWidth="2"
            points={secondary.map((point, index) => `${xFor(index, secondary.length)},${scale(point.value)}`).join(' ')}
          />
        ) : null}
        {secondary.map((point) => {
          const primaryIndex = primary.findIndex((primaryPoint) => primaryPoint.date === point.date);
          const primaryPoint = primaryIndex >= 0 ? primary[primaryIndex] : null;
          return primaryPoint && (point.signal === 'buy' || point.signal === 'sell') ? (
            <SignalMarker
              key={`${point.date}-${point.signal}`}
              x={xFor(primaryIndex, primary.length)}
              y={scale(primaryPoint.value)}
              signal={point.signal}
            />
          ) : null;
        })}
        {latest ? (
          <g transform={`translate(${WIDTH - PADDING.right + 12} ${clamp(scale(latest.value) - 18, PADDING.top, HEIGHT - PADDING.bottom - VALUE_MARKER_HEIGHT)})`}>
            <path d="M0 18 L12 0 H78 A5 5 0 0 1 83 5 V31 A5 5 0 0 1 78 36 H12 Z" fill="#ff5b2e" />
            <text x="22" y="23" fill="#fff" fontSize="16" fontWeight="800">
              {formatIndicatorValue(latest.value, mode)}
            </text>
          </g>
        ) : null}
        {hoveredPoint && hoverIndex !== null ? (
          <IndicatorTooltip
            title={title}
            secondaryTitle={secondaryTitle}
            primary={hoveredPoint}
            secondary={hoveredSecondary}
            x={xFor(hoverIndex, primary.length)}
            y={scale(hoveredPoint.value)}
            mode={mode}
          />
        ) : null}
        {showDateAxis && dateTicks.length > 0 ? (
          <>
            {dateTicks.map((tick, tickIndex) => (
              <text
                key={`${tick.date}-${tick.index}`}
                x={xFor(tick.index, primary.length)}
                y={HEIGHT - 5}
                textAnchor={tickIndex === 0 ? 'start' : tickIndex === dateTicks.length - 1 ? 'end' : 'middle'}
                className="axis-label"
              >
                {formatDateLabel(tick.date)}
              </text>
            ))}
          </>
        ) : null}
      </svg>
    </div>
  );
}

function SignalMarker({ x, y, signal }: { x: number; y: number; signal: 'buy' | 'sell' | string }) {
  const isBuy = signal === 'buy';
  const color = isBuy ? '#ef4055' : '#4f7ee8';
  const points = isBuy
    ? `${x},${y - 10} ${x - 7},${y + 4} ${x + 7},${y + 4}`
    : `${x},${y + 10} ${x - 7},${y - 4} ${x + 7},${y - 4}`;

  return <polygon points={points} fill={color} stroke="#ffffff" strokeWidth="1.5" />;
}

function ValueAxis({
  ticks,
  scale,
  mode,
}: {
  ticks: number[];
  scale: (value: number) => number;
  mode: 'rsi' | 'macd';
}) {
  return (
    <g aria-hidden="true">
      {ticks.map((tick) => (
        <text key={tick} x={WIDTH - PADDING.right + 16} y={scale(tick) + 4} className="axis-label indicator-axis-label">
          {mode === 'rsi' ? tick.toFixed(0) : formatIndicatorValue(tick, mode)}
        </text>
      ))}
    </g>
  );
}

function IndicatorTooltip({
  title,
  secondaryTitle,
  primary,
  secondary,
  x,
  y,
  mode,
}: {
  title: string;
  secondaryTitle?: string;
  primary: { date: string; value: number };
  secondary?: { date: string; value: number; signal: string };
  x: number;
  y: number;
  mode: 'rsi' | 'macd';
}) {
  const tooltipWidth = 156;
  const tooltipHeight = secondary ? 82 : 64;
  const tooltipX = placeTooltipAwayFromPointer(x, tooltipWidth, WIDTH, PADDING.left, PADDING.right, 12);
  const tooltipY = clamp(y - tooltipHeight / 2, PADDING.top, HEIGHT - PADDING.bottom - tooltipHeight);
  return (
    <g className="chart-tooltip">
      <line x1={x} x2={x} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} stroke="#1f2937" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx={x} cy={y} r="4" fill="#111827" stroke="#ffffff" strokeWidth="2" />
      <g transform={`translate(${tooltipX} ${tooltipY})`}>
        <rect width={tooltipWidth} height={tooltipHeight} rx="6" fill="#111827" opacity="0.94" />
        <text x="10" y="20" fill="#ffffff" fontSize="13" fontWeight="800">
          {formatDateLabel(primary.date)}
        </text>
        <text x="10" y="42" fill="#d1d5db" fontSize="12">
          {title} {formatIndicatorValue(primary.value, mode)}
        </text>
        {secondary ? (
          <text x="10" y="62" fill="#d1d5db" fontSize="12">
            {secondaryTitle} {formatIndicatorValue(secondary.value, mode)}
          </text>
        ) : null}
      </g>
    </g>
  );
}

function formatIndicatorValue(value: number, mode: 'rsi' | 'macd') {
  return mode === 'rsi' ? value.toFixed(2) : value.toLocaleString('ko-KR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function createScale(values: number[], mode: 'rsi' | 'macd') {
  const axis =
    mode === 'macd'
      ? createMacdValueAxis(values)
      : createPaddedValueAxis(values, {
          count: 5,
          paddingRatio: 0.12,
          roundTo: 10,
        });
  const rawMin = values.length > 0 ? Math.min(...values) : axis.min;
  const rawMax = values.length > 0 ? Math.max(...values) : axis.max;
  const scale = (value: number) => {
    const ratio = (value - axis.min) / (axis.max - axis.min);
    return HEIGHT - PADDING.bottom - ratio * (HEIGHT - PADDING.top - PADDING.bottom);
  };

  return {
    scale,
    ticks: axis.ticks,
    referenceLines: mode === 'rsi' ? createRsiReferenceLines(rawMin, rawMax) : [],
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
