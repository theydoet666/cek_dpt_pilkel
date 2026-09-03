import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

// Header CORS standar agar bisa dipanggil dari browser publik
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // 1. Tangani preflight request OPTIONS dari browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method tidak diizinkan. Gunakan POST.' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Ambil parameter pencarian 'q' dari request body
    const body = await req.json().catch(() => ({}));
    const q = typeof body.q === 'string' ? body.q.trim() : '';

    if (!q) {
      return new Response(
        JSON.stringify({ error: 'Parameter pencarian (q) wajib diisi.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Ekstrak IP Address Pengguna dari Headers
    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-real-ip') ||
      '0.0.0.0';

    // 4. Inisialisasi Supabase Client dengan Service Role Key di Server
    // (SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY otomatis diinjeksi oleh Supabase Edge Functions)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Server Configuration Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return new Response(
        JSON.stringify({ error: 'Konfigurasi server belum lengkap.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // 5. Periksa Rate Limit Per-IP (Maksimal 15 request per 60 detik)
    // Menggunakan fungsi atomik di database
    const { data: isAllowed, error: rateErr } = await supabaseAdmin.rpc('check_ip_rate_limit', {
      client_ip: clientIp,
      max_requests: 15,
      window_seconds: 60,
    });

    if (rateErr) {
      console.warn('Rate limit check fallback:', rateErr.message);
      // Jika terjadi error pada tabel rate limit, lakukan fallback query manual
      const now = new Date();
      const { data: rateData } = await supabaseAdmin
        .from('search_rate_limit')
        .select('*')
        .eq('ip_address', clientIp)
        .maybeSingle();

      if (rateData) {
        const windowStart = new Date(rateData.window_start);
        const diffSeconds = (now.getTime() - windowStart.getTime()) / 1000;

        if (diffSeconds > 60) {
          await supabaseAdmin
            .from('search_rate_limit')
            .update({ request_count: 1, window_start: now.toISOString(), last_request: now.toISOString() })
            .eq('ip_address', clientIp);
        } else if (rateData.request_count >= 15) {
          return new Response(
            JSON.stringify({ error: 'Terlalu banyak permintaan, coba lagi nanti.' }),
            { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } else {
          await supabaseAdmin
            .from('search_rate_limit')
            .update({ request_count: rateData.request_count + 1, last_request: now.toISOString() })
            .eq('ip_address', clientIp);
        }
      } else {
        await supabaseAdmin
          .from('search_rate_limit')
          .insert([{ ip_address: clientIp, request_count: 1, window_start: now.toISOString(), last_request: now.toISOString() }]);
      }
    } else if (isAllowed === false) {
      return new Response(
        JSON.stringify({ error: 'Terlalu banyak permintaan, coba lagi nanti.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Eksekusi RPC search_pemilih jika rate limit aman
    const { data: searchResults, error: searchErr } = await supabaseAdmin.rpc('search_pemilih', {
      q,
    });

    if (searchErr) {
      console.error('RPC Error:', searchErr);
      return new Response(
        JSON.stringify({ error: 'Gagal memproses pencarian.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 7. Kembalikan data hasil pencarian aman ke client
    return new Response(JSON.stringify(searchResults || []), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('Unexpected error:', err);
    return new Response(
      JSON.stringify({ error: err?.message || 'Terjadi kesalahan pada server.' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
