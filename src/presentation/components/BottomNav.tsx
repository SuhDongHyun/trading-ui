const ITEMS = ['메뉴', '홈', '관심', '현재가', '잔고', '지수'];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="하단 메뉴">
      {ITEMS.map((item) => (
        <span key={item} className={item === '현재가' ? 'active' : undefined}>
          <i aria-hidden>{iconFor(item)}</i>
          {item}
        </span>
      ))}
    </nav>
  );
}

function iconFor(item: string): string {
  switch (item) {
    case '메뉴':
      return '☰';
    case '홈':
      return '⌂';
    case '관심':
      return '♡';
    case '현재가':
      return '▰';
    case '잔고':
      return '▱';
    default:
      return '보기';
  }
}
