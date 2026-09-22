import React from 'react';
import {
  X,
  Building2,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  FileText,
  Clock,
  Send,
  HelpCircle,
  CreditCard,
  ShieldCheck,
  User,
  PhoneCall,
  ExternalLink,
  Receipt,
  FileCheck2
} from 'lucide-react';
import {
  MonitoringLPJRecord,
  MasterSatker
} from '../../types';
import { formatRupiah } from '../../utils/lpjExcelParser';

interface DetailSatkerLPJModalProps {
  record: MonitoringLPJRecord | null;
  masterSatker?: MasterSatker;
  isDark: boolean;
  onClose: () => void;
}

export const DetailSatkerLPJModal: React.FC<DetailSatkerLPJModalProps> = ({
  record,
  masterSatker,
  isDark,
  onClose
}) => {
  if (!record) return null;

  const bgModal = isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900';
  const cardBg = isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-500';

  const isSudahKirim = record.statusPengiriman === 'SUDAH_KIRIM';
  const phone = record.noHpBendahara || masterSatker?.noHpPic || '';

  const handleContactWA = () => {
    if (!phone) return;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const targetPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.substring(1) : cleanPhone;
    const msg = isSudahKirim
      ? `Halo Yth. Bendahara ${record.namaSatker} (${record.kodeSatker}), terima kasih telah menyampaikan LPJ Bendahara ${record.periodeFormatted} dengan nomor ${record.nomorLpj}. Status di KPPN 026 Semarang: ${record.statusVerifikasi}.`
      : `Halo Yth. Bendahara ${record.namaSatker} (${record.kodeSatker}), kami menginfokan bahwa berdasarkan monitoring KPPN 026 Semarang, LPJ Bendahara periode ${record.periodeFormatted} terdata BELUM MENGIRIMKAN ke KPPN. Mohon kesediaannya segera mengunggah ADK LPJ melalui SAKTI sebelum batas waktu ${record.batasWaktuPengiriman || 'tanggal 10'}. Terima kasih.`;
    window.open(`https://wa.me/${targetPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-3xl rounded-2xl shadow-2xl border ${bgModal} ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        } overflow-hidden max-h-[92vh] flex flex-col`}
      >
        {/* Header Modal */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${
              isSudahKirim
                ? isDark ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/50' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                : isDark ? 'bg-rose-950/60 text-rose-400 border border-rose-800/50' : 'bg-rose-50 text-rose-600 border border-rose-200'
            }`}>
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold leading-tight">{record.namaSatker}</h3>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  isSudahKirim
                    ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-500/30'
                }`}>
                  {isSudahKirim ? 'SUDAH MENGIRIMKAN' : 'BELUM MENGIRIMKAN'}
                </span>
              </div>
              <p className={`text-xs ${textMuted} flex items-center gap-2 mt-0.5`}>
                <span>Kode: <strong className="font-mono">{record.kodeSatker}</strong></span>
                <span>•</span>
                <span>KPPN: {record.kodeKppn} (Semarang I)</span>
                <span>•</span>
                <span>Tipe: <strong>{record.jenisBendahara}</strong></span>
                <span>•</span>
                <span>Periode: <strong>{record.periodeFormatted}</strong></span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Status Alert Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
            isSudahKirim
              ? isDark ? 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : isDark ? 'bg-rose-950/30 border-rose-800/60 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            {isSudahKirim ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-sm">
              <p className="font-bold">
                {isSudahKirim
                  ? `LPJ Bendahara ${record.periodeFormatted} Diterima KPPN`
                  : `Peringatan: LPJ ${record.periodeFormatted} Belum Dikirimkan`}
              </p>
              <p className="text-xs opacity-90 leading-relaxed">
                {isSudahKirim
                  ? `Satuan kerja telah mengirimkan berkas LPJ pada tanggal ${record.tanggalKirim} dengan nomor berkas ${record.nomorLpj}. Status Verifikasi KPPN: ${record.statusVerifikasi}.`
                  : `Satuan kerja belum mengunggah atau mengirimkan ADK LPJ Bendahara ke KPPN Semarang I. Batas akhir penyampaian LPJ adalah ${record.batasWaktuPengiriman || 'tanggal 10 bulan berikutnya'}. Segera lakukan upload di menu SAKTI Satker.`}
              </p>
            </div>
          </div>

          {/* Grid Informasi Utama */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Probis Pengiriman Dokumen */}
            <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" /> Dokumen &amp; Pengiriman
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  record.statusVerifikasi === 'TERVERIFIKASI' || record.statusVerifikasi === 'DISETUJUI'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {record.statusVerifikasi}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                  <span className={textMuted}>Tanggal Pengiriman</span>
                  <span className="font-semibold">{record.tanggalKirim || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                  <span className={textMuted}>Nomor LPJ</span>
                  <span className="font-mono font-medium">{record.nomorLpj || '-'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                  <span className={textMuted}>Batas Waktu Pengiriman</span>
                  <span className="font-medium text-amber-600 dark:text-amber-400">{record.batasWaktuPengiriman || '10 Bulan Berikutnya'}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className={textMuted}>Kelengkapan Berkas</span>
                  <span className="font-semibold flex items-center gap-1">
                    {record.isLengkapDokumen ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Lengkap (Koran Bank &amp; BA)
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Belum Lengkap
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Saldo Kas & Rekonsiliasi Kas */}
            <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> Posisi Kas &amp; Selisih
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                  record.statusKlopKas === 'KLOP'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}>
                  {record.statusKlopKas === 'KLOP' ? 'Saldo Klop (0)' : record.statusKlopKas}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                  <span className={textMuted}>Saldo Rekening Bank</span>
                  <span className="font-mono font-medium">{formatRupiah(record.saldoRekeningBank)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                  <span className={textMuted}>Saldo Kas Tunai / Brankas</span>
                  <span className="font-mono font-medium">{formatRupiah(record.saldoKasTunai)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/50 dark:border-slate-700/50">
                  <span className={textMuted}>Total Kas Keseluruhan</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{formatRupiah(record.totalSaldoKas)}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className={textMuted}>Selisih Kas Rekonsiliasi</span>
                  <span className={`font-mono font-bold ${
                    record.selisihKas === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {formatRupiah(record.selisihKas)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION SPESIFIK: Rincian Buku Pembantu & Mutasi sesuai Jenis Bendahara */}
          {record.jenisBendahara === 'PENGELUARAN' && (
            <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4" /> Rincian Buku Pembantu (Bendahara Pengeluaran)
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 font-medium">
                    Validasi SAKTI: {record.rincianPengeluaran?.tglValidasiKppn && record.rincianPengeluaran.tglValidasiKppn !== '-' ? record.rincianPengeluaran.tglValidasiKppn : 'Tervalidasi'}
                  </span>
                </div>
              </div>

              {/* Grid 5 BP Pengeluaran */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">BP UP / TUP</span>
                  <span className="text-xs font-mono font-bold mt-1 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianPengeluaran?.bpUpTup ?? record.saldoRekeningBank)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">BP LS Bendahara</span>
                  <span className="text-xs font-mono font-bold mt-1 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianPengeluaran?.bpLsBendahara ?? 0)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">BP Pajak</span>
                  <span className="text-xs font-mono font-bold mt-1 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianPengeluaran?.bpPajak ?? 0)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">BP Hibah</span>
                  <span className="text-xs font-mono font-bold mt-1 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianPengeluaran?.bpHibah ?? 0)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">BP Lain-Lain</span>
                  <span className="text-xs font-mono font-bold mt-1 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianPengeluaran?.bpLainLain ?? 0)}
                  </span>
                </div>
              </div>

              {/* Subtotal BP & Rekonsiliasi Kas */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60">
                  <div className="flex justify-between items-center">
                    <span className="text-indigo-900 dark:text-indigo-300 font-semibold">Jumlah Buku Pembantu</span>
                    <span className="font-mono font-bold text-indigo-700 dark:text-indigo-300">
                      {formatRupiah(record.rincianPengeluaran?.jumlahBp ?? record.totalSaldoKas)}
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-900 dark:text-blue-300 font-semibold">Kuitansi Belum GU</span>
                    <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                      {formatRupiah(record.rincianPengeluaran?.kuitansi ?? 0)}
                    </span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60">
                  <div className="flex justify-between items-center">
                    <span className="text-emerald-900 dark:text-emerald-300 font-semibold">Total Saldo Kas Fisik</span>
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                      {formatRupiah(record.rincianPengeluaran?.saldoKas ?? record.totalSaldoKas)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {record.jenisBendahara === 'PENERIMAAN' && (
            <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4" /> Rincian Mutasi PNBP (Bendahara Penerimaan)
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                  Kas Bank: {formatRupiah(record.rincianPenerimaan?.kasBank ?? record.saldoRekeningBank)}
                </span>
              </div>

              {/* Grid Mutasi PNBP */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Saldo Awal PNBP</span>
                  <span className="text-xs font-mono font-bold mt-1 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianPenerimaan?.saldoAwalPnbp ?? 0)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Penerimaan PNBP</span>
                  <span className="text-xs font-mono font-bold mt-1 block text-emerald-600 dark:text-emerald-400">
                    {formatRupiah(record.rincianPenerimaan?.penerimaanPnbp ?? record.totalSaldoKas)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Penyetoran ke Kas Negara</span>
                  <span className="text-xs font-mono font-bold mt-1 block text-blue-600 dark:text-blue-400">
                    {formatRupiah(record.rincianPenerimaan?.penyetoranPnbp ?? record.totalSaldoKas)}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Saldo PNBP Akhir</span>
                  <span className="text-xs font-mono font-bold mt-1 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianPenerimaan?.saldoPnbp ?? 0)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {record.jenisBendahara === 'BLU' && (
            <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Receipt className="w-4 h-4" /> Rincian Buku Pembantu &amp; Pengelolaan Kas Satker BLU
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-medium">
                  Pola BLU
                </span>
              </div>

              {/* Grid 9 BP BLU */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">BP UP</span>
                  <span className="text-xs font-mono font-bold mt-0.5 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianBlu?.bpUp ?? 0)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">BP LS Bendahara</span>
                  <span className="text-xs font-mono font-bold mt-0.5 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianBlu?.bpLsBendahara ?? 0)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">BP Pendapatan</span>
                  <span className="text-xs font-mono font-bold mt-0.5 block text-purple-600 dark:text-purple-400">
                    {formatRupiah(record.rincianBlu?.bpPendapatan ?? record.totalSaldoKas)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">BP Pajak</span>
                  <span className="text-xs font-mono font-bold mt-0.5 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianBlu?.bpPajak ?? 0)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">BP Pihak Ketiga</span>
                  <span className="text-xs font-mono font-bold mt-0.5 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianBlu?.bpUangPihakKetiga ?? 0)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">BP Uang Titipan</span>
                  <span className="text-xs font-mono font-bold mt-0.5 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianBlu?.bpUangTitipan ?? 0)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">BP Dana Bergulir</span>
                  <span className="text-xs font-mono font-bold mt-0.5 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianBlu?.bpDanaBergulir ?? 0)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">BP Hibah/Donasi</span>
                  <span className="text-xs font-mono font-bold mt-0.5 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianBlu?.bpHibah ?? 0)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">BP Lain-Lain</span>
                  <span className="text-xs font-mono font-bold mt-0.5 block text-slate-800 dark:text-slate-200">
                    {formatRupiah(record.rincianBlu?.bpLainLain ?? 0)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800">
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 block font-bold">Total Buku Pembantu</span>
                  <span className="text-xs font-mono font-bold mt-0.5 block text-purple-700 dark:text-purple-300">
                    {formatRupiah(record.rincianBlu?.jumlahBp ?? record.totalSaldoKas)}
                  </span>
                </div>
              </div>

              {/* 3 Pilar Kas BLU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">1. Komponen Uang Persediaan</span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className={textMuted}>Saldo UP</span>
                      <span className="font-mono">{formatRupiah(record.rincianBlu?.saldoUp ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Kuitansi Belum GU</span>
                      <span className="font-mono">{formatRupiah(record.rincianBlu?.kuitansiBelumGu ?? 0)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span>Jumlah UP</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400">{formatRupiah(record.rincianBlu?.jumlahUp ?? 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">2. Komponen Pendapatan BLU</span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className={textMuted}>Saldo Pendapatan</span>
                      <span className="font-mono">{formatRupiah(record.rincianBlu?.saldoPendapatan ?? record.totalSaldoKas)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Belum Disetor</span>
                      <span className="font-mono">{formatRupiah(record.rincianBlu?.pendapatanBelumDisetor ?? 0)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span>Jumlah Pendapatan</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400">{formatRupiah(record.rincianBlu?.jumlahPendapatan ?? record.totalSaldoKas)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">3. Komponen Hibah / Donasi</span>
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className={textMuted}>Saldo Hibah</span>
                      <span className="font-mono">{formatRupiah(record.rincianBlu?.saldoHibah ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className={textMuted}>Belum Disetor</span>
                      <span className="font-mono">{formatRupiah(record.rincianBlu?.hibahBelumDisetor ?? 0)}</span>
                    </div>
                    <div className="flex justify-between font-semibold pt-1 border-t border-slate-200 dark:border-slate-700">
                      <span>Jumlah Hibah</span>
                      <span className="font-mono text-purple-600 dark:text-purple-400">{formatRupiah(record.rincianBlu?.jumlahHibah ?? 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Rincian Pejabat Bendahara & Kontak */}
          <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <User className="w-4 h-4 text-emerald-500" /> Pejabat Bendahara &amp; Kontak WhatsApp
              </span>
              {phone && (
                <button
                  onClick={handleContactWA}
                  className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSudahKirim ? 'Kirim Konfirmasi WA' : 'Kirim Tagihan / Reminder WA'}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className={textMuted}>Nama Bendahara</span>
                <p className="font-semibold text-sm mt-0.5">{record.namaBendahara || '-'}</p>
              </div>
              <div>
                <span className={textMuted}>Nomor WhatsApp / HP</span>
                <p className="font-mono font-semibold text-sm mt-0.5 text-emerald-600 dark:text-emerald-400">{phone || '-'}</p>
              </div>
              <div>
                <span className={textMuted}>Catatan / Keterangan</span>
                <p className="text-xs mt-0.5 italic">{record.keterangan || '-'}</p>
              </div>
            </div>
          </div>

          {/* Probis Checklist Tahapan LPJ */}
          <div className={`p-4 rounded-xl border ${cardBg} space-y-3`}>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-indigo-500" /> Alur Proses Bisnis Penyampaian LPJ ke KPPN
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div className={`p-2.5 rounded-lg border ${
                isSudahKirim
                  ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                  : 'bg-slate-100/70 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500'
              }`}>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">1</span>
                  Tutup Buku Kas
                </div>
                <p className="text-[11px] opacity-80">Rekonsiliasi internal &amp; cetak Berita Acara Kas</p>
              </div>

              <div className={`p-2.5 rounded-lg border ${
                isSudahKirim
                  ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                  : 'bg-slate-100/70 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500'
              }`}>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">2</span>
                  Kirim ADK SAKTI
                </div>
                <p className="text-[11px] opacity-80">Upload ADK LPJ dari aplikasi SAKTI Satker</p>
              </div>

              <div className={`p-2.5 rounded-lg border ${
                isSudahKirim
                  ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                  : 'bg-slate-100/70 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500'
              }`}>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">3</span>
                  Verifikasi KPPN
                </div>
                <p className="text-[11px] opacity-80">Pemeriksaan selisih kas &amp; saldo rekening koran</p>
              </div>

              <div className={`p-2.5 rounded-lg border ${
                record.statusVerifikasi === 'TERVERIFIKASI' || record.statusVerifikasi === 'DISETUJUI'
                  ? 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
                  : 'bg-slate-100/70 border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-500'
              }`}>
                <div className="flex items-center gap-1.5 font-bold mb-1">
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center">4</span>
                  Terbit Surat / Rekap
                </div>
                <p className="text-[11px] opacity-80">Penerbitan surat hasil verifikasi LPJ KPPN</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-3 border-t ${isDark ? 'border-slate-800 bg-slate-900/90' : 'border-slate-200 bg-slate-50/90'}`}>
          <div className="text-xs text-slate-500">
            KPPN 026 Semarang • Sistem Monitoring Kepatuhan LPJ
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            Tutup Rincian
          </button>
        </div>
      </div>
    </div>
  );
};
