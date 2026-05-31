import type { StockNewsItem } from '../../domain/stock';
import { formatDateTimeLabel } from '../format';

type NewsListProps = {
  news: StockNewsItem[] | undefined;
  isLoading: boolean;
};

export function NewsList({ news, isLoading }: NewsListProps) {
  const items = news ?? [];

  return (
    <section className="news-panel" aria-labelledby="news-panel-title">
      <div className="news-panel-header">
        <h2 id="news-panel-title">뉴스</h2>
        <span>{isLoading ? '조회 중' : `${items.length}건`}</span>
      </div>

      {items.length > 0 ? (
        <ul className="news-list">
          {items.map((item, index) => (
            <li key={`${item.publishedAt}-${item.title}-${index}`} className="news-item">
              <p>{item.title}</p>
              <div>
                <span>{item.source}</span>
                <time dateTime={item.publishedAt}>{formatDateTimeLabel(item.publishedAt)}</time>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="news-empty">{isLoading ? '뉴스를 불러오는 중입니다.' : '표시할 뉴스가 없습니다.'}</div>
      )}
    </section>
  );
}
