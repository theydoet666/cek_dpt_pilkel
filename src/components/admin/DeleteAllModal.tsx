import React, { useState } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';
import clsx from 'clsx';

interface DeleteAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: (mode: 'hard' | 'soft') => Promise<void>;
  totalCount: number;
  loading: boolean;
}

const CONFIRMATION_PHRASE = 'HAPUS SEMUA DATA DPT';

export const DeleteAllModal: React.FC<DeleteAllModalProps> = ({
  isOpen,
  onClose,
  onConfirmDelete,
  totalCount,
  loading,
}) => {
  const [deleteMode, setDeleteMode] = useState<'soft' | 'hard'>('soft');
  const [inputPhrase, setInputPhrase] = useState('');

  const isConfirmed = inputPhrase.trim().toUpperCase() === CONFIRMATION_PHRASE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed) return;
    await onConfirmDelete(deleteMode);
    setInputPhrase('');
  };

  const handleClose = () => {
    if (!loading) {
      setInputPhrase('');
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Hapus Semua Data DPT Pemilih"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Warning Banner */}
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-900">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs sm:text-sm">
            <strong className="font-bold block text-rose-950 text-sm sm:text-base">
              Peringatan Tindakan Masif & Riskan!
            </strong>
            <p className="text-rose-800 leading-relaxed">
              Anda akan menghapus seluruh data DPT sebanyak{' '}
              <strong className="font-extrabold underline text-rose-950">{totalCount} pemilih</strong>. Tindakan ini mempengaruhi seluruh portal publik dan panel admin.
            </p>
          </div>
        </div>

        {/* Delete Mode Option */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 block">
            Pilih Metode Penghapusan:
          </label>

          <div className="grid grid-cols-1 gap-2.5">
            <label
              className={clsx(
                'border rounded-xl p-3.5 cursor-pointer transition-all flex items-start gap-3',
                deleteMode === 'soft'
                  ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <input
                type="radio"
                name="deleteMode"
                value="soft"
                checked={deleteMode === 'soft'}
                onChange={() => setDeleteMode('soft')}
                className="mt-1 text-amber-600 focus:ring-amber-500"
              />
              <div>
                <strong className="block text-xs sm:text-sm text-slate-900 font-bold">
                  Nonaktifkan Semua Data (Soft Delete - Direkomendasikan)
                </strong>
                <span className="text-[11px] sm:text-xs text-slate-500 block mt-0.5">
                  Mengubah status data menjadi non-aktif. Data disembunyikan dari publik tetapi tetap aman jika sewaktu-waktu dibutuhkan kembali.
                </span>
              </div>
            </label>

            <label
              className={clsx(
                'border rounded-xl p-3.5 cursor-pointer transition-all flex items-start gap-3',
                deleteMode === 'hard'
                  ? 'border-rose-600 bg-rose-50/50 ring-2 ring-rose-500/20'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              )}
            >
              <input
                type="radio"
                name="deleteMode"
                value="hard"
                checked={deleteMode === 'hard'}
                onChange={() => setDeleteMode('hard')}
                className="mt-1 text-rose-600 focus:ring-rose-500"
              />
              <div>
                <strong className="block text-xs sm:text-sm text-rose-950 font-bold">
                  Hapus Permanen (Hard Delete - Kosongkan Total)
                </strong>
                <span className="text-[11px] sm:text-xs text-rose-700/80 block mt-0.5">
                  Menghapus baris data dari database Supabase secara permanen. Data yang dihapus tidak dapat dikembalikan lagi.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Confirmation Phrase Input */}
        <div className="space-y-2 pt-1">
          <label className="text-xs font-bold text-slate-700 block">
            Ketikkan kata kunci di bawah ini untuk mengonfirmasi:
          </label>

          <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-center select-all font-mono font-bold text-xs sm:text-sm text-rose-900 tracking-wider">
            {CONFIRMATION_PHRASE}
          </div>

          <input
            type="text"
            value={inputPhrase}
            onChange={(e) => setInputPhrase(e.target.value)}
            placeholder="Ketik kata kunci di atas..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-rose-600 font-mono"
            disabled={loading}
            autoComplete="off"
          />
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-3 border-t border-slate-100">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            Batal
          </Button>

          <Button
            type="submit"
            variant="danger"
            disabled={!isConfirmed || loading}
            loading={loading}
            icon={<Trash2 className="w-4 h-4" />}
            className="w-full sm:w-auto py-2.5 shadow-md shadow-rose-900/10"
          >
            {deleteMode === 'hard' ? 'Hapus Permanen Sekarang' : 'Nonaktifkan Semua Data'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
