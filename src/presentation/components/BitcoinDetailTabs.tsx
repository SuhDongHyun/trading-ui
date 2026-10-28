import { useEffect, useState, type PointerEvent } from 'react';
import {
  calculateBitcoinMovingAverage,
  calculateBitcoinPeriodStatistics,
  getBitcoinOrderbookMaxSize,
  getBitcoinOrderbookSpread,
  getBitcoinTradeKst,
  resolveBitcoinHoverIndex,
} from '../../domain/bitcoinDetail';
import type {
  BitcoinCandle,
  BitcoinCandlePeriod,
  BitcoinCoin,
  BitcoinOrderbook,
  BitcoinOrderbookInstrument,
  BitcoinTicker,
  BitcoinTrade,
} from '../../domain/bitcoin';
import { bitcoinDirection, formatBitcoinAmount, formatBitcoinNumber, formatBitcoinPrice, formatBitcoinRate, formatBitcoinVolume, formatBitcoinTradeTime } from '../bitcoinFormat';
import { chartPalette } from '../chartPalette';
import { shouldClearTooltipOnPointerEnd, shouldClearTooltipOnPointerLeave } from '../chartTooltipInteraction';
import type { BitcoinDetailTab, BitcoinTradeSide } from '../hooks/useBitcoinSearch';

type BitcoinDetailTabsProps = {
  coin: BitcoinCoin;
  ticker: BitcoinTicker;
  detailTab: BitcoinDetailTab;
  selectDetailTab: (tab: BitcoinDetailTab) => void;
  chartPeriod: BitcoinCandlePeriod;
  updateChartPeriod: (period: BitcoinCandlePeriod) => void;
  candles: BitcoinCandle[] | null;
  isChartLoading: boolean;
  chartError: string | null;
  orderbookLevel: string;
  updateOrderbookLevel: (level: string) => void;
  orderbook: { instrument: BitcoinOrderbookInstrument; book: BitcoinOrderbook } | null;
  isOrderbookLoading: boolean;
  orderbookError: string | null;
  tradeSide: BitcoinTradeSide;
  updateTradeSide: (side: BitcoinTradeSide) => void;
  trades: BitcoinTrade[] | null;
  isTradesLoading: boolean;
  tradesError: string | null;
};

const PERIODS: Array<{ key: BitcoinCandlePeriod; label: string }> = [
  { key: 'm15', label: '15분' },
  { key: 'm60', label: '1시간' },
  { key: 'D', label: '일' },
  { key: 'W', label: '주' },
  { key: 'M', label: '월' },
];

const DETAIL_TABS: Array<{ key: BitcoinDetailTab; label: string }> = [
  { key: 'chart', label: '차트' },
  { key: 'orderbook', label: '호가' },
  { key: 'trades', label: '체결' },
];

export function BitcoinDetailTabs(props: BitcoinDetailTabsProps) {
  const { coin, detailTab, selectDetailTab } = props;
  return (
    <div className="coin-detail-content">
      <nav className="tab-row coin-detail-tabs" role="tablist" aria-label="코인 상세 정보">
        {DETAIL_TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={detailTab === key}
            aria-controls={`bitcoin-panel-${key}`}
            className={detailTab === key ? 'active' : undefined}
            onClick={() => selectDetailTab(key)}
          >
            {label}
          </button>
        ))}
      </nav>

      {detailTab === 'chart' ? (
        <section id="bitcoin-panel-chart" className="coin-detail-panel" role="tabpanel" aria-label="차트">
          <div className="coin-panel-toolbar">
            <div className="coin-toolbar-group">
              <div className="segmented coin-period-tabs" role="tablist" aria-label="캔들 주기">
                {PERIODS.map(({ key, label }) => (
                  <button
                    type="button"
                    key={key}
                    role="tab"
                    aria-selected={props.chartPeriod === key}
                    className={props.chartPeriod === key ? 'active' : undefined}
                    onClick={() => props.updateChartPeriod(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="coin-chart-legend" aria-label="차트 범례">
                <span><i style={{ background: chartPalette.chartTeal }} />MA5</span>
                <span><i style={{ background: chartPalette.chartOrange }} />MA20</span>
              </div>
            </div>
          </div>
          <BitcoinChart
            candles={props.candles}
            period={props.chartPeriod}
            currentPrice={props.ticker.tradePrice}
            currentChange={props.ticker.signedChangePrice}
            quote={coin.quote}
            symbol={coin.symbol}
            isLoading={props.isChartLoading}
            error={props.chartError}
          />
        </section>
      ) : null}

      {detailTab === 'orderbook' ? (
        <section id="bitcoin-panel-orderbook" className="coin-detail-panel" role="tabpanel" aria-label="호가">
          <BitcoinOrderbookPanel
            coin={coin}
            ticker={props.ticker}
            level={props.orderbookLevel}
            updateLevel={props.updateOrderbookLevel}
            data={props.orderbook}
            isLoading={props.isOrderbookLoading}
            error={props.orderbookError}
          />
        </section>
      ) : null}

      {detailTab === 'trades' ? (
        <section id="bitcoin-panel-trades" className="coin-detail-panel" role="tabpanel" aria-label="체결">
          <BitcoinTradesPanel
            coin={coin}
            trades={props.trades}
            side={props.tradeSide}
            updateSide={props.updateTradeSide}
            isLoading={props.isTradesLoading}
            error={props.tradesError}
          />
        </section>
      ) : null}
    </div>
  );
}

const CHART_WIDTH = 900;
const CHART_HEIGHT = 400;
const CHART_PADDING = { top: 16, right: 92, bottom: 26, left: 8 };

function BitcoinChart({
  candles,
  period,
  currentPrice,
  currentChange,
  quote,
  symbol,
  isLoading,
  error,
}: {
  candles: BitcoinCandle[] | null;
  period: BitcoinCandlePeriod;
  currentPrice: number;
  currentChange: number;
  quote: string;
  symbol: string;
  isLoading: boolean;
  error: string | null;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  useEffect(() => setHoverIndex(null), [candles]);
  if (isLoading && !candles) return <DetailState>차트 데이터를 불러오는 중입니다.</DetailState>;
  if (error && !candles) return <DetailState error>{`차트 데이터를 불러오지 못했습니다: ${error}`}</DetailState>;
  if (!candles || candles.length === 0) return <DetailState>표시할 가격 데이터가 없습니다.</DetailState>;

  const plotWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const priceHeight = (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom) * 0.74;
  const volumeTop = CHART_PADDING.top + priceHeight + 14;
  const volumeHeight = CHART_HEIGHT - CHART_PADDING.bottom - volumeTop;
  const slot = plotWidth / candles.length;
  const candleWidth = Math.max(1, Math.min(14, slot * 0.64));
  const minPrice = Math.min(currentPrice, ...candles.map((candle) => candle.lowPrice));
  const maxPrice = Math.max(currentPrice, ...candles.map((candle) => candle.highPrice));
  const verticalPadding = (maxPrice - minPrice) * 0.06 || maxPrice * 0.01 || 1;
  const min = minPrice - verticalPadding;
  const max = maxPrice + verticalPadding;
  const maxVolume = Math.max(...candles.map((candle) => candle.accumulatedTradeVolume)) || 1;
  const yFor = (value: number) => CHART_PADDING.top + ((max - value) / (max - min)) * priceHeight;
  const xFor = (index: number) => CHART_PADDING.left + slot * index + slot / 2;
  const volumeYFor = (value: number) => volumeTop + volumeHeight - (value / maxVolume) * volumeHeight;
  const priceStep = niceStep(max - min, 5);
  const priceTicks: number[] = [];
  for (let value = Math.ceil(min / priceStep) * priceStep; value <= max && priceTicks.length < 8; value += priceStep) {
    priceTicks.push(value);
  }
  const closes = candles.map((candle) => candle.tradePrice);
  const ma5 = calculateBitcoinMovingAverage(closes, 5);
  const ma20 = calculateBitcoinMovingAverage(closes, 20);
  const stats = calculateBitcoinPeriodStatistics(candles);
  const currentColor = bitcoinDirection(currentChange) === 'down' ? chartPalette.down : chartPalette.up;
  const activeHoverIndex = resolveBitcoinHoverIndex(hoverIndex, candles.length);
  const hovered = activeHoverIndex === null ? null : candles[activeHoverIndex];
  const prevClose = activeHoverIndex === null || activeHoverIndex === 0 ? hovered?.openingPrice : candles[activeHoverIndex - 1].tradePrice;
  const labelEvery = Math.max(1, Math.ceil(candles.length / Math.max(3, Math.floor(plotWidth / 96))));
  const tooltipLeft = activeHoverIndex === null ? '50%' : `${(xFor(activeHoverIndex) / CHART_WIDTH) * 100}%`;

  const findHoverIndex = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const svgX = ((event.clientX - bounds.left) / bounds.width) * CHART_WIDTH;
    setHoverIndex(Math.min(candles.length - 1, Math.max(0, Math.floor((svgX - CHART_PADDING.left) / slot))));
  };

  return (
    <>
      <div className="coin-chart-wrap">
        <svg
          className="coin-candle-chart"
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          role="img"
          aria-label={`${periodLabel(period)} 캔들 차트`}
          onPointerDown={findHoverIndex}
          onPointerMove={findHoverIndex}
          onPointerUp={(event) => {
            if (shouldClearTooltipOnPointerEnd(event.pointerType)) setHoverIndex(null);
          }}
          onPointerCancel={(event) => {
            if (shouldClearTooltipOnPointerEnd(event.pointerType)) setHoverIndex(null);
          }}
          onPointerLeave={(event) => {
            if (shouldClearTooltipOnPointerLeave(event.pointerType)) setHoverIndex(null);
          }}
        >
          {priceTicks.map((tick) => {
            const y = yFor(tick);
            return (
              <g key={tick}>
                <line x1={CHART_PADDING.left} x2={CHART_PADDING.left + plotWidth} y1={y} y2={y} stroke={chartPalette.border} />
                {Math.abs(y - yFor(currentPrice)) > 16 ? (
                  <text x={CHART_PADDING.left + plotWidth + 8} y={y + 4} fill={chartPalette.textMuted} fontSize="12">
                    {formatBitcoinPrice(tick, quote)}
                  </text>
                ) : null}
              </g>
            );
          })}
          <line x1={CHART_PADDING.left} x2={CHART_PADDING.left + plotWidth} y1={volumeTop - 7} y2={volumeTop - 7} stroke={chartPalette.border} />
          <text x={CHART_PADDING.left + plotWidth + 8} y={volumeTop + 9} fill={chartPalette.textMuted} fontSize="11">거래량</text>
          {candles.map((candle, index) => {
            const x = xFor(index);
            const color = candle.tradePrice >= candle.openingPrice ? chartPalette.up : chartPalette.down;
            const bodyTop = yFor(Math.max(candle.openingPrice, candle.tradePrice));
            const bodyHeight = Math.max(1, Math.abs(yFor(candle.openingPrice) - yFor(candle.tradePrice)));
            return (
              <g key={`${candle.dateTimeKst}-${index}`}>
                <line x1={x} x2={x} y1={yFor(candle.highPrice)} y2={yFor(candle.lowPrice)} stroke={color} />
                <rect x={x - candleWidth / 2} y={bodyTop} width={candleWidth} height={bodyHeight} fill={color} />
                <rect
                  x={x - candleWidth / 2}
                  y={volumeYFor(candle.accumulatedTradeVolume)}
                  width={candleWidth}
                  height={volumeTop + volumeHeight - volumeYFor(candle.accumulatedTradeVolume)}
                  fill={color}
                  opacity="0.38"
                />
              </g>
            );
          })}
          <polyline fill="none" stroke={chartPalette.chartTeal} strokeWidth="1.5" points={maPoints(ma5, xFor, yFor)} />
          <polyline fill="none" stroke={chartPalette.chartOrange} strokeWidth="1.5" points={maPoints(ma20, xFor, yFor)} />
          {candles.map((candle, index) => (index === candles.length - 1 || index % labelEvery === 0 ? (
            <text key={`date-${candle.dateTimeKst}`} x={xFor(index)} y={CHART_HEIGHT - 8} fill={chartPalette.textMuted} fontSize="11" textAnchor="middle">
              {chartAxisLabel(candle.dateTimeKst, period, candles[index - 1]?.dateTimeKst)}
            </text>
          ) : null))}
          <line
            x1={CHART_PADDING.left}
            x2={CHART_PADDING.left + plotWidth}
            y1={yFor(currentPrice)}
            y2={yFor(currentPrice)}
            stroke={currentColor}
            strokeDasharray="3 3"
          />
          <rect x={CHART_PADDING.left + plotWidth + 2} y={yFor(currentPrice) - 10} width={CHART_PADDING.right - 4} height="20" rx="4" fill={currentColor} />
          <text x={CHART_PADDING.left + plotWidth + 7} y={yFor(currentPrice) + 4} fill={chartPalette.surface} fontSize="11" fontWeight="600">
            {formatBitcoinPrice(currentPrice, quote)}
          </text>
          {activeHoverIndex !== null ? (
            <line x1={xFor(activeHoverIndex)} x2={xFor(activeHoverIndex)} y1={CHART_PADDING.top} y2={volumeTop + volumeHeight} stroke={chartPalette.borderStrong} />
          ) : null}
          <rect x={CHART_PADDING.left} y={CHART_PADDING.top} width={plotWidth} height={volumeTop + volumeHeight - CHART_PADDING.top} fill="transparent" />
        </svg>
        {hovered && activeHoverIndex !== null ? (
          <div className={`coin-chart-tooltip${activeHoverIndex > candles.length / 2 ? ' right' : ''}`} style={{ left: tooltipLeft }}>
            <strong>{chartTooltipDate(hovered.dateTimeKst, period)}</strong>
            <dl>
              <dt>시가</dt><dd>{formatBitcoinPrice(hovered.openingPrice, quote)}</dd>
              <dt>고가</dt><dd className="up">{formatBitcoinPrice(hovered.highPrice, quote)}</dd>
              <dt>저가</dt><dd className="down">{formatBitcoinPrice(hovered.lowPrice, quote)}</dd>
              <dt>종가</dt><dd className={bitcoinDirection(hovered.tradePrice - (prevClose ?? hovered.openingPrice))}>
                {formatBitcoinPrice(hovered.tradePrice, quote)} ({formatBitcoinRate((hovered.tradePrice - (prevClose ?? hovered.openingPrice)) / (prevClose || hovered.openingPrice || 1))})
              </dd>
              <dt>거래량</dt><dd>{formatBitcoinVolume(hovered.accumulatedTradeVolume)}</dd>
            </dl>
          </div>
        ) : null}
      </div>
      {stats ? (
        <dl className="coin-period-stats">
          <div><dt>기간 최고가</dt><dd className="up">{formatBitcoinPrice(stats.highPrice, quote)}</dd></div>
          <div><dt>기간 최저가</dt><dd className="down">{formatBitcoinPrice(stats.lowPrice, quote)}</dd></div>
          <div><dt>기간 수익률 ({candles.length}봉)</dt><dd className={bitcoinDirection(stats.returnRate)}>{formatBitcoinRate(stats.returnRate)}</dd></div>
          <div><dt>누적 거래량</dt><dd>{formatBitcoinVolume(stats.accumulatedTradeVolume)} {symbol}</dd></div>
        </dl>
      ) : null}
      {isLoading ? <div className="coin-inline-loading" role="status">최신 차트를 불러오는 중입니다.</div> : null}
      {error ? <div className="coin-inline-error" role="alert">최신 차트를 불러오지 못했습니다: {error}</div> : null}
    </>
  );
}

function BitcoinOrderbookPanel({
  coin,
  ticker,
  level,
  updateLevel,
  data,
  isLoading,
  error,
}: {
  coin: BitcoinCoin;
  ticker: BitcoinTicker;
  level: string;
  updateLevel: (level: string) => void;
  data: { instrument: BitcoinOrderbookInstrument; book: BitcoinOrderbook } | null;
  isLoading: boolean;
  error: string | null;
}) {
  if (isLoading && !data) return <DetailState>호가 정보를 불러오는 중입니다.</DetailState>;
  if (error && !data) return <DetailState error>{`호가 정보를 불러오지 못했습니다: ${error}`}</DetailState>;
  if (!data) return <DetailState>표시할 호가 정보가 없습니다.</DetailState>;

  const { book, instrument } = data;
  const total = book.totalAskSize + book.totalBidSize;
  const askPercent = total > 0 ? (book.totalAskSize / total) * 100 : 50;
  const maxSize = getBitcoinOrderbookMaxSize(book.units.flatMap((unit) => [unit.askSize, unit.bidSize]));
  const spread = getBitcoinOrderbookSpread(book);
  const asks = book.units.filter((unit) => unit.askPrice > 0).slice().reverse();
  const bids = book.units.filter((unit) => unit.bidPrice > 0);

  return (
    <>
      <div className="coin-panel-toolbar">
        <div className="coin-toolbar-group">
          <label className="coin-ob-select">모아보기
            <select value={level} onChange={(event) => updateLevel(event.target.value)}>
              {instrument.supportedLevels.map((item) => (
                <option key={item} value={item}>{item === '0' ? '기본 (호가 단위)' : `${formatBitcoinPrice(Number(item), coin.quote)} 단위`}</option>
              ))}
            </select>
          </label>
          <span className="coin-ob-info">호가 단위 <b>{formatBitcoinPrice(instrument.tickSize, coin.quote)}</b> {instrument.quoteCurrency}</span>
        </div>
      </div>
      <div className="coin-ob-ratio">
        <div className="coin-ob-ratio-bar"><span className="ask" style={{ width: `${askPercent}%` }} /><span className="bid" style={{ width: `${100 - askPercent}%` }} /></div>
        <div className="coin-ob-ratio-labels">
          <span className="down">매도 잔량 {formatBitcoinVolume(book.totalAskSize)} ({askPercent.toFixed(1)}%)</span>
          <span className="up">매수 잔량 {formatBitcoinVolume(book.totalBidSize)} ({(100 - askPercent).toFixed(1)}%)</span>
        </div>
      </div>
      <div className="coin-orderbook" aria-label="호가 목록">
        {asks.map((unit, index) => (
          <OrderbookRow
            key={`ask-${unit.askPrice}-${index}`}
            side="ask"
            price={unit.askPrice}
            size={unit.askSize}
            maxSize={maxSize}
            quote={coin.quote}
            previousClosingPrice={ticker.previousClosingPrice}
            currentPrice={ticker.tradePrice}
          />
        ))}
        <div className="coin-ob-spread">
          <span>현재가 <b className={bitcoinDirection(ticker.signedChangePrice)}>{formatBitcoinPrice(ticker.tradePrice, coin.quote)}</b></span>
          <span>스프레드 <b>{spread ? formatBitcoinPrice(spread.spread, coin.quote) : '—'}</b> {spread ? `(${(spread.spreadRate * 100).toFixed(3)}%)` : ''}</span>
        </div>
        {bids.map((unit, index) => (
          <OrderbookRow
            key={`bid-${unit.bidPrice}-${index}`}
            side="bid"
            price={unit.bidPrice}
            size={unit.bidSize}
            maxSize={maxSize}
            quote={coin.quote}
            previousClosingPrice={ticker.previousClosingPrice}
            currentPrice={ticker.tradePrice}
          />
        ))}
      </div>
      {isLoading ? <div className="coin-inline-loading" role="status">최신 호가를 불러오는 중입니다.</div> : null}
      {error ? <div className="coin-inline-error" role="alert">최신 호가를 불러오지 못했습니다: {error}</div> : null}
    </>
  );
}

function OrderbookRow({
  side,
  price,
  size,
  maxSize,
  quote,
  previousClosingPrice,
  currentPrice,
}: {
  side: 'ask' | 'bid';
  price: number;
  size: number;
  maxSize: number;
  quote: string;
  previousClosingPrice: number;
  currentPrice: number;
}) {
  const direction = bitcoinDirection(price - previousClosingPrice);
  const sizeCell = (
    <div className="coin-ob-cell coin-ob-size">
      <span className="bar" style={{ width: `${Math.max(1, (size / maxSize) * 100)}%` }} />
      <span>{formatBitcoinVolume(size)}</span>
    </div>
  );
  const priceCell = (
    <div className={`coin-ob-cell coin-ob-price ${direction}`}>
      <span>{formatBitcoinPrice(price, quote)}</span>
      <small>{formatBitcoinRate(previousClosingPrice === 0 ? 0 : (price - previousClosingPrice) / previousClosingPrice)}</small>
    </div>
  );
  return (
    <div className={`coin-ob-row ${side}${price === currentPrice ? ' current' : ''}`}>
      {side === 'ask' ? sizeCell : <div className="coin-ob-cell" />}
      {priceCell}
      {side === 'bid' ? sizeCell : <div className="coin-ob-cell" />}
    </div>
  );
}

function BitcoinTradesPanel({
  coin,
  trades,
  side,
  updateSide,
  isLoading,
  error,
}: {
  coin: BitcoinCoin;
  trades: BitcoinTrade[] | null;
  side: BitcoinTradeSide;
  updateSide: (side: BitcoinTradeSide) => void;
  isLoading: boolean;
  error: string | null;
}) {
  if (isLoading && !trades) return <DetailState>체결 정보를 불러오는 중입니다.</DetailState>;
  if (error && !trades) return <DetailState error>{`체결 정보를 불러오지 못했습니다: ${error}`}</DetailState>;
  if (!trades) return <DetailState>표시할 체결 정보가 없습니다.</DetailState>;

  const rows = side === 'all' ? trades : trades.filter((trade) => trade.side === side);
  const bidVolume = trades.filter((trade) => trade.side === 'BID').reduce((sum, trade) => sum + trade.tradeVolume, 0);
  const askVolume = trades.filter((trade) => trade.side === 'ASK').reduce((sum, trade) => sum + trade.tradeVolume, 0);

  return (
    <>
      <div className="coin-panel-toolbar coin-trade-toolbar">
        <div className="coin-toolbar-group">
          <div className="segmented coin-trade-filters" role="tablist" aria-label="체결 구분">
            {([
              ['all', '전체'], ['BID', '매수'], ['ASK', '매도'],
            ] as Array<[BitcoinTradeSide, string]>).map(([key, label]) => (
              <button key={key} type="button" role="tab" aria-selected={side === key} className={side === key ? 'active' : undefined} onClick={() => updateSide(key)}>
                {label}
              </button>
            ))}
          </div>
          <div className="coin-trade-summary">
            <span>최근 {trades.length}건</span>
            <span>매수 <b className="up">{formatBitcoinVolume(bidVolume)}</b></span>
            <span>매도 <b className="down">{formatBitcoinVolume(askVolume)}</b></span>
          </div>
        </div>
      </div>
      <div className="coin-trades-table-wrap">
        <table className="coin-trades-table">
          <thead>
            <tr>
              <th>체결시각 (KST)</th>
              <th>구분</th>
              <th>체결가격</th>
              <th>체결량</th>
              <th className="hide-sm">체결금액</th>
              <th className="hide-sm">전일대비</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((trade, index) => {
              const kst = getBitcoinTradeKst(trade);
              const previousClose = trade.previousClosingPrice || coin.previousClosingPrice;
              const priceDiff = trade.tradePrice - previousClose;
              const amount = trade.tradePrice * trade.tradeVolume;
              return (
                <tr key={`${trade.sequentialId}-${trade.side}-${trade.timestamp}-${index}`}>
                  <td>{formatBitcoinTradeTime(kst.date, kst.time)}</td>
                  <td><span className={`coin-side-badge ${trade.side === 'BID' ? 'bid' : 'ask'}`}>{trade.side === 'BID' ? '매수' : '매도'}</span></td>
                  <td className={bitcoinDirection(priceDiff)}>{formatBitcoinPrice(trade.tradePrice, coin.quote)}</td>
                  <td>{formatBitcoinVolume(trade.tradeVolume)}</td>
                  <td className="hide-sm">{coin.quote === 'KRW' ? formatBitcoinNumber(Math.round(amount)) : formatBitcoinVolume(amount)}</td>
                  <td className={`hide-sm ${bitcoinDirection(priceDiff)}`}>{formatBitcoinRate(previousClose === 0 ? 0 : priceDiff / previousClose)}</td>
                </tr>
              );
            }) : (
              <tr><td colSpan={6} className="coin-trades-empty">해당 구분의 체결이 없습니다</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {isLoading ? <div className="coin-inline-loading" role="status">최신 체결을 불러오는 중입니다.</div> : null}
      {error ? <div className="coin-inline-error" role="alert">최신 체결을 불러오지 못했습니다: {error}</div> : null}
    </>
  );
}

function DetailState({ children, error = false }: { children: React.ReactNode; error?: boolean }) {
  return <div className={`coin-detail-state coin-panel-state${error ? ' error' : ''}`} role={error ? 'alert' : 'status'}>{children}</div>;
}

function maPoints(values: Array<number | null>, xFor: (index: number) => number, yFor: (value: number) => number): string {
  return values
    .map((value, index) => value === null ? null : `${xFor(index).toFixed(1)},${yFor(value).toFixed(1)}`)
    .filter((point): point is string => point !== null)
    .join(' ');
}

function niceStep(range: number, count: number): number {
  const raw = range / count;
  if (!Number.isFinite(raw) || raw <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(raw));
  const normalized = raw / magnitude;
  return (normalized >= 5 ? 10 : normalized >= 2 ? 5 : normalized >= 1 ? 2 : 1) * magnitude;
}

function periodLabel(period: BitcoinCandlePeriod): string {
  return PERIODS.find((item) => item.key === period)?.label ?? '일';
}

function chartAxisLabel(value: string, period: BitcoinCandlePeriod, previous?: string): string {
  const [date = '', time = ''] = value.split('T');
  const [year, month, day] = date.split('-');
  if (period === 'm15' || period === 'm60') return !previous || previous.slice(0, 10) !== date ? `${month}.${day}` : time.slice(0, 5);
  if (period === 'D') return `${month}.${day}`;
  if (period === 'W') return `${year?.slice(2)}.${month}.${day}`;
  return `${year}.${month}`;
}

function chartTooltipDate(value: string, period: BitcoinCandlePeriod): string {
  const [date = '', time = ''] = value.split('T');
  const base = date.replaceAll('-', '.');
  if (period === 'm15' || period === 'm60') return `${base} ${time.slice(0, 5)}`;
  if (period === 'W') return `${base} 주`;
  if (period === 'M') return base.slice(0, 7);
  return base;
}
