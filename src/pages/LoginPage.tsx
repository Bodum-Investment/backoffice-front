import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, Navigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import '@/styles/pages/login.css';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const ERROR_MESSAGES: Record<string, string> = {
    INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다',
    ACCOUNT_SUSPENDED: '정지된 계정입니다',
    ACCOUNT_DELETED: '삭제된 계정입니다',
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      setErrorMessage(ERROR_MESSAGES[msg] ?? '로그인에 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  return (
    <div className="login-page">
      <form className="login-form" onSubmit={handleSubmit}>
        <h1 className="login-title">보듬 백오피스</h1>
        <div className="form-group">
          <label htmlFor="email">이메일</label>
          <input
            id="email" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@example.com"
            autoComplete="email"
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">비밀번호</label>
          <input
            id="password" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            autoComplete="current-password"
          />
        </div>
        {errorMessage && <p className="form-error">{errorMessage}</p>}
        <button type="submit" className="btn btn--primary btn--full" disabled={!isFormValid || isLoading}>
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>
    </div>
  );
}
