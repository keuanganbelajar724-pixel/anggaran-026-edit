import { BuletinConfig, RealisasiBelanjaSummary } from '../types';
import { formatRupiahShort, formatRupiahFull } from './realisasiBelanjaProcessor';

/**
 * Generates a standalone, ultra-responsive HTML5 digital flipbook magazine
 * that can be opened offline in any browser or shared via email/WhatsApp.
 */
export function exportStandaloneBuletinHtml(
  config: BuletinConfig,
  summary?: RealisasiBelanjaSummary | null
): void {
  const title = config.namaBuletin || 'WARTA SEMARANG SATU';
  const edisi = config.edisi || 'Edisi Khusus 2026';
  const paguStr = summary ? formatRupiahShort(summary.totalPagu) : 'Rp12,85 Triliun';
  const realStr = summary ? formatRupiahShort(summary.totalRealisasi) : 'Rp8,42 Triliun';
  const persenStr = summary ? `${summary.persenRealisasiTotal.toFixed(1)}%` : '65.5%';

  const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} - ${edisi}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,800;0,900;1,400;1,700&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #090d16;
      color: #f1f5f9;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: rgba(15, 23, 42, 0.95);
      border-bottom: 1px solid rgba(255,255,255,0.1);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
      backdrop-filter: blur(8px);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-logo {
      width: 38px;
      height: 38px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #0f172a;
      font-weight: 900;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
    }
    .brand-title {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0.5px;
      color: #ffffff;
    }
    .badge-edition {
      background: #f59e0b;
      color: #090d16;
      font-size: 10px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 9999px;
      margin-left: 8px;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn {
      background: #1e293b;
      color: #f8fafc;
      border: 1px solid rgba(255,255,255,0.15);
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn:hover { background: #334155; }
    .btn-gold {
      background: #f59e0b;
      color: #0f172a;
      border: none;
    }
    .btn-gold:hover { background: #fbbf24; }
    
    .magazine-container {
      max-width: 900px;
      margin: 30px auto;
      padding: 0 16px;
      flex: 1;
      width: 100%;
    }
    .page-card {
      background: #ffffff;
      color: #0f172a;
      border-radius: 12px;
      padding: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      min-height: 1050px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
    }
    .cover-page {
      background: linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #0f172a 100%);
      color: #ffffff;
    }
    .cover-title {
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      font-weight: 900;
      line-height: 1.1;
      color: #ffffff;
      margin: 20px 0 10px 0;
    }
    .cover-subtitle {
      font-size: 16px;
      color: #fde68a;
      font-style: italic;
      margin-bottom: 24px;
    }
    .stat-pill {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      padding: 16px 20px;
      border-radius: 12px;
      display: flex;
      justify-content: space-between;
      margin-top: 16px;
    }
    .page-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin: 24px 0;
    }
    .nav-btn {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.2);
      color: #f59e0b;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .nav-btn:hover { background: #334155; }
    .nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
    
    @media print {
      header, .page-nav, .controls { display: none !important; }
      body { background: white; color: black; }
      .page-card { box-shadow: none; border-radius: 0; padding: 20mm; page-break-after: always; min-height: 297mm; }
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="brand-logo">026</div>
      <div>
        <div class="brand-title">${title} <span class="badge-edition">${edisi}</span></div>
        <div style="font-size: 11px; color: #94a3b8;">KPPN Tipe A1 Semarang I • DJPb Kemenkeu RI</div>
      </div>
    </div>
    <div class="controls">
      <button class="btn btn-gold" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
      <button class="btn" onclick="speakSummary()">🔊 Dengar Audio</button>
    </div>
  </header>

  <main class="magazine-container">
    <div class="page-card cover-page">
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 12px;">
          <span style="font-size: 11px; font-weight: 800; letter-spacing: 2px; color: #f59e0b;">MAJALAH RESMI PERBENDAHARAAN</span>
          <span style="font-size: 12px; font-weight: 700; color: #94a3b8;">${config.bulanTahun || '2026'}</span>
        </div>
        
        <h1 class="cover-title">${title}</h1>
        <p class="cover-subtitle">${config.taglineBuletin || 'Kiprah Perbendaharaan & Kinerja APBN Wilayah KPPN Semarang I'}</p>
        
        <div class="stat-pill">
          <div>
            <div style="font-size: 10px; text-transform: uppercase; color: #94a3b8;">Total Pagu Kelolaan</div>
            <div style="font-size: 18px; font-weight: 900; color: #f59e0b;">${paguStr}</div>
          </div>
          <div>
            <div style="font-size: 10px; text-transform: uppercase; color: #94a3b8;">Realisasi Belanja</div>
            <div style="font-size: 18px; font-weight: 900; color: #34d399;">${realStr} (${persenStr})</div>
          </div>
        </div>

        <div style="margin-top: 30px; background: rgba(0,0,0,0.4); border-radius: 12px; padding: 20px; border-left: 4px solid #f59e0b;">
          <h3 style="font-size: 13px; font-weight: 800; color: #f59e0b; text-transform: uppercase; margin-bottom: 6px;">Rubrik Utama Edisi Ini:</h3>
          <ul style="font-size: 12px; line-height: 1.8; color: #e2e8f0; padding-left: 16px;">
            <li>Evaluasi Kinerja 8 Indikator IKPA 127 Satker Mitra</li>
            <li>Kata Pengantar Kepala KPPN & Strategi Akselerasi Belanja</li>
            <li>Liputan Khusus Capacity Building & Sinergi Pegawai</li>
            <li>Wawancara Eksklusif Satker Juara Nilai IKPA Tertinggi</li>
            <li>Zona Integritas WBBM & Teka-Teki Silang Perbendaharaan SAKTI</li>
          </ul>
        </div>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.2); padding-top: 16px; display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
        <span>Diterbitkan oleh Seksi MSKI KPPN Semarang I</span>
        <span style="color: #f59e0b; font-weight: 700;">Layanan Prima Tanpa Biaya (Rp0,-)</span>
      </div>
    </div>

    <div class="page-nav">
      <button class="nav-btn" onclick="alert('Gunakan versi online untuk melihat 24 halaman interaktif.')">◀</button>
      <span style="font-size: 12px; color: #94a3b8; font-weight: 700;">Halaman Sampul Utama (E-Reader Mode)</span>
      <button class="nav-btn" onclick="alert('Gunakan versi online untuk melihat 24 halaman interaktif.')">▶</button>
    </div>
  </main>

  <script>
    function speakSummary() {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = "Selamat datang di Majalah Digital ${title}, ${edisi}. Diterbitkan oleh KPPN Tipe A1 Semarang Satu. Realisasi belanja negara mencapai ${realStr} dari total pagu ${paguStr}.";
        const ut = new SpeechSynthesisUtterance(text);
        ut.lang = 'id-ID';
        window.speechSynthesis.speak(ut);
      } else {
        alert('Browser Anda tidak mendukung fitur narasi suara.');
      }
    }
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Buletin_${title.replace(/\s+/g, '_')}_${edisi.replace(/\s+/g, '_')}.html`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
