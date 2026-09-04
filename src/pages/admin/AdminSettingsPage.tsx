import React, { useState, useRef } from 'react';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { useAppLogo } from '../../context/LogoContext';
import { Button } from '../../components/shared/Button';
import {
  Upload,
  Image as ImageIcon,
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Layout,
  Sparkles,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  ShieldAlert,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';

// ─── Password Strength Helper ────────────────────────────────────────────────
function getPasswordStrength(pwd: string): { score: number; label: string; color: string } {
  if (!pwd) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score, label: 'Sangat Lemah', color: 'bg-rose-500' };
  if (score === 2) return { score, label: 'Lemah', color: 'bg-orange-400' };
  if (score === 3) return { score, label: 'Sedang', color: 'bg-yellow-400' };
  if (score === 4) return { score, label: 'Kuat', color: 'bg-emerald-400' };
  return { score, label: 'Sangat Kuat', color: 'bg-emerald-600' };
}

// ─── Show/Hide Password Toggle ────────────────────────────────────────────────
function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || '••••••••'}
        disabled={disabled}
        autoComplete="new-password"
        className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all disabled:opacity-50"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export const AdminSettingsPage: React.FC = () => {
  const { logoUrl, updateLogo, resetLogo, loading } = useAppLogo();
  const { user, signIn } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Password Change State ────────────────────────────────────────────────
  const [oldPassword, setOldPassword]     = useState('');
  const [newPassword, setNewPassword]     = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading]       = useState(false);
  const [pwdError, setPwdError]           = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess]       = useState(false);

  const strength = getPasswordStrength(newPassword);

  // ─── Logo Handlers ────────────────────────────────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMimeTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'webp'];

    if (!allowedMimeTypes.includes(file.type.toLowerCase()) || !allowedExtensions.includes(ext)) {
      toast.error('Format tidak didukung! Hanya file PNG, JPG, dan WEBP yang diizinkan demi keamanan.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 3MB.');
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

  // ─── Password Change Handler ──────────────────────────────────────────────
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(false);

    // Validasi client-side
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPwdError('Semua field password wajib diisi.');
      return;
    }
    if (newPassword.length < 8) {
      setPwdError('Password baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Konfirmasi password tidak cocok dengan password baru.');
      return;
    }
    if (newPassword === oldPassword) {
      setPwdError('Password baru tidak boleh sama dengan password lama.');
      return;
    }
    if (strength.score < 2) {
      setPwdError('Password terlalu lemah. Gunakan kombinasi huruf, angka, dan simbol.');
      return;
    }

    setPwdLoading(true);
    try {
      // Step 1: Verifikasi password lama dengan re-login
      const email = user?.email || '';
      const { error: verifyErr } = await signIn(email, oldPassword);
      if (verifyErr) {
        setPwdError('Password lama tidak sesuai. Silakan periksa kembali.');
        return;
      }

      // Step 2: Update password ke yang baru
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateErr) {
        throw updateErr;
      }

      // Berhasil — reset form
      setPwdSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password berhasil diperbarui! Silakan gunakan password baru untuk login berikutnya.');
    } catch (err: any) {
      console.error('Change password error:', err);
      setPwdError(err?.message || 'Gagal memperbarui password. Coba lagi.');
      toast.error('Gagal memperbarui password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const currentActiveLogo = selectedImage || logoUrl;

  return (
    <AdminLayout title="Pengaturan">
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">

        {/* ── Banner Section ─────────────────────────────────────────────── */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-700/60 border border-emerald-500/40 rounded-full text-xs font-bold text-emerald-200">
              <Sparkles className="w-3.5 h-3.5" /> Pengaturan Sistem
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Logo, Favicon & Keamanan Akun
            </h2>
            <p className="text-emerald-100/80 text-xs sm:text-sm max-w-xl">
              Kelola logo resmi Panitia dan ganti password akun admin secara aman langsung dari panel ini.
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

        {/* ── Upload & Preview Grid ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upload Dropzone Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-md space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-700" /> Unggah Gambar Logo Baru
              </h3>
              <p className="text-xs text-slate-500">
                Format yang didukung: <strong>PNG, JPG, WEBP</strong> (Disarankan latar belakang transparan / PNG square ratio).
              </p>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png,image/jpeg,image/jpg,image/webp"
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
                Simpan &amp; Terapkan Logo
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

        {/* ── Ganti Password Card ────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4 pb-2 border-b border-slate-100">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Ganti Password Admin</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Akun:&nbsp;
                <span className="font-semibold text-emerald-700">{user?.email || '—'}</span>
                &nbsp;·&nbsp;Perubahan akan berlaku segera setelah disimpan.
              </p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-5" autoComplete="off">
            {/* Error Banner */}
            {pwdError && (
              <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 text-sm animate-fade-in">
                <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{pwdError}</span>
              </div>
            )}

            {/* Success Banner */}
            {pwdSuccess && (
              <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 text-sm animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Password berhasil diperbarui! Gunakan password baru saat login berikutnya.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Password Lama */}
              <div className="space-y-1.5">
                <label htmlFor="old-password" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-400" /> Password Saat Ini
                </label>
                <PasswordInput
                  id="old-password"
                  value={oldPassword}
                  onChange={(v) => { setOldPassword(v); setPwdError(null); setPwdSuccess(false); }}
                  placeholder="Password lama"
                  disabled={pwdLoading}
                />
              </div>

              {/* Password Baru */}
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" /> Password Baru
                </label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(v) => { setNewPassword(v); setPwdError(null); setPwdSuccess(false); }}
                  placeholder="Min. 8 karakter"
                  disabled={pwdLoading}
                />
                {/* Strength meter */}
                {newPassword && (
                  <div className="space-y-1 pt-1">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.score ? strength.color : 'bg-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-[11px] font-semibold ${
                      strength.score <= 1 ? 'text-rose-500'
                      : strength.score === 2 ? 'text-orange-500'
                      : strength.score === 3 ? 'text-yellow-600'
                      : 'text-emerald-600'
                    }`}>
                      Kekuatan: {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Konfirmasi Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" /> Konfirmasi Password Baru
                </label>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(v) => { setConfirmPassword(v); setPwdError(null); setPwdSuccess(false); }}
                  placeholder="Ulangi password baru"
                  disabled={pwdLoading}
                />
                {/* Match indicator */}
                {confirmPassword && newPassword && (
                  <p className={`text-[11px] font-semibold pt-1 ${
                    confirmPassword === newPassword ? 'text-emerald-600' : 'text-rose-500'
                  }`}>
                    {confirmPassword === newPassword ? '✓ Password cocok' : '✗ Password tidak cocok'}
                  </p>
                )}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">Tips password yang kuat:</p>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                <li>Minimal <strong>8 karakter</strong></li>
                <li>Kombinasi <strong>huruf besar & kecil</strong></li>
                <li>Sertakan <strong>angka</strong> (0–9)</li>
                <li>Tambahkan <strong>simbol</strong> (!, @, #, $, dll.)</li>
              </ul>
            </div>

            {/* Submit */}
            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="primary"
                loading={pwdLoading}
                disabled={!oldPassword || !newPassword || !confirmPassword}
                className="px-8 py-3"
                icon={<KeyRound className="w-4 h-4" />}
              >
                {pwdLoading ? 'Memverifikasi & Menyimpan...' : 'Simpan Password Baru'}
              </Button>
            </div>
          </form>
        </div>

      </div>
    </AdminLayout>
  );
};
