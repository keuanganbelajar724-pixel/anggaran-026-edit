import React, { useState } from 'react';
import { DiagnostikCaputResult, DiagnostikCaputROItem } from '../types';
import { 
  CalendarDays, 
  CheckSquare, 
  Square, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Printer, 
  Sparkles, 
  UserCheck, 
  ArrowRight,
  ShieldAlert,
  Download,
  Copy,
  Check
} from 'lucide-react';

interface SaktiActionPlanGanttProps {
  data: DiagnostikCaputResult;
  onOpenSimulator: (ro: DiagnostikCaputROItem) => void;
  isDark?: boolean;
}

interface ActionTask {
  id: string;
  roId: string;
  kodeRo: string;
  namaRo: string;
  week: 1 | 2 | 3 | 4;
  title: string;
  pic: 'PPK' | 'Operator SAKTI' | 'Bendahara' | 'KPA' | 'Penyedia/Rekanan';
  completed: boolean;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  deadline: string;
}

export const SaktiActionPlanGanttView: React.FC<SaktiActionPlanGanttProps> = ({
  data,
  onOpenSimulator,
  isDark = false
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number | 'ALL'>('ALL');
  const [copiedPlan, setCopiedPlan] = useState<boolean>(false);

  // Generate actionable tasks from problematic ROs
  const initialTasks: ActionTask[] = [];

  data.items.forEach(ro => {
    // Week 1 Tasks: Physical Verification & BAST/BAP
    if (ro.realisasiProgres < ro.targetProgres || ro.diagnosaSeverity === 'KRITIS') {
      initialTasks.push({
        id: `t-w1-1-${ro.id}`,
        roId: ro.id,
        kodeRo: ro.kodeRo,
        namaRo: ro.namaRo,
        week: 1,
        title: `Verifikasi fisik & penyusunan Berita Acara Progres Fisik (BAP) / BAST parsial s.d. target ${ro.targetProgres}%`,
        pic: 'PPK',
        completed: false,
        priority: 'HIGH',
        deadline: 'Minggu I Bulan Berjalan'
      });
    }

    // Week 2 Tasks: Financial Realization / Tagihan
    if (ro.realisasiAnggaran < 20 || (ro.realisasiAnggaran - ro.realisasiProgres > 20)) {
      initialTasks.push({
        id: `t-w2-1-${ro.id}`,
        roId: ro.id,
        kodeRo: ro.kodeRo,
        namaRo: ro.namaRo,
        week: 2,
        title: `Akselerasi penerbitan SPP/SPM LS Kontraktual atau pertanggungjawaban UP/TUP belanja barang`,
        pic: 'Bendahara',
        completed: false,
        priority: 'HIGH',
        deadline: 'Minggu II Bulan Berjalan'
      });
    }

    // Week 3 Tasks: SAKTI Input & 3 Mandatory Elements
    initialTasks.push({
      id: `t-w3-1-${ro.id}`,
      roId: ro.id,
      kodeRo: ro.kodeRo,
      namaRo: ro.namaRo,
      week: 3,
      title: `Input realisasi fisik (${ro.realisasiProgres}%), volume (${ro.realisasiVolume}), Ref ${ro.rekomendasiRefCode || '01'}, dan narasi 3 elemen di Form Caput SAKTI`,
      pic: 'Operator SAKTI',
      completed: false,
      priority: 'MEDIUM',
      deadline: 'Sebelum HK-5 Bulan Berikutnya'
    });

    // Week 4 Tasks: PPK Approval
    initialTasks.push({
      id: `t-w4-1-${ro.id}`,
      roId: ro.id,
      kodeRo: ro.kodeRo,
      namaRo: ro.namaRo,
      week: 4,
      title: `Approval dan Kirim data Capaian Output ke KPPN via Modul Komitmen PPK (Maksimal HK-7 Pukul 23.59)`,
      pic: 'PPK',
      completed: false,
      priority: 'HIGH',
      deadline: 'Maksimal HK-7 Pukul 23.59 WIB'
    });
  });

  const [tasks, setTasks] = useState<ActionTask[]>(initialTasks);

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t));
  };

  const filteredTasks = tasks.filter(t => selectedWeek === 'ALL' || t.week === selectedWeek);
  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 100;

  const handleCopyPlan = () => {
    const text = [
      `=== MATRIKS RENCANA AKSI PEMULIHAN CAPAIAN OUTPUT SAKTI ===`,
      `Satker: ${data.summary.satkerCode} - ${data.summary.satkerName}`,
      `Periode: ${data.summary.periode}`,
      `Total Agenda Aksi: ${tasks.length} Butir | Selesai: ${completedCount} (${progressPercent}%)`,
      ``,
      ...tasks.map((t, i) => `${i + 1}. [${t.completed ? 'SELESAI' : 'PENDING'}] [W${t.week}] [${t.pic}] RO ${t.kodeRo}: ${t.title} (Deadline: ${t.deadline})`)
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedPlan(true);
    setTimeout(() => setCopiedPlan(false), 2500);
  };

  const handlePrintPlan = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className={`p-6 sm:p-8 rounded-3xl border ${
        isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200 shadow-sm'
      } space-y-4`}>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-xs font-bold">
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Action Plan Engine &bull; Matriks Jadwal Aksi Pemulihan Caput SAKTI</span>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Matriks Rencana Aksi 4-Mingguan PPK &amp; Tim Keuangan
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-3xl leading-relaxed mt-1">
              Panduan tugas terperinci berdasarkan pekan (Minggu I s.d. Minggu IV) untuk memitigasi kendala fisik, mempercepat SPM kontraktual, hingga batas akhir *approval* PPK di SAKTI.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleCopyPlan}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              {copiedPlan ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copiedPlan ? 'Tersalin' : 'Salin Matriks'}</span>
            </button>

            <button
              onClick={handlePrintPlan}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Jadwal Aksi</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-600 dark:text-slate-300">
              Progres Pelaksanaan Rencana Aksi Satker:
            </span>
            <span className="font-mono text-blue-600 dark:text-blue-400">
              {completedCount} dari {tasks.length} Butir Selesai ({progressPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Week Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-current/10">
          <button
            onClick={() => setSelectedWeek('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedWeek === 'ALL'
                ? 'bg-blue-600 text-white'
                : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            Semua Pekan ({tasks.length})
          </button>
          <button
            onClick={() => setSelectedWeek(1)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedWeek === 1
                ? 'bg-blue-600 text-white'
                : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            📅 Minggu I (Audit Fisik &amp; BAP)
          </button>
          <button
            onClick={() => setSelectedWeek(2)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedWeek === 2
                ? 'bg-blue-600 text-white'
                : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            💳 Minggu II (Penerbitan SPP/SPM)
          </button>
          <button
            onClick={() => setSelectedWeek(3)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedWeek === 3
                ? 'bg-blue-600 text-white'
                : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            ⌨️ Minggu III (Input &amp; Narasi SAKTI)
          </button>
          <button
            onClick={() => setSelectedWeek(4)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              selectedWeek === 4
                ? 'bg-blue-600 text-white'
                : isDark ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-700'
            }`}
          >
            🛡️ Minggu IV (Approval PPK HK-7)
          </button>
        </div>
      </div>

      {/* Task List Cards */}
      <div className="space-y-3">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
              task.completed
                ? isDark ? 'bg-slate-800/40 border-emerald-900/50 opacity-75' : 'bg-emerald-50/40 border-emerald-200 opacity-75'
                : isDark ? 'bg-slate-800/90 border-slate-700 hover:border-blue-500' : 'bg-white border-slate-200 hover:border-blue-400 shadow-sm'
            }`}
          >
            <div className="pt-0.5">
              {task.completed ? (
                <CheckSquare className="w-5 h-5 text-emerald-600" />
              ) : (
                <Square className="w-5 h-5 text-slate-400" />
              )}
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                  {task.kodeRo}
                </span>
                <span className="text-xs font-bold text-slate-500 truncate max-w-xs">
                  {task.namaRo}
                </span>
                <span className="ml-auto text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  PIC: {task.pic}
                </span>
              </div>

              <p className={`text-xs sm:text-sm font-medium ${
                task.completed ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'
              }`}>
                {task.title}
              </p>

              <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Target: {task.deadline}</span>
                </span>
                <span>&bull;</span>
                <span>Pekan: Minggu ke-{task.week}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
