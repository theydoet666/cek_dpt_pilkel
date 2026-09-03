import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicCheckPage } from '../pages/PublicCheckPage';
import { ProtectedRoute } from './ProtectedRoute';
import { Spinner } from '../components/shared/Spinner';

// Lazy load admin pages for clean code splitting & optimal performance
const AdminLoginPage = lazy(() =>
  import('../pages/admin/AdminLoginPage').then((m) => ({ default: m.AdminLoginPage }))
);
const AdminDashboardPage = lazy(() =>
  import('../pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage }))
);
const AdminUploadPage = lazy(() =>
  import('../pages/admin/AdminUploadPage').then((m) => ({ default: m.AdminUploadPage }))
);
const AdminDataPage = lazy(() =>
  import('../pages/admin/AdminDataPage').then((m) => ({ default: m.AdminDataPage }))
);
const AdminTpsPage = lazy(() =>
  import('../pages/admin/AdminTpsPage').then((m) => ({ default: m.AdminTpsPage }))
);
const AdminHistoryPage = lazy(() =>
  import('../pages/admin/AdminHistoryPage').then((m) => ({ default: m.AdminHistoryPage }))
);
const AdminSettingsPage = lazy(() =>
  import('../pages/admin/AdminSettingsPage').then((m) => ({ default: m.AdminSettingsPage }))
);

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-slate-50">
    <Spinner label="Memuat halaman..." size="lg" />
  </div>
);

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<PublicCheckPage />} />
          <Route path="/hasil" element={<PublicCheckPage />} />

          {/* Admin Login Route */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/upload" element={<AdminUploadPage />} />
            <Route path="/admin/data" element={<AdminDataPage />} />
            <Route path="/admin/tps" element={<AdminTpsPage />} />
            <Route path="/admin/riwayat" element={<AdminHistoryPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};
