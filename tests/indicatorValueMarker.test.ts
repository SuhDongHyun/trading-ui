import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getIndicatorValueMarkerLayout } from '../src/presentation/indicatorValueMarker.ts';

const baseInput = {
  valueY: 80,
  axisLabelYs: [],
  axisLabelHeight: 18,
  markerX: 784,
  svgWidth: 900,
  markerHeight: 36,
  minY: -16,
  maxY: 110,
};

test('indicator value marker expands for long values and stays inside the SVG', () => {
  assert.equal(getIndicatorValueMarkerLayout({ ...baseInput, valueText: '40.23' }).width, 83);
  assert.equal(getIndicatorValueMarkerLayout({ ...baseInput, valueText: '-10,488.09' }).width, 114);
  assert.equal(getIndicatorValueMarkerLayout({ ...baseInput, valueText: '-123,456,789.00' }).width, 116);
});

test('indicator value marker stays at the value and hides overlapping axis labels', () => {
  const layout = getIndicatorValueMarkerLayout({
    ...baseInput,
    valueText: '40.23',
    valueY: 100,
    axisLabelYs: [40, 90, 125],
  });

  assert.equal(layout.y, 82);
  assert.deepEqual(layout.hiddenAxisLabelIndexes, [1, 2]);
});
