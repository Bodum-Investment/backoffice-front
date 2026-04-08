import { Routes, Route, Navigate } from 'react-router';
import { useAuth } from '@/hooks/useAuth';
import AdminLayout from '@/components/layout/AdminLayout';
import DuplicateLoginModal from '@/components/common/DuplicateLoginModal';
import Toast from '@/components/common/Toast';
import PrivateRoute from '@/routes/PrivateRoute';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import UserListPage from '@/pages/users/UserListPage';
import UserDetailPage from '@/pages/users/UserDetailPage';
import EventListPage from '@/pages/events/EventListPage';
import EventFormPage from '@/pages/events/EventFormPage';
import NoticeListPage from '@/pages/notices/NoticeListPage';
import NoticeFormPage from '@/pages/notices/NoticeFormPage';
import ActionLogPage from '@/pages/ActionLogPage';

export default function App() {
  const { showDuplicateLoginModal, closeDuplicateLoginModal } = useAuth();

  return (
    <>
      <DuplicateLoginModal show={showDuplicateLoginModal} onClose={closeDuplicateLoginModal} />
      <Toast />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<PrivateRoute><AdminLayout><DashboardPage /></AdminLayout></PrivateRoute>} />
        <Route path="/users" element={<PrivateRoute><AdminLayout><UserListPage /></AdminLayout></PrivateRoute>} />
        <Route path="/users/:userId" element={<PrivateRoute><AdminLayout><UserDetailPage /></AdminLayout></PrivateRoute>} />
        <Route path="/events" element={<PrivateRoute><AdminLayout><EventListPage /></AdminLayout></PrivateRoute>} />
        <Route path="/events/new" element={<PrivateRoute><AdminLayout><EventFormPage /></AdminLayout></PrivateRoute>} />
        <Route path="/events/:eventId" element={<PrivateRoute><AdminLayout><EventFormPage /></AdminLayout></PrivateRoute>} />
        <Route path="/notices" element={<PrivateRoute><AdminLayout><NoticeListPage /></AdminLayout></PrivateRoute>} />
        <Route path="/notices/new" element={<PrivateRoute><AdminLayout><NoticeFormPage /></AdminLayout></PrivateRoute>} />
        <Route path="/notices/:noticeId" element={<PrivateRoute><AdminLayout><NoticeFormPage /></AdminLayout></PrivateRoute>} />
        <Route path="/action-logs" element={<PrivateRoute><AdminLayout><ActionLogPage /></AdminLayout></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
