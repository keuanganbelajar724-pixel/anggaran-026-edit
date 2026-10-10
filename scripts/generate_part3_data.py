# -*- coding: utf-8 -*-
import json
import os

def make_q(num, topic, diff, q_text, a, b, c, d, ans, exp, reg):
    pts = 5 if diff == 'MUDAH' else (10 if diff == 'SEDANG' else 15)
    return {
        "id": f"mbq_{num}",
        "number": num,
        "topic": topic,
        "difficulty": diff,
        "questionText": q_text,
        "optionA": a,
        "optionB": b,
        "optionC": c,
        "optionD": d,
        "correctAnswer": ans,
        "explanation": exp,
        "referenceRegulation": reg,
        "points": pts
    }

questions = []
cur_num = 1051

# 10 Topics for Part 3
topics = [
    {
        "name": "IKPA - Reformulasi 2026 & Kinerja Anggaran",
        "reg": "PER-5/PB/2022 jo Petunjuk Teknis IKPA Terkini",
        "focus": "8 Indikator IKPA, Deviasi Hal III DIPA 5%, Batas 17 HK BAST, Revolving UP 50%, Dispensasi SPM, Capaian Output PCRO/RVRO"
    },
    {
        "name": "Aplikasi SAKTI & MonSAKTI Terintegrasi",
        "reg": "PMK No. 171/PMK.05/2021 tentang Pelaksanaan Sistem Aplikasi Keuangan Tingkat Instansi",
        "focus": "Modul Anggaran, Komitmen, Pembayaran, Bendahara, Aset, Persediaan, GL Pelaporan, OTP TTE, To Do List MonSAKTI"
    },
    {
        "name": "Mekanisme Pembayaran APBN & SP2D Elektronik",
        "reg": "PMK No. 190/PMK.05/2012 jo PMK No. 62/PMK.05/2023 tentang Tata Cara Pembayaran APBN",
        "focus": "Pengujian PPK/PPSPM, Penerbitan SPP & SPM, Pengujian KPPN, SLA SP2D Elektronik 1 Jam, Penolakan SPM, Koreksi Akun"
    },
    {
        "name": "Pengelolaan UP, TUP, KKP Domestik & Digipay Satu",
        "reg": "PMK No. 196/PMK.05/2018 jo PMK No. 79/PMK.05/2022 & Perdirjen Digipay",
        "focus": "Proporsi UP Tunai vs KKP 60:40, Izin TUP 1 Bulan, KKP Domestik QRIS GPN, Belanja UMKM Digipay Satu, Rekonsiliasi Tagihan KKP"
    },
    {
        "name": "Perpajakan Bendahara Pengeluaran & Instansi Pemerintah",
        "reg": "PMK No. 59/PMK.03/2022 tentang Tata Cara Perpajakan Instansi Pemerintah & UU HPP",
        "focus": "PPh Pasal 21 Honorarium PNS/Non-PNS, PPh 22 Belanja Barang >Rp2 Juta, PPh 23 Sewa & Jasa, PPh Final 4(2) Konstruksi, PPN 11%/12%, e-Bupot"
    },
    {
        "name": "LLAT TA 2026 & Rekening Penampungan Akhir Tahun (RPATA)",
        "reg": "PMK No. 109/PMK.05/2023 tentang Mekanisme RPATA & Perdirjen LLAT",
        "focus": "Rekening Penampungan Akhir Tahun (RPATA), Bank Garansi Akhir Tahun, Tahapan Batas SPM LS Kontraktual/Non-kontraktual, Jam Layanan KPPN, GUP/PTUP Nihil"
    },
    {
        "name": "Kas Negara, TSA, SPRINT & Cash Forecasting",
        "reg": "PMK No. 182/PMK.05/2017 & PMK No. 197/PMK.05/2017 tentang Pengelolaan Rekening dan Perencanaan Kas",
        "focus": "Treasury Single Account (TSA), Rekening Bersaldo Nihil, Izin Rekening SPRINT, RPD Harian Kategori A (>Rp500M)/B/C, Idle Cash Prevention"
    },
    {
        "name": "Pengadaan Barang/Jasa Pemerintah & Kontrak Satker",
        "reg": "Perpres No. 16/2018 jo Perpres No. 12/2021 tentang Pengadaan Barang dan Jasa Pemerintah",
        "focus": "Kewenangan PA/KPA/PPK/Pokja/Pejabat Pengadaan, E-Purchasing Katalog, Pengadaan Langsung Rp200 Juta, Swakelola Tipe I-IV, Denda 1 Mil/Hari, Jaminan Kontrak"
    },
    {
        "name": "Akuntansi Pemerintahan SAP PP 71/2010 & Pelaporan Keuangan",
        "reg": "PP No. 71/2010 tentang Standar Akuntansi Pemerintahan & Modul Pelaporan SAKTI",
        "focus": "SAP Akrual, 7 Laporan Keuangan (LRA, Neraca, LO, LPE, CaLK), Pendapatan LRA vs LO, Beban vs Belanja, Penyusutan Aset, Jurnal Eliminasi Transaksi Antar Entitas"
    },
    {
        "name": "LPJ Bendahara Pengeluaran/Penerimaan & Rekonsiliasi Bank",
        "reg": "PMK No. 162/PMK.05/2013 jo PMK No. 230/PMK.05/2016 tentang Tata Cara LPJ Bendahara",
        "focus": "Penyusunan LPJ Bulanan Bendahara, Rekonsiliasi BKU vs Rekening Koran Bank, Berita Acara Kas KPA, Batas Penyampaian Tanggal 10, Verifikasi KPPN Vera, Sanksi SP2D"
    }
]

print("Ready to populate questions for all 10 topics.")
