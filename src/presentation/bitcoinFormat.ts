export function decimalsFor(price: number, quote: string): number {
  if (quote === 'BTC') return 8;
  const absolute = Math.abs(price);
  if (quote === 'USDT') return absolute >= 100 ? 2 : absolute >= 1 ? 3 : absolute >= 0.01 ? 5 : 8;
  return absolute >= 100 ? 0 : absolute >= 1 ? 2 : absolute >= 0.01 ? 4 : 6;
}

export function formatBitcoinNumber(value: number, digits = 0): string {
  return value.toLocaleString('ko-KR', { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

export function formatBitcoinPrice(price: number, quote: string): string {
  return formatBitcoinNumber(price, decimalsFor(price, quote));
}

export function formatBitcoinSignedPrice(value: number, quote: string): string {
  const formatted = formatBitcoinPrice(Math.abs(value), quote);
  return value > 0 ? `+${formatted}` : value < 0 ? `-${formatted}` : formatted;
}

export function formatBitcoinRate(rate: number): string {
  const percent = rate * 100;
  return `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`;
}

export function formatBitcoinAmount(value: number, quote: string): string {
  if (quote === 'KRW') {
    if (value >= 1e12) return `${formatBitcoinNumber(value / 1e12, 2)}조`;
    if (value >= 1e8) return `${formatBitcoinNumber(Math.round(value / 1e8))}억`;
    return `${formatBitcoinNumber(Math.round(value / 1e6))}백만`;
  }
  if (quote === 'BTC') return formatBitcoinNumber(value, value >= 10 ? 2 : 3);
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
}

export function formatBitcoinVolume(value: number): string {
  const absolute = Math.abs(value);
  const digits = absolute >= 1e6 ? 0 : absolute >= 1000 ? 2 : absolute >= 1 ? 4 : 8;
  return formatBitcoinNumber(value, digits);
}

export function formatBitcoinTradeTime(date: string, time: string): string {
  const normalizedDate = date.replaceAll('-', '');
  const normalizedTime = time.replaceAll(':', '');
  if (normalizedDate.length < 8 || normalizedTime.length < 6) return `${date} ${time}`;
  return `${normalizedDate.slice(0, 4)}.${normalizedDate.slice(4, 6)}.${normalizedDate.slice(6, 8)} ${normalizedTime.slice(0, 2)}:${normalizedTime.slice(2, 4)}:${normalizedTime.slice(4, 6)}`;
}

export function formatBitcoinDate(date: string): string {
  return date.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1.$2.$3');
}

export function bitcoinDirection(value: number): 'up' | 'down' | 'even' {
  return value > 0 ? 'up' : value < 0 ? 'down' : 'even';
}
