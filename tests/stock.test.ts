import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createPaddedValueAxis,
  createMacdValueAxis,
  createDateAxisTicks,
  createDefaultQuery,
  createMagnitudeAxisStep,
  createRsiReferenceLines,
  createValueAxisTicks,
  findNearestDataIndex,
  findPriceExtremes,
  getPriceChangeTone,
  type DailyPrice,
} from '../src/domain/stock.ts';

test('createDefaultQuery sets the date range from one month ago through today', () => {
  const query = createDefaultQuery(new Date(2026, 4, 16));

  assert.equal(query.market, 'J');
  assert.equal(query.startDate, '2026-04-16');
  assert.equal(query.endDate, '2026-05-16');
});

test('findPriceExtremes returns high and low labels with current-price percent differences', () => {
  const prices: DailyPrice[] = [
    makePrice('20260509', 68000, 72000),
    makePrice('20260510', 65000, 70000),
    makePrice('20260511', 69000, 76000),
  ];

  const extremes = findPriceExtremes(prices, 70000);

  assert.deepEqual(extremes.low, {
    date: '20260510',
    value: 65000,
    percentDiff: -7.142857142857142,
  });
  assert.deepEqual(extremes.high, {
    date: '20260511',
    value: 76000,
    percentDiff: 8.571428571428571,
  });
});

test('findNearestDataIndex clamps pointer x into the available chart range', () => {
  assert.equal(findNearestDataIndex(30, 4, 30, 816), 0);
  assert.equal(findNearestDataIndex(292, 4, 30, 816), 1);
  assert.equal(findNearestDataIndex(999, 4, 30, 816), 3);
});

test('createDateAxisTicks returns evenly spaced first, middle, and last dates', () => {
  const dates = Array.from({ length: 31 }, (_, index) => `202605${String(index + 1).padStart(2, '0')}`);

  assert.deepEqual(createDateAxisTicks(dates, 6), [
    { date: '20260501', index: 0 },
    { date: '20260507', index: 6 },
    { date: '20260513', index: 12 },
    { date: '20260519', index: 18 },
    { date: '20260525', index: 24 },
    { date: '20260531', index: 30 },
  ]);
});

test('createValueAxisTicks keeps exact maximum and minimum values on the axis', () => {
  assert.deepEqual(createValueAxisTicks(192400, 202500, 5, 100), [202500, 200000, 197500, 194900, 192400]);
});

test('createPaddedValueAxis rounds price ticks to thousands when requested', () => {
  const axis = createPaddedValueAxis([192400, 202500], {
    count: 5,
    paddingRatio: 0.08,
    roundTo: 1000,
  });

  assert.deepEqual(axis.ticks, [203000, 200000, 198000, 195000, 192000]);
});

test('createMacdValueAxis keeps zero visible without forcing a symmetric domain', () => {
  const axis = createMacdValueAxis([-0.2, 2]);

  assert.equal(axis.min > -1, true);
  assert.equal(axis.max > 2, true);
  assert.equal(axis.min < 0, true);
  assert.equal(axis.max > 0, true);
});

test('createMagnitudeAxisStep uses the max value magnitude for indicator tick units', () => {
  assert.equal(createMagnitudeAxisStep(8.2), 1);
  assert.equal(createMagnitudeAxisStep(18.4), 10);
  assert.equal(createMagnitudeAxisStep(180), 100);
  assert.equal(createMagnitudeAxisStep(1200), 1000);
});

test('createPaddedValueAxis can round RSI ticks to tens', () => {
  const axis = createPaddedValueAxis([42.4, 76.1], {
    count: 5,
    paddingRatio: 0.12,
    roundTo: 10,
  });

  assert.deepEqual(axis.ticks, [80, 70, 60, 50, 40]);
});

test('createPaddedValueAxis removes rounded ticks outside the visible chart domain', () => {
  const rsiAxis = createPaddedValueAxis([57.1, 82.3], {
    count: 5,
    paddingRatio: 0.12,
    roundTo: 10,
  });
  const macdAxis = createMacdValueAxis([-1.6, 2.2]);

  assert.deepEqual(rsiAxis.ticks, [80, 70, 60]);
  assert.deepEqual(macdAxis.ticks, [2, 1, -1, -2]);
});

test('createRsiReferenceLines returns only visible 30 and 70 guide lines', () => {
  assert.deepEqual(createRsiReferenceLines(42, 76), [70]);
  assert.deepEqual(createRsiReferenceLines(22, 74), [30, 70]);
  assert.deepEqual(createRsiReferenceLines(42, 58), []);
});

test('getPriceChangeTone maps negative quote rates to blue and positive rates to red', () => {
  assert.equal(getPriceChangeTone(-1.25), 'down');
  assert.equal(getPriceChangeTone(0), 'up');
  assert.equal(getPriceChangeTone(2.5), 'up');
});

function makePrice(date: string, lowPrice: number, highPrice: number): DailyPrice {
  return {
    date,
    openPrice: lowPrice,
    highPrice,
    lowPrice,
    closePrice: highPrice,
    accumulatedVolume: 0,
    accumulatedTradingValue: 0,
    priceDiff: 0,
    priceDiffSign: '',
    changeFlag: '',
  };
}
