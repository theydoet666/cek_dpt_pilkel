import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { SearchResult } from '../lib/types';

// Mock data fallback jika Supabase belum terhubung / env placeholder
const MOCK_DEMO_RESULTS: SearchResult[] = [
  {
    nama: 'I GEDE ARIE SAPUTRA',
    nik_tersamar: '5104********0391',
    alamat: 'JLN. RAYA BELEGA NO. 12, BR. JASRI',
    tps_nomor: 7,
    tps_lokasi: 'Balai Banjar Jasri',
    status_dpt: 'LOLOS',
  },
  {
    nama: 'SAYU PUTRI ARI PRATIWI',
    nik_tersamar: '5171********0390',
    alamat: 'COMPLEX BTN BELEGA PERMAI BLOK A/4, BR. BELEGA',
    tps_nomor: 9,
    tps_lokasi: 'Balai Banjar Belega',
    status_dpt: 'LOLOS',
  },
  {
    nama: 'NI WAYAN SARIASIH',
    nik_tersamar: '5104********1102',
    alamat: 'BR. KEBON DESA BELEGA',
    tps_nomor: 8,
    tps_lokasi: 'Balai Banjar Kebon',
    status_dpt: 'BARU',
  },
];

export function usePemilihSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const search = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Masukkan NIK (16 digit) atau Nama pemilih.');
      return;
    }

    if (trimmed.length < 3 && !/^\d+$/.test(trimmed)) {
      setError('Pencarian berdasarkan nama minimal 3 karakter.');
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const isPlaceholder = import.meta.env.VITE_SUPABASE_URL?.includes('placeholder');

      if (isPlaceholder) {
        // Fallback demo mode
        await new Promise((r) => setTimeout(r, 600)); // Simulasi network delay
        const qUpper = trimmed.toUpperCase();
        const matches = MOCK_DEMO_RESULTS.filter(
          (item) =>
            item.nama.toUpperCase().includes(qUpper) ||
            (/^\d{16}$/.test(trimmed) && item.nik_tersamar.startsWith(trimmed.slice(0, 4)))
        );
        setResults(matches);
      } else {
        // RPC Call resmi ke Supabase search_pemilih function
        const { data, error: rpcErr } = await supabase.rpc('search_pemilih', {
          q: trimmed,
        });

        if (rpcErr) {
          throw rpcErr;
        }

        setResults(data || []);
      }
    } catch (err: any) {
      console.error('Error searching pemilih:', err);
      setError(err.message || 'Gagal terhubung ke server. Silakan coba lagi.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearSearch = () => {
    setResults(null);
    setHasSearched(false);
    setError(null);
  };

  return {
    search,
    clearSearch,
    results,
    loading,
    error,
    hasSearched,
  };
}
