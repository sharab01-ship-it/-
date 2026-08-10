import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { UserRole } from '@/types';
import { FullPageSpinner } from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: UserRole[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullPageSpinner message="جاري التحقق من الجلسة..." />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    const dashboardPath =
      user.role === 'admin' ? '/dashboard' :
      user.role === 'supervisor' ? '/dashboard' :
      '/dashboard';
    return <Navigate to={dashboardPath} replace />;
  }

  return <>{children}</>;
}
