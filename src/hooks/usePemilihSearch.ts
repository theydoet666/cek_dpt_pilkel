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

// Rate limiting tracker (client-side anti-scraping guard)
let searchTimestamps: number[] = [];
const RATE_LIMIT_WINDOW_MS = 30000; // 30 detik
const MAX_REQUESTS_PER_WINDOW = 12; // Maks 12 pencarian per 30 detik
const MIN_INTERVAL_MS = 600; // Jeda minimal 600ms antar pencarian

export function usePemilihSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const search = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Masukkan NIK atau Nama pemilih.');
      return;
    }

    if (trimmed.length < 3 && !/^\d+$/.test(trimmed)) {
      setError('Pencarian berdasarkan nama minimal 3 karakter.');
      return;
    }

    // Rate limiting check
    const now = Date.now();
    searchTimestamps = searchTimestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

    if (searchTimestamps.length > 0) {
      const lastTimestamp = searchTimestamps[searchTimestamps.length - 1];
      if (now - lastTimestamp < MIN_INTERVAL_MS) {
        // Terlalu cepat, abaikan request beruntun
        return;
      }
    }

    if (searchTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      setError('Terlalu banyak permintaan pencarian. Mohon tunggu beberapa detik demi keamanan sistem.');
      return;
    }

    searchTimestamps.push(now);

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
            item.nik_tersamar.includes(trimmed) ||
            item.nik_tersamar.startsWith(trimmed.slice(0, 4))
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
