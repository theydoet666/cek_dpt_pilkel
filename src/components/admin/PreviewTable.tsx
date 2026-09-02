import React, { useState } from 'react';
import type { ExcelParseResult } from '../../lib/types';
import { Button } from '../shared/Button';
import { CheckCircle2, AlertTriangle, Database, RefreshCw, FileCheck } from 'lucide-react';
import clsx from 'clsx';

interface PreviewTableProps {
  parseResult: ExcelParseResult;
  onConfirmUpload: (mode: 'upsert' | 'replace') => void;
  onCancel: () => void;
  loading: boolean;
}

export const PreviewTable: React.FC<PreviewTableProps> = ({
  parseResult,
  onConfirmUpload,
  onCancel,
  loading,
}) => {
  const [activeTab, setActiveTab] = useState<'valid' | 'invalid'>('valid');
  const [importMode, setImportMode] = useState<'upsert' | 'replace'>('upsert');
  const [confirmReplace, setConfirmReplace] = useState(false);

  const { validRows, invalidRows, totalRows, fileName, sheetName, headerRowIndex } = parseResult;

  const handleSave = () => {
    if (importMode === 'replace' && !confirmReplace) {
      alert('Mohon centang konfirmasi sebelum melakukan Replace All!');
      return;
    }
    onConfirmUpload(importMode);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 shadow-md animate-fade-in">
      {/* Summary Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md">
            <FileCheck className="w-4 h-4" /> Hasil Parse Excel
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
            {fileName} <span className="text-slate-400 font-normal text-base">(Sheet: {sheetName})</span>
          </h3>
          <p className="text-xs text-slate-500">
            Header terdeteksi pada baris ke-<strong>{headerRowIndex}</strong>
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-100 px-4 py-2 rounded-xl text-center">
            <span className="text-xs text-slate-500 block">Total Baris</span>
            <span className="text-lg font-extrabold text-slate-900">{totalRows}</span>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-center">
            <span className="text-xs text-emerald-700 block font-medium">Valid</span>
            <span className="text-lg font-extrabold text-emerald-800">{validRows.length}</span>
          </div>

          <div className="bg-rose-50 border border-rose-200 px-4 py-2 rounded-xl text-center">
            <span className="text-xs text-rose-700 block font-medium">Error / Warning</span>
            <span className="text-lg font-extrabold text-rose-800">{invalidRows.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('valid')}
          className={clsx(
            'pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2',
            activeTab === 'valid'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          )}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          Data Valid ({validRows.length})
        </button>

        {invalidRows.length > 0 && (
          <button
            onClick={() => setActiveTab('invalid')}
            className={clsx(
              'pb-3 px-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2',
              activeTab === 'invalid'
                ? 'border-rose-600 text-rose-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            )}
          >
            <AlertTriangle className="w-4 h-4 text-rose-600" />
            Data Error ({invalidRows.length})
          </button>
        )}
      </div>

      {/* Preview Table View */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-96">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 sticky top-0">
            <tr>
              <th className="p-3"># Baris</th>
              <th className="p-3">NIK</th>
              <th className="p-3">Nama</th>
              <th className="p-3">TPS</th>
              <th className="p-3">Alamat</th>
              <th className="p-3">Kategori</th>
              <th className="p-3">Status / Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeTab === 'valid'
              ? validRows.slice(0, 100).map((row) => (
                  <tr key={row.rowNumber} className="hover:bg-slate-50/80">
                    <td className="p-3 text-slate-400 font-mono">{row.rowNumber}</td>
                    <td className="p-3 font-mono font-medium text-slate-900">{row.data.nik}</td>
                    <td className="p-3 font-bold text-slate-900">{row.data.nama}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                        TPS {row.data.tps_nomor}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{row.data.alamat}</td>
                    <td className="p-3">
                      {row.data.kategori_pemilih ? (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs rounded font-medium">
                          {row.data.kategori_pemilih}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">-</span>
                      )}
                    </td>
                    <td className="p-3 text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                    </td>
                  </tr>
                ))
              : invalidRows.map((row) => (
                  <tr key={row.rowNumber} className="bg-rose-50/40 hover:bg-rose-50/80">
                    <td className="p-3 text-rose-400 font-mono">{row.rowNumber}</td>
                    <td className="p-3 font-mono text-rose-900">{row.data.nik || '-'}</td>
                    <td className="p-3 font-bold text-rose-900">{row.data.nama || '-'}</td>
                    <td className="p-3 text-rose-800">{row.data.tps_nomor || '-'}</td>
                    <td className="p-3 text-slate-600 max-w-xs truncate">{row.data.alamat || '-'}</td>
                    <td className="p-3 text-slate-500">{row.data.kategori_pemilih || '-'}</td>
                    <td className="p-3 text-rose-700 font-semibold text-xs">
                      {row.errors.join(', ')}
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Mode Import & Confirmation Panel */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-700" /> Mode Penyimpanan ke Database
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            className={clsx(
              'border rounded-xl p-4 cursor-pointer transition-all flex items-start gap-3',
              importMode === 'upsert'
                ? 'border-emerald-600 bg-white ring-2 ring-emerald-500/20 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <input
              type="radio"
              name="importMode"
              value="upsert"
              checked={importMode === 'upsert'}
              onChange={() => setImportMode('upsert')}
              className="mt-1 text-emerald-600 focus:ring-emerald-500"
            />
            <div>
              <strong className="block text-sm text-slate-900">Upsert by NIK (Rekomendasi)</strong>
              <span className="text-xs text-slate-500">
                Data NIK yang sudah ada akan diperbarui, NIK baru akan ditambahkan. Data lama tidak akan terhapus.
              </span>
            </div>
          </label>

          <label
            className={clsx(
              'border rounded-xl p-4 cursor-pointer transition-all flex items-start gap-3',
              importMode === 'replace'
                ? 'border-rose-600 bg-white ring-2 ring-rose-500/20 shadow-xs'
                : 'border-slate-200 bg-white hover:border-slate-300'
            )}
          >
            <input
              type="radio"
              name="importMode"
              value="replace"
              checked={importMode === 'replace'}
              onChange={() => setImportMode('replace')}
              className="mt-1 text-rose-600 focus:ring-rose-500"
            />
            <div>
              <strong className="block text-sm text-rose-900">Replace All (Timpa Total)</strong>
              <span className="text-xs text-rose-600/80">
                Menghapus SELURUH data DPT yang ada saat ini dan menggantinya penuh dengan data file Excel ini.
              </span>
            </div>
          </label>
        </div>

        {importMode === 'replace' && (
          <div className="bg-rose-100/70 border border-rose-300 rounded-xl p-3.5 text-xs text-rose-900 flex items-center gap-2">
            <input
              type="checkbox"
              id="confirmReplaceCheck"
              checked={confirmReplace}
              onChange={(e) => setConfirmReplace(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <label htmlFor="confirmReplaceCheck" className="font-semibold cursor-pointer">
              Saya mengerti bahwa Replace All akan menghapus seluruh data DPT lama di database.
            </label>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading} className="w-full sm:w-auto">
          Batal & Pilih File Lain
        </Button>

        <Button
          variant={importMode === 'replace' ? 'danger' : 'primary'}
          onClick={handleSave}
          loading={loading}
          disabled={validRows.length === 0}
          icon={<RefreshCw className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Simpan {validRows.length} Data ke Database
        </Button>
      </div>
    </div>
  );
};
