import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const cssPath = new URL('../src/presentation/styles.css', import.meta.url);

test('chart SVGs allow vertical page scrolling on touch devices', async () => {
  const css = await readFile(cssPath, 'utf8');

  assert.match(css, /\.price-chart,\n\.indicator-chart\s*{[^}]*touch-action: pan-y;/);
  assert.match(css, /\.vix-chart\s*{[^}]*touch-action: pan-y;/);
  assert.match(css, /\.summary-line-chart,\n\.summary-candle-chart\s*{[^}]*touch-action: pan-y;/);
});
