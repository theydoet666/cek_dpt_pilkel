import React, { useState } from 'react';
import type { Pemilih } from '../../lib/types';
import { Button } from '../shared/Button';
import { Search, Filter, Edit, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

interface DataTableProps {
  data: Pemilih[];
  loading: boolean;
  onAddClick: () => void;
  onEditClick: (item: Pemilih) => void;
  onDeleteClick: (item: Pemilih) => void;
  onDeleteAllClick?: () => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  loading,
  onAddClick,
  onEditClick,
  onDeleteClick,
  onDeleteAllClick,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTps, setSelectedTps] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filter logic
  const filteredData = data.filter((item) => {
    const matchesSearch =
      item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nik.includes(searchTerm) ||
      item.alamat.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTps = selectedTps === 'all' || item.tps_nomor === selectedTps;
    const matchesCategory =
      selectedCategory === 'all' ||
      (item.kategori_pemilih || '').toUpperCase() === selectedCategory.toUpperCase();

    return matchesSearch && matchesTps && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage) || 1;
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-4">
      {/* Table Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Cari berdasarkan Nama, NIK, atau Alamat..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-600 font-medium">TPS:</span>
            <select
              value={selectedTps}
              onChange={(e) => {
                setSelectedTps(e.target.value === 'all' ? 'all' : Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">Semua TPS</option>
              <option value={7}>TPS 7</option>
              <option value={8}>TPS 8</option>
              <option value={9}>TPS 9</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <span className="text-slate-600 font-medium">Kategori:</span>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent text-slate-900 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              <option value="LOKAL">LOKAL</option>
              <option value="BTN">BTN</option>
              <option value="BTN KG">BTN KG</option>
              <option value="TK">TK</option>
            </select>
          </div>

          {onDeleteAllClick && data.length > 0 && (
            <Button
              variant="danger"
              size="sm"
              onClick={onDeleteAllClick}
              icon={<Trash2 className="w-4 h-4" />}
            >
              Hapus Semua Data
            </Button>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={onAddClick}
            icon={<Plus className="w-4 h-4" />}
          >
            Tambah Pemilih
          </Button>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-slate-900 text-white font-semibold border-b border-slate-800">
            <tr>
              <th className="p-3.5">NO</th>
              <th className="p-3.5">NIK (Full)</th>
              <th className="p-3.5">Nama Pemilih</th>
              <th className="p-3.5">JK</th>
              <th className="p-3.5">TPS</th>
              <th className="p-3.5">Alamat Lengkap</th>
              <th className="p-3.5">Kategori</th>
              <th className="p-3.5 text-center">Aksi</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500 font-medium">
                  Memuat data DPT...
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  Tidak ada data pemilih yang sesuai filter.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, idx) => (
                <tr key={item.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5 text-slate-400 font-mono">
                    {item.no_urut || (currentPage - 1) * itemsPerPage + idx + 1}
                  </td>
                  <td className="p-3.5 font-mono font-medium text-slate-900">
                    {item.nik.split('#')[0]}
                  </td>
                  <td className="p-3.5 font-bold text-slate-900">{item.nama}</td>
                  <td className="p-3.5">
                    <span className="font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {item.jenis_kelamin || '-'}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                      TPS {item.tps_nomor}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-700 max-w-xs truncate">{item.alamat}</td>
                  <td className="p-3.5">
                    {item.kategori_pemilih ? (
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded">
                        {item.kategori_pemilih}
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => onEditClick(item)}
                        className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Edit Data"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteClick(item)}
                        className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus Data"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500">
        <div>
          Menampilkan{' '}
          <strong className="text-slate-900">
            {filteredData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}
          </strong>{' '}
          -{' '}
          <strong className="text-slate-900">
            {Math.min(currentPage * itemsPerPage, filteredData.length)}
          </strong>{' '}
          dari <strong className="text-slate-900">{filteredData.length}</strong> total data
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Sebelumnya
          </Button>

          <span className="px-3 font-semibold text-slate-700">
            {currentPage} / {totalPages}
          </span>

          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            icon={<ChevronRight className="w-4 h-4" />}
          >
            Selanjutnya
          </Button>
        </div>
      </div>
    </div>
  );
};
