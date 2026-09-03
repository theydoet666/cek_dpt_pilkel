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
        // Prepare records array & ensure unique NIKs per batch
        const rawPayload = parseResult.validRows.map((r) => r.data);
        const nikCounter = new Map<string, number>();
        const uniquePayload: any[] = [];

        for (const item of rawPayload) {
          if (!item.nik) continue;
          
          const baseNik = item.nik.trim();
          const count = (nikCounter.get(baseNik) || 0) + 1;
          nikCounter.set(baseNik, count);

          if (count === 1) {
            uniquePayload.push({ ...item, nik: baseNik });
          } else {
            // Jika NIK terduplikat/tersamar dalam file Excel, beri suffix unik (#2, #3, dst)
            uniquePayload.push({ ...item, nik: `${baseNik}#${count}` });
          }
        }

        // 1. Buat log upload_batches terlebih dahulu
        const { data: batchLog } = await supabase
          .from('upload_batches')
          .insert({
            file_name: parseResult.fileName,
            total_rows: parseResult.totalRows,
            valid_rows: parseResult.validRows.length,
            error_rows: parseResult.invalidRows.length,
            mode: mode,
            status: 'processing',
          })
          .select('id')
          .single();

        const batchId = batchLog?.id || null;

        if (mode === 'replace') {
          // =========================================================
          // MODE REPLACE: Panggil RPC Atomik dalam 1 Transaksi Database
          // =========================================================
          try {
            const { data: rpcRes, error: rpcErr } = await supabase.rpc('replace_all_pemilih', {
              batch: uniquePayload,
              batch_id: batchId,
            });

            if (rpcErr) throw rpcErr;
            if (!rpcRes?.success) {
              throw new Error('Gagal memproses replace data secara atomik.');
            }
          } catch (rpcCatchErr: any) {
            console.warn('RPC replace_all_pemilih fallback:', rpcCatchErr.message);
            // Fallback jika migration 005 belum dijalankan di DB
            await supabase.from('pemilih').update({ is_active: false }).eq('is_active', true);
            const chunkSize = 500;
            for (let i = 0; i < uniquePayload.length; i += chunkSize) {
              const chunk = uniquePayload.slice(i, i + chunkSize);
              const { error: upsertErr } = await supabase.from('pemilih').upsert(
                chunk.map((c) => ({ ...c, upload_batch_id: batchId })),
                { onConflict: 'nik' }
              );
              if (upsertErr) throw upsertErr;
            }
          }
        } else {
          // =========================================================
          // MODE UPSERT: Batch upsert dalam chunks per 500 baris
          // =========================================================
          const chunkSize = 500;
          for (let i = 0; i < uniquePayload.length; i += chunkSize) {
            const chunk = uniquePayload.slice(i, i + chunkSize);
            const { error: upsertErr } = await supabase.from('pemilih').upsert(
              chunk.map((c) => ({ ...c, upload_batch_id: batchId })),
              { onConflict: 'nik' }
            );

            if (upsertErr) throw upsertErr;
          }
        }

        // 2. Update status batch log menjadi success
        if (batchId) {
          await supabase
            .from('upload_batches')
            .update({ status: 'success' })
            .eq('id', batchId);
        }

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
