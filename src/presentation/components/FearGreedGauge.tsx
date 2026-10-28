import type { FearAndGreedIndex } from '../../domain/stock';
import { chartPalette } from '../chartPalette';

type FearGreedGaugeProps = {
  index?: FearAndGreedIndex | null;
};

const WIDTH = 450;
const HEIGHT = 260;
const CENTER_X = 225;
const CENTER_Y = 200;
const RADIUS = 165;
const STROKE_WIDTH = 18;

const SEGMENTS = [
  { from: 0, to: 20, label: 'Extreme Fear', color: chartPalette.fearExtreme, labelX: 0, labelY: 194, textAnchor: 'start' as const },
  { from: 20, to: 40, label: 'Fear', color: chartPalette.fear, labelX: 94, labelY: 75, textAnchor: 'end' as const },
  { from: 40, to: 60, label: 'Neutral', color: chartPalette.neutral, labelX: CENTER_X, labelY: 13, textAnchor: 'middle' as const },
  { from: 60, to: 80, label: 'Greed', color: chartPalette.greed, labelX: 356, labelY: 75, textAnchor: 'start' as const },
  { from: 80, to: 100, label: 'Extreme Greed', color: chartPalette.greedExtreme, labelX: WIDTH, labelY: 194, textAnchor: 'end' as const },
];

export function FearGreedGauge({ index }: FearGreedGaugeProps) {
  const value = clamp(index?.value ?? 0, 0, 100);
  const condition = index ? formatCondition(index.condition) : '-';
  const pointer = polarToCartesian(CENTER_X, CENTER_Y, RADIUS - 16, valueToAngle(value));

  return (
    <section className="fear-greed-gauge" aria-label="공포탐욕지수 게이지">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`공포탐욕지수 ${index ? value.toFixed(0) : '-'}`}>
        {SEGMENTS.map((segment) => (
          <path
            key={segment.label}
            d={describeArc(CENTER_X, CENTER_Y, RADIUS, valueToAngle(segment.from), valueToAngle(segment.to))}
            fill="none"
            stroke={segment.color}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="butt"
          />
        ))}
        {SEGMENTS.map((segment) => (
          <GaugeLabel key={`${segment.label}-label`} segment={segment} />
        ))}
        <line
          x1={CENTER_X}
          y1={CENTER_Y}
          x2={pointer.x}
          y2={pointer.y}
          stroke={chartPalette.textPrimary}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx={CENTER_X} cy={CENTER_Y} r="8" fill={chartPalette.textPrimary} />
        <text x={CENTER_X} y={CENTER_Y - 45} className="gauge-value" textAnchor="middle">
          {index ? value.toFixed(0) : '-'}
        </text>
        <text x={CENTER_X} y={CENTER_Y - 22} className="gauge-condition" textAnchor="middle" paintOrder="stroke">
          {condition}
        </text>
      </svg>
    </section>
  );
}

function GaugeLabel({ segment }: { segment: (typeof SEGMENTS)[number] }) {
  const words = segment.label.split(' ');

  return (
    <text x={segment.labelX} y={segment.labelY} className="gauge-edge-label" textAnchor={segment.textAnchor}>
      {words.map((word, index) => (
        <tspan key={word} x={segment.labelX} dy={index === 0 ? 0 : 14}>
          {word}
        </tspan>
      ))}
    </text>
  );
}

function formatCondition(condition: string): string {
  return condition
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((word) => `${word[0]?.toUpperCase() ?? ''}${word.slice(1)}`)
    .join(' ');
}

function valueToAngle(value: number): number {
  return 180 - (clamp(value, 0, 100) / 100) * 180;
}

function describeArc(cx: number, cy: number, radius: number, startAngle: number, endAngle: number): string {
  const start = polarToCartesian(cx, cy, radius, startAngle);
  const end = polarToCartesian(cx, cy, radius, endAngle);
  const largeArcFlag = Math.abs(endAngle - startAngle) <= 180 ? '0' : '1';

  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`;
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDegrees: number) {
  const angleRadians = (angleDegrees * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRadians),
    y: cy - radius * Math.sin(angleRadians),
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
