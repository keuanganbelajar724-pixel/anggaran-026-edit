import { MonitoringHal3Item, UploadHal3Batch, HistoriHal3Item } from '../types/hal3Dipa';
import satkersBaseline from './satkersBaseline.json';

// Batch awal unggahan dari Kanwil DJPb
export const DEFAULT_HAL3_UPLOAD_BATCH: UploadHal3Batch = {
  id: 'batch-hal3-tw4-2026-kanwil',
  nama_file: 'Monitoring Rev Hal III DIPA TW IV 2026.xlsx',
  tahun_anggaran: 2026,
  periode: 'TW IV',
  kppn_kode: '026',
  jumlah_data: 125,
  jumlah_baru: 125,
  jumlah_update: 0,
  jumlah_error: 0,
  status_import: 'BERHASIL',
  uploaded_by: 'Kanwil DJPb Prov Jawa Tengah',
  uploaded_at: '2026-10-06T08:30:00.000Z',
  catatan: 'Data monitoring revisi Hal III DIPA Triwulan IV TA 2026 dari Kanwil DJPb'
};

// 13 Satker yang sudah mengajukan revisi Hal III DIPA (TW IV 2026)
const SUDAH_MENGAJUKAN_KODES = new Set([
  '890594', // BPK
  '411802', // POLRESTABES SEMARANG
  '411811', // DITPOLAIR POLDA JATENG
  '411827', // POLRES SALATIGA
  '555555', // Sample KPPN
  '653012', // PENGADILAN TINGGI AGAMA SEMARANG
  '653023', // PENGADILAN AGAMA SALATIGA
  '653034', // PENGADILAN AGAMA KENDAL
  '653045', // PENGADILAN NEGERI SEMARANG
  '653056', // PENGADILAN NEGERI KENDAL
  '653067', // PENGADILAN NEGERI SALATIGA
  '653078', // PENGADILAN TATA USAHA NEGARA SEMARANG
  '653089'  // PENGADILAN MILITER II-10 SEMARANG
]);

export function generateDefaultHal3DipaData(): MonitoringHal3Item[] {
  const satkerList = (Array.isArray(satkersBaseline) ? satkersBaseline : []).slice(0, 125);

  return satkerList.map((s: any, idx: number) => {
    const kode = String(s.kodeSatker || '').trim();
    const nama = String(s.namaSatker || '').trim();
    const isSudah = SUDAH_MENGAJUKAN_KODES.has(kode) || idx < 13;
    const statusKanwil = isSudah ? 'Sudah Mengajukan' : 'Belum Mengajukan';
    const id = `${kode}-2026-TW IV`;

    let tindakLanjut = undefined;
    let histori: HistoriHal3Item[] = [
      {
        id: `hist-${kode}-upload`,
        monitoring_id: id,
        tanggal: '2026-10-06T08:30:00.000Z',
        jenis_perubahan: 'UPLOAD_KANWIL',
        status_baru: statusKanwil,
        keterangan: `Data diimpor dari file ${DEFAULT_HAL3_UPLOAD_BATCH.nama_file}`,
        user_nama: 'Sistem (Kanwil DJPb)',
        created_at: '2026-10-06T08:30:00.000Z'
      }
    ];

    if (isSudah) {
      tindakLanjut = {
        id: `tl-${kode}`,
        monitoring_id: id,
        status_tindak_lanjut: 'Selesai' as const,
        keputusan_satker: 'Akan Mengajukan' as const,
        tanggal_konfirmasi: '2026-10-06',
        nama_pic: 'Operator SAKTI',
        jabatan_pic: 'Bendahara / Operator RPD',
        media_konfirmasi: 'WhatsApp' as const,
        catatan_kppn: 'Usulan revisi Hal III DIPA telah masuk dan status di Kanwil sudah mengajukan.',
        petugas_nama: 'Petugas MSKI KPPN',
        created_at: '2026-10-06T09:00:00.000Z',
        updated_at: '2026-10-06T09:00:00.000Z'
      };
      histori.push({
        id: `hist-${kode}-selesai`,
        monitoring_id: id,
        tanggal: '2026-10-06T09:00:00.000Z',
        jenis_perubahan: 'SELESAI' as const,
        status_baru: 'Selesai',
        keterangan: 'Status monitoring Kanwil: Sudah Mengajukan. Tindak lanjut selesai.',
        user_nama: 'Petugas MSKI KPPN',
        created_at: '2026-10-06T09:00:00.000Z'
      });
    } else {
      // Sampel beberapa satker yang sudah ditindaklanjuti KPPN
      if (idx === 13 || idx === 14 || idx === 15) {
        // Akan Mengajukan
        tindakLanjut = {
          id: `tl-${kode}`,
          monitoring_id: id,
          status_tindak_lanjut: 'Akan Mengajukan' as const,
          keputusan_satker: 'Akan Mengajukan' as const,
          tanggal_konfirmasi: '2026-10-06',
          nama_pic: 'Bambang Supriyadi',
          jabatan_pic: 'PPK / Kasubbag Umum',
          no_hp_pic: '081234567890',
          media_konfirmasi: 'WhatsApp' as const,
          catatan_kppn: 'Satker telah selesai menyusun usulan RPD Hal III DIPA, saat ini proses unggah berkas surat pengantar di SAKTI.',
          rencana_tindak_lanjut: 'Monitoring status approval KPA dan pengiriman ADK ke Kanwil.',
          tanggal_follow_up: '2026-10-08',
          petugas_nama: 'Ahmad Faisal (CSO KPPN)',
          created_at: '2026-10-06T10:15:00.000Z',
          updated_at: '2026-10-06T10:15:00.000Z'
        };
        histori.push({
          id: `hist-${kode}-akan`,
          monitoring_id: id,
          tanggal: '2026-10-06T10:15:00.000Z',
          jenis_perubahan: 'KEPUTUSAN_SATKER' as const,
          status_baru: 'Akan Mengajukan',
          keterangan: 'Konfirmasi via WhatsApp: Satker menyampaikan akan mengajukan revisi Hal III DIPA TW IV.',
          user_nama: 'Ahmad Faisal (CSO KPPN)',
          created_at: '2026-10-06T10:15:00.000Z'
        });
      } else if (idx === 16 || idx === 17 || idx === 18) {
        // Tidak Mengajukan karena Hal III sudah sesuai
        tindakLanjut = {
          id: `tl-${kode}`,
          monitoring_id: id,
          status_tindak_lanjut: 'Hal III Sudah Sesuai' as const,
          keputusan_satker: 'Hal III Sudah Sesuai' as const,
          alasan_kode: 'Hal III DIPA sudah sesuai dengan kebutuhan.',
          alasan_detail: 'Realisasi penyerapan anggaran s.d. triwulan berjalan dan rencana sisa anggaran sampai akhir tahun telah selaras dengan matriks Hal III DIPA petikan terakhir.',
          tanggal_konfirmasi: '2026-10-06',
          nama_pic: 'Siti Rahmawati',
          jabatan_pic: 'Bendahara Pengeluaran',
          no_hp_pic: '081398765432',
          media_konfirmasi: 'Telepon' as const,
          catatan_kppn: 'Konfirmasi telepon: Satker tidak memerlukan revisi karena target RPD bulanan dan deviasi masih dalam batas aman IKPA (di bawah toleransi 5%).',
          petugas_nama: 'Budi Santoso (MSKI KPPN)',
          created_at: '2026-10-06T11:20:00.000Z',
          updated_at: '2026-10-06T11:20:00.000Z'
        };
        histori.push({
          id: `hist-${kode}-sesuai`,
          monitoring_id: id,
          tanggal: '2026-10-06T11:20:00.000Z',
          jenis_perubahan: 'KEPUTUSAN_SATKER' as const,
          status_baru: 'Hal III Sudah Sesuai',
          keterangan: 'Satker konfirmasi tidak mengajukan: Hal III DIPA sudah sesuai dengan kebutuhan.',
          user_nama: 'Budi Santoso (MSKI KPPN)',
          created_at: '2026-10-06T11:20:00.000Z'
        });
      } else if (idx === 19 || idx === 20) {
        // Menunggu Jawaban
        tindakLanjut = {
          id: `tl-${kode}`,
          monitoring_id: id,
          status_tindak_lanjut: 'Menunggu Jawaban' as const,
          keputusan_satker: 'Masih Dalam Proses/Koordinasi' as const,
          tanggal_konfirmasi: '2026-10-06',
          nama_pic: 'Wahyu Nugroho',
          jabatan_pic: 'Staf Keuangan',
          no_hp_pic: '081512345678',
          media_konfirmasi: 'WhatsApp' as const,
          catatan_kppn: 'Pesan WA sudah terkirim dan dibaca. PIC sedang mengoordinasikan dengan PPK & KPA terkait evaluasi deviasi Hal III triwulan berjalan.',
          rencana_tindak_lanjut: 'Hubungi kembali via telepon jika belum ada kepastian dalam 2 hari kerja.',
          tanggal_follow_up: '2026-10-07',
          petugas_nama: 'Dewi Lestari (CSO KPPN)',
          created_at: '2026-10-06T13:45:00.000Z',
          updated_at: '2026-10-06T13:45:00.000Z'
        };
        histori.push({
          id: `hist-${kode}-menunggu`,
          monitoring_id: id,
          tanggal: '2026-10-06T13:45:00.000Z',
          jenis_perubahan: 'TINDAK_LANJUT_DIHUBUNGI' as const,
          status_baru: 'Menunggu Jawaban',
          keterangan: 'KPPN menghubungi via WhatsApp, satker masih koordinasi internal dengan KPA.',
          user_nama: 'Dewi Lestari (CSO KPPN)',
          created_at: '2026-10-06T13:45:00.000Z'
        });
      }
    }

    return {
      id,
      tahun_anggaran: 2026,
      periode: 'TW IV',
      kppn_kode: '026',
      kode_satker: kode,
      nama_satker: nama,
      nama_satker_source: nama,
      status_kanwil: statusKanwil,
      source_upload_id: DEFAULT_HAL3_UPLOAD_BATCH.id,
      source_file_name: DEFAULT_HAL3_UPLOAD_BATCH.nama_file,
      tanggal_data: '2026-10-06',
      source_row_reference: idx + 2,
      is_in_latest_upload: true,
      tindak_lanjut: tindakLanjut,
      histori,
      created_at: '2026-10-06T08:30:00.000Z',
      updated_at: '2026-10-06T08:30:00.000Z'
    };
  });
}
