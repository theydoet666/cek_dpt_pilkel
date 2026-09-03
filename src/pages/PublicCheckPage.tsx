import React, { useEffect, useState } from 'react';
import { usePemilihSearch } from '../hooks/usePemilihSearch';
import { useAppLogo } from '../context/LogoContext';
import { supabase } from '../lib/supabaseClient';
import type { TPS } from '../lib/types';
import { SearchForm } from '../components/public/SearchForm';
import { ResultCard } from '../components/public/ResultCard';
import { EmptyState } from '../components/public/EmptyState';
import { Modal } from '../components/shared/Modal';
import {
  Vote,
  ShieldCheck,
  Building,
  MapPin,
  Info,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/shared/Button';

const INITIAL_TPS: TPS[] = [
  {
    id: '1',
    nomor_tps: 7,
    nama_lokasi: 'Balai Banjar Jasri',
    alamat_lokasi: 'Banjar Jasri, Desa Belega, Kec. Blahbatuh',
    dusun: 'Warga Banjar Jasri dan sekitarnya',
  },
  {
    id: '2',
    nomor_tps: 8,
    nama_lokasi: 'Balai Banjar Kebon',
    alamat_lokasi: 'Banjar Kebon, Desa Belega, Kec. Blahbatuh',
    dusun: 'Warga Banjar Kebon dan sekitarnya',
  },
  {
    id: '3',
    nomor_tps: 9,
    nama_lokasi: 'Balai Banjar Belega',
    alamat_lokasi: 'Banjar Belega, Desa Belega, Kec. Blahbatuh',
    dusun: 'Warga Banjar Belega, Kompleks BTN Belega Perma, BTN KG, & TK',
  },
];

export const PublicCheckPage: React.FC = () => {
  const { search, clearSearch, results, loading, error, hasSearched } = usePemilihSearch();
  const { logoUrl } = useAppLogo();
  const [showTpsModal, setShowTpsModal] = useState(false);
  const [tpsList, setTpsList] = useState<TPS[]>(INITIAL_TPS);

  useEffect(() => {
    const fetchTps = async () => {
      try {
        const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');
        if (!isPlaceholder) {
          const { data, error } = await supabase
            .from('tps')
            .select('*')
            .order('nomor_tps', { ascending: true });

          if (!error && data && data.length > 0) {
            setTpsList(data);
          }
        }
      } catch (e) {
        console.warn('Could not fetch TPS list in public page:', e);
      }
    };
    fetchTps();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Village Header Bar */}
      <header className="bg-emerald-900 text-white border-b border-emerald-800 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo Panitia"
                className="w-10 h-10 object-contain bg-white rounded-xl p-1 shadow-md border border-emerald-700/50"
              />
            ) : (
              <div className="p-2 bg-emerald-700 rounded-xl text-white shadow-xs">
                <Vote className="w-6 h-6" />
              </div>
            )}
            <div>
              <h1 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-white">
                Panitia Pemilihan Perbekel Belega
              </h1>
              <p className="text-xs text-emerald-200 font-medium">
                Desa Belega, Kec. Blahbatuh, Kab. Gianyar
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Hero Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Hero Title & Subtitle */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-100/80 border border-emerald-200 rounded-full text-emerald-800 text-xs font-bold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Pengecekan DPT Resmi — Pemilihan Perbekel 2026</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Cek Status Pemilih Anda
          </h2>
          <p className="text-slate-600 text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Masukkan NIK KTP atau Nama Lengkap Anda untuk mengetahui lokasi TPS tempat mencoblos di Desa Belega.
          </p>
        </div>

        {/* Privacy Protection Notice */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-start gap-3 shadow-2xs text-xs sm:text-sm text-slate-600">
          <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-800 font-semibold">Perlindungan Data Pribadi (UU PDP):</strong>{' '}
            Sistem ini menyamarkan NIK secara otomatis. Data NIK Anda tidak pernah ditampilkan penuh di publik.
          </div>
        </div>

        {/* Search Card Container */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/50 space-y-6">
          <SearchForm onSearch={search} loading={loading} />

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-sm font-medium animate-fade-in">
              {error}
            </div>
          )}
        </div>

        {/* Search Results Area */}
        {hasSearched && !loading && (
          <div className="pt-2">
            {results && results.length > 0 ? (
              <ResultCard results={results} />
            ) : (
              <EmptyState onReset={clearSearch} />
            )}
          </div>
        )}

        {/* Information Cards Bottom */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6">
          <div
            onClick={() => setShowTpsModal(true)}
            className="bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex items-start justify-between"
          >
            <div className="space-y-1">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-2">
                <Building className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-base group-hover:text-emerald-800">
                Lokasi TPS Belega
              </h4>
              <p className="text-xs text-slate-500">
                Lihat daftar TPS 7 (Jasri), TPS 8 (Kebon), & TPS 9 (Belega/BTN).
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 transition-colors mt-2" />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-1">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold mb-2">
              <HelpCircle className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-base">
              Bantuan & Pengaduan
            </h4>
            <p className="text-xs text-slate-500">
              Belum terdaftar? Hubungi Panitia Pemilihan di Kantor Desa Belega.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 text-xs py-6 mt-12">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-200">
              © 2026 Panitia Pemilihan Perbekel Desa Belega
            </p>
            <p className="text-slate-500">
              Kecamatan Blahbatuh, Kabupaten Gianyar, Provinsi Bali.
            </p>
          </div>

          <div>
            <a
              href="/admin/login"
              className="text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1 font-medium"
            >
              Portal Login Admin Panitia ↗
            </a>
          </div>
        </div>
      </footer>

      {/* Modal Detail TPS */}
      <Modal
        isOpen={showTpsModal}
        onClose={() => setShowTpsModal(false)}
        title="Daftar Tempat Pemungutan Suara (TPS)"
        maxWidth="lg"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Daftar lokasi TPS resmi untuk Pemilihan Perbekel Desa Belega:
          </p>

          <div className="space-y-3">
            {tpsList.map((item) => (
              <div
                key={item.id || item.nomor_tps}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-emerald-700 text-white font-extrabold text-xs rounded-full">
                    TPS {String(item.nomor_tps).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-semibold text-emerald-800">{item.nama_lokasi}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 pt-1">{item.nama_lokasi}</p>
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{item.alamat_lokasi}</span>
                </p>
                {item.dusun && (
                  <p className="text-xs text-slate-500 italic pt-1">
                    Cakupan: {item.dusun}
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" onClick={() => setShowTpsModal(false)}>
              Tutup
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
