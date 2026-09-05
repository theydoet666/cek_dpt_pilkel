# PRD (Product Requirement Document)
# Sistem Pengecekan DPT Online — Pemilihan Perbekel Desa Belega

**Versi:** 1.7 (Terkini & Tervalidasi)  
**Tanggal Pembaruan:** 5 September 2026  
**Stack:** React 19 + TypeScript + Vite + Tailwind CSS (Frontend) · Supabase (PostgreSQL, Auth, Storage, RPC Definer, Edge Functions)  
**Repositori GitHub:** [https://github.com/theydoet666/cek_dpt_pilkel.git](https://github.com/theydoet666/cek_dpt_pilkel.git)

---

## 1. Latar Belakang & Tujuan

Panitia Pemilihan Perbekel Desa Belega, Kecamatan Blahbatuh, Kabupaten Gianyar membutuhkan sistem berbasis web agar warga dapat **mengecek status dirinya dalam Daftar Pemilih Tetap (DPT)** secara mandiri dan cepat, tanpa harus datang ke kantor desa atau balai banjar. Sumber data berasal dari file Excel rekap PDPB (Pemutakhiran Data Pemilih Berkelanjutan) yang dikelola oleh panitia pemilihan.

**Tujuan utama:**
1. **Kemudahan Warga**: Warga dapat mengecek status pemilih (terdaftar/tidak) secara mandiri melalui NIK atau Nama, lalu melihat alamat dan lokasi TPS mencoblos.
2. **Kemudahan Panitia (Admin)**: Panitia dapat mengunggah file Excel rekap DPT (hingga 4.500+ data sekaligus) dengan deteksi kolom cerdas, mengelola data manual, mengelola lokasi TPS, mengatur logo web/favicon, memantau log & analitik pengecekan warga, mengganti password akun admin, serta menghapus/mereset data DPT dengan aman.
3. **Kepatuhan Privasi (UU PDP)**: NIK warga selalu disamarkan di halaman publik dan tidak pernah terekspos penuh ke publik.
4. **Desain Modern & Mobile-First**: Antarmuka responsif dan ramah pengguna di semua ukuran layar (layar HP hingga Desktop).
5. **Skalabilitas & Keamanan Konkurensi**: Tahan beban tinggi di hari-H pemilihan saat ribuan warga mengakses portal pencarian secara bersamaan (bebas table-lock / collision).

---

## 2. Ruang Lingkup

### 2.1 Termasuk (In-Scope)
- **Halaman Publik**:
  - Form pencarian cerdas (by NIK atau Nama).
  - Tampilan kartu hasil pengecekan dengan NIK tersamar, nama, alamat, status DPT, dan lokasi TPS.
  - Dialog modal interaktif "Info Lokasi TPS" yang terhubung langsung ke database.
- **Panel Admin Panitia**:
  - Autentikasi Admin via Supabase Auth (Email + Password) dan rute terproteksi (`ProtectedRoute`).
  - Dashboard statistik real-time: Total DPT, Total TPS, Pemilih Laki-laki/Perempuan, dan Sebaran Pemilih per masing-masing TPS (TPS 01 s/d TPS 09+).
  - Upload Excel DPT dengan deteksi header otomatis, penanganan NIK fleksibel/tersamar, batch chunking per 500 baris (mendukung 4.500+ data sekaligus), serta opsi mode *Upsert by NIK* dan *Replace All*.
  - **Kelola Data Pemilih**: CRUD data pemilih individual, **Filter TPS Dinamis dari Database**, **Filter Alamat (Banjar/Dusun)**, pencarian real-time, paginasi, serta fitur **Hapus Semua Data DPT** (Double-Confirmation). (Filter Kategori telah dihapus demi kesederhanaan antarmuka).
  - **Kelola Data TPS**: CRUD lokasi TPS (Nomor, Nama Lokasi, Alamat, Dusun Cakupan), perhitungan *exact count* pemilih per TPS tanpa batas PostgREST 1.000 baris, serta **Banner Peringatan Deteksi TPS Belum Terdaftar** (dengan tombol 1-klik auto-add TPS).
  - **Log & Analitik Pengecekan Nama**: Halaman admin memantau riwayat pencarian publik, frekuensi pencarian per nama/NIK, pencarian tidak ditemukan, stat cards analitik, filter tanggal/query, dan ekspor data CSV.
  - **Pengaturan & Keamanan (Ganti Password & Branding)**: Unggah Logo resmi Panitia / Desa Belega (header, sidebar, login, favicon) dan fitur **Ganti Password Admin** langsung dari panel admin dengan re-autentikasi password lama & password strength meter.
  - Riwayat Batch Upload: Pencatatan otomatis riwayat unggahan file Excel.
- **Backend & Database**:
  - Database PostgreSQL di Supabase dengan Row Level Security (RLS) aktif di seluruh tabel.
  - PostgreSQL RPC Functions: `search_pemilih()` (PL/pgSQL berbasis CTE untuk konkurensi tinggi), `get_tps_summary()`, `replace_all_pemilih()`, `get_search_stats()`, dan `get_search_name_frequency()`.
  - Supabase Edge Function `cek-dpt-search` dengan CORS whitelist dinamis (`ALLOWED_ORIGINS`).
- **Keamanan & Kinerja**:
  - Anti-scraping rate limiting pada pencarian publik.
  - Audit Keamanan (Skor 97/100): Pengamanan CORS whitelist dinamis, penutupan login bypass di production, validasi input query.
  - Refaktor PL/pgSQL `search_pemilih()` menggunakan Common Table Expression (CTE) tanpa `CREATE TEMP TABLE` untuk keamanan eksekusi serentak (concurrent access).
  - Zero-vulnerability Excel parser (`read-excel-file/browser`).
  - React ErrorBoundary untuk pemulihan runtime yang mulus.

### 2.2 Tidak Termasuk (Out-of-Scope)
- Sistem e-voting (pemungutan suara digital).
- Verifikasi biometrik / OTP SMS berbayar.
- Integrasi API Dukcapil langsung.

---

## 3. Aktor & Hak Akses

| Aktor | Peran | Hak Akses |
|---|---|---|
| **Warga / Pemilih (Publik)** | Pengguna umum tanpa login | Mengakses halaman utama, mencari DPT by NIK/Nama, melihat hasil dengan NIK tersamar, melihat daftar lokasi TPS |
| **Admin Panitia** | Petugas / Panitia Pemilihan | Login admin, melihat dashboard statistik dinamis, upload Excel DPT, CRUD pemilih, CRUD TPS, memantau log & analitik pengecekan, ganti password, ganti logo/favicon, hapus semua data |
| **Super Admin** | Ketua Panitia | Seluruh hak akses admin + pengelolaan akun panitia |

---

## 4. Kebutuhan Fungsional

### 4.1 Modul Publik — Cek DPT

- **F-01 Form Pencarian Cerdas**:
  - Input teks tunggal: NIK (16 digit atau tersamar) **atau** Nama warga.
  - Minimal 3 karakter untuk pencarian nama.
  - Dilengkapi *client-side rate limiting guard* (maksimal 12 pencarian per 30 detik) untuk mencegah bot *scraping*.
- **F-02 Tampilan Hasil Pencarian**:
  - Nama Lengkap Pemilih.
  - NIK **Tersamar** otomatis (contoh: `5104********0391`).
  - Alamat lengkap pemilih.
  - Lokasi TPS (Nomor TPS + Nama Balai/Sekolah tempat mencoblos).
  - Status DPT: Badge status *LOLOS*, *DPS*, *BARU*, atau *TIDAK LOLOS*.
- **F-03 Modal Info TPS Publik**:
  - Menampilkan seluruh daftar lokasi TPS resmi Desa Belega yang diambil secara dinamis dari database.
  - Tampilan modal dengan scroll internal dan batas tinggi (`max-h-[90vh]`).

### 4.2 Modul Admin Panitia

- **F-04 Autentikasi & Proteksi Rute**:
  - Login via Supabase Auth dengan sesi JWT aman.
  - `ProtectedRoute` memastikan rute `/admin/*` hanya dapat diakses oleh admin yang terotentikasi.
  - Fitur Demo Mode Bypass yang dibatasi strictly pada environment development (`import.meta.env.DEV`).
- **F-05 Dashboard Statistik Dinamis**:
  - Kartu Ringkasan: Total DPT, Total TPS, Total Laki-laki (% rasio), Total Perempuan (% rasio).
  - Sebaran Pemilih per Lokasi TPS: Menampilkan seluruh TPS yang terdaftar beserta jumlah pemilih real-time dan persentase progress bar.
  - Tombol Refresh cepat dan log batch upload terakhir.
- **F-06 Upload Excel DPT (`.xlsx`)**:
  - Menggunakan library browser-native `read-excel-file/browser` yang ringan dan aman (0 vulnerabilities).
  - Deteksi baris header secara dinamis (mencari kolom `NIK` dan `NAMA`).
  - Dukungan NIK fleksibel (boleh kurang dari 16 digit atau mengandung asterisks `*`).
  - Batch chunking 500 baris per request yang mampu memproses **4.500+ baris data sekaligus** secara aman tanpa timeout.
  - Mode **Upsert by NIK** (default) dan **Replace All**.
- **F-07 Kelola Data Pemilih (DPT)**:
  - Tabel interaktif dengan **Filter TPS Dinamis dari Database**, **Filter Alamat (Banjar/Dusun)**, pencarian real-time, dan paginasi.
  - Tambah pemilih manual, edit pemilih, dan hapus pemilih.
  - **Fitur Hapus Semua Data DPT**: Modal konfirmasi ganda dengan opsi *Soft Delete* vs *Hard Delete*, serta wajib mengetikkan frasa `HAPUS SEMUA DATA DPT`.
- **F-08 Kelola Tempat Pemungutan Suara (TPS)**:
  - CRUD lengkap TPS: Tambah TPS baru, Edit Lokasi/Alamat/Dusun, dan Hapus TPS (dengan peringatan jika ada pemilih terdaftar).
  - Perhitungan jumlah pemilih akurat per TPS via query *exact count* server (`count: 'exact', head: true`) yang bebas dari limit 1.000 PostgREST.
  - **Banner Deteksi TPS Belum Terdaftar**: Peringatan visual otomatis apabila ada pemilih aktif dengan nomor TPS yang belum terdaftar di tabel master TPS, dengan tombol 1-klik untuk menambah TPS.
- **F-09 Pengaturan & Keamanan (Ganti Password & Branding)**:
  - **Fitur Ganti Password**: Form ganti password dengan re-autentikasi password lama, indikator visual *Password Strength Meter* (5 level), konfirmasi password, dan toggle show/hide password.
  - Unggah logo resmi Panitia/Desa Belega (format PNG, JPG, WEBP dengan proteksi XSS).
  - Mengubah tampilan logo di Header Publik, Sidebar Admin, Halaman Login, serta Favicon tab browser secara otomatis.
- **F-10 Riwayat Unggahan**:
  - Halaman log riwayat batch upload file Excel (nama file, total baris, jumlah baris valid/error, mode, dan tanggal).
- **F-11 Log & Analitik Pengecekan Nama (`/admin/search-logs`)**:
  - 4 Stat Cards: Total Pengecekan, Nama Unik Dicek, Berhasil Ditemukan, Tidak Ditemukan.
  - Tab Navigasi: Semua Log, Rekap Frekuensi Pencarian, dan Pencarian Tidak Ditemukan.
  - Fitur Pencarian & Filter Tanggal (Start Date - End Date).
  - Ekspor Laporan Log ke format CSV untuk analisis panitia.

---

## 5. Arsitektur & Keamanan Sistem

```
[ Browser Publik ] ---> [ React SPA (Vite) ] ---> [ Edge Function / RPC: search_pemilih() ] ---> [ PostgreSQL (RLS ON) ]
                                            ---> [ Supabase RPC: get_tps_summary() ]        /
[ Browser Admin  ] ---> [ React SPA (/admin) ] -> [ Supabase Auth ]                         /
                                                \-> [ Supabase Table CRUD (RLS Authenticated) ]
```

### Standar Keamanan & Performa yang Diterapkan:
1. **Row Level Security (RLS)**: Diaktifkan pada semua tabel (`pemilih`, `tps`, `upload_batches`, `admin_profiles`, `app_settings`, `search_logs`).
2. **Pencarian Aman via RPC Definer & CTE**: Publik hanya dapat mencari via fungsi `search_pemilih(q)` yang menyamarkan NIK di level database. Fungsi ini ditulis dengan Common Table Expression (CTE) agar bebas dari isu temp-table lock saat diakses bersamaan oleh ribuan warga secara serentak.
3. **Penyimpanan Kredensial & Secrets**: File `.env` diabaikan oleh `.gitignore`. Edge Function menggunakan environment variable `ALLOWED_ORIGINS` untuk mengunci CORS origin secara dinamis di produksi.
4. **Validasi File Upload & Input**: Pembatasan MIME type & ekstensi gambar untuk mencegah *Stored XSS*. Pembatasan panjang query pencarian maksimal 100 karakter.
5. **Anti-Scraping**: Client-side throttle pada pencarian publik untuk melindungi data dari scraping massal.
6. **Audit Keamanan Terverifikasi**: Skor Keamanan 97/100 (Bebas dari peretasan CORS wildcard dan login bypass).

---

## 6. Skema Database (PostgreSQL / Supabase)

### 6.1 Struktur Tabel

```sql
-- 1. Tabel TPS
create table public.tps (
  id            uuid primary key default gen_random_uuid(),
  nomor_tps     int not null unique,
  nama_lokasi   text not null,
  alamat_lokasi text,
  dusun         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 2. Tabel Upload Batches
create table public.upload_batches (
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

-- 3. Tabel Pemilih (DPT)
create table public.pemilih (
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
  kategori_pemilih text,
  tps_id           uuid references public.tps(id),
  tps_nomor        int not null default 7,
  status_dpt       text check (status_dpt in ('DPS','LOLOS','TIDAK_LOLOS','BARU')) default 'LOLOS',
  is_active        boolean not null default true,
  upload_batch_id  uuid references public.upload_batches(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint uq_nik unique (nik)
);

-- 4. Tabel App Settings (Logo & Branding)
create table public.app_settings (
  key         text primary key,
  value       text,
  updated_at  timestamptz not null default now()
);

-- 5. Tabel Search Logs (Pencatatan Pengecekan DPT)
create table public.search_logs (
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
```

### 6.2 RPC Functions Kunci

- **`search_pemilih(q text)`**: Fungsi pencarian publik `SECURITY DEFINER` berbasis CTE (Common Table Expression) dengan penyamaran NIK & pencatatan log otomatis ke `search_logs`.
- **`get_tps_summary()`**: Fungsi rekapitulasi data TPS dan perhitungan pemilih aktif secara instan dan akurat.
- **`replace_all_pemilih(batch jsonb, batch_id uuid)`**: Fungsi penggantian total data DPT dalam 1 transaksi atomik database.
- **`get_search_stats()`**: Fungsi statistik agregat pencarian publik (total pengecekan, nama unik, ditemukan, tidak ditemukan).
- **`get_search_name_frequency(only_not_found boolean)`**: Fungsi rekap frekuensi pencarian per nama unik untuk analisis panitia.

---

## 7. Struktur Halaman & Routing (Frontend)

```
/                      → Halaman Publik: Cek DPT Online & Info TPS
/hasil                 → Alias Halaman Publik
/admin/login           → Halaman Login Admin Panitia
/admin                 → Dashboard Utama (Statistik & Sebaran TPS Dinamis)
/admin/upload          → Unggah File Excel DPT (.xlsx) & Preview (Batching 500 Chunk)
/admin/data            → Kelola Data Pemilih (Tabel, Filter TPS Dinamis, Filter Alamat, CRUD, Hapus Semua Data)
/admin/tps             → Kelola Tempat Pemungutan Suara (CRUD Lokasi TPS & Deteksi Missing TPS)
/admin/search-logs     → Halaman Log & Analitik Pengecekan Nama (Search Logs)
/admin/riwayat         → Riwayat Batch Upload File
/admin/settings        → Pengaturan & Keamanan (Ganti Password, Logo & Favicon Web)
```

---

## 8. Status Kriteria Selesai (Definition of Done)

- [x] Warga dapat mengecek NIK atau Nama dan mendapatkan hasil lokasi TPS secara akurat.
- [x] NIK selalu disamarkan di sisi publik (UU PDP).
- [x] Pencarian warga otomatis dicatat ke tabel `search_logs` untuk analitik panitia.
- [x] Fungsi database `search_pemilih()` teroptimasi menggunakan CTE untuk eksekusi serentak (concurrency) tinggi tanpa *table lock*.
- [x] Admin dapat login dengan aman via Supabase Auth dan mengganti password langsung dari panel admin (`/admin/settings`).
- [x] Admin dapat memantau log & analitik pengecekan warga di halaman `/admin/search-logs` lengkap dengan statistik & ekspor CSV.
- [x] Admin dapat mengunggah file Excel DPT (hingga 4.500+ data) dengan deteksi header otomatis dan opsi batch chunking per 500 baris.
- [x] Dashboard menampilkan data seluruh TPS dan statistik pemilih secara dinamis & akurat dari database.
- [x] Halaman Data Pemilih memuat Filter TPS Dinamis dari Database & Filter Alamat (Banjar/Dusun).
- [x] Fitur CRUD Lokasi TPS berfungsi penuh dan terhubung dengan banner deteksi TPS belum terdaftar.
- [x] Fitur Hapus Semua Data DPT dengan pengaman konfirmasi ganda berfungsi dengan baik.
- [x] Fitur Upload Logo dan Favicon browser dinamis berfungsi penuh.
- [x] Audit Keamanan Selesai (Skor 97/100): Perbaikan CORS dynamic whitelist di Edge Function & penutupan login bypass di production.
- [x] Bebas dari vulnerability paket (`found 0 vulnerabilities`) dan file kredensial `.env` terlindungi.
- [x] Desain responsif mobile-first diuji di layar 360px hingga layar monitor desktop.
- [x] Seluruh kode sumber terkelola di repositori GitHub [theydoet666/cek_dpt_pilkel](https://github.com/theydoet666/cek_dpt_pilkel.git).
