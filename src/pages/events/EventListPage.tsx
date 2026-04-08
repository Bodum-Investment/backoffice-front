import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { getEvents } from '@/api/events';
import { useToast } from '@/hooks/useToast';
import type { EventResponse } from '@/types/event';
import Pagination from '@/components/common/Pagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/format';
import '@/styles/pages/events.css';

export default function EventListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getEvents({ status: statusFilter || undefined, page });
      setEvents(result.content);
      setTotalPages(result.totalPages);
    } catch {
      showToast('error', '이벤트 목록 조회에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, showToast]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="event-list">
      <h2 className="page-title">이벤트 관리</h2>

      <div className="page-toolbar">
        <div className="search-form">
          <div className="form-group">
            <label>상태</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            >
              <option value="">전체</option>
              <option value="UPCOMING">예정</option>
              <option value="ONGOING">진행중</option>
              <option value="ENDED">종료</option>
            </select>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn btn--primary" onClick={() => navigate('/events/new')}>
            이벤트 생성
          </button>
        </div>
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
                  <th>상태</th>
                  <th>시작일시</th>
                  <th>종료일시</th>
                  <th>활성화</th>
                  <th>생성일</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-empty">조회된 이벤트가 없습니다</td>
                  </tr>
                ) : (
                  events.map((event) => (
                    <tr key={event.id} onClick={() => navigate(`/events/${event.id}`)}>
                      <td>{event.id}</td>
                      <td>{event.title}</td>
                      <td><StatusBadge value={event.status} /></td>
                      <td>{formatDate(event.startAt)}</td>
                      <td>{formatDate(event.endAt)}</td>
                      <td>{event.isActive ? 'O' : 'X'}</td>
                      <td>{formatDate(event.createdAt)}</td>
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
