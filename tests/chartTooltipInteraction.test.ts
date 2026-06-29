import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  findNearestChartPointerIndex,
  placeTooltipAwayFromPointer,
  shouldClearTooltipOnPointerLeave,
} from '../src/presentation/chartTooltipInteraction.ts';

test('shouldClearTooltipOnPointerLeave keeps touch and pen tooltips open after the pointer leaves', () => {
  assert.equal(shouldClearTooltipOnPointerLeave('mouse'), true);
  assert.equal(shouldClearTooltipOnPointerLeave('touch'), false);
  assert.equal(shouldClearTooltipOnPointerLeave('pen'), false);
});

test('findNearestChartPointerIndex maps client x into a bounded chart index', () => {
  const bounds = { left: 100, width: 300 };

  assert.equal(findNearestChartPointerIndex(100, bounds, 4), 0);
  assert.equal(findNearestChartPointerIndex(200, bounds, 4), 1);
  assert.equal(findNearestChartPointerIndex(400, bounds, 4), 3);
  assert.equal(findNearestChartPointerIndex(999, bounds, 4), 3);
});

test('placeTooltipAwayFromPointer shows right-side points on the left and left-side points on the right', () => {
  assert.equal(placeTooltipAwayFromPointer(120, 172, 900, 30, 132, 14), 134);
  assert.equal(placeTooltipAwayFromPointer(650, 172, 900, 30, 132, 14), 464);
});
