import type { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-layout">
      <Header />
      <div className="admin-layout__body">
        <Sidebar />
        <main className="admin-layout__content">
          {children}
        </main>
      </div>
    </div>
  );
}
