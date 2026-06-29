import { useState, type PointerEvent } from 'react';
import {
  createDateAxisTicks,
  createPaddedValueAxis,
  type VixIndexPoint,
} from '../../domain/stock';
import {
  findNearestSvgChartPointerIndex,
  shouldClearTooltipOnPointerEnd,
  shouldClearTooltipOnPointerLeave,
} from '../chartTooltipInteraction';
import { formatDateLabel } from '../format';

type VixChartProps = {
  points: VixIndexPoint[] | undefined;
  isLoading: boolean;
  showDateAxis?: boolean;
};

const WIDTH = 900;
const HEIGHT = 260;
const PADDING = { top: 34, right: 128, bottom: 36, left: 30 };

export function VixChart({ points, isLoading, showDateAxis = false }: VixChartProps) {
  const data = points ?? [];
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <section className="vix-panel" aria-labelledby="vix-panel-title">
        <div className="vix-panel-header">
          <h2 id="vix-panel-title">VIX 지표</h2>
          <span>{isLoading ? '조회 중' : '0건'}</span>
        </div>
        <div className="chart-state compact-state">{isLoading ? 'VIX 지표를 불러오는 중입니다.' : '표시할 VIX 데이터가 없습니다.'}</div>
      </section>
    );
  }

  const values = data.map((point) => point.value);
  const axis = createPaddedValueAxis(values, {
    count: 5,
    paddingRatio: 0.14,
    roundTo: 1,
  });
  const scale = (value: number) => {
    const ratio = (value - axis.min) / (axis.max - axis.min);
    return HEIGHT - PADDING.bottom - ratio * (HEIGHT - PADDING.top - PADDING.bottom);
  };
  const xFor = (index: number) =>
    PADDING.left + (index / Math.max(data.length - 1, 1)) * (WIDTH - PADDING.left - PADDING.right);
  const latest = data.at(-1);
  const hoveredPoint = hoverIndex === null ? null : data[hoverIndex];
  const dateTicks = createDateAxisTicks(data.map((point) => point.date), 6);

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    setHoverIndex(findNearestSvgChartPointerIndex(event.clientX, bounds, WIDTH, data.length, PADDING.left, WIDTH - PADDING.left - PADDING.right));
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
    <section className="vix-panel" aria-labelledby="vix-panel-title">
      <div className="vix-panel-header">
        <h2 id="vix-panel-title">VIX 지표</h2>
        <span>{isLoading ? '조회 중' : `${data.length}건`}</span>
      </div>
      <div className="chart-block vix-block">
        <div className="legend-row compact">
          <span className="legend-button teal-text">● VIX</span>
        </div>
        <svg
          className="vix-chart"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          role="img"
          aria-label="VIX 지표 차트"
          onPointerDown={handlePointerMove}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
          onPointerLeave={handlePointerLeave}
        >
          {[0, 1, 2, 3, 4].map((line) => {
            const y = PADDING.top + (line / 4) * (HEIGHT - PADDING.top - PADDING.bottom);
            return <line key={line} x1="0" x2={WIDTH} y1={y} y2={y} stroke="#eeeeee" strokeWidth="1" />;
          })}
          {axis.ticks.map((tick) => (
            <text key={tick} x={WIDTH - PADDING.right + 16} y={scale(tick) + 4} className="axis-label indicator-axis-label">
              {tick.toFixed(0)}
            </text>
          ))}
          <polyline
            fill="none"
            stroke="#1f9aa8"
            strokeWidth="2.5"
            points={data.map((point, index) => `${xFor(index)},${scale(point.value)}`).join(' ')}
          />
          {data.map((point, index) => (
            <circle key={`${point.date}-${index}`} cx={xFor(index)} cy={scale(point.value)} r="3" fill="#1f9aa8" />
          ))}
          {latest ? (
            <g transform={`translate(${WIDTH - PADDING.right + 12} ${clamp(scale(latest.value) - 18, PADDING.top, HEIGHT - PADDING.bottom - 36)})`}>
              <path d="M0 18 L12 0 H76 A5 5 0 0 1 81 5 V31 A5 5 0 0 1 76 36 H12 Z" fill="#1f9aa8" />
              <text x="22" y="23" fill="#fff" fontSize="16" fontWeight="800">
                {latest.value.toFixed(2)}
              </text>
            </g>
          ) : null}
          {hoveredPoint && hoverIndex !== null ? (
            <VixTooltip point={hoveredPoint} x={xFor(hoverIndex)} y={scale(hoveredPoint.value)} />
          ) : null}
          {showDateAxis
            ? dateTicks.map((tick, tickIndex) => (
                <text
                  key={`${tick.date}-${tick.index}`}
                  x={xFor(tick.index)}
                  y={HEIGHT - 6}
                  textAnchor={tickIndex === 0 ? 'start' : tickIndex === dateTicks.length - 1 ? 'end' : 'middle'}
                  className="axis-label"
                >
                  {formatDateLabel(tick.date)}
                </text>
              ))
            : null}
        </svg>
      </div>
    </section>
  );
}

function VixTooltip({ point, x, y }: { point: VixIndexPoint; x: number; y: number }) {
  const tooltipWidth = 142;
  const tooltipHeight = 62;
  const tooltipX = clamp(x + 12, PADDING.left, WIDTH - PADDING.right - tooltipWidth);
  const tooltipY = clamp(y - tooltipHeight / 2, PADDING.top, HEIGHT - PADDING.bottom - tooltipHeight);

  return (
    <g className="chart-tooltip">
      <line x1={x} x2={x} y1={PADDING.top} y2={HEIGHT - PADDING.bottom} stroke="#1f2937" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx={x} cy={y} r="4" fill="#111827" stroke="#ffffff" strokeWidth="2" />
      <g transform={`translate(${tooltipX} ${tooltipY})`}>
        <rect width={tooltipWidth} height={tooltipHeight} rx="6" fill="#111827" opacity="0.94" />
        <text x="10" y="22" fill="#ffffff" fontSize="13" fontWeight="800">
          {formatDateLabel(point.date)}
        </text>
        <text x="10" y="44" fill="#d1d5db" fontSize="12">
          VIX {point.value.toFixed(2)}
        </text>
      </g>
    </g>
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
