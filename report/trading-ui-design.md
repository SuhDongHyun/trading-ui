# Trading UI Design

## Goal

Build a React/TypeScript frontend that uses the `traind-api` OpenAPI contract at `http://localhost:9999/openapi.json` to render a stock chart screen similar to `앱 예시 화면.jpg`.

The selected visual direction is **Responsive app**: preserve the mobile investing-app density and chart-first hierarchy, but adapt it to a web viewport.

## User Flow

1. User enters a stock code, start date, and end date.
2. User clicks search.
3. The app requests quote, RSI, RSI signal, and MACD data with the selected market, and requests the top price chart and moving averages with `market=UN`.
4. The screen renders a quote header, candlestick chart with moving averages, RSI/Signal panel, and MACD panel.
5. User clicks RSI, Signal, MACD, or moving-average labels to open a settings modal.
6. User changes windows or EMA values and applies the settings.
7. Indicator APIs are reloaded using the new settings.

## API Contract

Base URL defaults to `/api` in the browser. Vite proxies `/api` to `http://localhost:9999`.

Endpoints:

- `POST /stock_quote`
- `POST /stock_quote/daily`
- `POST /stock_quote/daily/moving-average`
- `POST /stock_quote/indicator/rsi`
- `POST /stock_quote/indicator/rsi-signal`
- `POST /stock_quote/indicator/macd`

Common request fields:

- `market`: default `J`
- `code`: six-digit stock code, default `005930`
- `start_date`: `YYYYMMDD`
- `end_date`: `YYYYMMDD`
- `period`: `D`, `W`, `M`, or `Y`
- `adjusted_price`: default `true`

## Architecture

The frontend follows clean architecture:

- `domain`: business types and request settings.
- `application`: use cases that orchestrate data loading.
- `infrastructure`: HTTP client and FastAPI adapter.
- `presentation`: React components, hooks, chart rendering, and styles.

React components never call `fetch` directly. They call `useStockChart`, which calls the application use case, which depends on a repository interface implemented by the FastAPI adapter.

## UI Design

The app uses a quiet, dense market-data layout:

- Top query bar: stock code, start date, end date, period, adjusted-price toggle, search button.
- Quote header: name inferred from known code where available, market metadata, current price, price difference, percent change, volume, and valuation metrics.
- Navigation strip: chart-centered tabs matching the reference screen, with only chart active.
- Chart controls: period segmented control, moving-average legend, utility buttons.
- Main chart: SVG candlesticks, moving-average lines, right-side latest-price badge.
- RSI panel: RSI and RSI signal lines, 70 reference line, clickable legend.
- MACD panel: MACD line with latest value badge.
- Settings modal: focused numeric controls for RSI window, RSI signal EMA, MACD short EMA, MACD long EMA, and moving-average windows.

## Error And Loading States

- Initial load uses Samsung Electronics `005930` and a recent fixed sample range from the reference: `2026-02-23` to `2026-05-04`.
- While loading, the chart area displays a compact loading state.
- API or validation failures show an inline error banner without clearing the previous query fields.
- Empty data renders a clear empty chart message.

## Testing And Verification

Verification commands:

- `npm run build` for TypeScript and production bundle validation.
- Manual browser check at the Vite dev server URL.
