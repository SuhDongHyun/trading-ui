# Trading UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a React/TypeScript stock chart frontend using the local `traind-api` OpenAPI contract.

**Architecture:** Clean architecture with domain models, application use cases, infrastructure API adapter, and presentation components. SVG charts keep the implementation dependency-light and controllable.

**Tech Stack:** React 19, TypeScript, Vite, CSS, browser Fetch API.

---

### Task 1: Project Scaffold

**Files:**

- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/vite-env.d.ts`

- [x] Add Vite React/TypeScript project configuration.
- [x] Configure `/api` proxy to `http://localhost:9999`.
- [x] Mount the React app at `#root`.

### Task 2: Domain And Application Layer

**Files:**

- Create: `src/domain/stock.ts`
- Create: `src/application/loadStockChart.ts`

- [x] Define quote, price, moving-average, RSI, RSI signal, MACD, query, and indicator settings types.
- [x] Define `StockRepository` interface.
- [x] Implement a `loadStockChart` use case that loads quote and chart series together.

### Task 3: Infrastructure Layer

**Files:**

- Create: `src/infrastructure/http.ts`
- Create: `src/infrastructure/fastApiStockRepository.ts`

- [x] Add a JSON POST helper with validation-friendly error messages.
- [x] Implement each OpenAPI endpoint behind the `StockRepository` interface.
- [x] Load moving averages for all configured windows.

### Task 4: Presentation Layer

**Files:**

- Create: `src/presentation/App.tsx`
- Create: `src/presentation/hooks/useStockChart.ts`
- Create: `src/presentation/components/QueryBar.tsx`
- Create: `src/presentation/components/QuoteHeader.tsx`
- Create: `src/presentation/components/ChartShell.tsx`
- Create: `src/presentation/components/PriceChart.tsx`
- Create: `src/presentation/components/IndicatorPanel.tsx`
- Create: `src/presentation/components/IndicatorSettingsModal.tsx`
- Create: `src/presentation/components/BottomNav.tsx`
- Create: `src/presentation/styles.css`

- [x] Implement stock code/date inputs and search action.
- [x] Render the quote header and app-like chart tabs.
- [x] Render candlesticks, moving averages, RSI/Signal, and MACD with SVG.
- [x] Open a modal from indicator labels and apply changed windows.
- [x] Keep layout responsive for desktop and mobile.

### Task 5: Verification

**Files:**

- Modify only if verification exposes issues.

- [x] Run `npm install`.
- [x] Run `npm run build`.
- [x] Start `npm run dev -- --host 127.0.0.1`.
- [x] Confirm the app renders at the local Vite URL.
