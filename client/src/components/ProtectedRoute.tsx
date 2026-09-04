import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoadingState } from './StateViews';

export default function ProtectedRoute({ role, children }: { role: 'COMPANY' | 'NGO'; children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingState label="Loading…" />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== role) return <Navigate to={user.role === 'NGO' ? '/ngo' : '/'} replace />;

  return <>{children}</>;
}
