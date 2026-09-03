import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  Users,
  Building,
  History,
  LogOut,
  Menu,
  X,
  Vote,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useAppLogo } from '../../context/LogoContext';
import clsx from 'clsx';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { logoUrl } = useAppLogo();

  const handleSignOut = async () => {
    await signOut();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Upload Excel', path: '/admin/upload', icon: <Upload className="w-5 h-5" /> },
    { label: 'Data Pemilih', path: '/admin/data', icon: <Users className="w-5 h-5" /> },
    { label: 'Kelola TPS', path: '/admin/tps', icon: <Building className="w-5 h-5" /> },
    { label: 'Riwayat Upload', path: '/admin/riwayat', icon: <History className="w-5 h-5" /> },
    { label: 'Pengaturan Logo', path: '/admin/settings', icon: <ImageIcon className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Navbar */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-md">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-7 h-7 object-contain rounded-lg bg-white/10 p-0.5" />
          ) : (
            <Vote className="w-6 h-6 text-emerald-400" />
          )}
          <span className="font-bold text-sm">Admin DPT Belega</span>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-lg focus:outline-none"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={clsx(
          'fixed md:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 shrink-0 shadow-xl',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-5 space-y-6">
          {/* Logo & Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="w-9 h-9 object-contain bg-white/10 rounded-xl p-1 shadow-md" />
            ) : (
              <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-md">
                <Vote className="w-6 h-6" />
              </div>
            )}
            <div>
              <h2 className="font-bold text-white text-base leading-tight">DPT Belega</h2>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Panel Admin
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-3.5 py-3 rounded-xl font-medium text-sm transition-colors',
                    isActive
                      ? 'bg-emerald-700 text-white shadow-md font-semibold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Info & Logout Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between gap-2">
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-white truncate">
                {user?.email || 'admin@belega.desa.id'}
              </p>
              <p className="text-[11px] text-emerald-400 font-medium">Panitia Perbekel</p>
            </div>

            <button
              onClick={handleSignOut}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout / Keluar"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-2xs">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {title}
          </h1>

          <Link
            to="/"
            target="_blank"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors border border-emerald-200"
          >
            Lihat Halaman Publik ↗
          </Link>
        </header>

        {/* Content Container */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
};
