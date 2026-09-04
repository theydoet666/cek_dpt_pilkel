export interface TPS {
  id: string;
  nomor_tps: number; // 7, 8, 9
  nama_lokasi: string; // e.g. "Balai Banjar Jasri"
  alamat_lokasi?: string;
  dusun?: string;
  created_at?: string;
  updated_at?: string;
}

export type StatusDPT = 'LOLOS' | 'DPS' | 'BARU' | 'TIDAK_LOLOS';

export interface Pemilih {
  id: string;
  no_urut?: number | null;
  kecamatan: string;
  kelurahan: string;
  nkk?: string | null;
  nik: string;
  nama: string;
  tempat_lahir?: string | null;
  tanggal_lahir?: string | null;
  status_kawin?: string | null; // S, B, P
  jenis_kelamin?: 'L' | 'P' | null;
  alamat: string;
  kategori_pemilih?: string | null; // LOKAL, BTN, BTN KG, TK
  tps_id?: string | null;
  tps_nomor: number; // 7, 8, 9
  status_dpt: StatusDPT;
  is_active: boolean;
  upload_batch_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UploadBatch {
  id: string;
  file_name: string;
  uploaded_by?: string | null;
  total_rows: number;
  valid_rows: number;
  error_rows: number;
  mode: 'upsert' | 'replace';
  status: 'processing' | 'success' | 'failed';
  notes?: string | null;
  created_at: string;
}

export interface SearchResult {
  nama: string;
  nik_tersamar: string;
  alamat: string;
  tps_nomor: number;
  tps_lokasi?: string;
  status_dpt: string;
}

export interface ParsedRow {
  rowNumber: number;
  data: Partial<Pemilih>;
  isValid: boolean;
  errors: string[];
}

export interface ExcelParseResult {
  fileName: string;
  sheetName: string;
  totalRows: number;
  validRows: ParsedRow[];
  invalidRows: ParsedRow[];
  headerRowIndex: number; // 1-indexed
  detectedHeaders: Record<string, string>;
}

export interface SearchLog {
  id: string;
  query_raw: string;
  query_clean: string;
  search_type: 'NAMA' | 'NIK';
  is_found: boolean;
  result_count: number;
  matched_nama?: string | null;
  tps_nomor?: number | null;
  created_at: string;
}

export interface SearchFrequencyItem {
  query_clean: string;
  search_type: 'NAMA' | 'NIK';
  search_count: number;
  is_found: boolean;
  matched_nama?: string | null;
  tps_nomor?: number | null;
  first_searched_at: string;
  last_searched_at: string;
}

export interface SearchStatsSummary {
  total_searches: number;
  unique_queries: number;
  total_found: number;
  total_not_found: number;
  unique_not_found: number;
}

