import { useMemo, useState, type FormEvent, type FocusEvent } from 'react';
import type { Market, Period, StockMetaInfo, StockQuery } from '../../domain/stock';
import { filterStockOptions, resolveStockSearchSelection } from '../stockSearch';

type QueryBarProps = {
  query: StockQuery;
  stockInput: string;
  stockOptions: StockMetaInfo[];
  isStockListLoading: boolean;
  onStockInputChange: (input: string) => void;
  onSearch: (query: StockQuery) => void;
};

export function QueryBar({ query, stockInput, stockOptions, isStockListLoading, onStockInputChange, onSearch }: QueryBarProps) {
  const [draft, setDraft] = useState(query);
  const [isStockMenuOpen, setIsStockMenuOpen] = useState(false);
  const filteredStockOptions = useMemo(
    () => filterStockOptions(stockOptions, stockInput).slice(0, 80),
    [stockInput, stockOptions],
  );

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selection = resolveStockSearchSelection(stockOptions, stockInput);
    onStockInputChange(selection.displayInput);
    onSearch({
      ...draft,
      code: selection.code,
    });
  }

  function selectStock(stock: StockMetaInfo) {
    onStockInputChange(stock.name);
    setDraft({ ...draft, code: stock.code });
    setIsStockMenuOpen(false);
  }

  function closeStockMenu(event: FocusEvent<HTMLLabelElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setIsStockMenuOpen(false);
    }
  }

  return (
    <form className="query-bar" onSubmit={submit}>
      <label>
        시장
        <select
          value={draft.market}
          onChange={(event) => setDraft({ ...draft, market: event.target.value as Market })}
        >
          <option value="J">KRX(J)</option>
          <option value="NX">NXT(NX)</option>
          <option value="UN">통합(UN)</option>
        </select>
      </label>
      <label className="stock-search-field" onBlur={closeStockMenu}>
        종목
        <input
          value={stockInput}
          maxLength={40}
          autoComplete="off"
          onFocus={() => setIsStockMenuOpen(true)}
          onChange={(event) => {
            onStockInputChange(event.target.value);
            setDraft({ ...draft, code: event.target.value });
            setIsStockMenuOpen(true);
          }}
        />
        {isStockMenuOpen ? (
          <div className="stock-search-menu" role="listbox" aria-label="종목 검색 결과">
            {isStockListLoading ? <div className="stock-search-empty">종목 목록을 불러오는 중</div> : null}
            {!isStockListLoading && filteredStockOptions.length === 0 ? (
              <div className="stock-search-empty">일치하는 종목이 없습니다</div>
            ) : null}
            {!isStockListLoading
              ? filteredStockOptions.map((stock) => (
                  <button
                    type="button"
                    key={stock.code}
                    className="stock-search-option"
                    role="option"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectStock(stock)}
                  >
                    <span>{stock.name}</span>
                    <small>
                      {stock.code} | {stock.marketName}
                    </small>
                  </button>
                ))
              : null}
          </div>
        ) : null}
      </label>
      <label>
        시작일
        <input
          type="date"
          value={draft.startDate}
          onChange={(event) => setDraft({ ...draft, startDate: event.target.value })}
        />
      </label>
      <label>
        종료일
        <input
          type="date"
          value={draft.endDate}
          onChange={(event) => setDraft({ ...draft, endDate: event.target.value })}
        />
      </label>
      <label>
        주기
        <select
          value={draft.period}
          onChange={(event) => setDraft({ ...draft, period: event.target.value as Period })}
        >
          <option value="D">일</option>
          <option value="W">주</option>
          <option value="M">월</option>
          <option value="Y">년</option>
        </select>
      </label>
      <label className="check-label">
        <input
          type="checkbox"
          checked={draft.adjustedPrice}
          onChange={(event) => setDraft({ ...draft, adjustedPrice: event.target.checked })}
        />
        수정주가
      </label>
      <button type="submit">조회</button>
    </form>
  );
}
