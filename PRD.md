# PRD (Product Requirement Document)
# Sistem Pengecekan DPT Online — Pemilihan Perbekel Desa Belega

**Versi:** 1.5 (Terkini & Tervalidasi)  
**Tanggal Pembaruan:** 3 September 2026  
**Stack:** React 19 + TypeScript + Vite + Tailwind CSS (Frontend) · Supabase (PostgreSQL, Auth, Storage, RPC Definer)  
**Repositori GitHub:** [https://github.com/theydoet666/cek_dpt_pilkel.git](https://github.com/theydoet666/cek_dpt_pilkel.git)

---

## 1. Latar Belakang & Tujuan

Panitia Pemilihan Perbekel Desa Belega, Kecamatan Blahbatuh, Kabupaten Gianyar membutuhkan sistem berbasis web agar warga dapat **mengecek status dirinya dalam Daftar Pemilih Tetap (DPT)** secara mandiri dan cepat, tanpa harus datang ke kantor desa atau balai banjar. Sumber data berasal dari file Excel rekap PDPB (Pemutakhiran Data Pemilih Berkelanjutan) yang dikelola oleh panitia pemilihan.

**Tujuan utama:**
1. **Kemudahan Warga**: Warga dapat mengecek status pemilih (terdaftar/tidak) secara mandiri melalui NIK atau Nama, lalu melihat alamat dan lokasi TPS mencoblos.
2. **Kemudahan Panitia (Admin)**: Panitia dapat mengunggah file Excel rekap DPT dengan deteksi kolom cerdas, mengelola data manual, mengelola lokasi TPS, mengatur logo web/favicon, serta menghapus/mereset data DPT dengan aman.
3. **Kepatuhan Privasi (UU PDP)**: NIK warga selalu disamarkan di halaman publik dan tidak pernah terekspos penuh ke publik.
4. **Desain Modern & Mobile-First**: Antarmuka responsif dan ramah pengguna di semua ukuran layar (layar HP hingga Desktop).

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
  - Upload Excel DPT dengan deteksi header otomatis, penanganan NIK fleksibel/tersamar, dan batch upsert.
  - Kelola Data Pemilih: CRUD data pemilih individual, filter TPS, pencarian, dan fitur **Hapus Semua Data DPT** (Double-Confirmation).
  - Kelola Data TPS: CRUD lokasi TPS (Nomor, Nama Lokasi, Alamat, Dusun Cakupan).
  - Pengaturan Branding: Unggah Logo resmi Panitia / Desa Belega yang otomatis mengubah logo Header Publik, Sidebar Admin, Login, dan Favicon browser tab.
  - Riwayat Batch Upload: Pencatatan otomatis riwayat unggahan file Excel.
- **Backend & Database**:
  - Database PostgreSQL di Supabase dengan Row Level Security (RLS) aktif di seluruh tabel.
  - PostgreSQL RPC Functions: `search_pemilih()` dan `get_tps_summary()`.
- **Keamanan & Kinerja**:
  - Anti-scraping rate limiting pada pencarian publik.
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
| **Admin Panitia** | Petugas / Panitia Pemilihan | Login admin, melihat dashboard statistik dinamis, upload Excel DPT, CRUD pemilih, CRUD TPS, ganti logo/favicon, hapus semua data |
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
- **F-05 Dashboard Statistik Dinamis**:
  - Kartu Ringkasan: Total DPT, Total TPS, Total Laki-laki (% rasio), Total Perempuan (% rasio).
  - Sebaran Pemilih per Lokasi TPS: Menampilkan seluruh TPS yang terdaftar (TPS 01 s/d TPS 09+) beserta jumlah pemilih dan persentase progress bar.
  - Tombol Refresh cepat dan log batch upload terakhir.
- **F-06 Upload Excel DPT (`.xlsx`)**:
  - Menggunakan library browser-native `read-excel-file/browser` yang ringan dan aman (0 vulnerabilities).
  - Deteksi baris header secara dinamis (mencari kolom `NIK` dan `NAMA`).
  - Dukungan NIK fleksibel (boleh kurang dari 16 digit atau mengandung asterisks `*`).
  - Penanganan duplikasi NIK tersamar per batch dengan suffix unik (`#2`, `#3`) guna mencegah Postgres Error 21000.
  - Mode **Upsert by NIK** (default) dan **Replace All**.
- **F-07 Kelola Data Pemilih (DPT)**:
  - Tabel interaktif dengan filter TPS, filter Kategori, pencarian real-time, dan paginasi.
  - Tambah pemilih manual, edit pemilih, dan hapus pemilih.
  - **Fitur Hapus Semua Data DPT**: Modal konfirmasi ganda dengan opsi *Soft Delete* vs *Hard Delete*, serta wajib mengetikkan frasa `HAPUS SEMUA DATA DPT`.
- **F-08 Kelola Tempat Pemungutan Suara (TPS)**:
  - CRUD lengkap TPS: Tambah TPS baru, Edit Lokasi/Alamat/Dusun, dan Hapus TPS (dengan peringatan jika ada pemilih terdaftar).
  - Perhitungan jumlah pemilih akurat per TPS via query tanpa batas baris.
- **F-09 Pengaturan Logo & Favicon**:
  - Unggah logo resmi Panitia/Desa Belega (format PNG, JPG, WEBP dengan proteksi XSS).
  - Mengubah tampilan logo di Header Publik, Sidebar Admin, Halaman Login, serta Favicon tab browser secara otomatis.
- **F-10 Riwayat Unggahan**:
  - Halaman log riwayat batch upload file Excel (nama file, total baris, jumlah baris valid/error, mode, dan tanggal).

---

## 5. Arsitektur & Keamanan Sistem

```
[ Browser Publik ] ---> [ React SPA (Vite) ] ---> [ Supabase RPC: search_pemilih() ] ---> [ PostgreSQL (RLS ON) ]
                                            ---> [ Supabase RPC: get_tps_summary() ]  /
[ Browser Admin  ] ---> [ React SPA (/admin) ] -> [ Supabase Auth ]                   /
                                                \-> [ Supabase Table CRUD (RLS Authenticated) ]
```

### Standar Keamanan yang Diterapkan:
1. **Row Level Security (RLS)**: Diaktifkan pada semua tabel (`pemilih`, `tps`, `upload_batches`, `admin_profiles`, `app_settings`).
2. **Pencarian Aman via RPC Definer**: Publik hanya dapat mencari via fungsi `search_pemilih(q)` yang menyamarkan NIK di level database.
3. **Penyimpanan Kredensial Aman**: File `.env` dan file mentah Excel diabaikan oleh `.gitignore` dan tidak di-push ke GitHub.
4. **Validasi File Upload**: Pembatasan MIME type & ekstensi gambar untuk mencegah serangan *Stored XSS*.
5. **Anti-Scraping**: Client-side throttle pada pencarian publik untuk melindungi data dari scraping massal.

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
```

### 6.2 RPC Functions Kunci

- **`search_pemilih(q text)`**: Fungsi pencarian publik berjenis `SECURITY DEFINER` dengan penyamaran NIK otomatis.
- **`get_tps_summary()`**: Fungsi rekapitulasi data TPS dan perhitungan pemilih aktif secara instan dan akurat.

---

## 7. Struktur Halaman & Routing (Frontend)

```
/                      → Halaman Publik: Cek DPT Online & Info TPS
/hasil                 → Alias Halaman Publik
/admin/login           → Halaman Login Admin Panitia
/admin                 → Dashboard Utama (Statistik & Sebaran TPS Dinamis)
/admin/upload          → Unggah File Excel DPT (.xlsx) & Preview
/admin/data            → Kelola Data Pemilih (Tabel, CRUD, Hapus Semua Data)
/admin/tps             → Kelola Tempat Pemungutan Suara (CRUD Lokasi TPS)
/admin/riwayat         → Riwayat Batch Upload File
/admin/settings        → Pengaturan Logo & Favicon Web
```

---

## 8. Status Kriteria Selesai (Definition of Done)

- [x] Warga dapat mengecek NIK atau Nama dan mendapatkan hasil lokasi TPS secara akurat.
- [x] NIK selalu disamarkan di sisi publik (UU PDP).
- [x] Admin dapat login dengan aman via Supabase Auth.
- [x] Admin dapat mengunggah file Excel DPT dengan deteksi header otomatis dan opsi batch upsert.
- [x] Dashboard menampilkan data seluruh TPS (TPS 01 s/d 09+) dan statistik pemilih secara dinamis dari database.
- [x] Fitur CRUD Lokasi TPS berfungsi penuh dan tersinkronisasi ke portal publik.
- [x] Fitur Hapus Semua Data DPT dengan pengaman konfirmasi ganda berfungsi dengan baik.
- [x] Fitur Upload Logo dan Favicon browser dinamis berfungsi penuh.
- [x] Audit Keamanan: Bebas dari vulnerability paket (`found 0 vulnerabilities`) dan file kredensial `.env` terlindungi.
- [x] Desain responsif mobile-first diuji di layar 360px hingga layar monitor desktop.
- [x] Seluruh kode sumber terkelola di repositori GitHub [theydoet666/cek_dpt_pilkel](https://github.com/theydoet666/cek_dpt_pilkel.git).
