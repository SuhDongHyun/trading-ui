import type { BitcoinCoin, BitcoinQuote } from './bitcoin';

const CHOSUNG = ['ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

export type BitcoinSortKey = 'name' | 'price' | 'rate' | 'amount';
export type BitcoinSort = { key: BitcoinSortKey; direction: 1 | -1 };

export function toChosung(text: string): string {
  return [...text]
    .map((character) => {
      const code = character.charCodeAt(0) - 0xac00;
      return code >= 0 && code < 11172 ? CHOSUNG[Math.floor(code / 588)] : character;
    })
    .join('');
}

export function isChosungQuery(query: string): boolean {
  const normalized = normalize(query);
  return normalized.length > 0 && [...normalized].every((character) => CHOSUNG.includes(character));
}

export function matchesBitcoinCoin(coin: BitcoinCoin, rawQuery: string): boolean {
  const query = normalize(rawQuery);
  if (!query) return true;
  if (isChosungQuery(query)) return normalize(coin.chosung).includes(query);

  return [coin.koreanName, coin.englishName, coin.symbol, coin.market].some((value) =>
    normalize(value).includes(query),
  );
}

export function filterBitcoinCoins(
  coins: BitcoinCoin[],
  quote: BitcoinQuote,
  query: string,
  cautionOnly: boolean,
): BitcoinCoin[] {
  return coins.filter(
    (coin) =>
      coin.quote === quote &&
      matchesBitcoinCoin(coin, query) &&
      (!cautionOnly || coin.warning || coin.cautions.length > 0),
  );
}

export function resolveBitcoinQuote(
  coins: BitcoinCoin[],
  currentQuote: BitcoinQuote,
  query: string,
  cautionOnly: boolean,
): BitcoinQuote {
  if (filterBitcoinCoins(coins, currentQuote, query, cautionOnly).length > 0) return currentQuote;
  return (['KRW', 'BTC', 'USDT'] as BitcoinQuote[]).find(
    (quote) => quote !== currentQuote && filterBitcoinCoins(coins, quote, query, cautionOnly).length > 0,
  ) ?? currentQuote;
}

export function sortBitcoinCoins(coins: BitcoinCoin[], sort: BitcoinSort): BitcoinCoin[] {
  return [...coins].sort((left, right) => {
    const comparison = sort.key === 'name'
      ? left.koreanName.localeCompare(right.koreanName, 'ko')
      : sort.key === 'price'
        ? left.tradePrice - right.tradePrice
        : sort.key === 'rate'
          ? left.signedChangeRate - right.signedChangeRate
          : left.accumulatedTradePrice24h - right.accumulatedTradePrice24h;
    return sort.direction * comparison;
  });
}

export function toBitcoinSort(key: BitcoinSortKey, current: BitcoinSort): BitcoinSort {
  if (current.key === key) return { key, direction: current.direction === 1 ? -1 : 1 };
  return { key, direction: key === 'name' ? 1 : -1 };
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().replace(/\s+/g, '');
}
