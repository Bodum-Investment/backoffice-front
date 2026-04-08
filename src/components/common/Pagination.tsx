interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const start = Math.max(0, page - 4);
  const end = Math.min(totalPages, start + 10);
  const pages = Array.from({ length: end - start }, (_, i) => start + i);

  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button
        className="pagination__btn"
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        aria-label="이전 페이지"
      >
        이전
      </button>
      {pages.map((p) => (
        <button
          key={p}
          className={`pagination__page ${p === page ? 'pagination__page--active' : ''}`}
          onClick={() => onPageChange(p)}
        >
          {p + 1}
        </button>
      ))}
      <button
        className="pagination__btn"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        aria-label="다음 페이지"
      >
        다음
      </button>
    </div>
  );
}
