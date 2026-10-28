export type AppPage = 'summary' | 'stock' | 'bitcoin';

export function getInitialPage(hash: string): AppPage {
  return getInitialBitcoinMarket(hash) ? 'bitcoin' : 'summary';
}

export function getInitialBitcoinMarket(hash: string): string | null {
  try {
    const market = decodeURIComponent(hash.replace(/^#/, ''));
    return ['KRW-', 'BTC-', 'USDT-'].some((prefix) => market.startsWith(prefix)) ? market : null;
  } catch {
    return null;
  }
}

export function shouldFallbackFromInvalidBitcoinHash(
  initialMarket: string | null,
  availableMarkets: string[],
  userNavigated: boolean,
): boolean {
  return Boolean(initialMarket && !userNavigated && !availableMarkets.includes(initialMarket));
}
