import React from 'react';
import { SearchX, Building, AlertTriangle } from 'lucide-react';
import { Button } from '../shared/Button';

interface EmptyStateProps {
  onReset: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onReset }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center shadow-lg animate-fade-in space-y-6 max-w-2xl mx-auto">
      <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center mx-auto text-rose-600">
        <SearchX className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
          Data Tidak Ditemukan
        </h3>
        <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
          Maaf, NIK atau Nama yang Anda masukkan tidak tercantum dalam Daftar Pemilih Tetap (DPT) Pemilihan Perbekel Desa Belega.
        </p>
      </div>

      {/* Helpful suggestions */}
      <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 text-left text-xs sm:text-sm text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Saran Pengecekan:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-amber-800 font-medium pl-1">
          <li>Pastikan 16 digit NIK yang dimasukkan sudah sesuai KTP-el / KK.</li>
          <li>Jika mencari dengan Nama, coba masukkan 1 atau 2 kata kunci nama depan saja.</li>
          <li>Pastikan Anda terdaftar sebagai warga Desa Belega (TPS 7, 8, atau 9).</li>
        </ul>
      </div>

      {/* Contact Panitia Box */}
      <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
        <div className="space-y-1">
          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
            <Building className="w-4 h-4 text-emerald-700" /> Sekretariat Panitia Perbekel Belega
          </h4>
          <p className="text-xs text-slate-500">
            Kantor Desa Belega, Kec. Blahbatuh, Kab. Gianyar
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onReset}
          className="shrink-0"
        >
          Coba Cari Lagi
        </Button>
      </div>
    </div>
  );
};
