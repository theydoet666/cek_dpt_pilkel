import React, { Suspense, lazy, Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicCheckPage } from '../pages/PublicCheckPage';
import { ProtectedRoute } from './ProtectedRoute';
import { Spinner } from '../components/shared/Spinner';
import { AlertCircle, RotateCcw } from 'lucide-react';

// Error Boundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component tree:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 text-white">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-rose-500/20 text-rose-400 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">Terjadi Kesalahan Memuat Halaman</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Modul aplikasi telah diperbarui. Silakan muat ulang halaman untuk mendapatkan versi terbaru.
            </p>
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
const AdminSearchLogsPage = lazy(() =>
  import('../pages/admin/AdminSearchLogsPage').then((m) => ({ default: m.AdminSearchLogsPage }))
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
    <ErrorBoundary>
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
              <Route path="/admin/logs" element={<AdminSearchLogsPage />} />
              <Route path="/admin/upload" element={<AdminUploadPage />} />
              <Route path="/admin/data" element={<AdminDataPage />} />
              <Route path="/admin/tps" element={<AdminTpsPage />} />
              <Route path="/admin/riwayat" element={<AdminHistoryPage />} />
              <Route path="/admin/settings" element={<AdminSettingsPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
};
