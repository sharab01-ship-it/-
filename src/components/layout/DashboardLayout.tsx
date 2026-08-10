import { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { navItems } from '@/config/navigation';
import { isConfigured } from '@/services/api';
import { Menu, LogOut, X, AlertTriangle } from 'lucide-react';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showConfigWarning, setShowConfigWarning] = useState(false);

  useEffect(() => {
    setShowConfigWarning(!isConfigured());
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate('/login');
  }, [logout, navigate]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  const items = navItems.filter((item) => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-surface-bright/95 backdrop-blur-sm border-b border-neutral-100 shadow-md3-1">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-primary-50 transition-colors"
              aria-label="القائمة"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center overflow-hidden">
                <img src="/images/photo_2026-08-03_18-02-01.jpg" alt="شعار زاد الحلقات" className="w-full h-full object-cover" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-base font-bold text-neutral-800 leading-tight">زاد الحلقات</h1>
                <p className="text-xs text-neutral-400 leading-tight">منصة حفظ الأحاديث</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-neutral-700">{user?.name}</p>
              <p className="text-xs text-neutral-400">
                {user?.role === 'admin' ? 'مدير عام' : user?.role === 'supervisor' ? 'مشرف' : 'طالب'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
              {user?.name?.charAt(0) || 'م'}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-error-50 text-neutral-500 hover:text-error-500 transition-colors"
              aria-label="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {showConfigWarning && (
        <div className="bg-warning-50 border-b border-warning-100 px-4 py-2.5 flex items-center gap-2 text-sm text-warning-600">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>لم يتم إعداد رابط Google Apps Script. يرجى إضافة VITE_APPS_SCRIPT_URL في ملف البيئة.</span>
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className={`fixed lg:sticky top-16 right-0 z-20 w-72 h-[calc(100vh-4rem)] bg-surface-bright border-l border-neutral-100 transition-transform duration-300 overflow-y-auto scrollbar-thin ${
            sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="p-4 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `nav-item ${isActive ? 'nav-item-active' : ''}`
                  }
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-10 bg-black/30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 min-w-0 overflow-x-hidden">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
