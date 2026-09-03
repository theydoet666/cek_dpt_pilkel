import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PublicCheckPage } from '../pages/PublicCheckPage';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage';
import { AdminUploadPage } from '../pages/admin/AdminUploadPage';
import { AdminDataPage } from '../pages/admin/AdminDataPage';
import { AdminTpsPage } from '../pages/admin/AdminTpsPage';
import { AdminHistoryPage } from '../pages/admin/AdminHistoryPage';
import { AdminSettingsPage } from '../pages/admin/AdminSettingsPage';
import { ProtectedRoute } from './ProtectedRoute';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
};
