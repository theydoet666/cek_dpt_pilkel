import React, { useState, useRef } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppLogo } from '../../context/LogoContext';
import { Button } from '../../components/shared/Button';
import { Upload, Image as ImageIcon, RotateCcw, CheckCircle2, ShieldCheck, Globe, Layout, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminSettingsPage: React.FC = () => {
  const { logoUrl, updateLogo, resetLogo, loading } = useAppLogo();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compress & convert file to DataURL
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('File yang dipilih harus berupa gambar (PNG, JPG, SVG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setSelectedImage(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveLogo = async () => {
    const targetLogo = selectedImage || logoUrl;
    if (!targetLogo) {
      toast.error('Pilih file gambar logo terlebih dahulu.');
      return;
    }

    setSaving(true);
    try {
      await updateLogo(targetLogo);
      setSelectedImage(null);
      toast.success('Logo berhasil diperbarui! Favicon dan tampilan web telah disesuaikan.');
    } catch (err: any) {
      toast.error(err?.message || 'Gagal menyimpan logo.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Kembalikan logo ke logo bawaan sistem?')) {
      setSaving(true);
      try {
        await resetLogo();
        setSelectedImage(null);
        toast.success('Logo dikembalikan ke default.');
      } catch (err: any) {
        toast.error('Gagal mereset logo.');
      } finally {
        setSaving(false);
      }
    }
  };

  const currentActiveLogo = selectedImage || logoUrl;

  return (
    <AdminLayout title="Pengaturan Logo & Favicon Web">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Banner Section */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700/60 border border-emerald-500/40 rounded-full text-xs font-bold text-emerald-200">
              <Sparkles className="w-3.5 h-3.5" /> Branding System
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Kelola Logo & Favicon
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xl">
              Unggah logo resmi Panitia / Desa Belega. Logo yang diunggah akan otomatis ditampilkan pada Header Halaman Publik, Navigation Sidebar Admin, dan Favicon browser tab.
            </p>
          </div>

          {currentActiveLogo && (
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 text-center shrink-0">
              <img
                src={currentActiveLogo}
                alt="Logo Aktif"
                className="w-16 h-16 object-contain mx-auto rounded-xl bg-white p-1.5 shadow-md"
              />
              <span className="text-[11px] font-semibold text-emerald-200 mt-2 block">
                Logo Aktif Saat Ini
              </span>
            </div>
          )}
        </div>

        {/* Upload & Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Dropzone Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-700" /> Unggah Gambar Logo Baru
              </h3>
              <p className="text-xs text-slate-500">
                Format yang didukung: <strong>PNG, JPG, SVG, WEBP</strong> (Disarankan latar belakang transparan / PNG square ratio).
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-3 group"
              >
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <ImageIcon className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-sm font-bold text-slate-800 block">
                    Klik untuk Pilih Gambar Logo
                  </span>
                  <span className="text-xs text-slate-400">
                    atau seret file ke area ini
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="primary"
                onClick={handleSaveLogo}
                loading={saving || loading}
                disabled={!selectedImage}
                className="w-full sm:flex-1 py-3"
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                Simpan & Terapkan Logo
              </Button>

              {logoUrl && (
                <Button
                  variant="outline"
                  onClick={handleReset}
                  disabled={saving || loading}
                  className="w-full sm:w-auto text-rose-600 border-rose-200 hover:bg-rose-50"
                  icon={<RotateCcw className="w-4 h-4" />}
                >
                  Reset Default
                </Button>
              )}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Layout className="w-5 h-5 text-emerald-700" /> Pratinjau Tampilan (Live Preview)
            </h3>

            <div className="space-y-4">
              {/* 1. Header Publik Preview */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" /> 1. Header Halaman Publik
                </span>
                <div className="bg-emerald-900 p-3 rounded-2xl text-white flex items-center gap-3 shadow-sm border border-emerald-800">
                  {currentActiveLogo ? (
                    <img
                      src={currentActiveLogo}
                      alt="Logo Header"
                      className="w-9 h-9 object-contain bg-white rounded-xl p-1 shadow-xs"
                    />
                  ) : (
                    <div className="p-2 bg-emerald-700 rounded-xl">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-extrabold text-xs sm:text-sm">Panitia Pemilihan Perbekel Belega</h4>
                    <p className="text-[10px] text-emerald-200">Desa Belega, Kec. Blahbatuh</p>
                  </div>
                </div>
              </div>

              {/* 2. Admin Sidebar Preview */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 2. Sidebar Admin Panel
                </span>
                <div className="bg-slate-900 p-3 rounded-2xl text-white flex items-center gap-3 shadow-sm border border-slate-800">
                  {currentActiveLogo ? (
                    <img
                      src={currentActiveLogo}
                      alt="Logo Sidebar"
                      className="w-8 h-8 object-contain bg-white/10 rounded-xl p-1 shadow-xs"
                    />
                  ) : (
                    <div className="p-2 bg-emerald-600 rounded-xl">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                  )}
                  <div>
                    <h4 className="font-bold text-xs">DPT Belega</h4>
                    <p className="text-[10px] text-emerald-400">Panel Admin</p>
                  </div>
                </div>
              </div>

              {/* 3. Browser Favicon Tab Preview */}
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500">
                  3. Favicon Browser Tab
                </span>
                <div className="bg-slate-200 border border-slate-300 rounded-t-xl px-4 py-2 flex items-center gap-2 max-w-xs text-xs text-slate-700">
                  {currentActiveLogo ? (
                    <img src={currentActiveLogo} alt="Favicon" className="w-4 h-4 object-contain rounded-xs" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-700" />
                  )}
                  <span className="truncate font-semibold">Cek DPT Pemilihan Perbekel...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
