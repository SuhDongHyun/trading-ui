type IndicatorValueMarkerLayoutInput = {
  valueText: string;
  valueY: number;
  axisLabelYs: number[];
  axisLabelHeight: number;
  markerX: number;
  svgWidth: number;
  markerHeight: number;
  minY: number;
  maxY: number;
};

export function getIndicatorValueMarkerLayout({
  valueText,
  valueY,
  axisLabelYs,
  axisLabelHeight,
  markerX,
  svgWidth,
  markerHeight,
  minY,
  maxY,
}: IndicatorValueMarkerLayoutInput) {
  const maxWidth = Math.max(0, svgWidth - markerX);
  const width = Math.min(maxWidth, Math.max(83, valueText.length * 8 + 34));
  const y = clamp(valueY - markerHeight / 2, minY, maxY);
  const hiddenAxisLabelIndexes = axisLabelYs.flatMap((labelY, index) =>
    y < labelY + 4 && y + markerHeight > labelY - axisLabelHeight ? [index] : [],
  );

  return { width, y, hiddenAxisLabelIndexes };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
