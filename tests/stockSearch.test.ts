import assert from 'node:assert/strict';
import { test } from 'node:test';
import { filterStockOptions, resolveStockSearchInput, resolveStockSearchSelection } from '../src/presentation/stockSearch.ts';

const stocks = [
  { marketName: 'KOSPI', code: '005930', name: '삼성전자', department: '전기전자' },
  { marketName: 'KOSPI', code: '009150', name: '삼성전기', department: '전기전자' },
  { marketName: 'KOSDAQ', code: '035720', name: '카카오', department: '서비스' },
];

test('filterStockOptions returns the full stock list when the search input is empty', () => {
  assert.deepEqual(filterStockOptions(stocks, ''), stocks);
});

test('filterStockOptions narrows the stock list by Korean name or code', () => {
  assert.deepEqual(filterStockOptions(stocks, '삼성'), [stocks[0], stocks[1]]);
  assert.deepEqual(filterStockOptions(stocks, '009'), [stocks[1]]);
});

test('resolveStockSearchInput turns a selected stock name into its code', () => {
  assert.equal(resolveStockSearchInput(stocks, '삼성전자'), '005930');
});

test('resolveStockSearchSelection keeps the stock name as the visible search input', () => {
  assert.deepEqual(resolveStockSearchSelection(stocks, '삼성전자'), {
    code: '005930',
    displayInput: '삼성전자',
  });
});

test('resolveStockSearchInput keeps an unmatched input as a trimmed code', () => {
  assert.equal(resolveStockSearchInput(stocks, ' 005930 '), '005930');
});
