# trading-ui

React, TypeScript, Vite 기반의 주식 차트 조회 UI입니다. 로컬 FastAPI 서버의 주식 시세 API를 호출해 현재가, 캔들 차트, 이동평균, RSI/Signal, MACD 지표를 한 화면에 표시합니다.

## 주요 기능

- 시장 선택: `KRX(J)`, `NXT(NX)`, `통합(UN)`
- 종목 코드, 시작일, 종료일, 주기(`D`, `W`, `M`, `Y`), 수정주가 여부 입력
- 현재가, 등락률, 거래량, PER/PBR/EPS/BPS 등 quote 정보 표시
- SVG 기반 캔들 차트와 이동평균선 렌더링
- RSI/Signal, MACD/Signal 보조지표 렌더링
- 지표 설정 모달에서 이동평균 window, RSI window, Signal EMA, MACD EMA 값 변경
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

프론트엔드는 브라우저에서 `/api`로 요청합니다. Vite 개발 서버는 이 요청을 `http://localhost:9999`로 프록시합니다.

필요한 백엔드 endpoint:

- `POST /stock_quote`
- `POST /stock_quote/daily`
- `POST /stock_quote/daily/moving-average`
- `POST /stock_quote/indicator/rsi`
- `POST /stock_quote/indicator/rsi-signal`
- `POST /stock_quote/indicator/macd`
- `POST /stock_quote/indicator/macd-signal`

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
  domain/
    stock.ts
  infrastructure/
    fastApiStockRepository.ts
    http.ts
  presentation/
    App.tsx
    components/
    hooks/
    format.ts
    styles.css
tests/
  loadStockChart.test.ts
  stock.test.ts
vite.config.ts
```

## 아키텍처

이 프로젝트는 UI에서도 계층을 분리합니다.

- `domain`: 주식 조회 조건, quote, 가격, 지표 타입과 차트 계산 유틸리티
- `application`: `loadStockChart` 유스케이스로 quote와 차트 시리즈를 함께 로드
- `infrastructure`: FastAPI endpoint를 `StockRepository` 인터페이스에 맞게 변환
- `presentation`: React hook, 화면 컴포넌트, SVG 차트, 스타일

React 컴포넌트는 `fetch`를 직접 호출하지 않습니다. 화면은 `useStockChart`를 사용하고, hook은 application layer를 통해 repository에 접근합니다.

## API 요청 형식

차트 계열 API는 화면 입력값을 다음 형태로 변환해 전송합니다.

```json
{
  "market": "J",
  "code": "005930",
  "start_date": "20260416",
  "end_date": "20260516",
  "period": "D",
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
- 주기: `D`
- 수정주가: `true`
- 이동평균: `5`, `20`, `60`, `120`
- RSI window: `14`
- Signal EMA: `9`
- MACD EMA: `12`, `26`
