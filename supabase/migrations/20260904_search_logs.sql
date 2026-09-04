-- =========================================================
-- MIGRATION: SEARCH LOGS & AUDIT FREQUENCY TRACKING
-- =========================================================

-- 1. TABEL LOG PENCARIAN PUBLIK (SEARCH LOGS)
create table if not exists public.search_logs (
  id            uuid primary key default gen_random_uuid(),
  query_raw     text not null,
  query_clean   text not null,
  search_type   text check (search_type in ('NAMA', 'NIK')) default 'NAMA',
  is_found      boolean not null default false,
  result_count  int not null default 0,
  matched_nama  text,
  tps_nomor     int,
  created_at    timestamptz not null default now()
);

-- Indexing untuk kecepatan analitik & rekap
create index if not exists idx_search_logs_query on public.search_logs (query_clean);
create index if not exists idx_search_logs_found on public.search_logs (is_found);
create index if not exists idx_search_logs_created on public.search_logs (created_at desc);

alter table public.search_logs enable row level security;

create policy "admin_all_search_logs" on public.search_logs
  for all using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- 2. FUNGSI PENCARIAN PUBLIK & PENCATATAN LOG OTOMATIS (RPC DEFINER)
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
declare
  clean_q text := trim(q);
  is_16_digit boolean;
  s_type text := 'NAMA';
begin
  if clean_q is null or length(clean_q) = 0 then
    return;
  end if;

  is_16_digit := (clean_q ~ '^[0-9]{16}$');
  if is_16_digit then
    s_type := 'NIK';
  end if;

  return query
  with search_results as (
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
        case
          when is_16_digit then
            (
              split_part(p.nik, '#', 1) = clean_q
              or
              (
                p.nik like '%*%'
                and length(split_part(split_part(p.nik, '#', 1), '*', 1)) >= 6
                and left(clean_q, length(split_part(split_part(p.nik, '#', 1), '*', 1))) = split_part(split_part(p.nik, '#', 1), '*', 1)
              )
            )
          else
            (
              length(clean_q) >= 3
              and p.nama ilike '%' || clean_q || '%'
            )
        end
      )
    limit 20
  ),
  log_entry as (
    insert into public.search_logs (
      query_raw,
      query_clean,
      search_type,
      is_found,
      result_count,
      matched_nama,
      tps_nomor,
      created_at
    )
    select
      q,
      upper(clean_q),
      s_type,
      (count(sr.nama) > 0),
      count(sr.nama)::int,
      case 
        when count(sr.nama) = 1 then max(sr.nama) 
        when count(sr.nama) > 1 then concat(max(sr.nama), ' (+', count(sr.nama) - 1, ' lainnya)') 
        else null 
      end,
      max(sr.tps_nomor),
      now()
    from (select 1) dummy
    left join search_results sr on true
    returning id
  )
  select sr.nama, sr.nik_tersamar, sr.alamat, sr.tps_nomor, sr.tps_lokasi, sr.status_dpt
  from search_results sr;
end;
$$;

grant execute on function public.search_pemilih(text) to anon, authenticated;

-- 3. FUNGSI STATISTIK LOG PENCARIAN (UNTUK DASHBOARD & LAPORAN ADMIN)
create or replace function public.get_search_stats()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  total_searches bigint := 0;
  unique_queries bigint := 0;
  total_found bigint := 0;
  total_not_found bigint := 0;
  unique_not_found bigint := 0;
begin
  select
    coalesce(count(*), 0),
    coalesce(count(distinct query_clean), 0),
    coalesce(count(*) filter (where is_found = true), 0),
    coalesce(count(*) filter (where is_found = false), 0),
    coalesce(count(distinct query_clean) filter (where is_found = false), 0)
  into
    total_searches,
    unique_queries,
    total_found,
    total_not_found,
    unique_not_found
  from public.search_logs;

  return jsonb_build_object(
    'total_searches', total_searches,
    'unique_queries', unique_queries,
    'total_found', total_found,
    'total_not_found', total_not_found,
    'unique_not_found', unique_not_found
  );
end;
$$;

grant execute on function public.get_search_stats() to authenticated;

-- 4. FUNGSI REKAP FREKUENSI PENCARIAN NAMA UNIK
create or replace function public.get_search_name_frequency(only_not_found boolean default false)
returns table (
  query_clean       text,
  search_type       text,
  search_count      bigint,
  is_found          boolean,
  matched_nama      text,
  tps_nomor         int,
  first_searched_at timestamptz,
  last_searched_at  timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    sl.query_clean,
    max(sl.search_type) as search_type,
    count(*) as search_count,
    bool_or(sl.is_found) as is_found,
    max(sl.matched_nama) as matched_nama,
    max(sl.tps_nomor) as tps_nomor,
    min(sl.created_at) as first_searched_at,
    max(sl.created_at) as last_searched_at
  from public.search_logs sl
  where (only_not_found is false or sl.is_found is false)
  group by sl.query_clean
  order by count(*) desc, max(sl.created_at) desc;
end;
$$;

grant execute on function public.get_search_name_frequency(boolean) to authenticated;
