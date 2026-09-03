import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppLogo } from '../../context/LogoContext';
import { Button } from '../../components/shared/Button';
import { Vote, Lock, Mail, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { signIn } = useAuth();
  const { logoUrl } = useAppLogo();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Masukkan Email dan Password admin.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');

      if (isPlaceholder) {
        // Fallback demo login jika Supabase belum dikonfigurasi real
        await new Promise((r) => setTimeout(r, 600));
        toast.success('Login Demo Berhasil!');
        navigate('/admin');
      } else {
        const { error: authErr } = await signIn(email, password);
        if (authErr) {
          throw authErr;
        }
        toast.success('Selamat datang, Admin!');
        navigate('/admin');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Email atau password salah.');
      toast.error('Gagal login. Periksa email & password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl space-y-6 animate-fade-in relative">
        {/* Back to Home Button */}
        <button
          onClick={() => navigate('/')}
          className="text-xs text-slate-500 hover:text-emerald-700 flex items-center gap-1 font-semibold transition-colors mb-2"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Cek DPT Publik
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="w-16 h-16 object-contain rounded-2xl mx-auto shadow-md p-1 bg-slate-50 border border-slate-200"
            />
          ) : (
            <div className="w-14 h-14 bg-emerald-700 text-white rounded-2xl flex items-center justify-center mx-auto shadow-md">
              <Vote className="w-8 h-8" />
            </div>
          )}
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Login Admin Panitia
          </h2>
          <p className="text-xs text-slate-500">
            Sistem DPT Pemilihan Perbekel Desa Belega
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-3.5 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Email Admin
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@belega.desa.id"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            className="mt-2 py-3.5"
          >
            Masuk ke Panel Admin
          </Button>
        </form>

        <div className="text-center pt-2">
          <p className="text-[11px] text-slate-400">
            Khusus Panitia Pemilihan Perbekel Desa Belega.
          </p>
        </div>
      </div>
    </div>
  );
};
