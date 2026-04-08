import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const { logout } = useAuth();

  return (
    <header className="header">
      <div className="header__logo">보듬 백오피스</div>
      <div className="header__actions">
        <button className="header__logout-btn" onClick={logout}>
          로그아웃
        </button>
      </div>
    </header>
  );
}
