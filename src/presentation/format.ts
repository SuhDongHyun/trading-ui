export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatSignedNumber(value: number): string {
  return `${value >= 0 ? '' : '-'}${formatNumber(Math.abs(value))}`;
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatDateLabel(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return `${value.slice(5, 7)}.${value.slice(8, 10)}`;
  }

  if (value.length !== 8) {
    return value;
  }
  return `${value.slice(4, 6)}.${value.slice(6, 8)}`;
}

export function formatDateTimeLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
