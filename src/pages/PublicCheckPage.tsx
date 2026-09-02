import React, { useState } from 'react';
import { usePemilihSearch } from '../hooks/usePemilihSearch';
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

export const PublicCheckPage: React.FC = () => {
  const { search, clearSearch, results, loading, error, hasSearched } = usePemilihSearch();
  const [showTpsModal, setShowTpsModal] = useState(false);

  const tpsLocations = [
    {
      tps: 7,
      nama: 'Balai Banjar Jasri',
      alamat: 'Banjar Jasri, Desa Belega, Kec. Blahbatuh',
      cakupan: 'Warga Banjar Jasri dan sekitarnya',
    },
    {
      tps: 8,
      nama: 'Balai Banjar Kebon',
      alamat: 'Banjar Kebon, Desa Belega, Kec. Blahbatuh',
      cakupan: 'Warga Banjar Kebon dan sekitarnya',
    },
    {
      tps: 9,
      nama: 'Balai Banjar Belega',
      alamat: 'Banjar Belega, Desa Belega, Kec. Blahbatuh',
      cakupan: 'Warga Banjar Belega, Kompleks BTN Belega Perma, BTN KG, & TK',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top Village Header Bar */}
      <header className="bg-emerald-900 text-white border-b border-emerald-800 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 rounded-xl text-white shadow-xs">
              <Vote className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg leading-tight tracking-tight text-white">
                Panitia Pemilihan Perbekel Belega
              </h1>
              <p className="text-xs text-emerald-200 font-medium">
                Desa Belega, Kec. Blahbatuh, Kab. Gianyar
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowTpsModal(true)}
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 px-3 py-1.5 rounded-xl transition-colors border border-emerald-700"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Info TPS (7, 8, 9)</span>
          </button>
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
            {tpsLocations.map((item) => (
              <div
                key={item.tps}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-emerald-700 text-white font-extrabold text-xs rounded-full">
                    TPS 0{item.tps}
                  </span>
                  <span className="text-xs font-semibold text-emerald-800">{item.nama}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 pt-1">{item.nama}</p>
                <p className="text-xs text-slate-600 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{item.alamat}</span>
                </p>
                <p className="text-xs text-slate-500 italic pt-1">
                  Cakupan: {item.cakupan}
                </p>
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
