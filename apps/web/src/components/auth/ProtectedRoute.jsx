import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export function ProtectedRoute({ adminOnly = false }) {
  const { isAuthenticated, isHydrating, user } = useAuthStore();
  const location = useLocation();

  if (isHydrating) {
    return (
      <div className="flex min-h-[50svh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (adminOnly && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
