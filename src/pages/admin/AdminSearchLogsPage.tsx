import React, { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { StatCard } from '../../components/admin/StatCard';
import { Button } from '../../components/shared/Button';
import { Modal } from '../../components/shared/Modal';
import { supabase } from '../../lib/supabaseClient';
import type { SearchLog, SearchFrequencyItem, SearchStatsSummary } from '../../lib/types';
import {
  Search,
  Users,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Flame,
  Clock,
  MapPin,
  TrendingUp,
  Copy,
  Check,
  Database,
  ChevronLeft,
  ChevronRight,
  UserX,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import clsx from 'clsx';

// Demo initial mock logs jika belum ada data di Supabase
const INITIAL_DEMO_LOGS: SearchLog[] = [
  {
    id: 'log-1',
    query_raw: 'I Gede Arie Saputra',
    query_clean: 'I GEDE ARIE SAPUTRA',
    search_type: 'NAMA',
    is_found: true,
    result_count: 1,
    matched_nama: 'I GEDE ARIE SAPUTRA',
    tps_nomor: 7,
    created_at: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
  },
  {
    id: 'log-2',
    query_raw: 'I Gede Arie Saputra',
    query_clean: 'I GEDE ARIE SAPUTRA',
    search_type: 'NAMA',
    is_found: true,
    result_count: 1,
    matched_nama: 'I GEDE ARIE SAPUTRA',
    tps_nomor: 7,
    created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
  },
  {
    id: 'log-3',
    query_raw: 'I Gede Arie',
    query_clean: 'I GEDE ARIE',
    search_type: 'NAMA',
    is_found: true,
    result_count: 1,
    matched_nama: 'I GEDE ARIE SAPUTRA',
    tps_nomor: 7,
    created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: 'log-4',
    query_raw: 'Ni Wayan Sariasih',
    query_clean: 'NI WAYAN SARIASIH',
    search_type: 'NAMA',
    is_found: true,
    result_count: 1,
    matched_nama: 'NI WAYAN SARIASIH',
    tps_nomor: 8,
    created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
  },
  {
    id: 'log-5',
    query_raw: 'Budi Santoso',
    query_clean: 'BUDI SANTOSO',
    search_type: 'NAMA',
    is_found: false,
    result_count: 0,
    matched_nama: null,
    tps_nomor: null,
    created_at: new Date(Date.now() - 1000 * 60 * 130).toISOString(),
  },
  {
    id: 'log-6',
    query_raw: 'Budi Santoso',
    query_clean: 'BUDI SANTOSO',
    search_type: 'NAMA',
    is_found: false,
    result_count: 0,
    matched_nama: null,
    tps_nomor: null,
    created_at: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
  },
  {
    id: 'log-7',
    query_raw: 'Kadek Dwi Permana',
    query_clean: 'KADEK DWI PERMANA',
    search_type: 'NAMA',
    is_found: false,
    result_count: 0,
    matched_nama: null,
    tps_nomor: null,
    created_at: new Date(Date.now() - 1000 * 60 * 260).toISOString(),
  },
  {
    id: 'log-8',
    query_raw: 'Sayu Putri Ari Pratiwi',
    query_clean: 'SAYU PUTRI ARI PRATIWI',
    search_type: 'NAMA',
    is_found: true,
    result_count: 1,
    matched_nama: 'SAYU PUTRI ARI PRATIWI',
    tps_nomor: 9,
    created_at: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
  },
];

// Helper Waktu Relatif Bahasa Indonesia
function formatTimeAgo(dateString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000);
    if (diff < 60) return 'Baru saja';
    if (diff < 3600) return `${Math.floor(diff / 60)} mnt lalu`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} jam lalu`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} hari lalu`;
    return new Date(dateString).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  } catch {
    return dateString;
  }
}

export const AdminSearchLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'frequency' | 'not_found' | 'raw_logs'>('frequency');
  const [logs, setLogs] = useState<SearchLog[]>(INITIAL_DEMO_LOGS);
  const [frequencyList, setFrequencyList] = useState<SearchFrequencyItem[]>([]);
  const [stats, setStats] = useState<SearchStatsSummary>({
    total_searches: 8,
    unique_queries: 5,
    total_found: 5,
    total_not_found: 3,
    unique_not_found: 2,
  });
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'found' | 'not_found'>('all');
  const [needsMigration, setNeedsMigration] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const fallbackToLocal = () => {
    let localLogs: SearchLog[] = [];
    try {
      const stored = localStorage.getItem('demo_search_logs');
      if (stored) {
        localLogs = JSON.parse(stored);
      }
    } catch {
      // ignore
    }

    const combinedLogs = localLogs.length > 0 ? [...localLogs, ...INITIAL_DEMO_LOGS] : INITIAL_DEMO_LOGS;
    const uniqueLogs = Array.from(
      new Map(combinedLogs.map((item) => [item.id || item.created_at + item.query_clean, item])).values()
    );
    setLogs(uniqueLogs);
    calculateLocalAggregations(uniqueLogs);
  };

  const fetchLogsData = async () => {
    setLoading(true);
    try {
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');

      if (isPlaceholder) {
        fallbackToLocal();
      } else {
        // 1. Fetch Raw Logs
        const { data: logsData, error: logsErr } = await supabase
          .from('search_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1000);

        if (logsErr) {
          if (
            logsErr.code === 'PGRST205' ||
            logsErr.message?.includes('schema cache') ||
            logsErr.message?.includes('does not exist')
          ) {
            setNeedsMigration(true);
            fallbackToLocal();
            return;
          }
          throw logsErr;
        }

        setNeedsMigration(false);

        // 2. Fetch Summary Stats via Supabase RPC get_search_stats
        let rpcStatsSuccess = false;
        try {
          const { data: statsData, error: statsErr } = await supabase.rpc('get_search_stats');
          if (!statsErr && statsData) {
            setStats(statsData);
            rpcStatsSuccess = true;
          }
        } catch {
          // fallback
        }

        if (logsData && logsData.length > 0) {
          setLogs(logsData);

          if (!rpcStatsSuccess) {
            calculateLocalAggregations(logsData);
          } else {
            // 3. Fetch Frequency List via RPC
            const { data: freqData, error: freqErr } = await supabase.rpc('get_search_name_frequency', {
              only_not_found: false,
            });

            if (!freqErr && freqData) {
              setFrequencyList(freqData);
            } else {
              calculateLocalFrequency(logsData);
            }
          }
        } else {
          setLogs([]);
          setFrequencyList([]);
          setStats({
            total_searches: 0,
            unique_queries: 0,
            total_found: 0,
            total_not_found: 0,
            unique_not_found: 0,
          });
        }
      }
    } catch (err: any) {
      console.warn('Fallback due to search logs error:', err?.message || err);
      fallbackToLocal();
    } finally {
      setLoading(false);
    }
  };

  const calculateLocalFrequency = (allLogs: SearchLog[]) => {
    const map = new Map<string, SearchFrequencyItem>();

    allLogs.forEach((item) => {
      const key = item.query_clean || item.query_raw.trim().toUpperCase();
      if (!map.has(key)) {
        map.set(key, {
          query_clean: key,
          search_type: item.search_type || 'NAMA',
          search_count: 1,
          is_found: item.is_found,
          matched_nama: item.matched_nama,
          tps_nomor: item.tps_nomor,
          first_searched_at: item.created_at,
          last_searched_at: item.created_at,
        });
      } else {
        const existing = map.get(key)!;
        existing.search_count += 1;
        if (item.is_found) existing.is_found = true;
        if (item.matched_nama && !existing.matched_nama) existing.matched_nama = item.matched_nama;
        if (item.tps_nomor && !existing.tps_nomor) existing.tps_nomor = item.tps_nomor;
        if (new Date(item.created_at) < new Date(existing.first_searched_at)) {
          existing.first_searched_at = item.created_at;
        }
        if (new Date(item.created_at) > new Date(existing.last_searched_at)) {
          existing.last_searched_at = item.created_at;
        }
      }
    });

    const list = Array.from(map.values()).sort((a, b) => b.search_count - a.search_count);
    setFrequencyList(list);
  };

  const calculateLocalAggregations = (allLogs: SearchLog[]) => {
    calculateLocalFrequency(allLogs);

    const total_searches = allLogs.length;
    const uniqueQueriesSet = new Set(allLogs.map((l) => l.query_clean));
    const unique_queries = uniqueQueriesSet.size;
    const total_found = allLogs.filter((l) => l.is_found).length;
    const total_not_found = allLogs.filter((l) => !l.is_found).length;

    const notFoundSet = new Set(allLogs.filter((l) => !l.is_found).map((l) => l.query_clean));
    const unique_not_found = notFoundSet.size;

    setStats({
      total_searches,
      unique_queries,
      total_found,
      total_not_found,
      unique_not_found,
    });
  };

  useEffect(() => {
    fetchLogsData();
  }, []);

  // Reset page when tab or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchFilter, statusFilter]);

  // Filtered Frequency List
  const filteredFrequencyList = useMemo(() => {
    return frequencyList.filter((item) => {
      const matchSearch =
        item.query_clean.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.matched_nama && item.matched_nama.toLowerCase().includes(searchFilter.toLowerCase()));

      const matchStatus =
        statusFilter === 'all' ? true : statusFilter === 'found' ? item.is_found : !item.is_found;

      return matchSearch && matchStatus;
    });
  }, [frequencyList, searchFilter, statusFilter]);

  // List Nama Tidak Ditemukan Khusus
  const notFoundList = useMemo(() => {
    return frequencyList
      .filter((item) => !item.is_found)
      .filter((item) => item.query_clean.toLowerCase().includes(searchFilter.toLowerCase()));
  }, [frequencyList, searchFilter]);

  // Filtered Raw Logs
  const filteredRawLogs = useMemo(() => {
    return logs.filter((item) => {
      const matchSearch =
        item.query_raw.toLowerCase().includes(searchFilter.toLowerCase()) ||
        item.query_clean.toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.matched_nama && item.matched_nama.toLowerCase().includes(searchFilter.toLowerCase()));

      const matchStatus =
        statusFilter === 'all' ? true : statusFilter === 'found' ? item.is_found : !item.is_found;

      return matchSearch && matchStatus;
    });
  }, [logs, searchFilter, statusFilter]);

  // Pagination Slicing
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    if (activeTab === 'frequency') {
      return filteredFrequencyList.slice(startIndex, startIndex + pageSize);
    } else if (activeTab === 'not_found') {
      return notFoundList.slice(startIndex, startIndex + pageSize);
    } else {
      return filteredRawLogs.slice(startIndex, startIndex + pageSize);
    }
  }, [activeTab, filteredFrequencyList, notFoundList, filteredRawLogs, currentPage]);

  const totalItemCount = useMemo(() => {
    if (activeTab === 'frequency') return filteredFrequencyList.length;
    if (activeTab === 'not_found') return notFoundList.length;
    return filteredRawLogs.length;
  }, [activeTab, filteredFrequencyList.length, notFoundList.length, filteredRawLogs.length]);

  const totalPages = Math.max(1, Math.ceil(totalItemCount / pageSize));

  // Export CSV Handler
  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: string[][] = [];
    let filename = `laporan-pengecekan-dpt-${new Date().toISOString().split('T')[0]}.csv`;

    if (activeTab === 'frequency') {
      headers = ['No', 'Nama / Query', 'Tipe', 'Frekuensi Dicek', 'Status DPT', 'Nama Cocok', 'TPS', 'Terakhir Dicek'];
      rows = filteredFrequencyList.map((item, idx) => [
        String(idx + 1),
        `"${item.query_clean}"`,
        item.search_type,
        String(item.search_count),
        item.is_found ? 'Terdaftar' : 'Tidak Ditemukan',
        `"${item.matched_nama || '-'}"`,
        item.tps_nomor ? `TPS ${item.tps_nomor}` : '-',
        new Date(item.last_searched_at).toLocaleString('id-ID'),
      ]);
    } else if (activeTab === 'not_found') {
      headers = ['No', 'Nama Warga Belum Terdaftar', 'Jumlah Percobaan Cek', 'Terakhir Dicari'];
      rows = notFoundList.map((item, idx) => [
        String(idx + 1),
        `"${item.query_clean}"`,
        String(item.search_count),
        new Date(item.last_searched_at).toLocaleString('id-ID'),
      ]);
      filename = `daftar-warga-tidak-terdaftar-dpt-${new Date().toISOString().split('T')[0]}.csv`;
    } else {
      headers = ['Waktu', 'Kata Kunci', 'Tipe', 'Status', 'Hasil', 'TPS'];
      rows = filteredRawLogs.map((item) => [
        new Date(item.created_at).toLocaleString('id-ID'),
        `"${item.query_raw}"`,
        item.search_type,
        item.is_found ? 'Ditemukan' : 'Tidak Ditemukan',
        `"${item.matched_nama || '-'}"`,
        item.tps_nomor ? `TPS ${item.tps_nomor}` : '-',
      ]);
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SQL_MIGRATION_TEXT = `-- 1. TABEL LOG PENCARIAN PUBLIK (SEARCH LOGS)
create table if not exists public.search_logs (
  id uuid primary key default gen_random_uuid(),
  query_raw text not null,
  query_clean text not null,
  search_type text check (search_type in ('NAMA', 'NIK')) default 'NAMA',
  is_found boolean not null default false,
  result_count int not null default 0,
  matched_nama text,
  tps_nomor int,
  created_at timestamptz not null default now()
);

create index if not exists idx_search_logs_query on public.search_logs (query_clean);
create index if not exists idx_search_logs_found on public.search_logs (is_found);
create index if not exists idx_search_logs_created on public.search_logs (created_at desc);

alter table public.search_logs enable row level security;
create policy "admin_all_search_logs" on public.search_logs for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- 2. FUNGSI PENCARIAN PUBLIK & LOGGING OTOMATIS
create or replace function public.search_pemilih(q text)
returns table (
  nama text, nik_tersamar text, alamat text,
  tps_nomor int, tps_lokasi text, status_dpt text
)
language plpgsql security definer set search_path = public as $$
declare
  clean_q text := trim(q);
  is_16_digit boolean;
  s_type text := 'NAMA';
  found_count int := 0;
  first_nama text := null;
  first_tps int := null;
begin
  if clean_q is null or length(clean_q) = 0 then return; end if;
  is_16_digit := (clean_q ~ '^[0-9]{16}$');
  if is_16_digit then s_type := 'NIK'; end if;

  drop table if exists temp_search_results;
  create temp table temp_search_results as
  select
    p.nama,
    case
      when p.nik ilike '%*%' then split_part(p.nik, '#', 1)
      when length(split_part(p.nik, '#', 1)) >= 16 then concat(left(split_part(p.nik, '#', 1), 4), '********', right(split_part(p.nik, '#', 1), 4))
      when length(split_part(p.nik, '#', 1)) >= 8 then concat(left(split_part(p.nik, '#', 1), 2), '****', right(split_part(p.nik, '#', 1), 2))
      else split_part(p.nik, '#', 1)
    end as nik_tersamar,
    p.alamat, p.tps_nomor,
    coalesce(t.nama_lokasi, concat('Balai Banjar / Lokasi TPS ', p.tps_nomor)) as tps_lokasi,
    p.status_dpt
  from public.pemilih p
  left join public.tps t on t.nomor_tps = p.tps_nomor
  where p.is_active = true and (
    case when is_16_digit then (split_part(p.nik, '#', 1) = clean_q or (p.nik like '%*%' and length(split_part(split_part(p.nik, '#', 1), '*', 1)) >= 6 and left(clean_q, length(split_part(split_part(p.nik, '#', 1), '*', 1))) = split_part(split_part(p.nik, '#', 1), '*', 1)))
    else (length(clean_q) >= 3 and p.nama ilike '%' || clean_q || '%') end
  ) limit 20;

  select count(*), max(temp_search_results.nama), max(temp_search_results.tps_nomor)
  into found_count, first_nama, first_tps from temp_search_results;

  insert into public.search_logs (
    query_raw, query_clean, search_type, is_found, result_count, matched_nama, tps_nomor, created_at
  ) values (
    q, upper(clean_q), s_type, (found_count > 0), found_count,
    case when found_count = 1 then first_nama when found_count > 1 then concat(first_nama, ' (+', found_count - 1, ' lainnya)') else null end,
    first_tps, now()
  );

  return query select * from temp_search_results;
end;
$$;
grant execute on function public.search_pemilih(text) to anon, authenticated;

-- 3. FUNGSI STATISTIK LOG PENCARIAN
create or replace function public.get_search_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  total_searches bigint := 0; unique_queries bigint := 0;
  total_found bigint := 0; total_not_found bigint := 0; unique_not_found bigint := 0;
begin
  select
    coalesce(count(*), 0), coalesce(count(distinct query_clean), 0),
    coalesce(count(*) filter (where is_found = true), 0),
    coalesce(count(*) filter (where is_found = false), 0),
    coalesce(count(distinct query_clean) filter (where is_found = false), 0)
  into total_searches, unique_queries, total_found, total_not_found, unique_not_found
  from public.search_logs;

  return jsonb_build_object(
    'total_searches', total_searches, 'unique_queries', unique_queries,
    'total_found', total_found, 'total_not_found', total_not_found,
    'unique_not_found', unique_not_found
  );
end;
$$;
grant execute on function public.get_search_stats() to authenticated;

-- 4. FUNGSI REKAP FREKUENSI NAMA UNIK
create or replace function public.get_search_name_frequency(only_not_found boolean default false)
returns table (
  query_clean text, search_type text, search_count bigint,
  is_found boolean, matched_nama text, tps_nomor int,
  first_searched_at timestamptz, last_searched_at timestamptz
) language plpgsql security definer set search_path = public as $$
begin
  return query select
    sl.query_clean, max(sl.search_type) as search_type, count(*) as search_count,
    bool_or(sl.is_found) as is_found, max(sl.matched_nama) as matched_nama, max(sl.tps_nomor) as tps_nomor,
    min(sl.created_at) as first_searched_at, max(sl.created_at) as last_searched_at
  from public.search_logs sl
  where (only_not_found is false or sl.is_found is false)
  group by sl.query_clean order by count(*) desc, max(sl.created_at) desc;
end;
$$;
grant execute on function public.get_search_name_frequency(boolean) to authenticated;`;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SQL_MIGRATION_TEXT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <AdminLayout title="Log & Rekapitulasi Pengecekan DPT">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Modern Top Hero Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-7 shadow-xs relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-full">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-700" />
                <span>Audit Log & Analisis Frekuensi Pencarian Warga</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Rekapitulasi Riwayat Pengecekan
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Pantau nama-nama yang dicek masyarakat, frekuensi pencarian per nama unik, serta identifikasi warga yang mencari namun belum terdaftar di DPT.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {needsMigration && (
                <button
                  onClick={() => setShowSqlModal(true)}
                  className="px-3.5 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-2xs"
                >
                  <Database className="w-4 h-4 text-amber-700" />
                  <span>Setup Supabase SQL</span>
                </button>
              )}

              <Button
                variant="outline"
                size="md"
                icon={<Download className="w-4 h-4 text-slate-600" />}
                onClick={handleExportCSV}
                className="bg-white hover:bg-slate-50 text-slate-800 border-slate-300 text-xs font-bold shadow-2xs"
              >
                Export CSV
              </Button>

              <button
                onClick={fetchLogsData}
                disabled={loading}
                className="p-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors shadow-sm disabled:opacity-50"
                title="Perbarui Data Log"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* 4 Compact Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
          <StatCard
            title="Total Pengecekan"
            value={stats.total_searches}
            subtitle="Seluruh aktivitas pencarian"
            icon={<Search className="w-5 h-5" />}
            variant="blue"
          />

          <StatCard
            title="Nama Unik Dicek"
            value={stats.unique_queries}
            subtitle="Dihitung 1 kali per nama"
            icon={<Users className="w-5 h-5" />}
            variant="emerald"
          />

          <StatCard
            title="Ditemukan di DPT"
            value={stats.total_found}
            subtitle={stats.total_searches > 0 ? `${Math.round((stats.total_found / stats.total_searches) * 100)}% berhasil` : '0%'}
            icon={<CheckCircle2 className="w-5 h-5" />}
            variant="indigo"
          />

          <StatCard
            title="Belum Terdaftar"
            value={stats.unique_not_found}
            subtitle={`${stats.total_not_found} kali percobaan gagal`}
            icon={<AlertTriangle className="w-5 h-5" />}
            variant="amber"
          />
        </div>

        {/* Main Table Container */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-sm space-y-5">
          {/* Controls Bar: Tabs, Search & Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            {/* Elegant Segmented Tab Switcher */}
            <div className="flex items-center bg-slate-100/90 p-1.5 rounded-2xl gap-1 overflow-x-auto w-full lg:w-auto">
              <button
                onClick={() => setActiveTab('frequency')}
                className={clsx(
                  'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                  activeTab === 'frequency'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Flame className={clsx('w-4 h-4', activeTab === 'frequency' ? 'text-amber-500' : 'text-slate-400')} />
                <span>Rekap Frekuensi Nama</span>
                <span className={clsx('text-[11px] px-1.5 py-0.5 rounded-md font-bold', activeTab === 'frequency' ? 'bg-emerald-100 text-emerald-900' : 'bg-slate-200 text-slate-600')}>
                  {frequencyList.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('not_found')}
                className={clsx(
                  'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                  activeTab === 'not_found'
                    ? 'bg-rose-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <UserX className="w-4 h-4 text-rose-300" />
                <span>Belum Terdaftar</span>
                <span className={clsx('text-[11px] px-1.5 py-0.5 rounded-md font-bold', activeTab === 'not_found' ? 'bg-rose-800 text-rose-100' : 'bg-rose-100 text-rose-800')}>
                  {stats.unique_not_found}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('raw_logs')}
                className={clsx(
                  'px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap',
                  activeTab === 'raw_logs'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Clock className="w-4 h-4 text-slate-400" />
                <span>Audit Log</span>
                <span className={clsx('text-[11px] px-1.5 py-0.5 rounded-md font-bold', activeTab === 'raw_logs' ? 'bg-slate-800 text-slate-200' : 'bg-slate-200 text-slate-600')}>
                  {logs.length}
                </span>
              </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative min-w-[220px] flex-1 sm:flex-initial">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama atau query..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium placeholder:text-slate-400"
                />
              </div>

              {activeTab !== 'not_found' && (
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={clsx(
                      'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors',
                      statusFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                    )}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setStatusFilter('found')}
                    className={clsx(
                      'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors',
                      statusFilter === 'found' ? 'bg-emerald-700 text-white shadow-2xs font-bold' : 'text-slate-500'
                    )}
                  >
                    Ditemukan
                  </button>
                  <button
                    onClick={() => setStatusFilter('not_found')}
                    className={clsx(
                      'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors',
                      statusFilter === 'not_found' ? 'bg-rose-700 text-white shadow-2xs font-bold' : 'text-slate-500'
                    )}
                  >
                    Gagal
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* TAB 1: REKAP FREKUENSI NAMA UNIK */}
          {activeTab === 'frequency' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900 text-white font-semibold">
                    <tr>
                      <th className="py-3 px-3.5 w-12 text-center text-slate-400">#</th>
                      <th className="py-3 px-3.5">Nama / Query yang Dicari</th>
                      <th className="py-3 px-3.5 text-center">Frekuensi Cek</th>
                      <th className="py-3 px-3.5">Status di DPT</th>
                      <th className="py-3 px-3.5">Hasil Pemilih & TPS</th>
                      <th className="py-3 px-3.5 text-right">Terakhir Dicari</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                          <span>Memuat rekapitulasi data...</span>
                        </td>
                      </tr>
                    ) : paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-slate-500">
                          Tidak ada data yang sesuai filter pencarian.
                        </td>
                      </tr>
                    ) : (
                      (paginatedData as SearchFrequencyItem[]).map((item, idx) => {
                        const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                        return (
                          <tr key={item.query_clean} className="hover:bg-slate-50/90 transition-colors">
                            <td className="py-3.5 px-3.5 text-center text-slate-400 font-mono font-bold text-xs">
                              {globalIndex}
                            </td>
                            <td className="py-3.5 px-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900">{item.query_clean}</span>
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                                  {item.search_type}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3.5 text-center">
                              <span
                                className={clsx(
                                  'inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black shadow-2xs',
                                  item.search_count >= 5
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : item.search_count >= 2
                                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                )}
                              >
                                {item.search_count >= 3 && <Flame className="w-3.5 h-3.5 text-amber-600" />}
                                {item.search_count}x Dicek
                              </span>
                            </td>
                            <td className="py-3.5 px-3.5">
                              {item.is_found ? (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terdaftar
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Belum Ada
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 text-slate-700">
                              {item.matched_nama ? (
                                <div>
                                  <div className="font-semibold text-slate-900 line-clamp-1">{item.matched_nama}</div>
                                  {item.tps_nomor && (
                                    <div className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-0.5">
                                      <MapPin className="w-3 h-3 shrink-0 text-emerald-600" />
                                      <span>TPS {String(item.tps_nomor).padStart(2, '0')}</span>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-xs">-</span>
                              )}
                            </td>
                            <td className="py-3.5 px-3.5 text-right font-medium text-slate-600 text-xs">
                              <span title={new Date(item.last_searched_at).toLocaleString('id-ID')}>
                                {formatTimeAgo(item.last_searched_at)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: DAFTAR NAMA TIDAK DITEMUKAN */}
          {activeTab === 'not_found' && (
            <div className="space-y-4">
              {/* Notice Banner */}
              <div className="bg-rose-50/70 border border-rose-200/90 rounded-2xl p-4 flex items-start gap-3 text-xs sm:text-sm text-rose-950 shadow-2xs">
                <ShieldAlert className="w-5 h-5 text-rose-700 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <h4 className="font-bold text-rose-900">Temuan Warga Belum Terdaftar di DPT</h4>
                  <p className="text-rose-800 text-xs leading-relaxed">
                    Daftar nama di bawah ini adalah warga yang mencari data di sistem tetapi <strong>belum terdaftar</strong>. Panitia dapat menggunakan data ini untuk verifikasi berkas dan tindak lanjut pendaftaran Daftar Pemilih Tambahan / DPSHP.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900 text-white font-semibold">
                    <tr>
                      <th className="py-3 px-3.5 w-12 text-center text-slate-400">#</th>
                      <th className="py-3 px-3.5">Nama Warga yang Dicari</th>
                      <th className="py-3 px-3.5 text-center">Jumlah Percobaan</th>
                      <th className="py-3 px-3.5">Status Verifikasi</th>
                      <th className="py-3 px-3.5 text-right">Waktu Terakhir Dicari</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                          <span>Memuat data...</span>
                        </td>
                      </tr>
                    ) : paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center">
                          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Sparkles className="w-6 h-6" />
                          </div>
                          <p className="font-bold text-slate-800">Semua nama yang dicek telah terdaftar!</p>
                          <p className="text-xs text-slate-400 mt-0.5">Tidak ada riwayat nama yang gagal ditemukan.</p>
                        </td>
                      </tr>
                    ) : (
                      (paginatedData as SearchFrequencyItem[]).map((item, idx) => {
                        const globalIndex = (currentPage - 1) * pageSize + idx + 1;
                        return (
                          <tr key={item.query_clean} className="hover:bg-rose-50/40 transition-colors">
                            <td className="py-3.5 px-3.5 text-center text-slate-400 font-mono font-bold text-xs">
                              {globalIndex}
                            </td>
                            <td className="py-3.5 px-3.5 font-bold text-rose-950">
                              <div className="flex items-center gap-2">
                                <span>{item.query_clean}</span>
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded">
                                  {item.search_type}
                                </span>
                              </div>
                            </td>
                            <td className="py-3.5 px-3.5 text-center">
                              <span className="inline-block px-3 py-1 bg-rose-100 text-rose-900 rounded-full text-xs font-black border border-rose-200">
                                {item.search_count}x Dicari
                              </span>
                            </td>
                            <td className="py-3.5 px-3.5">
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Tidak Ditemukan di Database
                              </span>
                            </td>
                            <td className="py-3.5 px-3.5 text-right font-medium text-slate-600 text-xs">
                              <span title={new Date(item.last_searched_at).toLocaleString('id-ID')}>
                                {formatTimeAgo(item.last_searched_at)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT LOG TRANSAKSI */}
          {activeTab === 'raw_logs' && (
            <div className="space-y-4">
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-900 text-white font-semibold">
                    <tr>
                      <th className="py-3 px-3.5">Waktu Pencarian</th>
                      <th className="py-3 px-3.5">Kata Kunci / Input</th>
                      <th className="py-3 px-3.5 text-center">Tipe</th>
                      <th className="py-3 px-3.5">Hasil</th>
                      <th className="py-3 px-3.5">Pemilih Terkait</th>
                      <th className="py-3 px-3.5">TPS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600 mb-2" />
                          <span>Memuat audit log...</span>
                        </td>
                      </tr>
                    ) : paginatedData.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-slate-500">
                          Belum ada data riwayat transaksi pencarian.
                        </td>
                      </tr>
                    ) : (
                      (paginatedData as SearchLog[]).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/90 transition-colors">
                          <td className="py-3.5 px-3.5 text-slate-500 font-mono text-xs whitespace-nowrap">
                            <span title={new Date(item.created_at).toLocaleString('id-ID')}>
                              {new Date(item.created_at).toLocaleString('id-ID', {
                                day: '2-digit',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5 font-bold text-slate-900">
                            {item.query_raw}
                          </td>
                          <td className="py-3.5 px-3.5 text-center">
                            <span className="uppercase font-bold text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              {item.search_type}
                            </span>
                          </td>
                          <td className="py-3.5 px-3.5">
                            {item.is_found ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Ditemukan ({item.result_count})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> 0 Hasil
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-3.5 text-slate-700 font-medium">
                            {item.matched_nama || <span className="text-slate-400 italic text-xs">-</span>}
                          </td>
                          <td className="py-3.5 px-3.5">
                            {item.tps_nomor ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded-md font-bold text-xs">
                                TPS {String(item.tps_nomor).padStart(2, '0')}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Clean Pagination Bar */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
              <p>
                Menampilkan <strong>{(currentPage - 1) * pageSize + 1}</strong> -{' '}
                <strong>{Math.min(currentPage * pageSize, totalItemCount)}</strong> dari <strong>{totalItemCount}</strong> data
              </p>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3 py-1 font-bold text-slate-800 bg-slate-100 rounded-lg text-xs">
                  {currentPage} / {totalPages}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Petunjuk Setup Supabase SQL */}
        <Modal
          isOpen={showSqlModal}
          onClose={() => setShowSqlModal(false)}
          title="Panduan Setup Database Supabase"
          maxWidth="lg"
        >
          <div className="space-y-4">
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Jalankan script SQL ini 1 kali di <strong>Supabase Dashboard &gt; SQL Editor</strong> agar tabel dan RPC otomatis logging aktif:
            </p>

            <div className="relative">
              <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl text-[11px] font-mono overflow-x-auto max-h-72 leading-relaxed border border-slate-800">
                {SQL_MIGRATION_TEXT}
              </pre>

              <button
                onClick={handleCopySql}
                className="absolute top-3 right-3 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Disalin!' : 'Salin SQL'}</span>
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setShowSqlModal(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
};
