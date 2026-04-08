import { useNavigate } from 'react-router';
import '@/styles/pages/dashboard.css';

interface DashboardCard {
  title: string;
  description: string;
  path: string;
}

const CARDS: DashboardCard[] = [
  { title: '회원 관리', description: '회원 조회, 정지 처리', path: '/users' },
  { title: '이벤트 관리', description: '이벤트 생성, 수정, 삭제', path: '/events' },
  { title: '공지사항 관리', description: '공지사항 생성, 수정, 삭제', path: '/notices' },
  { title: '관리자 로그', description: '관리자 액션 이력 조회', path: '/action-logs' },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="dashboard">
      <h2 className="page-title">대시보드</h2>
      <div className="dashboard__cards">
        {CARDS.map((card) => (
          <div
            key={card.path}
            className="dashboard__card"
            onClick={() => navigate(card.path)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(card.path)}
          >
            <h3>{card.title}</h3>
            <p>{card.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
