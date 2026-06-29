import type { StockMetaInfo } from '../domain/stock';

export function filterStockOptions(stocks: StockMetaInfo[], input: string): StockMetaInfo[] {
  const keyword = input.trim().toLocaleLowerCase();
  if (!keyword) {
    return stocks;
  }

  return stocks.filter((stock) => {
    const name = stock.name.toLocaleLowerCase();
    const code = stock.code.toLocaleLowerCase();
    return name.includes(keyword) || code.includes(keyword);
  });
}

export function resolveStockSearchInput(stocks: StockMetaInfo[], input: string): string {
  return resolveStockSearchSelection(stocks, input).code;
}

export function resolveStockSearchSelection(stocks: StockMetaInfo[], input: string): { code: string; displayInput: string } {
  const keyword = input.trim();
  const selectedStock = stocks.find((stock) => stock.name === keyword || stock.code === keyword);
  return {
    code: selectedStock?.code ?? keyword,
    displayInput: selectedStock?.name ?? keyword,
  };
}
