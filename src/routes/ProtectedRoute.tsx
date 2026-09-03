import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Spinner } from '../components/shared/Spinner';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <Spinner label="Memeriksa sesi login admin..." size="lg" />
      </div>
    );
  }

  // Hanya izinkan bypass di mode LOCAL DEVELOPMENT jika env placeholder disetel sengaja
  if (import.meta.env.DEV && isPlaceholder) {
    return <Outlet />;
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
};
