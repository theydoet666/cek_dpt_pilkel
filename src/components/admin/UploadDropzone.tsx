import React, { useState, useRef } from 'react';
import { UploadCloud, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Button } from '../shared/Button';

interface UploadDropzoneProps {
  onFileSelected: (file: File) => void;
  loading: boolean;
}

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onFileSelected, loading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndProcessFile = (file: File) => {
    setError(null);
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setError('File harus berformat Excel (.xlsx atau .xls)');
      return;
    }
    onFileSelected(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${
          isDragging
            ? 'border-emerald-600 bg-emerald-50/60 scale-[1.01]'
            : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-slate-50/50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx, .xls"
          className="hidden"
          disabled={loading}
        />

        <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs">
          <UploadCloud className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <h3 className="text-lg font-bold text-slate-900">
            Tarik & Lepas File Excel DPT di Sini
          </h3>
          <p className="text-sm text-slate-500 max-w-sm">
            Atau klik untuk memilih file <span className="font-semibold text-slate-700">.xlsx / .xls</span> dari perangkat Anda.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="md"
          loading={loading}
          icon={<FileSpreadsheet className="w-4 h-4 text-emerald-700" />}
          className="mt-2"
        >
          Pilih Berkas Excel
        </Button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3.5 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
