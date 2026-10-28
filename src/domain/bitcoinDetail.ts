import type { BitcoinCandle, BitcoinOrderbook, BitcoinTrade } from './bitcoin';

export type BitcoinPeriodStatistics = {
  highPrice: number;
  lowPrice: number;
  returnRate: number;
  accumulatedTradeVolume: number;
};

export type BitcoinOrderbookSpread = {
  bestAsk: number;
  bestBid: number;
  spread: number;
  spreadRate: number;
};

export function resolveBitcoinHoverIndex(index: number | null, candleCount: number): number | null {
  return index !== null && Number.isInteger(index) && index >= 0 && index < candleCount ? index : null;
}

export function getBitcoinOrderbookMaxSize(sizes: number[]): number {
  const largest = Math.max(0, ...sizes);
  return largest || 1;
}

export function calculateBitcoinMovingAverage(values: number[], window: number): Array<number | null> {
  if (window < 1 || !Number.isInteger(window)) return values.map(() => null);
  return values.map((_, index) => {
    if (index < window - 1) return null;
    let sum = 0;
    for (let cursor = index - window + 1; cursor <= index; cursor += 1) sum += values[cursor];
    return sum / window;
  });
}

export function calculateBitcoinPeriodStatistics(candles: BitcoinCandle[]): BitcoinPeriodStatistics | null {
  if (candles.length === 0) return null;
  const first = candles[0];
  const last = candles.at(-1)!;
  return {
    highPrice: Math.max(...candles.map((candle) => candle.highPrice)),
    lowPrice: Math.min(...candles.map((candle) => candle.lowPrice)),
    returnRate: first.openingPrice === 0 ? 0 : (last.tradePrice - first.openingPrice) / first.openingPrice,
    accumulatedTradeVolume: candles.reduce((sum, candle) => sum + candle.accumulatedTradeVolume, 0),
  };
}

export function getBitcoinOrderbookSpread(book: BitcoinOrderbook): BitcoinOrderbookSpread | null {
  const first = book.units[0];
  if (!first || first.bidPrice === 0) return null;
  const spread = first.askPrice - first.bidPrice;
  return {
    bestAsk: first.askPrice,
    bestBid: first.bidPrice,
    spread,
    spreadRate: spread / first.bidPrice,
  };
}

export function getBitcoinTradeKst(trade: BitcoinTrade): { date: string; time: string } {
  if (trade.tradeDateKst && trade.tradeTimeKst) {
    return { date: trade.tradeDateKst, time: trade.tradeTimeKst };
  }

  const date = normalizeDate(trade.tradeDateUtc);
  const time = normalizeTime(trade.tradeTimeUtc);
  const timestamp = Date.parse(`${date}T${time}Z`);
  if (!Number.isFinite(timestamp)) return { date: trade.tradeDateUtc, time: trade.tradeTimeUtc };

  const kst = new Date(timestamp + 9 * 60 * 60 * 1000).toISOString();
  return { date: kst.slice(0, 10), time: kst.slice(11, 19) };
}

function normalizeDate(value: string): string {
  if (/^\d{8}$/.test(value)) return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`;
  return value;
}

function normalizeTime(value: string): string {
  const normalized = value.replaceAll(':', '');
  if (/^\d{6}$/.test(normalized)) return `${normalized.slice(0, 2)}:${normalized.slice(2, 4)}:${normalized.slice(4, 6)}`;
  return value;
}
