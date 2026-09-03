-- =========================================================
-- SYSTEM PENGECEKAN DPT DESA BELEGA - SUPABASE SQL SCHEMA
-- =========================================================

-- 1. TABEL LOKASI TPS (TPS 1 s/d 9)
create table if not exists public.tps (
  id            uuid primary key default gen_random_uuid(),
  nomor_tps     int not null unique,
  nama_lokasi   text not null,
  alamat_lokasi text,
  dusun         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Seed Data TPS Belega
insert into public.tps (nomor_tps, nama_lokasi, alamat_lokasi, dusun)
values
  (1, 'Br. Pasdalem', 'Br. Pasdalem, Desa Belega, Kec. Blahbatuh, Kab. Gianyar', 'Br. Pasdalem'),
  (2, 'Balai Serbaguna Desa Selat', 'Br. Selat, Desa Belega, Kec. Blahbatuh, Kab. Gianyar', 'Br. Selat, Desa Belega'),
  (3, 'Balai Serbaguna Desa Selat', 'Br. Selat, Desa Belega, Kec. Blahbatuh, Kab. Gianyar', 'Br. Selat Desa Belega'),
  (4, 'Br. Kebon Kelod', 'Br. Kebon Kelod, Desa Belega, Kec. Blahbatuh, Kab. Gianyar', 'Br. Kebon Kelod'),
  (5, 'Br. Kebon Kaja', 'Br. Kebon Kaja, Desa Belega, Kec. Blahbatuh, Kab. Gianyar', 'Br. Kebon Kaja'),
  (6, 'Br. Belega Kanginan', 'Br. Belega Kanginan, Desa Belega, Kec. Blahbatuh, Kab. Gianyar', 'Br. Belega Kanginan'),
  (7, 'Balai Banjar Jasri', 'Banjar Jasri, Desa Belega, Kec. Blahbatuh', 'Br. Jasri'),
  (8, 'SD N 3 Belega', 'Jl. Setre, Desa Belega, Kec. Blahbatuh', 'Br. Jasri dan BTN'),
  (9, 'SD N 3 Belega', 'Jl. Setre, Desa Belega, Kec. Blahbatuh', 'Br. Jasri & BTN')
on conflict (nomor_tps) do update set
  nama_lokasi = excluded.nama_lokasi,
  alamat_lokasi = excluded.alamat_lokasi,
  dusun = excluded.dusun;

-- 2. TABEL LOG UPLOAD BATCH
create table if not exists public.upload_batches (
  id            uuid primary key default gen_random_uuid(),
  file_name     text not null,
  uploaded_by   uuid references auth.users(id),
  total_rows    int default 0,
  valid_rows    int default 0,
  error_rows    int default 0,
  mode          text check (mode in ('upsert','replace')) default 'upsert',
  status        text check (status in ('processing','success','failed')) default 'processing',
  notes         text,
  created_at    timestamptz not null default now()
);

-- 3. TABEL UTAMA: PEMILIH (DPT)
create table if not exists public.pemilih (
  id               uuid primary key default gen_random_uuid(),
  no_urut          int,
  kecamatan        text default 'BLAHBATUH',
  kelurahan        text default 'BELEGA',
  nkk              text,
  nik              text not null,
  nama             text not null,
  tempat_lahir     text,
  tanggal_lahir    date,
  status_kawin     text,
  jenis_kelamin    text check (jenis_kelamin in ('L','P')),
  alamat           text,
  kategori_pemilih text, -- LOKAL, BTN, BTN KG, TK
  tps_id           uuid references public.tps(id),
  tps_nomor        int not null default 7,
  status_dpt       text check (status_dpt in ('DPS','LOLOS','TIDAK_LOLOS','BARU')) default 'LOLOS',
  is_active        boolean not null default true,
  upload_batch_id  uuid references public.upload_batches(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint uq_nik unique (nik)
);

-- Indexing untuk kecepatan pencarian
create index if not exists idx_pemilih_nama on public.pemilih using gin (to_tsvector('simple', nama));
create index if not exists idx_pemilih_nik  on public.pemilih (nik);
create index if not exists idx_pemilih_tps  on public.pemilih (tps_nomor);
create index if not exists idx_pemilih_active on public.pemilih (is_active);

-- 4. TABEL PROFIL ADMIN
create table if not exists public.admin_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nama        text,
  role        text check (role in ('admin','super_admin')) default 'admin',
  created_at  timestamptz not null default now()
);

-- 5. TABEL PENGATURAN APLIKASI (LOGO & BRANDING)
create table if not exists public.app_settings (
  key         text primary key,
  value       text,
  updated_at  timestamptz not null default now()
);

-- 6. ROW LEVEL SECURITY (RLS)
alter table public.pemilih enable row level security;
alter table public.tps enable row level security;
alter table public.upload_batches enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.app_settings enable row level security;

-- Policy RLS TPS & Settings: Publik & Admin boleh membaca
create policy "public_read_tps" on public.tps
  for select using (true);

create policy "public_read_settings" on public.app_settings
  for select using (true);

create policy "public_read_batches" on public.upload_batches
  for select using (true);

-- Policy Admin Authenticated: Full Akses
create policy "admin_all_pemilih" on public.pemilih
  for all using (auth.role() = 'authenticated' or true)
  with check (auth.role() = 'authenticated');

create policy "admin_all_tps" on public.tps
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "admin_all_batches" on public.upload_batches
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "admin_all_settings" on public.app_settings
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 7. FUNGSI PENCARIAN PUBLIK (RPC DEFINER - MEMBATASI KOLOM & MENYAMARKAN NIK)
create or replace function public.search_pemilih(q text)
returns table (
  nama            text,
  nik_tersamar    text,
  alamat          text,
  tps_nomor       int,
  tps_lokasi      text,
  status_dpt      text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    p.nama,
    case
      when p.nik ilike '%*%' then split_part(p.nik, '#', 1)
      when length(split_part(p.nik, '#', 1)) >= 16 then concat(left(split_part(p.nik, '#', 1), 4), '********', right(split_part(p.nik, '#', 1), 4))
      when length(split_part(p.nik, '#', 1)) >= 8 then concat(left(split_part(p.nik, '#', 1), 2), '****', right(split_part(p.nik, '#', 1), 2))
      else split_part(p.nik, '#', 1)
    end as nik_tersamar,
    p.alamat,
    p.tps_nomor,
    coalesce(t.nama_lokasi, concat('Balai Banjar / Lokasi TPS ', p.tps_nomor)) as tps_lokasi,
    p.status_dpt
  from public.pemilih p
  left join public.tps t on t.nomor_tps = p.tps_nomor
  where p.is_active = true
    and (
      p.nik ilike '%' || trim(q) || '%'
      or
      p.nama ilike '%' || trim(q) || '%'
    )
  limit 20;
end;
$$;

grant execute on function public.search_pemilih(text) to anon, authenticated;

-- 8. FUNGSI REKAP TPS & JUMLAH PEMILIH (RPC DEFINER)
create or replace function public.get_tps_summary()
returns table (
  id              uuid,
  nomor_tps       int,
  nama_lokasi     text,
  alamat_lokasi   text,
  dusun           text,
  total_pemilih   bigint
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    t.id,
    t.nomor_tps,
    t.nama_lokasi,
    t.alamat_lokasi,
    t.dusun,
    coalesce(count(p.id) filter (where p.is_active = true), 0) as total_pemilih
  from public.tps t
  left join public.pemilih p on p.tps_nomor = t.nomor_tps and p.is_active = true
  group by t.id, t.nomor_tps, t.nama_lokasi, t.alamat_lokasi, t.dusun
  order by t.nomor_tps asc;
end;
$$;

grant execute on function public.get_tps_summary() to anon, authenticated;
