# PRD (Product Requirement Document)
# Sistem Pengecekan DPT — Pemilihan Perbekel Desa Belega

**Versi:** 1.0
**Tanggal:** 2 September 2026
**Stack:** React.js + Tailwind CSS (Frontend) · Supabase (Database, Auth, Storage, Edge Functions)

---

## 1. Latar Belakang & Tujuan

Panitia Pemilihan Perbekel Desa Belega, Kecamatan Blahbatuh, Kabupaten Gianyar membutuhkan sistem berbasis web agar warga dapat **mengecek status dirinya dalam Daftar Pemilih Tetap (DPT)** secara mandiri, tanpa harus datang ke kantor desa/banjar. Sumber data berasal dari file Excel rekap PDPB (Pemutakhiran Data Pemilih Berkelanjutan) yang saat ini dikelola manual oleh panitia.

**Tujuan utama:**
1. Warga dapat mengecek status pemilih (terdaftar/tidak) melalui NIK atau Nama, lalu melihat alamat & lokasi TPS miliknya.
2. Panitia (admin) dapat meng-upload/update data pemilih dari file Excel tanpa perlu keahlian teknis, dan datanya langsung tersedia di halaman publik.
3. Tampilan mobile-first & responsif, karena mayoritas warga akan mengakses lewat HP.

---

## 2. Ruang Lingkup

### 2.1 Termasuk (in-scope)
- Halaman publik: form cek NIK/Nama + hasil pengecekan.
- Halaman admin (login): upload Excel, preview & validasi data, kelola data manual (tambah/edit/hapus), riwayat upload, statistik ringkas per TPS.
- Database terpusat di Supabase (Postgres).
- Proteksi data pribadi (NIK) sesuai semangat UU PDP — publik tidak melihat NIK penuh.

### 2.2 Tidak termasuk (out-of-scope, fase awal)
- Sistem e-voting / rekap suara.
- Verifikasi wajah / OTP SMS.
- Integrasi Dukcapil real-time.
- Multi-desa/multi-tenant (sistem ini didesain khusus 1 desa: Belega; TPS 7, 8, 9).

---

## 3. Aktor & Peran

| Aktor | Deskripsi | Akses |
|---|---|---|
| **Warga / Pemilih (Publik)** | Pengguna umum, tanpa login | Hanya form cek NIK/Nama + hasil |
| **Admin Panitia** | Petugas KPPS/Panitia Pemilihan | Login, upload Excel, kelola data, lihat statistik |
| **Super Admin** (opsional, fase 2) | Ketua Panitia | Semua akses admin + kelola akun admin lain |

---

## 4. Kebutuhan Fungsional

### 4.1 Modul Publik — Cek DPT

**F-01 Form Pencarian**
- Input tunggal: NIK (16 digit) **atau** Nama.
- Sistem otomatis mendeteksi: jika input 16 digit angka → cari by NIK (exact match); selain itu → cari by Nama (partial match, tidak case-sensitive, toleran spasi berlebih).
- Tombol "Cek Status".
- Validasi input dasar (tidak boleh kosong, minimal 3 karakter untuk nama).

**F-02 Hasil Pencarian**
- Jika ditemukan (1 hasil):
  - Nama lengkap
  - NIK **tersamar** (contoh: `5104******0391`)
  - Alamat (dusun/banjar)
  - **Lokasi TPS** (nomor TPS + alamat/lokasi TPS jika ada)
  - Status (badge): *Terdaftar* / *Terdaftar - Pemilih Baru* / *Tidak Memenuhi Syarat*
- Jika ditemukan lebih dari 1 hasil (pencarian by nama) → tampilkan daftar ringkas (Nama, Alamat, TPS), user pilih salah satu untuk lihat detail.
- Jika tidak ditemukan → pesan jelas: "Data tidak ditemukan dalam Daftar Pemilih Tetap Desa Belega" + saran menghubungi panitia/banjar.
- Loading state & empty state yang ramah pengguna awam.

**F-03 Informasi Pendukung**
- Statistik publik ringan (opsional): total pemilih per TPS (tanpa data pribadi individu).
- Info kontak panitia / link ke pengumuman resmi.

### 4.2 Modul Admin

**F-04 Autentikasi**
- Login via Supabase Auth (email + password).
- Session persistensi, logout.
- (Fase 2) Reset password via email.

**F-05 Upload Data Excel**
- Upload file `.xlsx`.
- Sistem membaca **berdasarkan nama kolom header**, bukan posisi kolom tetap (karena sheet sumber memiliki variasi urutan kolom & baris info di atas tabel).
- Preview data hasil parsing sebelum disimpan (tabel preview + ringkasan: total baris, baris valid, baris error).
- Validasi per baris: NIK harus 16 digit, Nama tidak boleh kosong, TPS harus salah satu dari [7, 8, 9] atau bisa dipetakan.
- Pilihan mode simpan:
  - **Upsert by NIK** (rekomendasi default): jika NIK sudah ada → update data, jika belum ada → insert baru.
  - **Replace All** (opsional, untuk sinkron ulang penuh — hanya untuk admin, ada dialog konfirmasi tegas).
- Setelah upload sukses → dicatat di tabel riwayat (`upload_batches`) berikut nama file, jumlah baris, waktu, oleh siapa.
- Menangani banyak sheet dalam satu file (opsional: admin pilih sheet mana yang mau diimpor, atau sistem otomatis menggabungkan semua sheet yang punya struktur tabel pemilih & mengabaikan sheet rekap yang bukan data pemilih).

**F-06 Kelola Data Manual**
- Tabel data pemilih (list, search, filter by TPS/status, pagination).
- Tambah 1 data pemilih manual.
- Edit data pemilih.
- Hapus data pemilih (soft delete direkomendasikan, `is_active`).

**F-07 Dashboard Ringkas**
- Total pemilih keseluruhan & per TPS.
- Jumlah per status (Lolos/DPS/Baru/Tidak Lolos).
- Riwayat upload terakhir.

**F-08 Manajemen TPS**
- CRUD data TPS (nomor TPS, nama lokasi, alamat lokasi TPS, dusun/banjar cakupan).

---

## 5. Kebutuhan Non-Fungsional

| Kategori | Kebutuhan |
|---|---|
| **Responsif** | Mobile-first (breakpoint Tailwind: `sm/md/lg`), diuji di layar 360px ke atas |
| **Kinerja** | Hasil pencarian publik < 1 detik untuk ±1.500 baris data |
| **Keamanan data** | NIK tidak pernah dikirim/ditampilkan penuh ke publik; akses tabel mentah dibatasi RLS; hanya fungsi pencarian (RPC) yang bisa diakses anonim |
| **Ketersediaan** | Hosting statis (Vercel/Netlify) + Supabase — cukup untuk skala 1 desa |
| **Auditability** | Setiap upload tercatat (siapa, kapan, berapa baris) |
| **Aksesibilitas** | Kontras warna cukup, ukuran tombol ramah sentuh (min 44px), bahasa Indonesia sederhana |
| **Kepatuhan privasi** | Sejalan dengan prinsip UU No. 27/2022 (PDP): minimalisasi data yang ditampilkan ke publik |

---

## 6. Arsitektur Sistem

```
[ Browser Publik ] ---> [ React SPA (Vite) ] ---> [ Supabase RPC: search_pemilih() ] ---> [ Postgres (RLS ON) ]
[ Browser Admin  ] ---> [ React SPA (rute /admin) ] ---> [ Supabase Auth ]
                                                    \--> [ Supabase Table CRUD (RLS: authenticated only) ]
                                                    \--> [ Supabase Storage (opsional, simpan file excel asli) ]

Upload Excel:
Admin pilih file --> Parse di browser (SheetJS) --> Preview --> Kirim batch JSON --> Insert/Upsert ke Postgres
```

**Poin desain penting:**
- Parsing Excel dilakukan **di sisi client** (library `xlsx`/SheetJS) agar tidak perlu server tambahan — cocok untuk arsitektur Supabase (BaaS).
- Publik **tidak** mengakses tabel `pemilih` secara langsung. Publik hanya memanggil **Postgres function** `search_pemilih(query text)` yang `SECURITY DEFINER`, mengembalikan kolom terbatas & NIK tersamar. Ini kunci keamanan data.
- Admin mengakses tabel penuh melalui Supabase client dengan sesi `authenticated`, diatur oleh RLS policy.

---

## 7. Skema Database (Supabase / PostgreSQL)

### 7.1 ERD (ringkas)

```
tps (1) ────────< (N) pemilih
upload_batches (1) ─< (N) pemilih   [pemilih.upload_batch_id, nullable]
auth.users (1) ─────< (1) admin_profiles
```

### 7.2 DDL SQL

```sql
-- =========================================================
-- 1. TABEL TPS
-- =========================================================
create table public.tps (
  id            uuid primary key default gen_random_uuid(),
  nomor_tps     int  not null unique,          -- 7, 8, 9
  nama_lokasi   text,                          -- ex: "Balai Banjar Jasri"
  alamat_lokasi text,                          -- alamat lengkap lokasi TPS
  dusun         text,                          -- Br. Jasri, dst
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- =========================================================
-- 2. TABEL UPLOAD BATCH (riwayat upload)
-- =========================================================
create table public.upload_batches (
  id            uuid primary key default gen_random_uuid(),
  file_name     text not null,
  uploaded_by   uuid references auth.users(id),
  total_rows    int  default 0,
  valid_rows    int  default 0,
  error_rows    int  default 0,
  mode          text check (mode in ('upsert','replace')) default 'upsert',
  status        text check (status in ('processing','success','failed')) default 'processing',
  notes         text,
  created_at    timestamptz not null default now()
);

-- =========================================================
-- 3. TABEL UTAMA: PEMILIH (DPT)
-- =========================================================
create table public.pemilih (
  id               uuid primary key default gen_random_uuid(),
  no_urut          int,                         -- kolom "NO" dari excel (arsip)
  kecamatan        text default 'BLAHBATUH',
  kelurahan        text default 'BELEGA',
  nkk              text,                        -- Nomor KK
  nik              text not null,               -- 16 digit, unik
  nama             text not null,
  tempat_lahir     text,
  tanggal_lahir    date,
  status_kawin     text,                        -- 'S','B','P','J' dst sesuai sumber
  jenis_kelamin    text check (jenis_kelamin in ('L','P')),
  alamat           text,                        -- alamat lengkap (jalan/no rumah/BTN/banjar)
  kategori_pemilih text,                        -- nilai dari kolom tanpa header di excel: 'LOKAL','BTN','BTN KG','TK', dst (boleh null)
  tps_id           uuid references public.tps(id),
  tps_nomor        int,                         -- disimpan juga sbg redundant utk query cepat
  status_dpt       text check (status_dpt in ('DPS','LOLOS','TIDAK_LOLOS','BARU')) default 'LOLOS',
  is_active        boolean not null default true,   -- untuk soft delete
  upload_batch_id  uuid references public.upload_batches(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint uq_nik unique (nik)
);

create index idx_pemilih_nama on public.pemilih using gin (to_tsvector('simple', nama));
create index idx_pemilih_nik  on public.pemilih (nik);
create index idx_pemilih_tps  on public.pemilih (tps_nomor);

-- =========================================================
-- 4. PROFIL ADMIN (melengkapi auth.users)
-- =========================================================
create table public.admin_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  nama        text,
  role        text check (role in ('admin','super_admin')) default 'admin',
  created_at  timestamptz not null default now()
);

-- =========================================================
-- 5. TRIGGER updated_at otomatis
-- =========================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger trg_pemilih_updated_at before update on public.pemilih
for each row execute procedure public.set_updated_at();

create trigger trg_tps_updated_at before update on public.tps
for each row execute procedure public.set_updated_at();
```

### 7.3 Row Level Security (RLS)

```sql
alter table public.pemilih enable row level security;
alter table public.tps enable row level security;
alter table public.upload_batches enable row level security;
alter table public.admin_profiles enable row level security;

-- PUBLIK: TIDAK BOLEH akses tabel pemilih langsung sama sekali
-- (tidak ada policy select untuk role anon -> otomatis default deny)

-- ADMIN (authenticated): full akses ke pemilih
create policy "admin_all_pemilih" on public.pemilih
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "admin_all_tps" on public.tps
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- TPS: publik boleh baca (untuk info lokasi TPS umum, tanpa data pribadi)
create policy "public_read_tps" on public.tps
  for select
  using (true);

create policy "admin_all_batches" on public.upload_batches
  for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "own_profile" on public.admin_profiles
  for select using (auth.uid() = id);
```

### 7.4 Fungsi Pencarian Publik (kunci keamanan)

```sql
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
security definer     -- berjalan dgn hak akses fungsi, bukan hak akses pemanggil (anon)
set search_path = public
as $$
begin
  return query
  select
    p.nama,
    concat(left(p.nik,4), '********', right(p.nik,4)) as nik_tersamar,
    p.alamat,
    p.tps_nomor,
    t.nama_lokasi,
    p.status_dpt
  from public.pemilih p
  left join public.tps t on t.id = p.tps_id
  where p.is_active = true
    and (
      -- jika query 16 digit angka -> exact match NIK
      (q ~ '^[0-9]{16}$' and p.nik = q)
      or
      -- selain itu -> partial match nama (case & spasi toleran)
      (q !~ '^[0-9]{16}$' and p.nama ilike '%' || trim(q) || '%')
    )
  limit 20;
end;
$$;

-- Izinkan role anon memanggil fungsi ini
grant execute on function public.search_pemilih(text) to anon;
```

> Dengan pendekatan ini, tabel `pemilih` **tidak pernah** diekspos langsung ke publik — satu-satunya jalan publik mendapatkan data adalah lewat fungsi ini, yang sudah membatasi kolom & menyamarkan NIK.

---

## 8. Pemetaan Kolom Excel → Database

**Format resmi/final** (berdasarkan `Contoh_Format_DPT.xlsx`) berupa **satu sheet** bernama `Lolos` yang berisi seluruh DPT (bukan lagi banyak sheet Lolos/Tidak Lolos/Baru/DPS/per-TPS seperti draf sebelumnya). Struktur baris:

| Baris | Isi |
|---|---|
| 1 | Judul: "DAFTAR PEMILIH PADA PEMUTAKHIRAN DATA PEMILIH BERKELANJUTAN (PDPB) ..." |
| 2 | Nama desa/kecamatan, contoh " DESA BELEGA KECAMATAN BLAHBATUH" |
| 3 | Nama kabupaten |
| 4 | Total jumlah pemilih (angka di salah satu kolom, mis. kolom C) |
| 5 | Baris kosong |
| **6** | **Baris header kolom** (lihat tabel di bawah) |
| 7 dst. | Data pemilih, satu baris = satu orang, sampai baris terakhir sheet |

Header baris ke-6: `NO | KECAMATAN | KELURAHAN | NKK | NIK | NAMA | TEMPAT LAHIR | TANGGAL LAHIR | STS KAWIN | KELAMIN | ALAMAT | (tanpa header) | TPS`

| Kolom Excel | Kolom Database (`pemilih`) | Catatan |
|---|---|---|
| NO | `no_urut` | Arsip saja, bukan primary key |
| KECAMATAN | `kecamatan` | Default "BLAHBATUH" jika kosong |
| KELURAHAN | `kelurahan` | Default "BELEGA" jika kosong |
| NKK | `nkk` | Boleh kosong |
| NIK | `nik` | **Wajib**, 16 digit, unik → dasar upsert |
| NAMA | `nama` | **Wajib** |
| TEMPAT LAHIR | `tempat_lahir` | - |
| TANGGAL LAHIR | `tanggal_lahir` | Format sumber `DD\|MM\|YYYY` → konversi ke `date` |
| STS KAWIN | `status_kawin` | Nilai teramati: `S` (Sudah kawin/kawin tercatat), `B` (Belum kawin), `P` (Pernah kawin/cerai) |
| KELAMIN | `jenis_kelamin` | `L`/`P` |
| ALAMAT | `alamat` | **Alamat lengkap** (jalan, nomor rumah, nama BTN/perumahan/banjar) — bukan sekadar nama dusun |
| *(kolom tanpa nama header, setelah ALAMAT)* | `kategori_pemilih` | Nilai teramati: `LOKAL`, `BTN`, `BTN KG`, `TK`, atau kosong. Kemungkinan penanda kelompok/kompleks pemilih (mis. warga lokal banjar vs penghuni BTN/perumahan). Simpan apa adanya, jangan divalidasi ketat — boleh null |
| TPS | `tps_nomor` + lookup ke `tps_id` | **Selalu terisi per baris** di format ini (7/8/9) — tidak perlu lagi deteksi dari nama sheet |
| *(nama sheet)* | `status_dpt` | Karena sheet contoh diberi nama "Lolos", isi default `status_dpt = 'LOLOS'` untuk seluruh baris dalam sheet ini. Jika di kemudian hari panitia mengunggah sheet lain (misal "Tidak Lolos" atau "DPTb/Baru"), field ini tetap dipetakan dari nama sheet sebagai fallback (lihat aturan parsing di bawah) |

**Aturan parsing yang direkomendasikan untuk fitur upload (disederhanakan sesuai format final):**
1. Untuk setiap sheet dalam file: cari baris header, yaitu baris yang selnya mengandung persis `"NIK"` **dan** `"NAMA"` (case-insensitive, trim spasi) — abaikan semua baris di atasnya (baris judul/nama desa/kabupaten/total/kosong). Di format resmi ini biasanya baris ke-6, tetapi **jangan hardcode nomor baris**, tetap cari secara dinamis agar tahan terhadap sedikit perubahan format di kemudian hari.
2. Cocokkan kolom **berdasarkan nama header**, bukan indeks tetap.
3. Kolom `TPS` **wajib diambil langsung dari kolom di tiap baris** (bukan dari nama sheet) karena format final selalu menyertakannya. Deteksi dari nama sheet/baris "TPS n :" hanya dipakai sebagai **fallback** bila suatu saat ada file lama yang formatnya berbeda dan kolom TPS tidak ditemukan di tabel.
4. `status_dpt` ditentukan dari nama sheet (default `LOLOS` jika nama sheet tidak mengandung kata kunci status lain seperti "tidak lolos"/"baru"/"dps"). Karena format final biasanya hanya berisi 1 sheet "Lolos", pada praktiknya seluruh baris akan berstatus `LOLOS`.
5. Bersihkan data: trim spasi di semua kolom teks, uppercase untuk `jenis_kelamin` (map ke `L`/`P` saja), validasi NIK harus tepat 16 digit angka setelah dibersihkan dari spasi.
6. Baris dengan NIK kosong/tidak valid 16 digit → masuk daftar error, **jangan** dimasukkan ke data valid.
7. Tampilkan hasil parsing (baris valid vs error, termasuk baris dengan `kategori_pemilih` kosong sebagai info/tidak fatal) di layar preview sebelum admin menekan "Simpan ke Database".

---

## 9. Alur Pengguna (User Flow)

### 9.1 Publik
1. Buka halaman utama → lihat form pencarian.
2. Ketik NIK atau Nama → tekan "Cek Status".
3. Sistem memanggil `search_pemilih()`.
4. Tampilkan hasil (kartu info) atau pesan "tidak ditemukan".

### 9.2 Admin – Upload Data
1. Login.
2. Masuk menu "Upload Data" → pilih file `.xlsx`.
3. Sistem parsing di browser → tampilkan preview + ringkasan validasi.
4. Admin pilih mode (Upsert/Replace) → konfirmasi.
5. Sistem kirim data ke Supabase (batch insert/upsert), tampilkan progress.
6. Tampilkan ringkasan hasil (berhasil, error, dan alasan error per baris jika ada).

---

## 10. Struktur Halaman (Frontend)

```
/                      → Halaman publik: cek DPT (default route)
/hasil                 → (opsional, bisa jadi state di halaman yang sama)
/admin/login           → Login admin
/admin                 → Dashboard ringkas
/admin/upload          → Upload Excel + preview
/admin/data            → Tabel kelola data pemilih (search/filter/edit/hapus)
/admin/tps             → Kelola data TPS
/admin/riwayat         → Riwayat upload
```

**Komponen UI kunci (Tailwind, mobile-first):**
- `SearchForm` (input + tombol besar, full width di mobile)
- `ResultCard` (status badge berwarna: hijau=Terdaftar, kuning=Baru, merah=Tidak Lolos)
- `EmptyState` / `LoadingSpinner`
- `AdminLayout` (sidebar collapsible di mobile → bottom nav atau hamburger menu)
- `UploadDropzone` + `PreviewTable` (scrollable horizontal di mobile)
- `DataTable` dengan pagination & search bar sticky di atas saat scroll

---

## 11. Rencana Bertahap (Roadmap)

| Fase | Ruang Lingkup |
|---|---|
| **MVP (Fase 1)** | Skema DB + RLS, halaman publik cek DPT, login admin, upload Excel (mode upsert), dashboard ringkas |
| **Fase 2** | Kelola data manual (CRUD UI), riwayat upload detail, manajemen TPS, role super_admin |
| **Fase 3** | Export laporan (PDF/Excel), notifikasi WhatsApp/email opsional, statistik grafik |

---

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Data NIK bocor ke publik | Gunakan RPC `security definer` + RLS deny by default, NIK selalu disamarkan di response publik |
| Format Excel berubah/berbeda antar periode unggahan | Parsing berbasis nama header (bukan posisi kolom) & pencarian baris header dinamis (bukan nomor baris tetap); validasi & preview sebelum simpan |
| Duplikasi data saat re-upload | Upsert berbasis `nik` (unique constraint) |
| Kesalahan admin replace-all tanpa sengaja | Konfirmasi ganda (ketik "HAPUS SEMUA" atau checkbox eksplisit) sebelum replace |
| Beban akses tinggi H-1 hari pemilihan | Index pada `nik` dan full-text index pada `nama`; Supabase gratis-tier cukup untuk ±1.500 data & traffic desa |

---

## 13. Kriteria Selesai (Definition of Done — MVP)

- [ ] Warga bisa cek NIK 16 digit dan mendapat hasil benar sesuai data di Excel.
- [ ] Warga bisa cek dengan Nama (partial match) dan melihat daftar bila lebih dari satu hasil.
- [ ] NIK tidak pernah tampil penuh di sisi publik (cek lewat Network tab browser).
- [ ] Admin bisa login, upload file contoh (`TPS_07-08-09_DPT_BR_JASTRI_.xlsx`), preview, dan menyimpan data ke Supabase tanpa error.
- [ ] Tampilan berfungsi baik di lebar layar 360px–1440px.
- [ ] RLS aktif dan diverifikasi: request langsung ke tabel `pemilih` dari klien anon **ditolak**.
