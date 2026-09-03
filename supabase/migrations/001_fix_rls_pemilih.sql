-- ====================================================================
-- MIGRATION: 001_fix_rls_pemilih.sql
-- Tujuan: Menghapus seluruh bypass RLS dan mengunci tabel pemilih secara ketat
-- ====================================================================

-- 1. Pastikan Row Level Security aktif pada tabel pemilih
alter table public.pemilih enable row level security;

-- 2. Drop policy lama yang bermasalah / mengandung bypass
drop policy if exists "admin_all_pemilih" on public.pemilih;
drop policy if exists "public_read_pemilih" on public.pemilih;
drop policy if exists "anon_read_pemilih" on public.pemilih;

-- 3. Buat policy ketat: HANYA role authenticated (Admin login) yang bisa akses
create policy "admin_all_pemilih" on public.pemilih
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 4. Kunci juga tabel upload_batches agar log upload hanya bisa diakses Admin
drop policy if exists "public_read_batches" on public.upload_batches;
drop policy if exists "admin_all_batches" on public.upload_batches;

alter table public.upload_batches enable row level security;

create policy "admin_all_batches" on public.upload_batches
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 5. Kunci tabel admin_profiles
drop policy if exists "admin_all_profiles" on public.admin_profiles;
drop policy if exists "own_profile" on public.admin_profiles;

alter table public.admin_profiles enable row level security;

create policy "admin_all_profiles" on public.admin_profiles
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
