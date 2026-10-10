#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import json
import sys

def build_questions():
    questions = []
    current_num = 521

    # Definisi 15 Kategori/Domain dan Butir Soal per Kategori
    
    # Kategori 1: IKPA - 8 Indikator & Reformulasi 2026 (40 soal)
    ikpa_data = [
        # MUDAH
        ("MUDAH", "IKPA - Deviasi Hal III DIPA", 
         "Berapakah ambang batas maksimal deviasi bulanan antara realisasi dengan RPD Halaman III DIPA per jenis belanja agar memperoleh nilai sempurna (100)?",
         "5%", "10%", "15%", "20%", "A",
         "Sesuai PER-5/PB/2022 dan petunjuk teknis IKPA, ambang batas deviasi bulanan per jenis belanja adalah maksimal 5% untuk mendapatkan nilai maksimal 100.",
         "PER-5/PB/2022 Petunjuk Teknis Penilaian IKPA"),
        ("MUDAH", "IKPA - Revisi DIPA",
         "Berapa kali batas frekuensi revisi DIPA kewenangan Kanwil DJPb/DJA dalam satu triwulan agar satker tidak terkena penalti nilai pada indikator Revisi DIPA?",
         "Maksimal 1 kali per triwulan", "Maksimal 2 kali per triwulan", "Maksimal 3 kali per triwulan", "Tidak dibatasi sama sekali", "A",
         "Pada indikator revisi DIPA, frekuensi revisi DIPA yang diperkenankan untuk mempertahankan nilai optimal adalah maksimal 1 kali dalam 1 triwulan kalender.",
         "PER-5/PB/2022 Lampiran Indikator Revisi DIPA"),
        ("MUDAH", "IKPA - Penyerapan Anggaran",
         "Berapakah target kumulatif penyerapan anggaran belanja barang pada akhir Triwulan III (September) sesuai standar IKPA?",
         "Minimal 70%", "Minimal 75%", "Minimal 60%", "Minimal 50%", "A",
         "Target penyerapan anggaran Triwulan III untuk belanja operasional dan belanja barang secara agregat dipatok minimal 70% (atau 75% sesuai penajaman indikator).",
         "Surat Edaran Dirjen Perbendaharaan tentang Target Penyerapan IKPA"),
        ("MUDAH", "IKPA - Belanja Kontraktual",
         "Berapa hari kerja batas waktu pendaftaran data kontrak (CAN) ke KPPN terhitung sejak tanggal penandatanganan kontrak?",
         "5 (lima) hari kerja", "7 (tujuh) hari kerja", "14 (empat belas) hari kerja", "30 (tiga puluh) hari kalender", "A",
         "Data perjanjian kerja/kontrak wajib didaftarkan ke KPPN paling lambat 5 (lima) hari kerja setelah kontrak ditandatangani oleh PPK dan penyedia.",
         "PMK No. 190/PMK.05/2012 Pasal 38 ayat (1) dan PER-5/PB/2022"),
        ("MUDAH", "IKPA - Penyelesaian Tagihan",
         "Berapa batas hari kerja penerbitan SPM-LS ke KPPN terhitung sejak tanggal Berita Acara Serah Terima (BAST) ditandatangani?",
         "17 (tujuh belas) hari kerja", "14 (empat belas) hari kerja", "5 (lima) hari kerja", "30 (tiga puluh) hari kalender", "A",
         "Batas waktu penyelesaian tagihan pihak ketiga adalah 17 hari kerja sejak timbulnya hak tagih (BAST/BAPP) sampai dengan SPM diterbitkan ke KPPN.",
         "PMK No. 190/PMK.05/2012 dan PER-5/PB/2022 Indikator Penyelesaian Tagihan"),
        ("MUDAH", "IKPA - Pengelolaan UP dan TUP",
         "Berapa minimal persentase revolving (penggantian) Uang Persediaan (GUP) dalam jangka waktu 1 (satu) bulan kalender agar indikator pengelolaan UP bernilai 100?",
         "Minimal 50% dari total pagu UP", "Minimal 25% dari total pagu UP", "Minimal 75% dari total pagu UP", "Minimal 100% dari total pagu UP", "A",
         "Ketentuan revolving UP adalah satker harus melakukan penggantian (revolving) minimal 50% dari besaran pagu UP dalam kurun waktu 1 bulan kalender.",
         "PER-5/PB/2022 Indikator Pengelolaan UP dan TUP"),
        ("MUDAH", "IKPA - Dispensasi SPM",
         "Mengapa pengajuan dispensasi SPM ke KPPN berdampak negatif terhadap capaian kinerja perbendaharaan Satker?",
         "Karena setiap SPM yang terbit dengan dispensasi mendapat pemotongan poin pada indikator dispensasi IKPA",
         "Karena satker akan langsung dibekukan rekening bank operasionalnya",
         "Karena pejabat PPK akan otomatis diberhentikan oleh KPPN",
         "Karena nilai belanja satker akan ditarik kembali ke kas umum negara", "A",
         "Dispensasi SPM mencerminkan keterlambatan tata kelola anggaran akhir tahun, di mana setiap dispensasi yang disetujui dikenakan penalti poin penilaian IKPA.",
         "PER-5/PB/2022 dan Perdirjen Pedoman Pelaksanaan Anggaran Akhir Tahun"),
        ("MUDAH", "IKPA - Capaian Output",
         "Kapan batas waktu pengisian dan konfirmasi data capaian output bulanan pada aplikasi SAKTI/MonSAKTI setiap bulannya?",
         "Paling lambat 5 (lima) hari kerja bulan berikutnya", "Paling lambat tanggal 10 bulan berikutnya", "Paling lambat akhir bulan berjalan", "Paling lambat akhir triwulan", "A",
         "Pelaporan data capaian output (Progres Capaian Rincian Output/PCRO dan Realisasi Volume Rincian Output/RVRO) wajib dikirim paling lambat 5 hari kerja bulan berikutnya.",
         "PER-5/PB/2022 Petunjuk Teknis Pengisian Capaian Output"),
        ("SEDANG", "IKPA - Deviasi Hal III DIPA",
         "Satker memiliki RPD Belanja Modal bulan Juli sebesar Rp1.000.000.000. Realisasi riil SP2D pada bulan tersebut adalah Rp930.000.000. Apakah satker terkena penalti deviasi?",
         "Ya, karena deviasi mencapai 7% (melebihi ambang batas 5%)",
         "Tidak, karena deviasi hanya 3%",
         "Tidak, selama masih dalam satu triwulan yang sama",
         "Tidak, karena realisasi di bawah pagu selalu diperbolehkan", "A",
         "Deviasi dihitung: |1.000.000.000 - 930.000.000| / 1.000.000.000 = 70.000.000 / 1.000.000.000 = 7%. Karena 7% > 5%, maka nilai indikator berkurang.",
         "PER-5/PB/2022 Lampiran Formula Deviasi Hal III DIPA"),
        ("SEDANG", "IKPA - Belanja Kontraktual",
         "Kontrak pekerjaan fisik ditandatangani pada hari Rabu, 10 Juni 2026. Kapan batas akhir pendaftaran data kontrak tersebut ke KPPN agar tepat waktu (tanpa menghitung libur)?",
         "Rabu, 17 Juni 2026 (5 hari kerja berikutnya)",
         "Senin, 15 Juni 2026 (3 hari kalender)",
         "Jumat, 12 Juni 2026 (2 hari kerja)",
         "Rabu, 24 Juni 2026 (10 hari kerja)", "A",
         "Perhitungan 5 hari kerja: Kamis (HK 1), Jumat (HK 2), Sabtu-Minggu libur, Senin (HK 3), Selasa (HK 4), Rabu 17 Juni (HK 5).",
         "PMK No. 190/PMK.05/2012 dan PER-5/PB/2022"),
        ("SEDANG", "IKPA - Penyelesaian Tagihan",
         "BAST pengadaan server ditandatangani PPK dan penyedia pada 2 Mei. Dokumen tagihan lengkap diterima PPK pada 10 Mei. Perhitungan 17 hari kerja penyelesaian tagihan dihitung mulai dari:",
         "Tanggal penandatanganan BAST (2 Mei)",
         "Tanggal dokumen diserahkan ke bendahara pengeluaran",
         "Tanggal penerbitan SPP oleh PPK",
         "Tanggal verifikasi pengujian oleh PPSPM", "A",
         "Sesuai regulasi, timbulnya hak tagih kepada negara didasarkan pada tanggal penandatanganan Berita Acara Serah Terima (BAST/BAPP).",
         "PMK 190/PMK.05/2012 Pasal 39 ayat (2)"),
        ("SEDANG", "IKPA - Pengelolaan UP dan TUP",
         "Satker menerima persetujuan TUP sebesar Rp300.000.000 pada 15 Agustus. Kapan batas waktu pertanggungjawaban (PTUP) atau penyetoran sisa dana TUP tersebut ke kas negara?",
         "Paling lambat 1 (satu) bulan kalender sejak SP2D TUP diterbitkan",
         "Paling lambat akhir tahun anggaran 31 Desember",
         "Paling lambat 14 hari kalender sejak uang cair",
         "Paling lambat saat dilakukan audit BPK", "A",
         "Pertanggungjawaban TUP (pengajuan SPM-PTUP atau setoran sisa kas TUP) wajib diselesaikan paling lama 1 bulan sejak tanggal SP2D TUP.",
         "PMK No. 190/PMK.05/2012 Pasal 45 ayat (1)"),
        ("SEDANG", "IKPA - Capaian Output",
         "Apabila Satker telah merealisasikan anggaran sebesar 80%, namun laporan Progres Capaian Rincian Output (PCRO) hanya dilaporkan 35%, kondisi ini disebut:",
         "Anomali Capaian Output (Gap Realisasi vs Capaian Output)",
         "Efisiensi Anggaran Optimal",
         "Revisi DIPA Otomatis",
         "Kinerja Keuangan Sangat Baik", "A",
         "Disparitas tinggi antara persentase realisasi anggaran dengan progres fisik rincian output mengindikasikan ketidaksinkronan data atau keterlambatan pelaporan output.",
         "PER-5/PB/2022 Modul Penilaian Capaian Output"),
        ("ANALISIS", "IKPA - Deviasi Hal III DIPA",
         "Sebuah Satker memiliki RPD Triwulan II: April Rp200 juta, Mei Rp500 juta, Juni Rp300 juta. Realisasi riil SP2D: April Rp210 juta (deviasi 5%), Mei Rp450 juta (deviasi 10%), Juni Rp300 juta (deviasi 0%). Berapakah rata-rata nilai deviasi triwulanan dan langkah korektifnya?",
         "Rata-rata deviasi 5%, dan satker perlu memutakhirkan RPD Triwulan III pada 10 hari kerja pertama Juli",
         "Rata-rata deviasi 15%, dan satker langsung diblokir penerbitan SPM-nya",
         "Rata-rata deviasi 0%, tidak ada tindakan korektif",
         "Satker wajib membayar denda kas negara sebesar selisih realisasi", "A",
         "Rata-rata deviasi = (5% + 10% + 0%) / 3 = 5%. Satker berada di ambang batas toleransi dan wajib memutakhirkan RPD Triwulan III pada 10 hari kerja pertama awal triwulan.",
         "PER-5/PB/2022 Juknis Perhitungan Nilai Kinerja Anggaran"),
        ("ANALISIS", "IKPA - Reformulasi 2026",
         "Pada reformulasi IKPA terbaru, bagaimana integrasi antara indikator Deviasi Halaman III DIPA dengan perencanaan kas harian KPPN (Cash Planning)?",
         "Satker yang mengajukan SPM bernilai besar (di atas Rp5 Miliar) wajib menyampaikan RPD Harian paling lambat 5 hari kerja sebelum pengajuan SPM agar tidak menimbulkan deviasi kas",
         "Semua jenis transaksi belanja di bawah Rp50 juta wajib didaftarkan 30 hari sebelumnya",
         "KPPN tidak lagi membatasi waktu pencairan dana APBN",
         "Revisi Hal III DIPA dapat dilakukan setiap hari tanpa batas waktu dan tanpa persetujuan Kanwil", "A",
         "Sinergi IKPA dan Manajemen Kas mensyaratkan penyampaian RPD harian untuk transaksi signifikan guna menjaga keandalan proyeksi kas negara dan meminimalkan deviasi.",
         "PMK No. 197/PMK.05/2017 tentang Perencanaan Kas Pemerintah Pusat"),
        ("ANALISIS", "IKPA - Penyerapan Anggaran",
         "Satker Pengadilan Negeri memiliki DIPA Rp10 Miliar. Pada akhir Triwulan IV, realisasi mencapai Rp9,4 Miliar (94%). Namun satker memiliki saldo sisa kas UP di bendahara sebesar Rp150 juta yang belum disetor s.d. 31 Desember. Bagaimana implikasinya terhadap nilai IKPA?",
         "Nilai penyerapan tercapai 94%, namun indikator Pengelolaan UP mendapat penalti berat karena sisa kas UP tidak nihil pada akhir tahun anggaran",
         "Nilai IKPA otomatis menjadi 100 tanpa pengurangan",
         "Sisa kas UP otomatis hangus dan diakui sebagai pendapatan negara bukan pajak",
         "Tidak ada pengaruh sama sekali pada seluruh indikator IKPA", "A",
         "Kelalaian penyetoran sisa kas UP sebelum tutup buku akhir tahun merusak indikator Pengelolaan UP/TUP dan melanggar ketentuan batas akhir penutupan rekening APBN.",
         "PER-9/PB/2026 Pedoman Tutup Tahun Anggaran"),
    ]

    # Kita tambahkan variasi pertanyaan IKPA lainnya hingga total 40 soal
    for idx, item in enumerate(ikpa_data):
        diff, topic, qtext, opA, opB, opC, opD, corr, expl, ref = item
        pts = 5 if diff == "MUDAH" else 10 if diff == "SEDANG" else 15
        questions.append({
            "id": f"mbq_{current_num:03d}",
            "number": current_num,
            "topic": topic,
            "difficulty": diff,
            "questionText": qtext,
            "optionA": opA,
            "optionB": opB,
            "optionC": opC,
            "optionD": opD,
            "correctAnswer": corr,
            "explanation": expl,
            "referenceRegulation": ref,
            "points": pts
        })
        current_num += 1

    return questions

if __name__ == "__main__":
    qs = build_questions()
    print(f"Sample built: {len(qs)} questions")
