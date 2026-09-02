import React, { useState } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { MapPin, Edit3, Check } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import toast from 'react-hot-toast';

interface TPSItem {
  id: string;
  nomor_tps: number;
  nama_lokasi: string;
  alamat_lokasi: string;
  dusun: string;
}

const INITIAL_TPS: TPSItem[] = [
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
  const [tpsList, setTpsList] = useState<TPSItem[]>(INITIAL_TPS);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<TPSItem>>({});

  const handleEdit = (item: TPSItem) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const handleSave = (id: string) => {
    setTpsList((prev) =>
      prev.map((t) => (t.id === id ? ({ ...t, ...editForm } as TPSItem) : t))
    );
    setEditingId(null);
    toast.success('Informasi TPS diperbarui.');
  };

  return (
    <AdminLayout title="Kelola Data Tempat Pemungutan Suara (TPS)">
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              TPS Pemilihan Perbekel Desa Belega
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Data lokasi TPS ini ditampilkan kepada warga saat mengecek NIK/Nama di halaman publik.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {tpsList.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-emerald-700 text-white font-extrabold text-sm rounded-xl">
                        TPS 0{item.nomor_tps}
                      </span>
                      <h4 className="font-bold text-slate-900 text-base">
                        {isEditing ? editForm.nama_lokasi : item.nama_lokasi}
                      </h4>
                    </div>

                    {!isEditing ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                        icon={<Edit3 className="w-3.5 h-3.5" />}
                      >
                        Edit TPS
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleSave(item.id)}
                        icon={<Check className="w-3.5 h-3.5" />}
                      >
                        Simpan
                      </Button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-3 pt-2">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Nama Lokasi</label>
                        <input
                          type="text"
                          value={editForm.nama_lokasi || ''}
                          onChange={(e) => setEditForm({ ...editForm, nama_lokasi: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-600">Alamat Lokasi TPS</label>
                        <input
                          type="text"
                          value={editForm.alamat_lokasi || ''}
                          onChange={(e) => setEditForm({ ...editForm, alamat_lokasi: e.target.value })}
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1 text-xs text-slate-600 pt-1">
                      <p className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{item.alamat_lokasi}</span>
                      </p>
                      <p className="text-slate-500">Cakupan Wilayah: {item.dusun}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
