import type { BitcoinCoin, BitcoinRepository } from '../domain/bitcoin';
import { toChosung } from '../domain/bitcoinSearch';

export async function loadBitcoinMarket(repository: BitcoinRepository): Promise<BitcoinCoin[]> {
  const [pairs, tickers] = await Promise.all([
    repository.getTradingPairs(true),
    repository.getQuoteTickers(['KRW', 'BTC', 'USDT']),
  ]);
  const tickersByMarket = new Map(tickers.map((ticker) => [ticker.market, ticker]));

  return pairs.flatMap((pair) => {
    const ticker = tickersByMarket.get(pair.market);
    return ticker ? [{ ...pair, ...ticker, chosung: toChosung(pair.koreanName) }] : [];
  });
}
