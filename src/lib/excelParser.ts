import * as XLSX from 'xlsx';
import type { ExcelParseResult, ParsedRow, Pemilih } from './types';

/**
 * Format string tanggal dari DD|MM|YYYY atau DD/MM/YYYY atau Excel Serial Date menjadi YYYY-MM-DD
 */
function parseDate(val: any): string | null {
  if (!val) return null;
  
  if (typeof val === 'number') {
    // Excel date number
    const dateObj = XLSX.SSF.parse_date_code(val);
    if (dateObj) {
      const y = dateObj.y;
      const m = String(dateObj.m).padStart(2, '0');
      const d = String(dateObj.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(val).trim();
  // Format DD|MM|YYYY atau DD/MM/YYYY atau DD-MM-YYYY
  const dateParts = str.split(/[|/\-]/);
  if (dateParts.length === 3) {
    const day = dateParts[0].padStart(2, '0');
    const month = dateParts[1].padStart(2, '0');
    let year = dateParts[2];
    if (year.length === 2) year = '19' + year; // fallback
    if (day.length === 2 && month.length === 2 && year.length === 4) {
      return `${year}-${month}-${day}`;
    }
  }

  return str;
}

/**
 * Bersihkan string NIK (hilangkan bintang/spasi jika ada, pastikan string)
 */
function cleanNik(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[\s\*]/g, '').trim();
}

/**
 * Parse file Excel rekap DPT Desa Belega
 */
export async function parseDptExcel(file: File): Promise<ExcelParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });

        // Cari sheet "Lolos" atau sheet pertama yang berisi data
        let targetSheetName = workbook.SheetNames.find(
          (name) => name.toLowerCase().includes('lolos') || name.toLowerCase().includes('dpt')
        );

        if (!targetSheetName) {
          targetSheetName = workbook.SheetNames[0];
        }

        const sheet = workbook.Sheets[targetSheetName];
        const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          blankrows: false,
          defval: '',
        });

        if (!rawRows || rawRows.length === 0) {
          throw new Error('Sheet Excel kosong atau tidak dapat dibaca');
        }

        // Cari baris header secara dinamis (baris yang punya sel "NIK" dan "NAMA")
        let headerRowIndex = -1;
        let columnMapping: Record<string, number> = {};

        for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
          const row = rawRows[i];
          const rowStr = row.map((cell) => String(cell).toUpperCase().trim());

          const hasNik = rowStr.some((c) => c === 'NIK' || c === 'NO NIK' || c.includes('NIK'));
          const hasNama = rowStr.some((c) => c === 'NAMA' || c === 'NAMA PEMILIH' || c.includes('NAMA'));

          if (hasNik && hasNama) {
            headerRowIndex = i;
            // Map header column names to indexes
            rowStr.forEach((headerText, colIdx) => {
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
                // Selalu cek jika kolom berikutnya setelah ALAMAT tidak memiliki nama header tapi berisi kategori LOKAL/BTN
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

        // Parsing data setelah baris header
        for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.every((c) => String(c).trim() === '')) continue;

          const rowNum = i + 1; // 1-indexed Excel row
          const errors: string[] = [];

          // Ambil nilai per kolom
          const rawNik = cleanNik(columnMapping['nik'] !== undefined ? row[columnMapping['nik']] : '');
          const rawNama = String(columnMapping['nama'] !== undefined ? row[columnMapping['nama']] : '').trim();
          const rawAlamat = String(columnMapping['alamat'] !== undefined ? row[columnMapping['alamat']] : '').trim();
          const rawTps = String(columnMapping['tps_nomor'] !== undefined ? row[columnMapping['tps_nomor']] : '').trim();
          const rawJk = String(columnMapping['jenis_kelamin'] !== undefined ? row[columnMapping['jenis_kelamin']] : '').toUpperCase().trim();
          const rawKategori = String(columnMapping['kategori_pemilih'] !== undefined ? row[columnMapping['kategori_pemilih']] : '').trim();

          // Validasi NIK: Harus 16 digit (atau angka tersamar jika sampel)
          if (!rawNik) {
            errors.push('NIK tidak boleh kosong');
          } else if (!/^\d{16}$/.test(rawNik) && !/^\d{6}\*{6}\d{4}$/.test(rawNik)) {
            errors.push(`NIK "${rawNik}" tidak valid (harus 16 digit angka)`);
          }

          // Validasi Nama
          if (!rawNama) {
            errors.push('Nama pemilih tidak boleh kosong');
          }

          // Validasi TPS
          const tpsNum = parseInt(rawTps.replace(/\D/g, ''), 10);
          if (!tpsNum || isNaN(tpsNum)) {
            errors.push('Nomor TPS tidak valid atau kosong');
          }

          // Jenis kelamin
          let jenisKelamin: 'L' | 'P' | null = null;
          if (rawJk.startsWith('L')) jenisKelamin = 'L';
          else if (rawJk.startsWith('P')) jenisKelamin = 'P';

          const pemilihData: Partial<Pemilih> = {
            no_urut: columnMapping['no_urut'] !== undefined ? parseInt(row[columnMapping['no_urut']], 10) || null : null,
            kecamatan: String(columnMapping['kecamatan'] !== undefined ? row[columnMapping['kecamatan']] : 'BLAHBATUH').trim() || 'BLAHBATUH',
            kelurahan: String(columnMapping['kelurahan'] !== undefined ? row[columnMapping['kelurahan']] : 'BELEGA').trim() || 'BELEGA',
            nkk: String(columnMapping['nkk'] !== undefined ? row[columnMapping['nkk']] : '').trim() || null,
            nik: rawNik,
            nama: rawNama,
            tempat_lahir: String(columnMapping['tempat_lahir'] !== undefined ? row[columnMapping['tempat_lahir']] : '').trim() || null,
            tanggal_lahir: parseDate(columnMapping['tanggal_lahir'] !== undefined ? row[columnMapping['tanggal_lahir']] : null),
            status_kawin: String(columnMapping['status_kawin'] !== undefined ? row[columnMapping['status_kawin']] : '').trim() || null,
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

        resolve({
          fileName: file.name,
          sheetName: targetSheetName,
          totalRows: validRows.length + invalidRows.length,
          validRows,
          invalidRows,
          headerRowIndex: headerRowIndex + 1,
          detectedHeaders: Object.fromEntries(
            Object.entries(columnMapping).map(([k, v]) => [k, `Kolom ${v + 1}`])
          ),
        });
      } catch (err: any) {
        reject(err.message || 'Gagal memproses file Excel.');
      }
    };

    reader.onerror = () => reject('Gagal membaca file.');
    reader.readAsArrayBuffer(file);
  });
}
