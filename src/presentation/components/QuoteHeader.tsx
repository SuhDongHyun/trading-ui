import type { Market, StockQuote } from '../../domain/stock';
import { formatNumber, formatSignedNumber } from '../format';

type QuoteHeaderProps = {
  quote?: StockQuote;
  code: string;
  market: Market;
};

const MARKET_LABELS: Record<Market, string> = {
  J: 'KRX',
  NX: 'NXT',
  UN: '통합',
};

export function QuoteHeader({ quote, code: queryCode, market }: QuoteHeaderProps) {
  const code = quote?.code ?? queryCode;
  const title = quote?.name || code;
  const marketLabel = quote?.marketName || MARKET_LABELS[market];
  const isUp = (quote?.priceDiff ?? 0) >= 0;

  return (
    <header className="quote-header">
      <div className="quote-topline">
        <div className="quote-title-group">
          <span className="back-icon" aria-hidden>
            ‹
          </span>
          <div>
            <h1>{title}</h1>
            <p>
              {code} | {marketLabel} | {quote?.industry ?? '시장 데이터'}
            </p>
          </div>
        </div>
        <div className="quote-actions">
          <span className="market-pill">{marketLabel}</span>
        </div>
      </div>

      <div className="quote-summary">
        <div>
          <strong className={isUp ? 'price up' : 'price down'}>{formatNumber(quote?.currentPrice ?? 0)}</strong>
          <span className={isUp ? 'diff up' : 'diff down'}>
            {isUp ? '▲' : '▼'} {formatSignedNumber(quote?.priceDiff ?? 0)} {quote?.priceDiffRate.toFixed(2) ?? '0.00'}%
          </span>
        </div>
        <dl>
          <div>
            <dt>거래량</dt>
            <dd>{formatNumber(quote?.currentVolume ?? 0)}주</dd>
          </div>
          <div>
            <dt>PER</dt>
            <dd>{quote?.per.toFixed(2) ?? '-'}</dd>
          </div>
          <div>
            <dt>PBR</dt>
            <dd>{quote?.pbr.toFixed(2) ?? '-'}</dd>
          </div>
        </dl>
      </div>
    </header>
  );
}
