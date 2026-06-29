import { findNearestDataIndex } from '../domain/stock';

type ChartBounds = {
  left: number;
  width: number;
};

export function shouldClearTooltipOnPointerLeave(pointerType: string) {
  return pointerType === 'mouse' || pointerType === 'touch' || pointerType === 'pen';
}

export function shouldClearTooltipOnPointerEnd(pointerType: string) {
  return pointerType !== 'mouse';
}

export function findNearestChartPointerIndex(clientX: number, bounds: ChartBounds, dataLength: number) {
  const ratio = clamp((clientX - bounds.left) / bounds.width, 0, 1);
  return Math.round(ratio * Math.max(dataLength - 1, 0));
}

export function findNearestSvgChartPointerIndex(
  clientX: number,
  bounds: ChartBounds,
  viewBoxWidth: number,
  dataLength: number,
  chartLeft: number,
  chartWidth: number,
) {
  const svgX = ((clientX - bounds.left) / bounds.width) * viewBoxWidth;
  return findNearestDataIndex(svgX, dataLength, chartLeft, chartWidth);
}

export function placeTooltipAwayFromPointer(
  pointerX: number,
  tooltipWidth: number,
  chartWidth: number,
  chartLeft: number,
  chartRightPadding: number,
  gap: number,
) {
  const chartRight = chartWidth - chartRightPadding;
  const midpoint = chartLeft + (chartRight - chartLeft) / 2;
  const preferredX = pointerX > midpoint ? pointerX - tooltipWidth - gap : pointerX + gap;
  return clamp(preferredX, chartLeft, chartRight - tooltipWidth);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
