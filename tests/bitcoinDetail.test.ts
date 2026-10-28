import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { BitcoinCandle, BitcoinOrderbook, BitcoinTrade } from '../src/domain/bitcoin.ts';
import {
  calculateBitcoinMovingAverage,
  calculateBitcoinPeriodStatistics,
  getBitcoinOrderbookMaxSize,
  getBitcoinOrderbookSpread,
  getBitcoinTradeKst,
  resolveBitcoinHoverIndex,
} from '../src/domain/bitcoinDetail.ts';

test('Bitcoin moving averages and period statistics use candle closes and volumes', () => {
  const candles: BitcoinCandle[] = [
    { market: 'KRW-BTC', dateTimeKst: '2026-10-27T09:00:00', openingPrice: 100, highPrice: 120, lowPrice: 90, tradePrice: 110, accumulatedTradeVolume: 2 },
    { market: 'KRW-BTC', dateTimeKst: '2026-10-28T09:00:00', openingPrice: 110, highPrice: 130, lowPrice: 105, tradePrice: 125, accumulatedTradeVolume: 3 },
  ];

  assert.deepEqual(calculateBitcoinMovingAverage([1, 3, 5, 7], 3), [null, null, 3, 5]);
  assert.deepEqual(calculateBitcoinMovingAverage([1, 3], 0), [null, null]);
  assert.deepEqual(calculateBitcoinPeriodStatistics(candles), {
    highPrice: 130,
    lowPrice: 90,
    returnRate: 0.25,
    accumulatedTradeVolume: 5,
  });
  assert.equal(calculateBitcoinPeriodStatistics([]), null);
});

test('Bitcoin orderbook spread and UTC trade time conversion handle KST day rollover', () => {
  const book: BitcoinOrderbook = {
    market: 'KRW-BTC', timestamp: 1, totalAskSize: 2, totalBidSize: 3, level: 0,
    units: [{ askPrice: 101, askSize: 1, bidPrice: 99, bidSize: 2 }],
  };
  const trade: BitcoinTrade = {
    market: 'KRW-BTC', tradeDateUtc: '2026-10-28', tradeTimeUtc: '23:30:05', timestamp: 1,
    tradePrice: 100, tradeVolume: 1, previousClosingPrice: 90, changePrice: 10, side: 'BID', sequentialId: 1,
  };

  assert.deepEqual(getBitcoinOrderbookSpread(book), { bestAsk: 101, bestBid: 99, spread: 2, spreadRate: 2 / 99 });
  assert.deepEqual(getBitcoinTradeKst(trade), { date: '2026-10-29', time: '08:30:05' });
  assert.deepEqual(getBitcoinTradeKst({ ...trade, tradeDateKst: '20261029', tradeTimeKst: '083005' }), { date: '20261029', time: '083005' });
});

test('Bitcoin chart hover index rejects values outside the current candle range', () => {
  assert.equal(resolveBitcoinHoverIndex(2, 3), 2);
  assert.equal(resolveBitcoinHoverIndex(3, 3), null);
  assert.equal(resolveBitcoinHoverIndex(-1, 3), null);
  assert.equal(resolveBitcoinHoverIndex(1.5, 3), null);
  assert.equal(resolveBitcoinHoverIndex(null, 3), null);
});

test('Bitcoin orderbook size bars scale to the largest fractional size', () => {
  assert.equal(getBitcoinOrderbookMaxSize([0.624, 0.4, 0.02]), 0.624);
  assert.equal(getBitcoinOrderbookMaxSize([0, 0]), 1);
  assert.equal(getBitcoinOrderbookMaxSize([]), 1);
});
