import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { DataTable } from '../../components/admin/DataTable';
import { DeleteAllModal } from '../../components/admin/DeleteAllModal';
import type { Pemilih } from '../../lib/types';
import { supabase } from '../../lib/supabaseClient';
import { Modal } from '../../components/shared/Modal';
import { Button } from '../../components/shared/Button';
import toast from 'react-hot-toast';

const SAMPLE_DEMO_PEMILIH: Pemilih[] = [
  {
    id: '1',
    no_urut: 1,
    kecamatan: 'BLAHBATUH',
    kelurahan: 'BELEGA',
    nik: '5104021201910391',
    nama: 'I GEDE ARIE SAPUTRA',
    tempat_lahir: 'KALTIM',
    tanggal_lahir: '1991-01-12',
    status_kawin: 'S',
    jenis_kelamin: 'L',
    alamat: 'BR. JASRI, DESA BELEGA',
    kategori_pemilih: 'LOKAL',
    tps_nomor: 7,
    status_dpt: 'LOLOS',
    is_active: true,
  },
  {
    id: '2',
    no_urut: 2,
    kecamatan: 'BLAHBATUH',
    kelurahan: 'BELEGA',
    nik: '5171046403900390',
    nama: 'SAYU PUTRI ARI PRATIWI',
    tempat_lahir: 'DENPASAR',
    tanggal_lahir: '1990-03-24',
    status_kawin: 'S',
    jenis_kelamin: 'P',
    alamat: 'COMPLEX BTN BELEGA PERMAI BLOK A/4',
    kategori_pemilih: 'BTN',
    tps_nomor: 9,
    status_dpt: 'LOLOS',
    is_active: true,
  },
  {
    id: '3',
    no_urut: 3,
    kecamatan: 'BLAHBATUH',
    kelurahan: 'BELEGA',
    nik: '5104025508920001',
    nama: 'NI WAYAN SARIASIH',
    tempat_lahir: 'GIANYAR',
    tanggal_lahir: '1992-08-15',
    status_kawin: 'B',
    jenis_kelamin: 'P',
    alamat: 'BR. KEBON, DESA BELEGA',
    kategori_pemilih: 'LOKAL',
    tps_nomor: 8,
    status_dpt: 'BARU',
    is_active: true,
  },
];

export const AdminDataPage: React.FC = () => {
  const [pemilihList, setPemilihList] = useState<Pemilih[]>([]);
  const [tpsOptions, setTpsOptions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State Tambah / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Pemilih | null>(null);

  // Modal State Hapus Semua Data
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [deleteAllLoading, setDeleteAllLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<Pemilih>>({
    nik: '',
    nama: '',
    alamat: '',
    tps_nomor: 7,
    jenis_kelamin: 'L',
    kategori_pemilih: 'LOKAL',
  });

  const fetchPemilih = async () => {
    setLoading(true);
    try {
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');
      if (isPlaceholder) {
        setPemilihList(SAMPLE_DEMO_PEMILIH);
        setTpsOptions([7, 8, 9]);
      } else {
        // Fetch list TPS dari database
        const { data: tpsData } = await supabase
          .from('tps')
          .select('nomor_tps')
          .order('nomor_tps', { ascending: true });
        
        if (tpsData && tpsData.length > 0) {
          setTpsOptions(tpsData.map((t) => t.nomor_tps));
        }

        const { data, error } = await supabase
          .from('pemilih')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .range(0, 49999);

        if (error) throw error;
        setPemilihList(data || []);
      }
    } catch (err: any) {
      console.error('Error fetching data pemilih:', err);
      toast.error('Gagal mengambil data pemilih dari database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPemilih();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      nik: '',
      nama: '',
      alamat: '',
      tps_nomor: 7,
      jenis_kelamin: 'L',
      kategori_pemilih: 'LOKAL',
      status_dpt: 'LOLOS',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: Pemilih) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const handleDelete = async (item: Pemilih) => {
    if (!window.confirm(`Hapus data pemilih "${item.nama}" (NIK: ${item.nik})?`)) return;

    try {
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');
      if (isPlaceholder) {
        setPemilihList((prev) => prev.filter((p) => p.id !== item.id));
        toast.success('Data pemilih berhasil dihapus (Demo mode)');
      } else {
        // Soft delete
        const { error } = await supabase
          .from('pemilih')
          .update({ is_active: false })
          .eq('id', item.id);

        if (error) throw error;
        toast.success('Data pemilih berhasil dihapus.');
        fetchPemilih();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus data.');
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nik || !formData.nama || !formData.alamat) {
      toast.error('NIK, Nama, dan Alamat wajib diisi.');
      return;
    }

    try {
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');

      if (isPlaceholder) {
        if (editingItem) {
          setPemilihList((prev) =>
            prev.map((p) => (p.id === editingItem.id ? ({ ...p, ...formData } as Pemilih) : p))
          );
          toast.success('Data pemilih diperbarui (Demo)');
        } else {
          const newItem: Pemilih = {
            id: String(Date.now()),
            nik: formData.nik!,
            nama: formData.nama!,
            alamat: formData.alamat!,
            tps_nomor: Number(formData.tps_nomor) || 7,
            jenis_kelamin: formData.jenis_kelamin as 'L' | 'P',
            kategori_pemilih: formData.kategori_pemilih || 'LOKAL',
            kecamatan: 'BLAHBATUH',
            kelurahan: 'BELEGA',
            status_dpt: 'LOLOS',
            is_active: true,
          };
          setPemilihList((prev) => [newItem, ...prev]);
          toast.success('Pemilih baru ditambahkan (Demo)');
        }
        setIsModalOpen(false);
      } else {
        if (editingItem) {
          const { error } = await supabase
            .from('pemilih')
            .update({
              nik: formData.nik,
              nama: formData.nama,
              alamat: formData.alamat,
              tps_nomor: Number(formData.tps_nomor),
              jenis_kelamin: formData.jenis_kelamin,
              kategori_pemilih: formData.kategori_pemilih,
            })
            .eq('id', editingItem.id);

          if (error) throw error;
          toast.success('Data pemilih berhasil diperbarui.');
        } else {
          const { error } = await supabase.from('pemilih').insert([
            {
              nik: formData.nik,
              nama: formData.nama,
              alamat: formData.alamat,
              tps_nomor: Number(formData.tps_nomor),
              jenis_kelamin: formData.jenis_kelamin,
              kategori_pemilih: formData.kategori_pemilih,
              status_dpt: 'LOLOS',
              is_active: true,
            },
          ]);

          if (error) throw error;
          toast.success('Pemilih baru berhasil ditambahkan.');
        }
        setIsModalOpen(false);
        fetchPemilih();
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal menyimpan data.');
    }
  };

  const handleDeleteAllData = async (mode: 'hard' | 'soft') => {
    setDeleteAllLoading(true);
    try {
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');

      if (isPlaceholder) {
        setPemilihList([]);
        toast.success(
          mode === 'hard'
            ? 'Seluruh data DPT berhasil dihapus permanen (Demo Mode).'
            : 'Seluruh data DPT berhasil dinonaktifkan (Demo Mode).'
        );
      } else {
        if (mode === 'soft') {
          // Soft delete all active records
          const { error } = await supabase
            .from('pemilih')
            .update({ is_active: false })
            .eq('is_active', true);

          if (error) throw error;
          toast.success('Seluruh data DPT berhasil dinonaktifkan.');
        } else {
          // Hard delete all records
          const { error } = await supabase
            .from('pemilih')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');

          if (error) throw error;
          toast.success('Seluruh data DPT berhasil dihapus permanen dari database.');
        }
        fetchPemilih();
      }
      setIsDeleteAllModalOpen(false);
    } catch (err: any) {
      console.error('Delete all error:', err);
      toast.error(err.message || 'Gagal menghapus seluruh data DPT.');
    } finally {
      setDeleteAllLoading(false);
    }
  };

  return (
    <AdminLayout title="Kelola Data Pemilih (DPT)">
      <div className="space-y-6">
        <DataTable
          data={pemilihList}
          loading={loading}
          tpsOptions={tpsOptions}
          onAddClick={handleOpenAddModal}
          onEditClick={handleOpenEditModal}
          onDeleteClick={handleDelete}
          onDeleteAllClick={() => setIsDeleteAllModalOpen(true)}
        />

        {/* Modal Hapus Semua Data DPT */}
        <DeleteAllModal
          isOpen={isDeleteAllModalOpen}
          onClose={() => setIsDeleteAllModalOpen(false)}
          onConfirmDelete={handleDeleteAllData}
          totalCount={pemilihList.length}
          loading={deleteAllLoading}
        />

        {/* Modal Form Tambah / Edit Pemilih */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? 'Edit Data Pemilih' : 'Tambah Pemilih Manual'}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  NIK *
                </label>
                <input
                  type="text"
                  maxLength={30}
                  value={formData.nik || ''}
                  onChange={(e) => setFormData({ ...formData, nik: e.target.value.trim() })}
                  placeholder="510402..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Nama Lengkap *
                </label>
                <input
                  type="text"
                  value={formData.nama || ''}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value.toUpperCase() })}
                  placeholder="I GEDE ..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">TPS *</label>
                <select
                  value={formData.tps_nomor || 7}
                  onChange={(e) => setFormData({ ...formData, tps_nomor: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
                >
                  <option value={7}>TPS 7 (Br. Jasri)</option>
                  <option value={8}>TPS 8 (Br. Kebon)</option>
                  <option value={9}>TPS 9 (Br. Belega/BTN)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Jenis Kelamin</label>
                <select
                  value={formData.jenis_kelamin || 'L'}
                  onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value as 'L' | 'P' })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                >
                  <option value="L">Laki-laki (L)</option>
                  <option value="P">Perempuan (P)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Kategori</label>
                <input
                  type="text"
                  value={formData.kategori_pemilih || ''}
                  onChange={(e) => setFormData({ ...formData, kategori_pemilih: e.target.value.toUpperCase() })}
                  placeholder="LOKAL / BTN / TK"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Alamat Lengkap *
              </label>
              <textarea
                rows={2}
                value={formData.alamat || ''}
                onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                placeholder="Jalan, Nomor Rumah, Banjar / Kompleks BTN..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="primary">
                Simpan Data
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};
