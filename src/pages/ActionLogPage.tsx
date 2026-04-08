import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { getActionLogs } from '@/api/actionLogs';
import { useToast } from '@/hooks/useToast';
import type { AdminActionLogResponse } from '@/types/actionLog';
import Pagination from '@/components/common/Pagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { formatDate } from '@/utils/format';
import '@/styles/pages/action-logs.css';

export default function ActionLogPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AdminActionLogResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({ adminUserId: '', actionType: '' });

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: { adminUserId?: number; actionType?: string; page: number } = { page };
      if (filters.adminUserId) params.adminUserId = Number(filters.adminUserId);
      if (filters.actionType) params.actionType = filters.actionType;
      const result = await getActionLogs(params);
      setLogs(result.content);
      setTotalPages(result.totalPages);
    } catch {
      showToast('error', '액션 로그 조회에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [page, filters, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  const handleReset = () => {
    setFilters({ adminUserId: '', actionType: '' });
    setPage(0);
  };

  return (
    <div className="action-log-list">
      <h2 className="page-title">관리자 로그</h2>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="form-group">
          <label>관리자 ID</label>
          <input
            type="number"
            value={filters.adminUserId}
            onChange={(e) => setFilters((f) => ({ ...f, adminUserId: e.target.value }))}
            placeholder="관리자 ID"
          />
        </div>
        <div className="form-group">
          <label>액션 유형</label>
          <input
            type="text"
            value={filters.actionType}
            onChange={(e) => setFilters((f) => ({ ...f, actionType: e.target.value }))}
            placeholder="액션 유형"
          />
        </div>
        <div className="search-form__actions">
          <button type="submit" className="btn btn--primary">검색</button>
          <button type="button" className="btn btn--secondary" onClick={handleReset}>초기화</button>
        </div>
      </form>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>관리자 ID</th>
                  <th>액션 유형</th>
                  <th>대상 유형</th>
                  <th>대상 ID</th>
                  <th>상세</th>
                  <th>생성일시</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-empty">조회된 로그가 없습니다</td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} style={{ cursor: 'default' }}>
                      <td>{log.id}</td>
                      <td>{log.adminUserId}</td>
                      <td>{log.actionType}</td>
                      <td>{log.targetType}</td>
                      <td>{log.targetId}</td>
                      <td>{log.detail ?? '-'}</td>
                      <td>{formatDate(log.createdAt)}</td>
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
