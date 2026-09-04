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

// Layer 1: Client-Side Rate Limiting (Defense in Depth)
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

    // 1. Client-Side Rate Limiting Check
    const now = Date.now();
    searchTimestamps = searchTimestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);

    if (searchTimestamps.length > 0) {
      const lastTimestamp = searchTimestamps[searchTimestamps.length - 1];
      if (now - lastTimestamp < MIN_INTERVAL_MS) {
        // Abaikan ketukan beruntun terlalu cepat
        return;
      }
    }

    if (searchTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      setError('Terlalu banyak permintaan pencarian. Mohon tunggu beberapa detik demi keamanan.');
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
        await new Promise((r) => setTimeout(r, 600));
        const qUpper = trimmed.toUpperCase();
        const matches = MOCK_DEMO_RESULTS.filter(
          (item) =>
            item.nama.toUpperCase().includes(qUpper) ||
            item.nik_tersamar.includes(trimmed) ||
            item.nik_tersamar.startsWith(trimmed.slice(0, 4))
        );
        setResults(matches);

        // Simpan log ke localStorage untuk mock mode admin
        try {
          const rawLogs = localStorage.getItem('demo_search_logs');
          const logs = rawLogs ? JSON.parse(rawLogs) : [];
          const isNik = /^\d{16}$/.test(trimmed);
          const newLog = {
            id: 'mock-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
            query_raw: trimmed,
            query_clean: trimmed.toUpperCase(),
            search_type: isNik ? 'NIK' : 'NAMA',
            is_found: matches.length > 0,
            result_count: matches.length,
            matched_nama: matches.length === 1 ? matches[0].nama : matches.length > 1 ? `${matches[0].nama} (+${matches.length - 1} lainnya)` : null,
            tps_nomor: matches.length > 0 ? matches[0].tps_nomor : null,
            created_at: new Date().toISOString(),
          };
          logs.unshift(newLog);
          localStorage.setItem('demo_search_logs', JSON.stringify(logs.slice(0, 500)));
        } catch (e) {
          console.warn('Could not save demo search log:', e);
        }
      } else {
        // 2. Layer 2: Server-Side Rate Limiting via Supabase Edge Function 'cek-dpt-search'
        let edgeData: any = null;
        let edgeSuccess = false;

        try {
          const { data, error: fnErr } = await supabase.functions.invoke('cek-dpt-search', {
            body: { q: trimmed },
          });

          if (fnErr) {
            // Tangani HTTP 429 dari Edge Function
            if (fnErr.message?.includes('429') || fnErr.context?.status === 429) {
              throw new Error('Terlalu banyak permintaan dari perangkat Anda. Mohon tunggu 1 menit.');
            }
            // Jika Edge Function belum di-deploy, fallback ke RPC langsung
            console.warn('Edge function not ready, using direct RPC fallback:', fnErr.message);
          } else {
            edgeData = data;
            edgeSuccess = true;
          }
        } catch (edgeCatchErr: any) {
          if (edgeCatchErr.message?.includes('Terlalu banyak permintaan')) {
            throw edgeCatchErr;
          }
          console.warn('Edge function invoke catch, fallback to RPC:', edgeCatchErr.message);
        }

        if (edgeSuccess) {
          setResults(edgeData || []);
        } else {
          // Fallback langsung ke Supabase RPC search_pemilih
          const { data: rpcData, error: rpcErr } = await supabase.rpc('search_pemilih', {
            q: trimmed,
          });

          if (rpcErr) throw rpcErr;
          setResults(rpcData || []);
        }
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
