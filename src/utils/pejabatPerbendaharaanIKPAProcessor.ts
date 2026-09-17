import * as XLSX from 'xlsx';
import { MasterSatker, PejabatSertifikasi, PejabatDanOperator } from '../types';

export interface ProcessPejabatIKPAResult {
  file: File;
  fileName: string;
  fileSize: number;
  totalRows: number;
  validData: PejabatSertifikasi[];
  invalidRows: any[];
  unregisteredSatkers: string[];
  satkerUpdatedCount: number;
  satkerPejabatOperatorMap: Record<string, Partial<PejabatDanOperator>>;
  stats: {
    total: number;
    tersertifikasi: number;
    belumSertifikat: number;
    perluPerpanjangan: number;
    kadaluarsa: number;
    aktif: number;
  };
}

export function cleanText(val: any): string {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

/**
 * Parses and validates an Excel/CSV file containing treasury officials (Pejabat Perbendaharaan Satker)
 * that will update the Satker Pejabat in the IKPA Tab.
 */
export async function validatePejabatPerbendaharaanIKPAExcel(
  file: File,
  masterSatkers: MasterSatker[] = []
): Promise<ProcessPejabatIKPAResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!buffer) {
          throw new Error('Gagal membaca isi file Excel.');
        }

        const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        if (!worksheet) {
          throw new Error('Lembar kerja (worksheet) kosong atau tidak terbaca.');
        }

        const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        if (!rawRows || rawRows.length < 2) {
          throw new Error('File Excel tidak memiliki baris data.');
        }

        // Find header row (inspect first 10 rows for keywords)
        let headerRowIndex = -1;
        let colMap: Record<string, number> = {};

        for (let r = 0; r < Math.min(15, rawRows.length); r++) {
          const row = rawRows[r];
          if (!row || !Array.isArray(row)) continue;

          const rowStr = row.map(c => cleanText(c).toLowerCase()).join(' ');
          if (
            (rowStr.includes('satker') || rowStr.includes('kode')) &&
            (rowStr.includes('nama') || rowStr.includes('pejabat') || rowStr.includes('jabatan') || rowStr.includes('nip'))
          ) {
            headerRowIndex = r;
            row.forEach((cellVal, colIdx) => {
              const str = cleanText(cellVal).toLowerCase().replace(/[\r\n\t_]/g, ' ');
              if ((str.includes('kd') && str.includes('satker')) || str === 'kode satker' || str === 'kodesatker' || str === 'kode') {
                colMap['kdSatker'] = colIdx;
              } else if ((str.includes('nm') && str.includes('satker')) || str === 'nama satker' || str === 'namasatker' || (str.includes('satker') && !colMap['kdSatker'])) {
                colMap['nmSatker'] = colIdx;
              } else if (str.includes('nip') || str.includes('no identitas') || str === 'nik') {
                colMap['nip'] = colIdx;
              } else if (str.includes('nama pejabat') || str.includes('nama pegawai') || str === 'nama' || str === 'pejabat' || str === 'nm_pejabat') {
                colMap['nama'] = colIdx;
              } else if (str.includes('jabatan') || str.includes('peran') || str === 'role') {
                colMap['nmJabatan'] = colIdx;
              } else if (str.includes('status jabatan') || str === 'status_jabatan') {
                colMap['statusJabatan'] = colIdx;
              } else if (str.includes('no sertifikat') || str.includes('nomor sertifikat') || str.includes('no register') || str === 'sertifikat') {
                colMap['noSertifikat'] = colIdx;
              } else if (str.includes('tgl sertifikat') || str.includes('tgl terbit') || str.includes('tanggal terbit') || str === 'tgl_sertifikat') {
                colMap['tglSertifikat'] = colIdx;
              } else if (str.includes('kadaluarsa') || str.includes('masa berlaku') || str.includes('exp date') || str.includes('expired')) {
                colMap['tglKadaluarsa'] = colIdx;
              } else if (str.includes('status sertifikasi') || str.includes('status sertifikat')) {
                colMap['statusSertifikasi'] = colIdx;
              } else if (str.includes('status usulan') || str === 'usulan') {
                colMap['statusUsulan'] = colIdx;
              } else if (str.includes('hp') || str.includes('telp') || str.includes('kontak') || str.includes('whatsapp') || str.includes('wa')) {
                colMap['noHp'] = colIdx;
              } else if (str.includes('email') || str.includes('surel')) {
                colMap['email'] = colIdx;
              }
            });
            break;
          }
        }

        // Fallback default column indices if header not fully detected
        if (colMap['kdSatker'] === undefined) colMap['kdSatker'] = 0;
        if (colMap['nmSatker'] === undefined) colMap['nmSatker'] = 1;
        if (colMap['nip'] === undefined) colMap['nip'] = 2;
        if (colMap['nama'] === undefined) colMap['nama'] = 3;
        if (colMap['nmJabatan'] === undefined) colMap['nmJabatan'] = 4;

        const validData: PejabatSertifikasi[] = [];
        const invalidRows: any[] = [];
        const unregisteredSatkersSet = new Set<string>();
        const satkerPejabatOperatorMap: Record<string, Partial<PejabatDanOperator>> = {};

        const startIdx = headerRowIndex >= 0 ? headerRowIndex + 1 : 1;
        const now = new Date();

        for (let r = startIdx; r < rawRows.length; r++) {
          const row = rawRows[r];
          if (!row || !Array.isArray(row) || row.length === 0) continue;

          let kodeSatker = cleanText(row[colMap['kdSatker'] ?? 0]);
          let namaSatker = cleanText(row[colMap['nmSatker'] ?? 1]);
          let nip = cleanText(row[colMap['nip'] ?? 2]);
          let nama = cleanText(row[colMap['nama'] ?? 3]);
          let nmJabatan = cleanText(row[colMap['nmJabatan'] ?? 4]) || 'Pejabat Perbendaharaan';
          let rawStatusJabatan = cleanText(row[colMap['statusJabatan'] ?? -1]) || 'Aktif';
          let noSertifikat = cleanText(row[colMap['noSertifikat'] ?? -1]);
          let tglSertifikat = cleanText(row[colMap['tglSertifikat'] ?? -1]);
          let tglKadaluarsa = cleanText(row[colMap['tglKadaluarsa'] ?? -1]);
          let rawStatusSert = cleanText(row[colMap['statusSertifikasi'] ?? -1]);
          let rawStatusUsulan = cleanText(row[colMap['statusUsulan'] ?? -1]) || 'Tersedia';
          let noHp = cleanText(row[colMap['noHp'] ?? -1]);
          let email = cleanText(row[colMap['email'] ?? -1]);

          // Strip non-digits from kodeSatker if it's longer than 6 digits
          if (kodeSatker && kodeSatker.length > 6) {
            const digitMatch = kodeSatker.match(/\d{6}/);
            if (digitMatch) kodeSatker = digitMatch[0];
          }

          // Format Date Objects if XLSX parsed them as Dates
          if (row[colMap['tglSertifikat'] ?? -1] instanceof Date) {
            tglSertifikat = (row[colMap['tglSertifikat'] ?? -1] as Date).toLocaleDateString('id-ID');
          }
          if (row[colMap['tglKadaluarsa'] ?? -1] instanceof Date) {
            tglKadaluarsa = (row[colMap['tglKadaluarsa'] ?? -1] as Date).toLocaleDateString('id-ID');
          }

          // Skip completely empty lines
          if (!kodeSatker && !nama && !nip) continue;

          // Try to match Satker with Master Satkers
          if (kodeSatker && masterSatkers.length > 0) {
            const master = masterSatkers.find(m => m.kodeSatker === kodeSatker);
            if (master) {
              namaSatker = master.namaSatker;
            } else {
              unregisteredSatkersSet.add(kodeSatker);
            }
          }

          // Determine certification status and expiry
          let isKadaluarsa = false;
          let isMendekatiKadaluarsa = false;
          let sisaHariMasaBerlaku = 0;

          if (tglKadaluarsa) {
            let expDate: Date | null = null;
            if (tglKadaluarsa.includes('-')) {
              const parts = tglKadaluarsa.split('-');
              if (parts[0].length === 4) {
                expDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
              } else if (parts[2].length === 4) {
                expDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
              }
            } else if (tglKadaluarsa.includes('/')) {
              const parts = tglKadaluarsa.split('/');
              if (parts[2].length === 4) {
                expDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
              }
            }

            if (expDate && !isNaN(expDate.getTime())) {
              const diffTime = expDate.getTime() - now.getTime();
              sisaHariMasaBerlaku = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (sisaHariMasaBerlaku <= 0) {
                isKadaluarsa = true;
              } else if (sisaHariMasaBerlaku <= 90) {
                isMendekatiKadaluarsa = true;
              }
            }
          }

          const hasCert = !!(noSertifikat && noSertifikat !== '-' && noSertifikat.toLowerCase() !== 'belum ada' && noSertifikat.toLowerCase() !== 'tidak ada');
          let statusSertifikasi: 'Tersertifikasi' | 'Belum Tersertifikasi' | 'Belum Perpanjangan' | 'Kadaluarsa' = 'Belum Tersertifikasi';

          if (isKadaluarsa) {
            statusSertifikasi = 'Kadaluarsa';
          } else if (isMendekatiKadaluarsa && hasCert) {
            statusSertifikasi = 'Belum Perpanjangan';
          } else if (hasCert || rawStatusSert.toLowerCase().includes('tersertifikasi')) {
            statusSertifikasi = 'Tersertifikasi';
          } else {
            statusSertifikasi = 'Belum Tersertifikasi';
          }

          const record: PejabatSertifikasi = {
            id: `pejabat-ikpa-${kodeSatker}-${nip || r}-${Date.now()}`,
            nomor: validData.length + 1,
            kdSatker: kodeSatker,
            nmSatker: namaSatker,
            nip: nip || '-',
            nama: nama || `Pejabat Satker ${kodeSatker}`,
            nmJabatan,
            statusJabatan: rawStatusJabatan.toLowerCase() === 'non aktif' ? 'Non Aktif' : 'Aktif',
            noSertifikat: noSertifikat || 'Belum Ada',
            tglSertifikat: tglSertifikat || '-',
            tglKadaluarsa: tglKadaluarsa || '-',
            statusSertifikasi,
            statusUsulan: rawStatusUsulan,
            status: statusSertifikasi === 'Tersertifikasi' ? 'Aktif' : statusSertifikasi,
            kategoriData: statusSertifikasi === 'Tersertifikasi' ? 'TERSERTIFIKASI_AKTIF' : (isKadaluarsa || isMendekatiKadaluarsa ? 'BELUM_PERPANJANGAN' : 'BELUM_SERTIFIKAT'),
            noHp: noHp || '-',
            email: email || '-',
            sisaHariMasaBerlaku,
            isKadaluarsa,
            isMendekatiKadaluarsa,
            keterangan: `${statusSertifikasi} - ${nmJabatan}`
          };

          validData.push(record);

          // Build mapping to update satker.pejabatOperator in IKPA
          if (kodeSatker) {
            if (!satkerPejabatOperatorMap[kodeSatker]) {
              satkerPejabatOperatorMap[kodeSatker] = {};
            }

            const currentMap = satkerPejabatOperatorMap[kodeSatker];
            const lowerJabatan = nmJabatan.toLowerCase();

            const contactObj = {
              nama: record.nama,
              nip: record.nip,
              noHp: record.noHp !== '-' ? record.noHp : '',
              email: record.email !== '-' ? record.email : ''
            };

            if (lowerJabatan.includes('kpa') || lowerJabatan.includes('kuasa pengguna')) {
              currentMap.kpa = contactObj;
            } else if (lowerJabatan.includes('ppk') || lowerJabatan.includes('pembuat komitmen')) {
              currentMap.ppk = contactObj;
            } else if (lowerJabatan.includes('ppspm') || lowerJabatan.includes('penandatangan') || lowerJabatan.includes('penanda tangan')) {
              currentMap.ppspm = contactObj;
            } else if (lowerJabatan.includes('bendahara pengeluaran') || lowerJabatan.includes('bendahara')) {
              currentMap.bendahara = contactObj;
            } else if (lowerJabatan.includes('komitmen')) {
              currentMap.operatorKomitmen = contactObj;
            } else if (lowerJabatan.includes('pembayaran')) {
              currentMap.operatorPembayaran = contactObj;
            } else if (lowerJabatan.includes('pelaporan') || lowerJabatan.includes('akuntansi')) {
              currentMap.operatorPelaporan = contactObj;
            } else if (lowerJabatan.includes('gaji')) {
              currentMap.operatorGaji = contactObj;
            }
          }
        }

        if (validData.length === 0) {
          throw new Error('Tidak ditemukan data Pejabat yang valid. Pastikan file memiliki baris data dengan Kode Satker, Nama Pejabat, NIP, atau Jabatan.');
        }

        const stats = {
          total: validData.length,
          tersertifikasi: validData.filter(p => p.statusSertifikasi === 'Tersertifikasi').length,
          belumSertifikat: validData.filter(p => p.statusSertifikasi === 'Belum Tersertifikasi').length,
          perluPerpanjangan: validData.filter(p => p.statusSertifikasi === 'Belum Perpanjangan').length,
          kadaluarsa: validData.filter(p => p.statusSertifikasi === 'Kadaluarsa').length,
          aktif: validData.filter(p => (p.statusJabatan || 'Aktif').toLowerCase() === 'aktif').length
        };

        resolve({
          file,
          fileName: file.name,
          fileSize: file.size,
          totalRows: validData.length + invalidRows.length,
          validData,
          invalidRows,
          unregisteredSatkers: Array.from(unregisteredSatkersSet),
          satkerUpdatedCount: Object.keys(satkerPejabatOperatorMap).length,
          satkerPejabatOperatorMap,
          stats
        });
      } catch (err: any) {
        reject(new Error(err.message || 'Gagal memproses file Excel Pejabat Perbendaharaan IKPA.'));
      }
    };

    reader.onerror = () => reject(new Error('Gagal membaca file dari sistem.'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generates and downloads a clean Excel template for Pejabat Perbendaharaan Satker (IKPA)
 */
export function downloadPejabatIKPATemplate() {
  const sampleData = [
    {
      'Kode Satker': '652189',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'NIP': '197505121998031001',
      'Nama Pejabat': 'Kombes Polisi Hendra Kurniawan, S.I.K.',
      'Jabatan': 'Kuasa Pengguna Anggaran (KPA)',
      'Status Jabatan': 'Aktif',
      'Nomor Sertifikat': 'PNT-08581/026/912/2021',
      'Tanggal Terbit': '17-09-2021',
      'Tanggal Kadaluarsa': '17-09-2026',
      'Status Sertifikasi': 'Tersertifikasi',
      'Status Usulan': 'Memenuhi Syarat',
      'No HP / WhatsApp': '081234567890',
      'Email': 'kpa.polrestabes@polri.go.id'
    },
    {
      'Kode Satker': '652189',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'NIP': '198203152006041003',
      'Nama Pejabat': 'AKP Bambang Wicaksono, S.E.',
      'Jabatan': 'Pejabat Pembuat Komitmen (PPK)',
      'Status Jabatan': 'Aktif',
      'Nomor Sertifikat': 'PNT-10294/026/912/2022',
      'Tanggal Terbit': '10-06-2022',
      'Tanggal Kadaluarsa': '10-06-2027',
      'Status Sertifikasi': 'Tersertifikasi',
      'Status Usulan': 'Memenuhi Syarat',
      'No HP / WhatsApp': '081398765432',
      'Email': 'ppk.polrestabes@polri.go.id'
    },
    {
      'Kode Satker': '652189',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'NIP': '198608242009122002',
      'Nama Pejabat': 'Iptu Siti Rahmawati, S.Ak.',
      'Jabatan': 'Pejabat Penandatangan SPM (PPSPM)',
      'Status Jabatan': 'Aktif',
      'Nomor Sertifikat': 'SNT-04912/026/912/2023',
      'Tanggal Terbit': '21-03-2023',
      'Tanggal Kadaluarsa': '21-03-2028',
      'Status Sertifikasi': 'Tersertifikasi',
      'Status Usulan': 'Memenuhi Syarat',
      'No HP / WhatsApp': '081277665544',
      'Email': 'ppspm.polrestabes@polri.go.id'
    },
    {
      'Kode Satker': '652189',
      'Nama Satker': 'POLRESTABES SEMARANG',
      'NIP': '199001102014021004',
      'Nama Pejabat': 'Bripka Joko Susilo, A.Md.',
      'Jabatan': 'Bendahara Pengeluaran',
      'Status Jabatan': 'Aktif',
      'Nomor Sertifikat': 'BNT-03762/185/518/2021',
      'Tanggal Terbit': '12-08-2021',
      'Tanggal Kadaluarsa': '12-08-2026',
      'Status Sertifikasi': 'Tersertifikasi',
      'Status Usulan': 'Memenuhi Syarat',
      'No HP / WhatsApp': '081566778899',
      'Email': 'bendahara.polrestabes@polri.go.id'
    },
    {
      'Kode Satker': '411792',
      'Nama Satker': 'KANTOR WILAYAH DJBC JATENG DAN D.I.YOGYAKARTA',
      'NIP': '198402112004121001',
      'Nama Pejabat': 'Ahmad Fauzi, S.E., M.M.',
      'Jabatan': 'Pejabat Pembuat Komitmen (PPK)',
      'Status Jabatan': 'Aktif',
      'Nomor Sertifikat': 'Belum Ada',
      'Tanggal Terbit': '-',
      'Tanggal Kadaluarsa': '-',
      'Status Sertifikasi': 'Belum Tersertifikasi',
      'Status Usulan': 'Antrean Diklat',
      'No HP / WhatsApp': '081299887766',
      'Email': 'ppk.djbc@kemenkeu.go.id'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(sampleData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pejabat_IKPA');
  XLSX.writeFile(wb, 'Format_Import_Pejabat_Perbendaharaan_IKPA.xlsx');
}

/**
 * Exports active Pejabat Perbendaharaan Satker to Excel
 */
export function exportPejabatIKPAToExcel(pejabatList: PejabatSertifikasi[]) {
  const data = pejabatList.map((p, idx) => ({
    'No': idx + 1,
    'Kode Satker': p.kdSatker,
    'Nama Satker': p.nmSatker,
    'NIP': p.nip,
    'Nama Pejabat': p.nama,
    'Jabatan': p.nmJabatan,
    'Status Jabatan': p.statusJabatan || 'Aktif',
    'Nomor Sertifikat': p.noSertifikat,
    'Tanggal Terbit': p.tglSertifikat || '-',
    'Tanggal Kadaluarsa': p.tglKadaluarsa || '-',
    'Status Sertifikasi': p.statusSertifikasi,
    'Status Usulan': p.statusUsulan || '-',
    'No HP / WhatsApp': p.noHp || '-',
    'Email': p.email || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pejabat_IKPA_KPPN');
  XLSX.writeFile(wb, `Database_Pejabat_Perbendaharaan_IKPA_${new Date().toISOString().split('T')[0]}.xlsx`);
}
