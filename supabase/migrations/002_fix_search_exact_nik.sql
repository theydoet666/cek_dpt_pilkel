-- ====================================================================
-- MIGRATION: 002_fix_search_exact_nik.sql
-- Tujuan: Mengunci pencarian publik agar 16 digit hanya mencari exact NIK,
--         dan pencarian nama tidak menyentuh kolom NIK sama sekali (privasi ketat).
-- ====================================================================

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
begin
  -- Deteksi apakah input merupakan persis 16 digit angka
  is_16_digit := (clean_q ~ '^[0-9]{16}$');

  return query
  select
    p.nama,
    -- Penyamaran NIK: Selalu kembalikan versi tersamar ke publik demi kepatuhan UU PDP
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
        -- ==================================================================
        -- KASUS 1: Input PERSIS 16 digit angka -> Cari HANYA by kolom NIK
        -- ==================================================================
        when is_16_digit then
          (
            -- Pencocokan NIK Utuh (Exact Match)
            split_part(p.nik, '#', 1) = clean_q
            or
            -- [WORKAROUND SEMENTARA]:
            -- Penanganan file sumber Excel yang NIK-nya sudah termasking tanda '*' dari panitia.
            -- Pencocokan dilakukan terhadap bagian digit sebelum tanda '*' (misal 10-12 digit awal).
            -- PERHATIAN: WORKAROUND SEMENTARA INI HARUS DITINJAU ULANG jika data produksi nanti berisi NIK utuh 16 digit.
            (
              p.nik like '%*%'
              and length(split_part(split_part(p.nik, '#', 1), '*', 1)) >= 6
              and left(clean_q, length(split_part(split_part(p.nik, '#', 1), '*', 1))) = split_part(split_part(p.nik, '#', 1), '*', 1)
            )
          )
        -- ==================================================================
        -- KASUS 2: Input BUKAN 16 digit angka (Nama Warga) -> Cari HANYA by NAMA
        -- Kolom NIK tidak dicocokkan sama sekali (mencegah penjelajahan NIK via angka parsial)
        -- ==================================================================
        else
          (
            length(clean_q) >= 3
            and p.nama ilike '%' || clean_q || '%'
          )
      end
    )
  limit 20;
end;
$$;

-- Izinkan pemanggilan publik (anonim) dan admin
grant execute on function public.search_pemilih(text) to anon, authenticated;
