import { RawQuestion } from './questionsIkpa';

export const pajakQuestions: RawQuestion[] = [
  // 1-15: PPh Pasal 21 & Skema Tarif Efektif Rata-rata (TER) PP 58/2023
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'MUDAH',
    questionText: 'Berapakah tarif PPh Pasal 21 Final atas honorarium yang bersumber dari APBN yang dibayarkan kepada Pegawai Negeri Sipil (PNS) / TNI / Polri Golongan IV?',
    optionA: '15% (lima belas persen) bersifat Final',
    optionB: '5% bersifat Final',
    optionC: '0% (bebas pajak)',
    optionD: '20% tidak final',
    correctAnswer: 'A',
    explanation: 'Sesuai PP No. 80/2010 tentang Tarif Pemotongan dan Pengenaan PPh Pasal 21 atas Penghasilan yang Menjadi Beban APBN/APBD, PNS Golongan IV dikenakan PPh Pasal 21 Final sebesar 15%.',
    referenceRegulation: 'PP No. 80 Tahun 2010 Pasal 4 ayat (2) huruf c'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'MUDAH',
    questionText: 'Berapakah tarif PPh Pasal 21 Final atas honorarium APBN yang diterima oleh PNS Golongan III?',
    optionA: '5% (lima persen) bersifat Final',
    optionB: '15% bersifat Final',
    optionC: '0%',
    optionD: '10%',
    correctAnswer: 'A',
    explanation: 'Berdasarkan PP 80/2010, honorarium atau imbalan lain yang dibayarkan kepada PNS Golongan III dikenakan pemotongan PPh Pasal 21 Final dengan tarif 5%.',
    referenceRegulation: 'PP No. 80 Tahun 2010 Pasal 4 ayat (2) huruf b'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'MUDAH',
    questionText: 'Berapakah tarif PPh Pasal 21 Final atas honorarium APBN yang diterima oleh PNS Golongan I dan Golongan II?',
    optionA: '0% (nol persen / tidak dipotong PPh 21 Final)',
    optionB: '5%',
    optionC: '10%',
    optionD: '15%',
    correctAnswer: 'A',
    explanation: 'Sesuai PP 80/2010, penghasilan honorarium yang dibayarkan kepada PNS Golongan I dan Golongan II dikenakan tarif PPh Pasal 21 sebesar 0% (tidak ada pemotongan).',
    referenceRegulation: 'PP No. 80 Tahun 2010 Pasal 4 ayat (2) huruf a'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'ANALISIS',
    questionText: 'Satker Balai Diklat mengundang seorang narasumber pakar (Bukan Pegawai / Non-PNS) untuk mengisi workshop selama 2 hari dengan honorarium bruto sebesar Rp10.000.000. Narasumber memiliki NPWP dan tidak berpenghasilan berkesinambungan. Berapakah PPh Pasal 21 yang dipotong bendahara sesuai UU HPP?',
    optionA: 'Rp250.000 (Tarif 5% x 50% Dasar Pengenaan Pajak Rp10.000.000 = 5% x Rp5.000.000)',
    optionB: 'Rp500.000 (5% x Rp10.000.000)',
    optionC: 'Rp1.500.000 (15% x Rp10.000.000)',
    optionD: 'Rp0 (Bebas pajak)',
    correctAnswer: 'A',
    explanation: 'Untuk tenaga ahli/narasumber Bukan Pegawai non-berkesinambungan, DPP PPh 21 adalah 50% dari penghasilan bruto. PPh 21 = 5% x (50% x Rp10.000.000) = 5% x Rp5.000.000 = Rp250.000.',
    referenceRegulation: 'PMK No. 168 Tahun 2023 tentang Petunjuk Pemotongan Pajak atas Penghasilan Sehubungan Pekerjaan'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'SEDANG',
    questionText: 'Dalam ketentuan Peraturan Pemerintah No. 58 Tahun 2023, skema baru apa yang diterapkan untuk pemotongan PPh Pasal 21 atas penghasilan bulanan pegawai tetap masa pajak Januari s.d. November?',
    optionA: 'Tarif Efektif Rata-Rata (TER) Bulanan (Kategori A, B, dan C) yang dikalikan langsung dengan penghasilan bruto',
    optionB: 'Tarif progresif Pasal 17 setiap bulan',
    optionC: 'Tarif flat 10% untuk semua pegawai',
    optionD: 'Pembebasan pajak penuh tanpa potongan',
    correctAnswer: 'A',
    explanation: 'PP 58/2023 dan PMK 168/2023 memperkenalkan metode TER Bulanan (Kategori A, B, C berdasarkan status PTKP) untuk mempermudah perhitungan PPh 21 bulanan masa Januari-November, sedangkan masa Desember menggunakan tarif Pasal 17 UU PPh.',
    referenceRegulation: 'PP No. 58 Tahun 2023 & PMK No. 168 Tahun 2023'
  },

  // 16-30: PPh Pasal 22 Belanja Barang Instansi Pemerintah
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'MUDAH',
    questionText: 'Berapakah tarif pemungutan PPh Pasal 22 atas belanja barang yang dilakukan oleh instansi pemerintah dari penyedia yang memiliki NPWP?',
    optionA: '1,5% (satu koma lima persen) dari harga beli tidak termasuk PPN',
    optionB: '2% dari total kuitansi',
    optionC: '10% dari pagu DIPA',
    optionD: '0,5% final',
    correctAnswer: 'A',
    explanation: 'Sesuai PMK 231/PMK.03/2019 jo PMK 59/PMK.03/2022, instansi pemerintah wajib memungut PPh Pasal 22 sebesar 1,5% atas pembayaran pembelian barang dari penyedia ber-NPWP.',
    referenceRegulation: 'PMK No. 59/PMK.03/2022 Pasal 12'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'SEDANG',
    questionText: 'Berapakah batasan nilai belanja barang yang DIKECUALIKAN dari pemungutan PPh Pasal 22 oleh bendahara instansi pemerintah?',
    optionA: 'Pembayaran yang jumlahnya paling banyak Rp2.000.000 (dua juta rupiah) tidak termasuk PPN dan bukan merupakan pembayaran yang dipecah-pecah',
    optionB: 'Pembayaran paling banyak Rp10.000.000',
    optionC: 'Pembayaran di bawah Rp50.000.000',
    optionD: 'Semua transaksi di atas Rp100.000',
    correctAnswer: 'A',
    explanation: 'Pembelian barang dengan nilai bruto paling banyak Rp2.000.000 (tidak termasuk PPN) dikecualikan dari kewajiban pemungutan PPh Pasal 22 oleh instansi pemerintah.',
    referenceRegulation: 'PMK No. 59/PMK.03/2022 Pasal 13 ayat (1) huruf a'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'ANALISIS',
    questionText: 'Satker membeli alat tulis kantor (ATK) senilai Rp4.440.000 (sudah termasuk PPN 11%) dari toko ber-NPWP. Berapakah DPP, PPN 11%, dan PPh Pasal 22 yang harus dipungut?',
    optionA: 'DPP = Rp4.000.000, PPN 11% = Rp440.000, PPh Pasal 22 (1,5%) = Rp60.000',
    optionB: 'DPP = Rp4.440.000, PPN = Rp488.400, PPh 22 = Rp66.600',
    optionC: 'DPP = Rp4.000.000, PPN = Rp400.000, PPh 22 = Rp80.000',
    optionD: 'Tidak ada pajak yang dipungut karena di bawah Rp5 juta',
    correctAnswer: 'A',
    explanation: 'DPP = 100/111 x Rp4.440.000 = Rp4.000.000. PPN 11% = 11% x Rp4.000.000 = Rp440.000. PPh 22 = 1,5% x Rp4.000.000 = Rp60.000. Karena DPP > Rp2.000.000, PPh 22 wajib dipungut.',
    referenceRegulation: 'PMK No. 59/PMK.03/2022'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'SEDANG',
    questionText: 'Jika rekanan penyedia barang TIDAK memiliki Nomor Pokok Wajib Pajak (NPWP / NIK tidak terdaftar), berapakah tarif pemotongan PPh Pasal 22 yang dikenakan?',
    optionA: '100% lebih tinggi dari tarif normal (menjadi 3%)',
    optionB: 'Tetap 1,5%',
    optionC: 'Dikenakan denda pidana kurungan',
    optionD: 'Bebas pajak',
    correctAnswer: 'A',
    explanation: 'Wajib pajak yang tidak memiliki NPWP dikenakan tarif 100% lebih tinggi dari tarif normal, sehingga tarif PPh Pasal 22 menjadi 2 x 1,5% = 3%. Namun saat ini NIK 16 digit telah diintegrasikan sebagai NPWP.',
    referenceRegulation: 'UU Pajak Penghasilan Pasal 22 ayat (2) & UU Harmonisasi Peraturan Perpajakan (HPP)'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'ANALISIS',
    questionText: 'Bendahara membeli BBM bersubsidi/non-subsidi langsung di SPBU Pertamina senilai Rp3.000.000 menggunakan uang persediaan. Apakah bendahara wajib memungut PPh Pasal 22?',
    optionA: 'Tidak dipungut PPh Pasal 22 karena pembelian bahan bakar minyak, gas, dan pelumas dikecualikan dari pemungutan PPh 22 oleh instansi pemerintah',
    optionB: 'Tetap dipungut PPh 22 sebesar 1,5%',
    optionC: 'Dipungut PPh 23 sebesar 2%',
    optionD: 'Dipungut PPh 4 ayat 2',
    correctAnswer: 'A',
    explanation: 'Pembelian bahan bakar minyak, listrik, gas, air minum/PDAM, dan benda pos dikecualikan secara eksplisit dari pemungutan PPh Pasal 22 oleh bendahara instansi pemerintah.',
    referenceRegulation: 'PMK No. 59/PMK.03/2022 Pasal 13 ayat (1) huruf b'
  },

  // 31-45: PPh Pasal 23, PPh 4 ayat 2, PPN 11%
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'MUDAH',
    questionText: 'Berapakah tarif PPh Pasal 23 yang wajib dipotong oleh instansi pemerintah atas pembayaran sewa kendaraan bermotor atau peralatan mesin kepada rekanan ber-NPWP?',
    optionA: '2% (dua persen) dari jumlah bruto tidak termasuk PPN',
    optionB: '15% dari nilai kontrak',
    optionC: '5% dari pagu',
    optionD: '0,5% final',
    correctAnswer: 'A',
    explanation: 'Berdasarkan UU PPh Pasal 23, atas sewa dan penghasilan lain sehubungan dengan penggunaan harta (selain tanah/bangunan) dikenakan tarif pemotongan sebesar 2% dari jumlah bruto.',
    referenceRegulation: 'UU PPh Pasal 23 ayat (1) huruf c & PMK 59/PMK.03/2022'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'MUDAH',
    questionText: 'Berapakah tarif pemotongan PPh Pasal 4 ayat (2) Final atas jasa persewaan tanah dan/atau bangunan gedung yang dibayarkan oleh instansi pemerintah?',
    optionA: '10% (sepuluh persen) bersifat Final dari jumlah bruto nilai persewaan',
    optionB: '2% tidak final',
    optionC: '5% final',
    optionD: '11%',
    correctAnswer: 'A',
    explanation: 'Penghasilan dari persewaan tanah dan/atau bangunan dikenakan Pajak Penghasilan Final Pasal 4 ayat (2) dengan tarif 10% dari jumlah bruto nilai persewaan.',
    referenceRegulation: 'PP No. 34 Tahun 2017 & PMK 59/PMK.03/2022'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'SEDANG',
    questionText: 'Berapakah batas nilai transaksi belanja yang DIKECUALIKAN dari kewajiban pemungutan PPN oleh instansi pemerintah?',
    optionA: 'Pembayaran yang jumlahnya paling banyak Rp2.000.000 (dua juta rupiah) termasuk PPN',
    optionB: 'Pembayaran paling banyak Rp10.000.000',
    optionC: 'Pembayaran di bawah Rp100.000.000',
    optionD: 'Tidak ada batas pengecualian',
    correctAnswer: 'A',
    explanation: 'Sesuai PMK 59/PMK.03/2022, instansi pemerintah tidak memungut PPN atas pembayaran yang jumlahnya paling banyak Rp2.000.000 (termasuk PPN). PPN-nya disetor sendiri oleh Pengusaha Kena Pajak rekanan.',
    referenceRegulation: 'PMK No. 59/PMK.03/2022 Pasal 18 ayat (1) huruf a'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'ANALISIS',
    questionText: 'Satker menggunakan jasa katering perorangan ber-NPWP untuk konsumsi rapat senilai Rp8.000.000. Berdasarkan regulasi perpajakan PMK 59/2022 dan UU PPN, bagaimanakah perlakuan pajak katering?',
    optionA: 'Jasa boga/katering merupakan objek pajak daerah (bukan objek PPN pusat), dan dipotong PPh Pasal 23 sebesar 2% (Rp160.000)',
    optionB: 'Dipungut PPN 11% dan PPh 22 1,5%',
    optionC: 'Dipungut PPh 4 ayat 2 sebesar 10%',
    optionD: 'Bebas dari segala jenis pajak',
    correctAnswer: 'A',
    explanation: 'Jasa boga/katering dikecualikan dari PPN (merupakan objek pajak restoran/daerah sesuai UU HKPD), namun tetap dipotong PPh Pasal 23 sebesar 2% dari jumlah bruto oleh bendahara pemerintah.',
    referenceRegulation: 'UU No. 1/2022 tentang HKPD & PMK No. 59/PMK.03/2022'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'SEDANG',
    questionText: 'Kapan batas waktu penyetoran pajak yang telah dipungut oleh Bendahara Pengeluaran atas transaksi Uang Persediaan (UP)?',
    optionA: 'Paling lambat 7 (tujuh) hari setelah tanggal pembayaran kepada rekanan',
    optionB: 'Paling lambat akhir tahun anggaran',
    optionC: 'Paling lambat 3 bulan kemudian',
    optionD: 'Hanya disetor jika diminta oleh kantor pajak',
    correctAnswer: 'A',
    explanation: 'Berdasarkan PMK 231/2019 jo PMK 59/2022, Bendahara Pengeluaran wajib menyetorkan pajak yang dipungut atas pembayaran UP paling lambat 7 hari setelah tanggal pelaksanaan pembayaran.',
    referenceRegulation: 'PMK No. 231/PMK.03/2019 Pasal 20 ayat (1)'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'MUDAH',
    questionText: 'Dokumen bukti pemungutan dan penyetoran pajak ke kas negara yang diterbitkan melalui sistem billing Direktorat Jenderal Pajak / MPN disebut...',
    optionA: 'Bukti Penerimaan Negara (BPN) dengan Nomor Transaksi Bank (NTB) / Nomor Transaksi Penerimaan Negara (NTPN)',
    optionB: 'Kuitansi bermeterai toko',
    optionC: 'Tiket parkir elektronik',
    optionD: 'Kartu keluarga',
    correctAnswer: 'A',
    explanation: 'Setoran pajak dinyatakan sah masuk ke kas negara apabila telah terbit Bukti Penerimaan Negara (BPN) yang memuat NTPN resmi dari sistem perbendaharaan negara.',
    referenceRegulation: 'Perdirjen Perbendaharaan tentang Modul Penerimaan Negara'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'ANALISIS',
    questionText: 'Satker membayar termin pekerjaan renovasi ruang rapat senilai Rp66.600.000 (termasuk PPN 11%) kepada kontraktor pelaksana kualifikasi usaha kecil yang memiliki sertifikat badan usaha (SBU) aktif. Berapakah PPh Final Jasa Konstruksi (Pasal 4 ayat 2) yang dipotong jika tarif kualifikasi kecil adalah 1,75%?',
    optionA: 'DPP = Rp60.000.000, PPh Final Konstruksi = 1,75% x Rp60.000.000 = Rp1.050.000',
    optionB: 'PPh Final = Rp2.000.000',
    optionC: 'PPh Final = Rp500.000',
    optionD: 'Tidak dipotong pajak karena di bawah Rp100 juta',
    correctAnswer: 'A',
    explanation: 'DPP = 100/111 x Rp66.600.000 = Rp60.000.000. Sesuai PP 9/2022 tentang Jasa Konstruksi, pekerjaan konstruksi oleh penyedia kualifikasi usaha kecil dikenakan PPh Final 1,75%. PPh = 1,75% x Rp60.000.000 = Rp1.050.000.',
    referenceRegulation: 'PP No. 9 Tahun 2022 tentang Perubahan Kedua atas PP No. 51/2008 tentang Jasa Konstruksi'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'SEDANG',
    questionText: 'Aplikasi yang digunakan oleh Bendahara Instansi Pemerintah untuk membuat bukti potong PPh Pasal 21/26 dan PPh Unifikasi (22, 23, 4 ayat 2) serta melaporkan SPT Masa secara elektronik adalah...',
    optionA: 'e-Bupot Instansi Pemerintah pada DJP Online (ebupotip.pajak.go.id)',
    optionB: 'Aplikasi Microsoft Word',
    optionC: 'Aplikasi SPAN Internal KPPN',
    optionD: 'Google Form bebas',
    correctAnswer: 'A',
    explanation: 'Direktorat Jenderal Pajak menyediakan aplikasi web e-Bupot Instansi Pemerintah pada DJP Online bagi bendahara untuk menerbitkan bukti potong unifikasi dan SPT Masa secara paperless.',
    referenceRegulation: 'PER-17/PJ/2021 tentang Tata Cara Pembuatan Bukti Pemotongan dan Pelaporan SPT Masa bagi Instansi Pemerintah'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'MUDAH',
    questionText: 'Berapakah tarif Pajak Pertambahan Nilai (PPN) yang berlaku di Indonesia sejak 1 April 2022 sesuai Undang-Undang Harmonisasi Peraturan Perpajakan (UU HPP)?',
    optionA: '11% (sebelas persen)',
    optionB: '10%',
    optionC: '12%',
    optionD: '5%',
    correctAnswer: 'A',
    explanation: 'Undang-Undang Nomor 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan (UU HPP) menetapkan kenaikan tarif PPN menjadi 11% yang mulai berlaku sejak 1 April 2022.',
    referenceRegulation: 'UU No. 7 Tahun 2021 tentang Harmonisasi Peraturan Perpajakan (HPP) Bab VI'
  },
  {
    topic: 'Perpajakan Bendahara Pemerintah',
    difficulty: 'ANALISIS',
    questionText: 'Bendahara membayar tagihan langganan internet kantor bulanan senilai Rp5.550.000 (termasuk PPN 11%) kepada PT Telkom Indonesia (BUMN). Bagaimanakah pemungutan PPN dan PPh Pasal 22/23-nya?',
    optionA: 'PPN 11% (Rp550.000) TIDAK dipungut bendahara melainkan disetor sendiri oleh BUMN penyedia jasa, dan dipotong PPh Pasal 23 atas jasa internet sebesar 2% (Rp100.000)',
    optionB: 'Semua pajak dipungut dua kali lipat oleh bendahara',
    optionC: 'BUMN dibebaskan dari seluruh jenis pajak',
    optionD: 'Bendahara wajib menyetorkan uang tunai langsung ke kantor pusat Telkom',
    correctAnswer: 'A',
    explanation: 'Pembayaran kepada BUMN tertentu (seperti Telkom, PLN, Pertamina) dikecualikan dari pemungutan PPN oleh instansi pemerintah (PPN disetor sendiri oleh BUMN rekanan), namun pemotongan PPh Pasal 23 tetap dilakukan oleh bendahara.',
    referenceRegulation: 'PMK No. 59/PMK.03/2022'
  }
];
