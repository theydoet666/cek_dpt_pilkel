-- ====================================================================
-- MIGRATION: 005_atomic_replace_pemilih.sql
-- Tujuan: Membuat fungsi RPC atomik replace_all_pemilih dalam 1 transaksi
--         sehingga data lama tidak hilang jika proses unggah terputus di tengah.
-- ====================================================================

create or replace function public.replace_all_pemilih(
  batch jsonb,
  batch_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_count int := 0;
begin
  -- 1. Nonaktifkan (soft delete) seluruh data lama
  -- Catatan: Seluruh operasi di dalam function PL/pgSQL berjalan dalam 1 transaksi atomik.
  -- Jika terjadi error pada proses insert di bawah, update ini otomatis di-rollback oleh Postgres.
  update public.pemilih
  set is_active = false, updated_at = now()
  where is_active = true;

  -- 2. Insert seluruh data baru dari batch jsonb
  insert into public.pemilih (
    no_urut,
    kecamatan,
    kelurahan,
    nkk,
    nik,
    nama,
    tempat_lahir,
    tanggal_lahir,
    status_kawin,
    jenis_kelamin,
    alamat,
    kategori_pemilih,
    tps_nomor,
    status_dpt,
    is_active,
    upload_batch_id,
    created_at,
    updated_at
  )
  select
    (elem->>'no_urut')::int,
    coalesce(elem->>'kecamatan', 'BLAHBATUH'),
    coalesce(elem->>'kelurahan', 'BELEGA'),
    elem->>'nkk',
    elem->>'nik',
    elem->>'nama',
    elem->>'tempat_lahir',
    case 
      when (elem->>'tanggal_lahir') ~ '^\d{4}-\d{2}-\d{2}$' then (elem->>'tanggal_lahir')::date
      else null
    end,
    elem->>'status_kawin',
    elem->>'jenis_kelamin',
    elem->>'alamat',
    elem->>'kategori_pemilih',
    coalesce((elem->>'tps_nomor')::int, 7),
    coalesce(elem->>'status_dpt', 'LOLOS'),
    true,
    batch_id,
    now(),
    now()
  from jsonb_array_elements(batch) as elem
  on conflict (nik) do update set
    no_urut = excluded.no_urut,
    kecamatan = excluded.kecamatan,
    kelurahan = excluded.kelurahan,
    nkk = excluded.nkk,
    nama = excluded.nama,
    tempat_lahir = excluded.tempat_lahir,
    tanggal_lahir = excluded.tanggal_lahir,
    status_kawin = excluded.status_kawin,
    jenis_kelamin = excluded.jenis_kelamin,
    alamat = excluded.alamat,
    kategori_pemilih = excluded.kategori_pemilih,
    tps_nomor = excluded.tps_nomor,
    status_dpt = excluded.status_dpt,
    is_active = true,
    upload_batch_id = coalesce(excluded.upload_batch_id, public.pemilih.upload_batch_id),
    updated_at = now();

  get diagnostics inserted_count = row_count;

  return jsonb_build_object(
    'success', true,
    'inserted_rows', inserted_count
  );
end;
$$;

-- Izin eksekusi hanya untuk role authenticated (Admin)
grant execute on function public.replace_all_pemilih(jsonb, uuid) to authenticated;
