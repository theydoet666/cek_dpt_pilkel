-- ====================================================================
-- MIGRATION: 003_add_server_rate_limiting.sql
-- Tujuan: Membuat tabel search_rate_limit & fungsi check_ip_rate_limit
--         untuk rate limiting per-IP di sisi server (Edge Function)
-- ====================================================================

-- 1. Buat tabel rate limit per-IP
create table if not exists public.search_rate_limit (
  ip_address    text primary key,
  request_count int not null default 1,
  window_start  timestamptz not null default now(),
  last_request  timestamptz not null default now()
);

-- Index pada kolom IP
create index if not exists idx_search_rate_limit_ip on public.search_rate_limit (ip_address);

-- 2. Aktifkan RLS ketat pada tabel search_rate_limit
alter table public.search_rate_limit enable row level security;

-- PENTING: TIDAK ADA policy untuk 'anon' atau 'authenticated'
-- Tabel ini HANYA bisa diakses oleh Service Role (Edge Function Server)
drop policy if exists "admin_all_rate_limit" on public.search_rate_limit;
drop policy if exists "public_read_rate_limit" on public.search_rate_limit;

-- 3. Fungsi Atomik Pengecekan Rate Limit (Per-IP)
create or replace function public.check_ip_rate_limit(
  client_ip text,
  max_requests int default 15,
  window_seconds int default 60
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rec record;
begin
  -- Kunci baris IP secara atomik untuk mencegah race conditions
  select * into rec from public.search_rate_limit where ip_address = client_ip for update;

  -- Jika belum pernah ada request dari IP ini -> buat baris baru
  if not found then
    insert into public.search_rate_limit (ip_address, request_count, window_start, last_request)
    values (client_ip, 1, now(), now());
    return true;
  end if;

  -- Jika jeda window waktu (60 detik) sudah lewat -> reset window dan counter ke 1
  if now() - rec.window_start > (window_seconds || ' seconds')::interval then
    update public.search_rate_limit
    set request_count = 1, window_start = now(), last_request = now()
    where ip_address = client_ip;
    return true;
  end if;

  -- Jika masih dalam window 60 detik dan counter sudah melebihi batas (15x) -> blokir
  if rec.request_count >= max_requests then
    update public.search_rate_limit
    set last_request = now()
    where ip_address = client_ip;
    return false;
  else
    -- Jika masih dalam batas -> naikkan counter
    update public.search_rate_limit
    set request_count = rec.request_count + 1, last_request = now()
    where ip_address = client_ip;
    return true;
  end if;
end;
$$;
