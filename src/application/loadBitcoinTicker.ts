import type { BitcoinRepository, BitcoinTicker } from '../domain/bitcoin';

export async function loadBitcoinTicker(repository: BitcoinRepository, market: string): Promise<BitcoinTicker> {
  const tickers = await repository.getTicker([market]);
  const ticker = tickers.find((item) => item.market === market);
  if (!ticker) throw new Error('선택한 코인의 시세 정보를 찾을 수 없습니다.');
  return ticker;
}
