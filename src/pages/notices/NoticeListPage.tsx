import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { getNotices } from '@/api/notices';
import { useToast } from '@/hooks/useToast';
import type { NoticeResponse } from '@/types/notice';
import Pagination from '@/components/common/Pagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatDate } from '@/utils/format';
import '@/styles/pages/notices.css';

export default function NoticeListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [notices, setNotices] = useState<NoticeResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotices = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getNotices({ page });
      setNotices(result.content);
      setTotalPages(result.totalPages);
    } catch {
      showToast('error', '공지사항 목록 조회에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [page, showToast]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  return (
    <div className="notice-list">
      <h2 className="page-title">공지사항 관리</h2>

      <div className="page-actions">
        <button className="btn btn--primary" onClick={() => navigate('/notices/new')}>
          공지사항 생성
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>제목</th>
                  <th>공개</th>
                  <th>고정</th>
                  <th>작성자</th>
                  <th>생성일</th>
                </tr>
              </thead>
              <tbody>
                {notices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty">조회된 공지사항이 없습니다</td>
                  </tr>
                ) : (
                  notices.map((notice) => (
                    <tr key={notice.id} onClick={() => navigate(`/notices/${notice.id}`)}>
                      <td>{notice.id}</td>
                      <td>{notice.title}</td>
                      <td>
                        <span className={`badge badge--${notice.isPublished ? 'green' : 'gray'}`}>
                          {notice.isPublished ? '공개' : '비공개'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge badge--${notice.isPinned ? 'blue' : 'gray'}`}>
                          {notice.isPinned ? '고정' : '-'}
                        </span>
                      </td>
                      <td>{notice.createdBy}</td>
                      <td>{formatDate(notice.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
