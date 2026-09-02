import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { StatCard } from '../../components/admin/StatCard';
import { Button } from '../../components/shared/Button';
import { Link } from 'react-router-dom';
import { Users, Building2, Upload, FileText, CheckCircle2, History } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalPemilih: 1542,
    tps7Count: 485,
    tps8Count: 512,
    tps9Count: 545,
    lastUpload: '2 September 2026, 14:00 WITA',
  });

  useEffect(() => {
    async function fetchStats() {
      try {
        const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');
        if (!isPlaceholder) {
          // Count total pemilih
          const { count: total } = await supabase
            .from('pemilih')
            .select('*', { count: 'exact', head: true })
            .eq('is_active', true);

          // Count TPS 7
          const { count: count7 } = await supabase
            .from('pemilih')
            .select('*', { count: 'exact', head: true })
            .eq('tps_nomor', 7)
            .eq('is_active', true);

          // Count TPS 8
          const { count: count8 } = await supabase
            .from('pemilih')
            .select('*', { count: 'exact', head: true })
            .eq('tps_nomor', 8)
            .eq('is_active', true);

          // Count TPS 9
          const { count: count9 } = await supabase
            .from('pemilih')
            .select('*', { count: 'exact', head: true })
            .eq('tps_nomor', 9)
            .eq('is_active', true);

          setStats({
            totalPemilih: total || 0,
            tps7Count: count7 || 0,
            tps8Count: count8 || 0,
            tps9Count: count9 || 0,
            lastUpload: 'Baru saja diupdate',
          });
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    }

    fetchStats();
  }, []);

  return (
    <AdminLayout title="Dashboard Perbekel">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-md">
              Desa Belega, Kec. Blahbatuh
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Selamat Datang di Panel Admin DPT
            </h2>
            <p className="text-sm text-emerald-100 max-w-xl">
              Kelola data Pemutakhiran Data Pemilih Berkelanjutan (PDPB) untuk Pemilihan Perbekel Desa Belega.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/admin/upload">
              <Button
                variant="primary"
                size="md"
                icon={<Upload className="w-4 h-4" />}
                className="bg-emerald-600 hover:bg-emerald-500 border-none"
              >
                Upload Excel DPT
              </Button>
            </Link>
            <Link to="/admin/data">
              <Button
                variant="outline"
                size="md"
                icon={<Users className="w-4 h-4" />}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Kelola Data
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total DPT Belega"
            value={stats.totalPemilih}
            subtitle="Warga terdaftar sah"
            icon={<Users className="w-6 h-6" />}
            variant="emerald"
          />

          <StatCard
            title="TPS 7 (Br. Jasri)"
            value={stats.tps7Count}
            subtitle="Balai Banjar Jasri"
            icon={<Building2 className="w-6 h-6" />}
            variant="blue"
          />

          <StatCard
            title="TPS 8 (Br. Kebon)"
            value={stats.tps8Count}
            subtitle="Balai Banjar Kebon"
            icon={<Building2 className="w-6 h-6" />}
            variant="indigo"
          />

          <StatCard
            title="TPS 9 (Br. Belega & BTN)"
            value={stats.tps9Count}
            subtitle="Balai Banjar Belega / Kompleks BTN"
            icon={<Building2 className="w-6 h-6" />}
            variant="amber"
          />
        </div>

        {/* Action Widgets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Upload Log Widget */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-700" /> Ringkasan Upload Terakhir
              </h3>

              <Link
                to="/admin/riwayat"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                Lihat Semua ↗
              </Link>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Contoh Format DPT.xlsx
                  </h4>
                  <p className="text-xs text-slate-500">
                    Status: <span className="text-emerald-700 font-semibold">Sukses (Upsert)</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 block">1,542 data</span>
                <span className="text-[11px] text-slate-400">2 Sep 2026</span>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Panduan Panitia
            </h3>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Upload file rekap Excel dengan sheet "Lolos". Sistem membaca header secara otomatis.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Gunakan mode <strong>Upsert by NIK</strong> agar data lama tidak terhapus.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Perubahan data langsung dapat diakses warga di halaman publik.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
