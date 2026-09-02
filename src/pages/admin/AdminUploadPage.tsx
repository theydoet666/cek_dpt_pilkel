import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { UploadDropzone } from '../../components/admin/UploadDropzone';
import { PreviewTable } from '../../components/admin/PreviewTable';
import { parseDptExcel } from '../../lib/excelParser';
import type { ExcelParseResult } from '../../lib/types';
import { supabase } from '../../lib/supabaseClient';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export const AdminUploadPage: React.FC = () => {
  const [parseResult, setParseResult] = useState<ExcelParseResult | null>(null);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileSelected = async (file: File) => {
    setParsing(true);
    try {
      const result = await parseDptExcel(file);
      setParseResult(result);
      toast.success(`Berhasil membaca file Excel (${result.validRows.length} data valid)`);
    } catch (err: any) {
      console.error('Parsing error:', err);
      toast.error(err || 'Gagal membaca file Excel.');
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmUpload = async (mode: 'upsert' | 'replace') => {
    if (!parseResult || parseResult.validRows.length === 0) return;

    setUploading(true);
    const toastId = toast.loading(`Menyimpan ${parseResult.validRows.length} data ke database...`);

    try {
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');

      if (isPlaceholder) {
        // Fallback demo mode
        await new Promise((r) => setTimeout(r, 1200));
        toast.success(`Demo Upload Sukses (${mode.toUpperCase()})! ${parseResult.validRows.length} data disimpan.`, {
          id: toastId,
        });
        navigate('/admin/data');
      } else {
        // Real Supabase Upload
        if (mode === 'replace') {
          // Soft delete / clear existing data
          await supabase.from('pemilih').update({ is_active: false }).eq('is_active', true);
        }

        // Prepare records array
        const payload = parseResult.validRows.map((r) => r.data);

        // Batch upsert in chunks of 500
        const chunkSize = 500;
        for (let i = 0; i < payload.length; i += chunkSize) {
          const chunk = payload.slice(i, i + chunkSize);
          const { error: upsertErr } = await supabase.from('pemilih').upsert(chunk, {
            onConflict: 'nik',
          });

          if (upsertErr) throw upsertErr;
        }

        // Record to upload_batches log
        await supabase.from('upload_batches').insert({
          file_name: parseResult.fileName,
          total_rows: parseResult.totalRows,
          valid_rows: parseResult.validRows.length,
          error_rows: parseResult.invalidRows.length,
          mode: mode,
          status: 'success',
        });

        toast.success(`Upload Berhasil! ${parseResult.validRows.length} data DPT disimpan.`, {
          id: toastId,
        });
        navigate('/admin/data');
      }
    } catch (err: any) {
      console.error('Upload DB error:', err);
      toast.error(`Gagal menyimpan data: ${err.message || err}`, { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminLayout title="Upload Rekap DPT (Excel)">
      <div className="max-w-4xl mx-auto space-y-6">
        {!parseResult ? (
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-4">
              <h3 className="text-xl font-bold text-slate-900">
                Unggah File Rekap PDPB Desa Belega
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                File Excel yang diunggah harus memiliki kolom <strong>NIK, NAMA, ALAMAT, dan TPS (7/8/9)</strong>. Baris header akan dideteksi secara otomatis.
              </p>
              <UploadDropzone onFileSelected={handleFileSelected} loading={parsing} />
            </div>
          </div>
        ) : (
          <PreviewTable
            parseResult={parseResult}
            onConfirmUpload={handleConfirmUpload}
            onCancel={() => setParseResult(null)}
            loading={uploading}
          />
        )}
      </div>
    </AdminLayout>
  );
};
