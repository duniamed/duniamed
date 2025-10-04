import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: Array<'patient' | 'specialist' | 'clinic_admin' | 'admin'>;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
        return;
      }

      // System admin users (from user_roles table) can access everything
      if (isAdmin) {
        return;
      }

      // Check profile role for regular role-based access
      if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
        // Redirect to appropriate dashboard based on role
        if (profile.role === 'patient') {
          navigate('/dashboard');
        } else if (profile.role === 'specialist') {
          navigate('/specialist/dashboard');
        } else if (profile.role === 'clinic_admin') {
          navigate('/clinic/dashboard');
        }
      }
    }
  }, [user, profile, isAdmin, loading, navigate, allowedRoles]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // System admin users (from user_roles table) can access everything
  if (isAdmin) {
    return <>{children}</>;
  }

  // Check profile role for regular role-based access
  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return null;
  }

  return <>{children}</>;
}
