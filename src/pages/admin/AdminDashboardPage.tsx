import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { StatCard } from '../../components/admin/StatCard';
import { Button } from '../../components/shared/Button';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Upload,
  FileText,
  CheckCircle2,
  History,
  MapPin,
  RefreshCw,
  UserCheck,
  Building,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import type { TPS } from '../../lib/types';

export const AdminDashboardPage: React.FC = () => {
  const [tpsList, setTpsList] = useState<TPS[]>([]);
  const [pemilihCounts, setPemilihCounts] = useState<Record<number, number>>({});
  const [totalPemilih, setTotalPemilih] = useState<number>(0);
  const [totalLaki, setTotalLaki] = useState<number>(0);
  const [totalPerempuan, setTotalPerempuan] = useState<number>(0);
  const [latestBatch, setLatestBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');

      if (isPlaceholder) {
        setTotalPemilih(1542);
        setTotalLaki(780);
        setTotalPerempuan(762);
        setTpsList([
          { id: '1', nomor_tps: 7, nama_lokasi: 'Balai Banjar Jasri', alamat_lokasi: 'Br. Jasri, Desa Belega', dusun: 'Br. Jasri' },
          { id: '2', nomor_tps: 8, nama_lokasi: 'Balai Banjar Kebon', alamat_lokasi: 'Br. Kebon, Desa Belega', dusun: 'Br. Kebon' },
          { id: '3', nomor_tps: 9, nama_lokasi: 'Balai Banjar Belega', alamat_lokasi: 'Br. Belega, Desa Belega', dusun: 'Br. Belega & BTN' },
        ]);
        setPemilihCounts({ 7: 485, 8: 512, 9: 545 });
      } else {
        // 1. Fetch TPS and Counts via RPC get_tps_summary (fast & accurate)
        let loadedTps = false;
        try {
          const { data: summaryData, error: summaryErr } = await supabase.rpc('get_tps_summary');
          if (!summaryErr && summaryData && summaryData.length > 0) {
            setTpsList(summaryData);
            const counts: Record<number, number> = {};
            summaryData.forEach((item: any) => {
              counts[item.nomor_tps] = Number(item.total_pemilih) || 0;
            });
            setPemilihCounts(counts);
            loadedTps = true;
          }
        } catch {
          // fallback to table query
        }

        if (!loadedTps) {
          // Fallback: Fetch all TPS from table
          const { data: tpsData, error: tpsErr } = await supabase
            .from('tps')
            .select('*')
            .order('nomor_tps', { ascending: true });

          if (tpsErr) throw tpsErr;
          setTpsList(tpsData || []);

          // Fetch all active voters with tps_nomor
          const { data: votersData } = await supabase
            .from('pemilih')
            .select('tps_nomor')
            .eq('is_active', true)
            .range(0, 50000);

          if (votersData) {
            const counts: Record<number, number> = {};
            votersData.forEach((row: any) => {
              if (row.tps_nomor !== null && row.tps_nomor !== undefined) {
                counts[row.tps_nomor] = (counts[row.tps_nomor] || 0) + 1;
              }
            });
            setPemilihCounts(counts);
          }
        }

        // 2. Exact count of total active voters
        const { count: totalCount } = await supabase
          .from('pemilih')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);
        setTotalPemilih(totalCount || 0);

        // 3. Count Male voters
        const { count: maleCount } = await supabase
          .from('pemilih')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('jenis_kelamin', 'L');
        setTotalLaki(maleCount || 0);

        // 4. Count Female voters
        const { count: femaleCount } = await supabase
          .from('pemilih')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true)
          .eq('jenis_kelamin', 'P');
        setTotalPerempuan(femaleCount || 0);

        // 6. Fetch latest upload batch
        const { data: batchData } = await supabase
          .from('upload_batches')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        setLatestBatch(batchData || null);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <AdminLayout title="Dashboard Perbekel">
      <div className="space-y-8 animate-fade-in">
        {/* Welcome Banner */}
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
                className="bg-emerald-600 hover:bg-emerald-500 border-none shadow-md"
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
            <button
              onClick={fetchDashboardData}
              disabled={loading}
              className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20"
              title="Perbarui Data Dashboard"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Primary Summary Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total DPT Terdaftar"
            value={totalPemilih}
            subtitle="Warga sah berhak memilih"
            icon={<Users className="w-6 h-6" />}
            variant="emerald"
          />

          <StatCard
            title="Total Lokasi TPS"
            value={tpsList.length}
            subtitle="Tempat Pemungutan Suara"
            icon={<Building2 className="w-6 h-6" />}
            variant="blue"
          />

          <StatCard
            title="Pemilih Laki-laki"
            value={totalLaki}
            subtitle={totalPemilih > 0 ? `${Math.round((totalLaki / totalPemilih) * 100)}% dari total DPT` : '0%'}
            icon={<UserCheck className="w-6 h-6" />}
            variant="indigo"
          />

          <StatCard
            title="Pemilih Perempuan"
            value={totalPerempuan}
            subtitle={totalPemilih > 0 ? `${Math.round((totalPerempuan / totalPemilih) * 100)}% dari total DPT` : '0%'}
            icon={<UserCheck className="w-6 h-6" />}
            variant="amber"
          />
        </div>

        {/* Dynamic TPS Cards Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-700" /> Sebaran Pemilih Per Lokasi TPS
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Data real-time jumlah pemilih aktif di seluruh {tpsList.length} TPS terdaftar di database Supabase.
              </p>
            </div>

            <Link
              to="/admin/tps"
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 shrink-0"
            >
              Kelola Lokasi TPS ↗
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
              <p className="text-sm font-medium">Memuat data TPS & Pemilih...</p>
            </div>
          ) : tpsList.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-2">
              <p className="text-sm font-bold text-slate-700">Belum ada TPS terdaftar di database.</p>
              <Link to="/admin/tps">
                <Button variant="primary" size="sm" className="mt-2">
                  Tambah TPS Sekarang
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tpsList.map((item) => {
                const count = pemilihCounts[item.nomor_tps] || 0;
                const percent = totalPemilih > 0 ? Math.round((count / totalPemilih) * 100) : 0;

                return (
                  <div
                    key={item.id || item.nomor_tps}
                    className="bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-xs">
                          TPS {String(item.nomor_tps).padStart(2, '0')}
                        </span>
                        <span className="text-xs font-bold px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 shadow-2xs">
                          👥 {count} Pemilih
                        </span>
                      </div>

                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-900 transition-colors line-clamp-1">
                          {item.nama_lokasi}
                        </h4>
                        <p className="text-xs text-slate-600 flex items-start gap-1.5 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{item.alamat_lokasi || 'Alamat belum diatur'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-slate-200/60 text-xs">
                      <div className="flex items-center justify-between text-slate-500 text-[11px]">
                        <span className="truncate max-w-[150px]">
                          {item.dusun ? `Cakupan: ${item.dusun}` : '-'}
                        </span>
                        <span className="font-bold text-emerald-800">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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

            {latestBatch ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">
                      {latestBatch.file_name || 'File DPT.xlsx'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      Status: <span className="text-emerald-700 font-semibold uppercase">{latestBatch.status} ({latestBatch.mode})</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-900 block">{latestBatch.valid_rows || 0} data</span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(latestBatch.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center text-xs text-slate-500">
                Belum ada riwayat batch upload file Excel.
              </div>
            )}
          </div>

          {/* Quick Info Box */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Panduan Panitia
            </h3>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Upload file rekap Excel dengan sheet "Lolos". Kolom NIK, Nama, Alamat, dan Nomor TPS dibaca otomatis.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Gunakan mode <strong>Upsert by NIK</strong> agar data yang sudah ada diperbarui tanpa duplikasi.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Data TPS dan pemilih yang diupdate langsung dapat diakses warga pada portal pengecekan DPT online.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
