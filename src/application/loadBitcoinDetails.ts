import type {
  BitcoinCandle,
  BitcoinCandlePeriod,
  BitcoinOrderbook,
  BitcoinOrderbookInstrument,
  BitcoinRepository,
  BitcoinTrade,
} from '../domain/bitcoin';

const CANDLE_COUNTS: Record<BitcoinCandlePeriod, number> = {
  m15: 80,
  m60: 80,
  D: 90,
  W: 80,
  M: 60,
};

export async function loadBitcoinCandles(
  repository: BitcoinRepository,
  market: string,
  period: BitcoinCandlePeriod,
  signal?: AbortSignal,
): Promise<BitcoinCandle[]> {
  const candles = await repository.getCandles(market, period, CANDLE_COUNTS[period], signal);
  return candles
    .filter((candle) => candle.market === market)
    .sort((left, right) => left.dateTimeKst.localeCompare(right.dateTimeKst));
}

export async function loadBitcoinOrderbook(
  repository: BitcoinRepository,
  market: string,
  requestedLevel: string,
  signal?: AbortSignal,
): Promise<{ instrument: BitcoinOrderbookInstrument; book: BitcoinOrderbook; level: string }> {
  const instruments = await repository.getOrderbookInstruments([market], signal);
  const instrument = instruments.find((item) => item.market === market);
  if (!instrument) throw new Error('선택한 코인의 호가 정보를 찾을 수 없습니다.');

  const level = instrument.supportedLevels.includes(requestedLevel) ? requestedLevel : '0';
  const books = await repository.getOrderbook(market, level, signal);
  const book = books.find((item) => item.market === market);
  if (!book) throw new Error('선택한 코인의 호가 정보를 찾을 수 없습니다.');
  return { instrument, book, level };
}

export async function loadBitcoinTrades(
  repository: BitcoinRepository,
  market: string,
  signal?: AbortSignal,
): Promise<BitcoinTrade[]> {
  const trades = await repository.getTrades(market, 30, signal);
  return trades
    .filter((trade) => trade.market === market)
    .sort((left, right) => right.timestamp - left.timestamp);
}
