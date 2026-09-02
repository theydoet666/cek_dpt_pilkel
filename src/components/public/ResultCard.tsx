import React, { useState } from 'react';
import type { SearchResult } from '../../lib/types';
import { StatusBadge } from './StatusBadge';
import { MapPin, Building2, ShieldCheck, UserCheck, ChevronRight } from 'lucide-react';

interface ResultCardProps {
  results: SearchResult[];
}

export const ResultCard: React.FC<ResultCardProps> = ({ results }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(
    results.length === 1 ? 0 : null
  );

  if (results.length === 0) return null;

  // Render detail card for selected voter
  const selectedVoter = selectedIndex !== null ? results[selectedIndex] : null;

  return (
    <div className="w-full space-y-4 animate-fade-in">
      {/* If multiple results, show selector list header */}
      {results.length > 1 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <span>
              Ditemukan <strong>{results.length} data pemilih</strong> yang cocok. Silakan pilih nama Anda di bawah.
            </span>
          </div>
        </div>
      )}

      {/* Multiple Candidates List */}
      {results.length > 1 && selectedIndex === null && (
        <div className="grid grid-cols-1 gap-3">
          {results.map((item, idx) => (
            <div
              key={idx}
              onClick={() => setSelectedIndex(idx)}
              className="bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-2xl p-4 transition-all cursor-pointer flex items-center justify-between shadow-xs group"
            >
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 group-hover:text-emerald-800 text-base">
                  {item.nama}
                </h4>
                <p className="text-xs text-slate-500 font-mono">NIK: {item.nik_tersamar}</p>
                <p className="text-xs text-slate-600 line-clamp-1">{item.alamat}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                  TPS {item.tps_nomor}
                </span>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-700 transition-colors" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Card for Single / Selected Voter */}
      {selectedVoter && (
        <div className="bg-white border-2 border-emerald-600/30 rounded-3xl p-6 sm:p-8 shadow-xl shadow-emerald-900/5 relative overflow-hidden">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md">
                  Hasil Pengecekan DPT
                </span>
                <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> NIK Tersamar (UU PDP)
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight pt-1">
                {selectedVoter.nama}
              </h3>
              <p className="text-sm font-mono text-slate-500">
                NIK: <span className="font-bold text-slate-700">{selectedVoter.nik_tersamar}</span>
              </p>
            </div>

            <div>
              <StatusBadge status={selectedVoter.status_dpt} size="md" />
            </div>
          </div>

          {/* TPS Main Highlight Box */}
          <div className="my-6 bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-2xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs uppercase tracking-wider font-bold text-emerald-300">
                Lokasi Tempat Pemungutan Suara
              </span>
              <h4 className="text-3xl sm:text-4xl font-extrabold text-white">
                TPS 0{selectedVoter.tps_nomor}
              </h4>
              <p className="text-sm text-emerald-100 flex items-center gap-1.5 pt-1">
                <Building2 className="w-4 h-4 shrink-0 text-emerald-300" />
                <span>{selectedVoter.tps_lokasi || `Balai Banjar / Lokasi TPS ${selectedVoter.tps_nomor}`}</span>
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 text-center sm:text-right border border-white/10 shrink-0">
              <span className="text-xs text-emerald-200 block">Desa & Kec:</span>
              <span className="font-bold text-sm text-white">Desa Belega, Blahbatuh</span>
            </div>
          </div>

          {/* Detailed Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-2">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Alamat Domisili Pemilih
              </span>
              <div className="flex items-start gap-2 text-slate-800 font-medium">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{selectedVoter.alamat}</span>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                Kabupaten / Wilayah
              </span>
              <p className="text-slate-800 font-medium">
                Kabupaten Gianyar, Provinsi Bali
              </p>
            </div>
          </div>

          {/* Action buttons if came from multiple results */}
          {results.length > 1 && (
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedIndex(null)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 py-2 px-3 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                ← Pilih Nama Pemilih Lain ({results.length} ditemukan)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
