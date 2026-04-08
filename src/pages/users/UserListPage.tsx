import { useState, useEffect, useCallback } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { getUsers } from '@/api/users';
import { useToast } from '@/hooks/useToast';
import type { UserListResponse } from '@/types/user';
import Pagination from '@/components/common/Pagination';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import StatusBadge from '@/components/common/StatusBadge';
import { formatDate } from '@/utils/format';
import '@/styles/pages/users.css';

export default function UserListPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState<UserListResponse[]>([]);
  const [page, setPage] = useState(Number(searchParams.get('page') || '0'));
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    email: searchParams.get('email') || '',
    nickname: searchParams.get('nickname') || '',
    status: searchParams.get('status') || '',
  });

  const fetchUsers = useCallback(async (currentPage: number, currentFilters: typeof filters) => {
    setIsLoading(true);
    try {
      const result = await getUsers({ ...currentFilters, page: currentPage });
      setUsers(result.content);
      setTotalPages(result.totalPages);
    } catch {
      showToast('error', '회원 목록 조회에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers(page, filters);
    const params: Record<string, string> = {};
    if (page > 0) params.page = String(page);
    if (filters.email) params.email = filters.email;
    if (filters.nickname) params.nickname = filters.nickname;
    if (filters.status) params.status = filters.status;
    setSearchParams(params, { replace: true });
  }, [page, filters, fetchUsers, setSearchParams]);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setPage(0);
  };

  const handleReset = () => {
    setFilters({ email: '', nickname: '', status: '' });
    setPage(0);
  };

  return (
    <div className="user-list">
      <h2 className="page-title">회원 관리</h2>

      <form className="search-form" onSubmit={handleSearch}>
        <div className="form-group">
          <label>이메일</label>
          <input
            type="text"
            value={filters.email}
            onChange={(e) => setFilters((f) => ({ ...f, email: e.target.value }))}
            placeholder="이메일 검색"
          />
        </div>
        <div className="form-group">
          <label>닉네임</label>
          <input
            type="text"
            value={filters.nickname}
            onChange={(e) => setFilters((f) => ({ ...f, nickname: e.target.value }))}
            placeholder="닉네임 검색"
          />
        </div>
        <div className="form-group">
          <label>상태</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="">전체</option>
            <option value="ACTIVE">활성</option>
            <option value="SUSPENDED">정지</option>
            <option value="DELETED">삭제</option>
          </select>
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
                  <th>이메일</th>
                  <th>닉네임</th>
                  <th>역할</th>
                  <th>상태</th>
                  <th>가입일</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-empty">조회된 회원이 없습니다</td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} onClick={() => navigate(`/users/${user.id}`)}>
                      <td>{user.id}</td>
                      <td>{user.email}</td>
                      <td>{user.nickname}</td>
                      <td>{user.role}</td>
                      <td><StatusBadge value={user.status} /></td>
                      <td>{formatDate(user.createdAt)}</td>
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
