import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import type { UploadBatch } from '../../lib/types';
import { supabase } from '../../lib/supabaseClient';
import { FileSpreadsheet, CheckCircle2 } from 'lucide-react';

const DEMO_BATCHES: UploadBatch[] = [
  {
    id: 'b1',
    file_name: 'Contoh Format DPT.xlsx',
    total_rows: 1542,
    valid_rows: 1542,
    error_rows: 0,
    mode: 'upsert',
    status: 'success',
    created_at: '2026-09-02T14:00:00Z',
  },
];

export const AdminHistoryPage: React.FC = () => {
  const [batches, setBatches] = useState<UploadBatch[]>(DEMO_BATCHES);

  useEffect(() => {
    async function fetchBatches() {
      try {
        const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');
        if (!isPlaceholder) {
          const { data, error } = await supabase
            .from('upload_batches')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;
          if (data && data.length > 0) setBatches(data);
        }
      } catch (err) {
        console.error('Error fetching upload batches:', err);
      }
    }

    fetchBatches();
  }, []);

  return (
    <AdminLayout title="Riwayat Upload Excel (Audit Log)">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-4">
          <h3 className="text-xl font-bold text-slate-900">
            Log Riwayat Pengunggahan File
          </h3>

          <div className="overflow-x-auto border border-slate-200 rounded-2xl">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-900 text-white font-semibold">
                <tr>
                  <th className="p-3.5">Waktu Upload</th>
                  <th className="p-3.5">Nama Berkas Excel</th>
                  <th className="p-3.5">Total Baris</th>
                  <th className="p-3.5">Valid</th>
                  <th className="p-3.5">Error</th>
                  <th className="p-3.5">Mode Impor</th>
                  <th className="p-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {batches.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="p-3.5 text-slate-500 font-mono">
                      {new Date(item.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span>{item.file_name}</span>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-900">{item.total_rows}</td>
                    <td className="p-3.5 text-emerald-700 font-bold">{item.valid_rows}</td>
                    <td className="p-3.5 text-rose-700 font-semibold">{item.error_rows}</td>
                    <td className="p-3.5">
                      <span className="uppercase font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {item.mode}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sukses
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
