# trading-ui

React, TypeScript, Vite 기반의 시장 요약 및 주식·코인 조회 UI입니다. FastAPI 서버에서 시장 지표와 시세 데이터를 불러와 Summary, 주식 검색, 코인 검색 페이지에 표시합니다.

## 주요 기능

- 시장 선택: `KRX(J)`, `NXT(NX)`, `통합(UN)`
- 종목 코드, 시작일, 종료일, 수정주가 여부 입력
- 현재가, 등락률, 거래량, PER/PBR/EPS/BPS 등 quote 정보 표시
- SVG 기반 캔들 차트와 이동평균선 렌더링
- RSI/Signal, MACD/Signal 보조지표 렌더링
- 지표 설정 모달에서 이동평균 window, RSI window, Signal EMA, MACD EMA 값 변경
- KRW/BTC/USDT 마켓별 코인 목록, 한글·영문·심볼·초성 검색, 정렬과 유의·주의 필터
- 선택한 코인의 현재가, 등락, 거래 통계, 52주 범위 및 최근 체결 시각 표시
- 선택한 코인의 15분·1시간·일·주·월 캔들 차트, 모아보기 호가와 최근 체결 상세 표시
- 차트 기간 통계와 이동평균선, 호가 잔량 비율, 체결 구분 필터 제공
- `#KRW-BTC` 형식의 코인 마켓 해시로 코인 검색 페이지 진입 및 선택 상태 공유
- API 오류와 빈 데이터 상태를 화면 안에서 표시

## 기술 스택

- React 19
- TypeScript
- Vite
- CSS
- Browser Fetch API
- Node.js 내장 테스트 러너

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. API 서버 실행

프론트엔드는 브라우저에서 `/api`로 요청합니다. Vite 개발/preview 서버는 이 요청을 `API_PROXY_TARGET`으로 프록시합니다.

백엔드 주소는 `.env`에서 설정합니다. `.env`는 git에 커밋되지 않으므로 `.env.example`을 복사해 만듭니다. `API_PROXY_TARGET` 값이 없으면 `http://localhost:9999`를 사용합니다.

```bash
cp .env.example .env
```

배포된 백엔드를 쓰려면 다음과 같이 지정합니다.

```bash
API_PROXY_TARGET=https://trading-api-gold.vercel.app
```

Vercel 배포에서는 `middleware.ts`가 `/api` 요청을 `API_PROXY_TARGET`으로 프록시합니다. `.env`는 Vercel에 올라가지 않으므로 Vercel 프로젝트의 Environment Variables에 같은 이름으로 `API_PROXY_TARGET`을 등록해야 합니다. 값이 없으면 `/api` 요청은 500으로 응답합니다.

필요한 백엔드 endpoint:

- `POST /stock_quote`
- `POST /stock_quote/daily`
- `POST /stock_quote/daily/moving-average`
- `POST /stock_quote/indicator/rsi`
- `POST /stock_quote/indicator/rsi-signal`
- `POST /stock_quote/indicator/macd`
- `POST /stock_quote/indicator/macd-signal`
- `POST /bitcoin/trading-pairs` (`is_details: true`)
- `POST /bitcoin/ticker/quote` (`quote_currencies: ["KRW", "BTC", "USDT"]`)
- `POST /bitcoin/ticker` (`markets: [선택한 마켓]`)
- `POST /bitcoin/candles/minutes/15`, `/bitcoin/candles/minutes/60`, `/bitcoin/candles/days`, `/bitcoin/candles/weeks`, `/bitcoin/candles/months`
- `POST /bitcoin/orderbook/instruments` (`markets: [선택한 마켓]`)
- `POST /bitcoin/orderbook` (`markets: [선택한 마켓]`, `level`)
- `POST /bitcoin/trades` (`market: 선택한 마켓`, `count: 30`)

### 3. 개발 서버 실행

```bash
npm run dev
```

기본 Vite URL은 `http://localhost:5173`입니다.

## 사용 가능한 명령

```bash
npm run dev
```

Vite 개발 서버를 실행합니다.

```bash
npm run build
```

TypeScript 프로젝트 빌드와 Vite production build를 실행합니다.

```bash
npm run preview
```

production build 결과를 로컬에서 미리 봅니다. 먼저 `npm run build`가 필요합니다.

```bash
npm test
```

도메인 로직과 데이터 로딩 유스케이스 테스트를 실행합니다.

## 프로젝트 구조

```text
src/
  application/
    loadStockChart.ts
    loadBitcoinDetails.ts
    loadBitcoinMarket.ts
    loadBitcoinTicker.ts
  domain/
    stock.ts
    bitcoin.ts
    bitcoinDetail.ts
    bitcoinSearch.ts
  infrastructure/
    fastApiStockRepository.ts
    fastApiBitcoinRepository.ts
    http.ts
  presentation/
    App.tsx
    components/
    hooks/
    format.ts
    bitcoinFormat.ts
    styles.css
tests/
  loadStockChart.test.ts
  loadBitcoinDetails.test.ts
  loadBitcoinMarket.test.ts
  bitcoinDetail.test.ts
  bitcoinDetailRepository.test.ts
  bitcoinSearch.test.ts
  stock.test.ts
middleware.ts
vite.config.ts
```

## 아키텍처

이 프로젝트는 UI에서도 계층을 분리합니다.

- `domain`: 주식·코인 조회 타입, 검색·정렬과 차트 계산 유틸리티
- `application`: 주식 차트 데이터, 코인 목록·시세를 함께 불러오는 유스케이스
- `infrastructure`: FastAPI endpoint 응답을 repository 인터페이스에 맞게 변환
- `presentation`: React hook, 화면 컴포넌트, SVG 차트, 스타일과 표시 형식

React 컴포넌트는 `fetch`를 직접 호출하지 않습니다. 화면은 `useStockChart` 또는 `useBitcoinSearch`를 사용하고, hook은 application layer를 통해 repository에 접근합니다.

## API 요청 형식

차트 계열 API는 화면 입력값을 다음 형태로 변환해 전송합니다.

```json
{
  "market": "J",
  "code": "005930",
  "start_date": "20260416",
  "end_date": "20260516",
  "adjusted_price": true
}
```

지표 endpoint에는 추가 window 값이 붙습니다.

- 이동평균: `window`
- RSI: `rsi_window`
- RSI Signal: `rsi_window`, `ema_window`
- MACD: `ema_short_window`, `ema_long_window`
- MACD Signal: `ema_short_window`, `ema_long_window`, `ema_window`

## 기본값

- 시장: `J`
- 종목 코드: `005930`
- 조회 기간: 오늘 기준 최근 1개월
- 수정주가: `true`
- 이동평균: `5`, `20`, `60`, `120`
- RSI window: `14`
- Signal EMA: `9`
- MACD EMA: `12`, `26`
