import React, { useEffect, useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import type { TPS } from '../../lib/types';
import { supabase } from '../../lib/supabaseClient';
import { Button } from '../../components/shared/Button';
import { Modal } from '../../components/shared/Modal';
import { MapPin, Plus, Edit, Trash2, Building, Users, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const INITIAL_TPS: TPS[] = [
  {
    id: '1',
    nomor_tps: 7,
    nama_lokasi: 'Balai Banjar Jasri',
    alamat_lokasi: 'Banjar Jasri, Desa Belega, Kec. Blahbatuh',
    dusun: 'Br. Jasri',
  },
  {
    id: '2',
    nomor_tps: 8,
    nama_lokasi: 'Balai Banjar Kebon',
    alamat_lokasi: 'Banjar Kebon, Desa Belega, Kec. Blahbatuh',
    dusun: 'Br. Kebon',
  },
  {
    id: '3',
    nomor_tps: 9,
    nama_lokasi: 'Balai Banjar Belega',
    alamat_lokasi: 'Banjar Belega, Desa Belega, Kec. Blahbatuh',
    dusun: 'Br. Belega & Kompleks BTN',
  },
];

export const AdminTpsPage: React.FC = () => {
  const [tpsList, setTpsList] = useState<TPS[]>([]);
  const [pemilihCounts, setPemilihCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<TPS | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState<Partial<TPS>>({
    nomor_tps: 1,
    nama_lokasi: '',
    alamat_lokasi: '',
    dusun: '',
  });

  const [exactTotalPemilih, setExactTotalPemilih] = useState<number>(0);

  const fetchTpsData = async () => {
    setLoading(true);
    try {
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');

      if (isPlaceholder) {
        setTpsList(INITIAL_TPS);
        setPemilihCounts({ 7: 420, 8: 380, 9: 510 });
        setExactTotalPemilih(1310);
      } else {
        // Fetch all TPS from Supabase ordered by nomor_tps
        const { data: tpsData, error: tpsErr } = await supabase
          .from('tps')
          .select('*')
          .order('nomor_tps', { ascending: true });

        if (tpsErr) throw tpsErr;
        setTpsList(tpsData || []);

        // Exact total active voters count
        const { count: totalCount } = await supabase
          .from('pemilih')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        setExactTotalPemilih(totalCount || 0);

        // Fetch counts per TPS (range up to 50,000 voters)
        const { data: pemilihData } = await supabase
          .from('pemilih')
          .select('tps_nomor')
          .eq('is_active', true)
          .range(0, 50000);

        if (pemilihData) {
          const counts: Record<number, number> = {};
          pemilihData.forEach((p: any) => {
            if (p.tps_nomor !== null && p.tps_nomor !== undefined) {
              counts[p.tps_nomor] = (counts[p.tps_nomor] || 0) + 1;
            }
          });
          setPemilihCounts(counts);
        }
      }
    } catch (err: any) {
      console.error('Fetch TPS error:', err);
      toast.error('Gagal mengambil data TPS dari database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTpsData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingItem(null);
    // Find next available TPS number
    const maxNum = tpsList.reduce((max, item) => Math.max(max, item.nomor_tps || 0), 0);
    setFormData({
      nomor_tps: maxNum > 0 ? maxNum + 1 : 1,
      nama_lokasi: '',
      alamat_lokasi: 'Desa Belega, Kec. Blahbatuh, Kab. Gianyar',
      dusun: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: TPS) => {
    setEditingItem(item);
    setFormData({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = async (item: TPS) => {
    const pemilihCount = pemilihCounts[item.nomor_tps] || 0;
    const countWarning = pemilihCount > 0 ? `\n⚠️ PERHATIAN: Terdapat ${pemilihCount} pemilih terdaftar pada TPS ini!` : '';
    
    if (!window.confirm(`Hapus Tempat Pemungutan Suara (TPS ${item.nomor_tps} - ${item.nama_lokasi})?${countWarning}`)) {
      return;
    }

    try {
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');

      if (isPlaceholder) {
        setTpsList((prev) => prev.filter((t) => t.id !== item.id));
        toast.success(`TPS ${item.nomor_tps} berhasil dihapus (Demo Mode)`);
      } else {
        const { error } = await supabase.from('tps').delete().eq('id', item.id);
        if (error) throw error;
        toast.success(`TPS ${item.nomor_tps} berhasil dihapus.`);
        fetchTpsData();
      }
    } catch (err: any) {
      console.error('Delete TPS error:', err);
      toast.error(err.message || 'Gagal menghapus TPS.');
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nomor_tps || formData.nomor_tps <= 0) {
      toast.error('Nomor TPS harus berupa angka positif.');
      return;
    }

    if (!formData.nama_lokasi?.trim()) {
      toast.error('Nama lokasi TPS wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');

      if (isPlaceholder) {
        if (editingItem) {
          setTpsList((prev) =>
            prev.map((t) => (t.id === editingItem.id ? ({ ...t, ...formData } as TPS) : t))
          );
          toast.success('Data TPS diperbarui (Demo)');
        } else {
          const newItem: TPS = {
            id: String(Date.now()),
            nomor_tps: Number(formData.nomor_tps),
            nama_lokasi: formData.nama_lokasi!,
            alamat_lokasi: formData.alamat_lokasi || '',
            dusun: formData.dusun || '',
          };
          setTpsList((prev) => [...prev, newItem].sort((a, b) => a.nomor_tps - b.nomor_tps));
          toast.success('TPS Baru berhasil ditambahkan (Demo)');
        }
        setIsModalOpen(false);
      } else {
        if (editingItem) {
          const { error } = await supabase
            .from('tps')
            .update({
              nomor_tps: Number(formData.nomor_tps),
              nama_lokasi: formData.nama_lokasi,
              alamat_lokasi: formData.alamat_lokasi,
              dusun: formData.dusun,
              updated_at: new Date().toISOString(),
            })
            .eq('id', editingItem.id);

          if (error) throw error;
          toast.success('Data TPS berhasil diperbarui.');
        } else {
          const { error } = await supabase.from('tps').insert([
            {
              nomor_tps: Number(formData.nomor_tps),
              nama_lokasi: formData.nama_lokasi,
              alamat_lokasi: formData.alamat_lokasi,
              dusun: formData.dusun,
            },
          ]);

          if (error) throw error;
          toast.success('TPS baru berhasil ditambahkan.');
        }
        setIsModalOpen(false);
        fetchTpsData();
      }
    } catch (err: any) {
      console.error('Save TPS error:', err);
      toast.error(err.message || 'Gagal menyimpan data TPS.');
    } finally {
      setSubmitting(false);
    }
  };

  const totalPemilih = exactTotalPemilih || Object.values(pemilihCounts).reduce((acc, count) => acc + count, 0);

  return (
    <AdminLayout title="Kelola Tempat Pemungutan Suara (TPS)">
      <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
        {/* Header Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-800 rounded-2xl">
              <Building className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Lokasi TPS</span>
              <span className="text-2xl font-extrabold text-slate-900">{tpsList.length} TPS</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-800 rounded-2xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium block">Total Pemilih Terdaftar</span>
              <span className="text-2xl font-extrabold text-slate-900">{totalPemilih} Orang</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex items-center justify-between">
            <Button
              variant="primary"
              onClick={handleOpenAddModal}
              icon={<Plus className="w-5 h-5" />}
              className="w-full py-3 shadow-md shadow-emerald-800/15"
            >
              Tambah TPS Baru
            </Button>
          </div>
        </div>

        {/* TPS List Section */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-700" /> Daftar TPS Pemilihan Perbekel
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Lokasi dan informasi TPS ini ditampilkan langsung pada portal pengecekan DPT publik.
              </p>
            </div>

            <button
              onClick={fetchTpsData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-colors shrink-0"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600" />
              <p className="text-sm font-medium">Memuat daftar TPS...</p>
            </div>
          ) : tpsList.length === 0 ? (
            <div className="p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
              <h4 className="font-bold text-slate-800 text-base">Belum Ada Data TPS</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Klik tombol "Tambah TPS Baru" untuk membuat lokasi TPS pertama.
              </p>
              <Button variant="primary" size="sm" onClick={handleOpenAddModal}>
                Tambah TPS Pertama
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tpsList.map((item) => {
                const count = pemilihCounts[item.nomor_tps] || 0;

                return (
                  <div
                    key={item.id}
                    className="bg-slate-50 border border-slate-200 hover:border-emerald-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between group"
                  >
                    <div className="space-y-3">
                      {/* Header Badge & Actions */}
                      <div className="flex items-center justify-between">
                        <span className="px-3.5 py-1 bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-xs">
                          TPS {String(item.nomor_tps).padStart(2, '0')}
                        </span>

                        <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleOpenEditModal(item)}
                            className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors"
                            title="Edit Data TPS"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Hapus TPS"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Info Title & Address */}
                      <div>
                        <h4 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-900 transition-colors">
                          {item.nama_lokasi}
                        </h4>
                        <p className="text-xs text-slate-600 flex items-start gap-1.5 mt-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{item.alamat_lokasi || 'Alamat belum diatur'}</span>
                        </p>
                      </div>
                    </div>

                    {/* Footer Info & Pemilih Count Badge */}
                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <span className="text-slate-500 italic truncate max-w-[200px]">
                        Cakupan: {item.dusun || '-'}
                      </span>

                      <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 shadow-2xs">
                        👥 {count} Pemilih
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Form Tambah / Edit TPS */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? `Edit TPS ${editingItem.nomor_tps}` : 'Tambah Tempat Pemungutan Suara (TPS) Baru'}
          maxWidth="md"
        >
          <form onSubmit={handleSaveForm} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1 sm:col-span-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Nomor TPS *
                </label>
                <input
                  type="number"
                  min={1}
                  max={99}
                  value={formData.nomor_tps || ''}
                  onChange={(e) => setFormData({ ...formData, nomor_tps: parseInt(e.target.value, 10) || 0 })}
                  placeholder="7"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
                  required
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 block">
                  Nama Lokasi TPS *
                </label>
                <input
                  type="text"
                  value={formData.nama_lokasi || ''}
                  onChange={(e) => setFormData({ ...formData, nama_lokasi: e.target.value })}
                  placeholder="e.g. Balai Banjar Jasri"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-bold"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Alamat Lokasi TPS *
              </label>
              <input
                type="text"
                value={formData.alamat_lokasi || ''}
                onChange={(e) => setFormData({ ...formData, alamat_lokasi: e.target.value })}
                placeholder="Banjar Jasri, Desa Belega, Kec. Blahbatuh"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Cakupan Wilayah / Banjar / Dusun
              </label>
              <input
                type="text"
                value={formData.dusun || ''}
                onChange={(e) => setFormData({ ...formData, dusun: e.target.value })}
                placeholder="e.g. Warga Banjar Jasri dan sekitarnya"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                Batal
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {editingItem ? 'Simpan Perubahan' : 'Tambah TPS'}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AdminLayout>
  );
};
