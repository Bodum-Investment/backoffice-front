import { NavLink } from 'react-router';

interface MenuItem {
  path: string;
  label: string;
}

const MENU_ITEMS: MenuItem[] = [
  { path: '/', label: '대시보드' },
  { path: '/users', label: '회원 관리' },
  { path: '/events', label: '이벤트 관리' },
  { path: '/notices', label: '공지사항 관리' },
  { path: '/action-logs', label: '관리자 로그' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <nav className="sidebar__nav">
        {MENU_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `sidebar__link ${isActive ? 'sidebar__link--active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
