import readXlsxFile from 'read-excel-file/browser';
import type { ExcelParseResult, ParsedRow, Pemilih } from './types';

/**
 * Format Date / Serial / String tanggal dari DD|MM|YYYY atau DD/MM/YYYY atau Date object menjadi YYYY-MM-DD
 */
function parseDate(val: any): string | null {
  if (val === null || val === undefined || val === '') return null;

  // Handle JS Date object
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Handle Excel date number (serial number)
  if (typeof val === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const targetDate = new Date(excelEpoch.getTime() + val * 86400000);
    if (!isNaN(targetDate.getTime())) {
      const y = targetDate.getUTCFullYear();
      const m = String(targetDate.getUTCMonth() + 1).padStart(2, '0');
      const d = String(targetDate.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(val).trim();
  if (!str) return null;

  // Pattern YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // Format DD|MM|YYYY atau DD/MM/YYYY atau DD-MM-YYYY
  const dateParts = str.split(/[|/\-]/);
  if (dateParts.length === 3) {
    const p1 = dateParts[0].padStart(2, '0');
    const p2 = dateParts[1].padStart(2, '0');
    let p3 = dateParts[2];

    if (p3.length === 2) p3 = '19' + p3;
    if (p1.length === 2 && p2.length === 2 && p3.length === 4) {
      const day = parseInt(p1, 10);
      const month = parseInt(p2, 10);
      if (day <= 31 && month <= 12) {
        return `${p3}-${p2}-${p1}`;
      }
    }
  }

  // Safe fallback parse Date
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return null;
}

/**
 * Bersihkan string NIK (pertahankan karakter asterisks jika tersamar, pastikan string)
 */
function cleanNik(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Parse file Excel rekap DPT Desa Belega menggunakan read-excel-file yang aman dan ringan
 */
export async function parseDptExcel(file: File): Promise<ExcelParseResult> {
  // 1. Dapatkan seluruh sheet beserta datanya
  const sheets = await readXlsxFile(file);
  if (!sheets || sheets.length === 0) {
    throw new Error('File Excel tidak memiliki sheet yang dapat dibaca.');
  }

  // 2. Cari sheet "Lolos" atau "DPT" atau sheet pertama
  let targetSheet = sheets.find(
    (s) =>
      s.sheet.toLowerCase().includes('lolos') ||
      s.sheet.toLowerCase().includes('dpt') ||
      s.sheet.toLowerCase().includes('pdpb')
  );

  if (!targetSheet) {
    targetSheet = sheets[0];
  }

  // 3. Ambil data baris
  const rawRows: any[][] = targetSheet.data;

  if (!rawRows || rawRows.length === 0) {
    throw new Error('Sheet Excel kosong atau tidak dapat dibaca.');
  }

  // 4. Cari baris header secara dinamis (baris yang punya kolom NIK dan NAMA)
  let headerRowIndex = -1;
  const columnMapping: Record<string, number> = {};

  for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
    const row = rawRows[i];
    const rowStr = row.map((cell: any) => String(cell || '').toUpperCase().trim());

    const hasNik = rowStr.some((c: string) => c === 'NIK' || c === 'NO NIK' || c.includes('NIK'));
    const hasNama = rowStr.some((c: string) => c === 'NAMA' || c === 'NAMA PEMILIH' || c.includes('NAMA'));

    if (hasNik && hasNama) {
      headerRowIndex = i;
      rowStr.forEach((headerText: string, colIdx: number) => {
        if (headerText.includes('NO') && !headerText.includes('NIK') && !headerText.includes('TPS') && !headerText.includes('KK')) {
          columnMapping['no_urut'] = colIdx;
        } else if (headerText.includes('KECAMATAN')) {
          columnMapping['kecamatan'] = colIdx;
        } else if (headerText.includes('KELURAHAN') || headerText.includes('DESA')) {
          columnMapping['kelurahan'] = colIdx;
        } else if (headerText.includes('NKK') || headerText.includes('KK')) {
          columnMapping['nkk'] = colIdx;
        } else if (headerText.includes('NIK')) {
          columnMapping['nik'] = colIdx;
        } else if (headerText.includes('NAMA')) {
          columnMapping['nama'] = colIdx;
        } else if (headerText.includes('TEMPAT')) {
          columnMapping['tempat_lahir'] = colIdx;
        } else if (headerText.includes('TANGGAL') || headerText.includes('TGL')) {
          columnMapping['tanggal_lahir'] = colIdx;
        } else if (headerText.includes('KAWIN') || headerText.includes('STS')) {
          columnMapping['status_kawin'] = colIdx;
        } else if (headerText.includes('KELAMIN') || headerText.includes('JK')) {
          columnMapping['jenis_kelamin'] = colIdx;
        } else if (headerText.includes('ALAMAT')) {
          columnMapping['alamat'] = colIdx;
          const nextColText = rowStr[colIdx + 1] || '';
          if (!nextColText || nextColText === '' || nextColText.includes('KATEGORI') || nextColText.includes('JENIS')) {
            columnMapping['kategori_pemilih'] = colIdx + 1;
          }
        } else if (headerText.includes('TPS')) {
          columnMapping['tps_nomor'] = colIdx;
        }
      });
      break;
    }
  }

  if (headerRowIndex === -1) {
    throw new Error(
      'Tidak dapat menemukan baris header pada file Excel (baris yang memiliki kolom NIK dan NAMA).'
    );
  }

  const validRows: ParsedRow[] = [];
  const invalidRows: ParsedRow[] = [];

  // 5. Parsing data setelah baris header
  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.every((c: any) => String(c || '').trim() === '')) continue;

    const rowNum = i + 1;
    const errors: string[] = [];

    const rawNik = cleanNik(columnMapping['nik'] !== undefined ? row[columnMapping['nik']] : '');
    const rawNama = String(columnMapping['nama'] !== undefined ? row[columnMapping['nama']] || '' : '').trim();
    const rawAlamat = String(columnMapping['alamat'] !== undefined ? row[columnMapping['alamat']] || '' : '').trim();
    const rawTps = String(columnMapping['tps_nomor'] !== undefined ? row[columnMapping['tps_nomor']] || '' : '').trim();
    const rawJk = String(columnMapping['jenis_kelamin'] !== undefined ? row[columnMapping['jenis_kelamin']] || '' : '').toUpperCase().trim();
    const rawKategori = String(columnMapping['kategori_pemilih'] !== undefined ? row[columnMapping['kategori_pemilih']] || '' : '').trim();

    if (!rawNik) {
      errors.push('NIK tidak boleh kosong');
    }

    if (!rawNama) {
      errors.push('Nama pemilih tidak boleh kosong');
    }

    const tpsNum = parseInt(rawTps.replace(/\D/g, ''), 10);
    if (!tpsNum || isNaN(tpsNum)) {
      errors.push('Nomor TPS tidak valid atau kosong');
    }

    let jenisKelamin: 'L' | 'P' | null = null;
    if (rawJk.startsWith('L')) jenisKelamin = 'L';
    else if (rawJk.startsWith('P')) jenisKelamin = 'P';

    const pemilihData: Partial<Pemilih> = {
      no_urut: columnMapping['no_urut'] !== undefined ? parseInt(String(row[columnMapping['no_urut']]), 10) || null : null,
      kecamatan: String(columnMapping['kecamatan'] !== undefined ? row[columnMapping['kecamatan']] || 'BLAHBATUH' : 'BLAHBATUH').trim() || 'BLAHBATUH',
      kelurahan: String(columnMapping['kelurahan'] !== undefined ? row[columnMapping['kelurahan']] || 'BELEGA' : 'BELEGA').trim() || 'BELEGA',
      nkk: String(columnMapping['nkk'] !== undefined ? row[columnMapping['nkk']] || '' : '').trim() || null,
      nik: rawNik,
      nama: rawNama,
      tempat_lahir: String(columnMapping['tempat_lahir'] !== undefined ? row[columnMapping['tempat_lahir']] || '' : '').trim() || null,
      tanggal_lahir: parseDate(columnMapping['tanggal_lahir'] !== undefined ? row[columnMapping['tanggal_lahir']] : null),
      status_kawin: String(columnMapping['status_kawin'] !== undefined ? row[columnMapping['status_kawin']] || '' : '').trim() || null,
      jenis_kelamin: jenisKelamin,
      alamat: rawAlamat,
      kategori_pemilih: rawKategori || null,
      tps_nomor: tpsNum || 7,
      status_dpt: 'LOLOS',
      is_active: true,
    };

    const parsedRowItem: ParsedRow = {
      rowNumber: rowNum,
      data: pemilihData,
      isValid: errors.length === 0,
      errors,
    };

    if (errors.length === 0) {
      validRows.push(parsedRowItem);
    } else {
      invalidRows.push(parsedRowItem);
    }
  }

  return {
    fileName: file.name,
    sheetName: targetSheet.sheet,
    totalRows: validRows.length + invalidRows.length,
    validRows,
    invalidRows,
    headerRowIndex: headerRowIndex + 1,
    detectedHeaders: Object.fromEntries(
      Object.entries(columnMapping).map(([k, v]) => [k, `Kolom ${v + 1}`])
    ),
  };
}
