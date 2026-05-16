import { useState, type FormEvent } from 'react';
import type { Market, Period, StockQuery } from '../../domain/stock';

type QueryBarProps = {
  query: StockQuery;
  onSearch: (query: StockQuery) => void;
};

export function QueryBar({ query, onSearch }: QueryBarProps) {
  const [draft, setDraft] = useState(query);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch({
      ...draft,
      code: draft.code.trim(),
    });
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
      <label>
        종목
        <input
          value={draft.code}
          maxLength={12}
          inputMode="numeric"
          onChange={(event) => setDraft({ ...draft, code: event.target.value })}
        />
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
