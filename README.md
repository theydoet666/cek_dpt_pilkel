# Cek DPT Online - Pemilihan Perbekel Desa Belega 2026

Sistem Pengecekan Daftar Pemilih Tetap (DPT) berbasis Web & Supabase untuk Pemilihan Perbekel Desa Belega, Kecamatan Blahbatuh, Kabupaten Gianyar.

## Fitur Utama
- **Pencarian Publik DPT**: Cek lokasi TPS mencoblos berdasarkan NIK / NIK Tersamar atau Nama Pemilih.
- **Perlindungan Data Pribadi (UU PDP)**: NIK disamarkan secara otomatis di halaman publik.
- **Panel Admin Panitia**:
  - Authentikasi Admin via Supabase Auth.
  - Upload Rekap DPT via Excel (`.xlsx`) dengan deteksi header otomatis dan pengolahan batch.
  - Kelola Data Pemilih (CRUD Pemilih & Hapus Semua Data DPT).
  - Kelola Data TPS (CRUD Lokasi TPS).
  - Pengaturan Branding & Upload Logo / Favicon Web secara langsung.

## Teknologi
- **Frontend**: React, TypeScript, Vite, TailwindCSS, Lucide Icons
- **Backend & Database**: Supabase (PostgreSQL, Auth, REST API, RPC Definer)
