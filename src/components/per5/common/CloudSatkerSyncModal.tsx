import React, { useState, useEffect } from 'react';
import {
  Cloud,
  CloudUpload,
  CloudDownload,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Building,
  Database,
  HardDrive,
  Info,
  CheckCheck,
  Calendar,
  Sparkles
} from 'lucide-react';
import { SimulationProject } from '../../../models/ikpa';
import { SatkerIKPA } from '../../../types';
import { db, doc, getDoc, setDoc } from '../../../lib/firebase';
import { verifySatkerPassword } from '../../../utils/satkerSecurity';
import { calculateIKPA } from '../../../calculations/ikpa';

interface CloudSatkerSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProject: SimulationProject;
  onLoadProject: (loadedProject: SimulationProject) => void;
  satkers?: SatkerIKPA[];
  selectedSatkerId?: string;
  onSelectSatker?: (satkerId: string) => void;
  isDark?: boolean;
}

export const CloudSatkerSyncModal: React.FC<CloudSatkerSyncModalProps> = ({
  isOpen,
  onClose,
  activeProject,
  onLoadProject,
  satkers = [],
  selectedSatkerId,
  onSelectSatker,
  isDark = false
}) => {
  const [selectedKode, setSelectedKode] = useState<string>(selectedSatkerId || '');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Cloud Save State
  const [isLoadingCloud, setIsLoadingCloud] = useState<boolean>(false);
  const [isSavingCloud, setIsSavingCloud] = useState<boolean>(false);
  const [cloudData, setCloudData] = useState<{
    exists: boolean;
    lastUpdated?: string;
    projectName?: string;
    finalScore?: number;
    projectData?: SimulationProject;
  } | null>(null);
  const [actionFeedback, setActionFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Sync selected kode when prop changes
  useEffect(() => {
    if (selectedSatkerId) {
      setSelectedKode(selectedSatkerId);
    }
  }, [selectedSatkerId]);

  const selectedSatker = satkers.find(s => s.kodeSatker === selectedKode);

  // Filter satkers for dropdown
  const filteredSatkers = satkers.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.kodeSatker || '').toLowerCase().includes(q) ||
      (s.namaSatker || '').toLowerCase().includes(q) ||
      (s.kementerianLembaga || '').toLowerCase().includes(q)
    );
  });

  // Verify satker password
  const handleVerifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedSatker) {
      setAuthError('Silakan pilih Satker terlebih dahulu.');
      return;
    }

    const isValid = verifySatkerPassword(selectedSatker as any, passwordInput);
    if (isValid) {
      setIsAuthenticated(true);
      setAuthError(null);
      checkCloudData(selectedSatker.kodeSatker);
    } else {
      setIsAuthenticated(false);
      setAuthError('Password salah. Silakan masukkan password resmi Satker Anda atau hubungi Admin KPPN.');
    }
  };

  // Check cloud save in Firestore
  const checkCloudData = async (kodeSatker: string) => {
    setIsLoadingCloud(true);
    try {
      const docRef = doc(db, 'simulasi_ikpa_satker', kodeSatker);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setCloudData({
          exists: true,
          lastUpdated: data.lastUpdated,
          projectName: data.projectName || 'Simulasi IKPA Cloud',
          finalScore: data.finalScore ?? (data.projectData?.output?.finalScore ?? 0),
          projectData: data.projectData
        });
      } else {
        setCloudData({ exists: false });
      }
    } catch (err: any) {
      console.warn('Gagal membaca data cloud satker:', err);
      setCloudData({ exists: false });
    } finally {
      setIsLoadingCloud(false);
    }
  };

  // Save active project to Firestore
  const handleSaveToCloud = async () => {
    if (!selectedSatker || !isAuthenticated) return;
    setIsSavingCloud(true);
    setActionFeedback(null);

    try {
      const docRef = doc(db, 'simulasi_ikpa_satker', selectedSatker.kodeSatker);
      const calculatedProject = {
        ...activeProject,
        metadata: {
          ...activeProject.metadata,
          kodeSatker: selectedSatker.kodeSatker,
          namaSatker: selectedSatker.namaSatker,
          kodeKPPN: selectedSatker.kodeKppn || '026'
        },
        output: calculateIKPA(activeProject)
      };

      await setDoc(docRef, {
        kodeSatker: selectedSatker.kodeSatker,
        namaSatker: selectedSatker.namaSatker,
        lastUpdated: new Date().toISOString(),
        projectName: activeProject.name,
        finalScore: calculatedProject.output.finalScore,
        projectData: calculatedProject
      });

      setCloudData({
        exists: true,
        lastUpdated: new Date().toISOString(),
        projectName: activeProject.name,
        finalScore: calculatedProject.output.finalScore,
        projectData: calculatedProject
      });

      setActionFeedback({
        message: `Skenario "${activeProject.name}" berhasil disimpan ke Cloud Database KPPN untuk Satker ${selectedSatker.namaSatker}!`,
        type: 'success'
      });
    } catch (err: any) {
      console.error('Gagal menyimpan ke cloud:', err);
      setActionFeedback({
        message: 'Gagal menyimpan ke Cloud. Pastikan koneksi internet aktif.',
        type: 'error'
      });
    } finally {
      setIsSavingCloud(false);
    }
  };

  // Load project from cloud into the simulator
  const handleLoadFromCloud = () => {
    if (!cloudData?.projectData) return;
    const loaded = {
      ...cloudData.projectData,
      output: calculateIKPA(cloudData.projectData)
    };
    onLoadProject(loaded);
    if (onSelectSatker && selectedSatker) {
      onSelectSatker(selectedSatker.kodeSatker);
    }
    setActionFeedback({
      message: `Skenario "${loaded.name}" berhasil dimuat dari Cloud ke dalam simulator!`,
      type: 'success'
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-900/50">
              <Cloud className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Cloud Database Satker
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                  Aman & Terproteksi Password
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Simpan dan buka skenario simulasi IKPA resmi Satker Anda di server KPPN Semarang I.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Storage Architecture Explanation Badge */}
          <div className="rounded-xl border border-sky-200 dark:border-sky-900/50 bg-sky-50/60 dark:bg-sky-950/20 p-3.5 text-xs text-sky-900 dark:text-sky-200 flex items-start gap-2.5">
            <Info className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-sky-950 dark:text-sky-100">
                Sistem Penyimpanan Cerdas (Hybrid Dual-Storage)
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                <strong>Lokal Browser (IndexedDB)</strong>: Secara default, simulator ini menyimpan data di browser perangkat Anda tanpa batas, super cepat, dan aman untuk utak-atik skenario bebas tanpa perlu login.<br />
                <strong>Cloud Database Satker</strong>: Gunakan fitur di bawah ini dengan <em>Password Satker</em> jika Anda ingin menyimpan skenario resmi secara permanen agar dapat diakses kembali dari komputer atau laptop kantor lainnya.
              </p>
            </div>
          </div>

          {/* Step 1: Select Satker */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              1. Pilih Satker
            </label>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Cari kode atau nama Satker..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
              />
              <select
                value={selectedKode}
                onChange={e => {
                  setSelectedKode(e.target.value);
                  setIsAuthenticated(false);
                  setPasswordInput('');
                  setCloudData(null);
                  setAuthError(null);
                }}
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500 font-medium"
              >
                <option value="">-- Pilih Satker ({filteredSatkers.length} Satker) --</option>
                {filteredSatkers.map(s => (
                  <option key={s.kodeSatker} value={s.kodeSatker}>
                    {s.kodeSatker} - {s.namaSatker} ({s.kementerianLembaga || 'K/L'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: Password Authentication */}
          {selectedSatker && (
            <div className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                2. Otentikasi Password Satker
              </label>

              {!isAuthenticated ? (
                <form onSubmit={handleVerifyPassword} className="space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        placeholder="Format: [KodeSatker]_[KodeBA] atau PIN Admin"
                        value={passwordInput}
                        onChange={e => {
                          setPasswordInput(e.target.value);
                          setAuthError(null);
                        }}
                        className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-sky-500"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white cursor-pointer transition-colors shadow-xs"
                    >
                      Buka Akses Cloud
                    </button>
                  </div>
                  {authError && (
                    <div className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>{authError}</span>
                    </div>
                  )}
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Contoh format password: <code className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-slate-700 dark:text-slate-300">{selectedSatker.kodeSatker}_018</code> (Kode Satker diikuti garis bawah dan Kode BA Kementerian/Lembaga).
                  </p>
                </form>
              ) : (
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/70 dark:bg-emerald-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Akses Terverifikasi untuk {selectedSatker.namaSatker}</span>
                  </div>
                  <button
                    onClick={() => setIsAuthenticated(false)}
                    className="text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
                  >
                    Kunci Kembali
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Cloud Operations (When Authenticated) */}
          {isAuthenticated && selectedSatker && (
            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                3. Operasi Skenario Cloud
              </label>

              {/* Feedback Alert */}
              {actionFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    actionFeedback.type === 'success'
                      ? 'border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                      : 'border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <CheckCheck className="h-4 w-4 shrink-0" />
                  <span>{actionFeedback.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Save Current Simulation to Cloud */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                      <CloudUpload className="h-4 w-4 text-sky-600" />
                      <span>Simpan Skenario Aktif</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                      Menyimpan skenario <strong>"{activeProject.name}"</strong> (Nilai: {activeProject.output?.finalScore?.toFixed(2) ?? '0.00'}) ke Cloud Satker.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveToCloud}
                    disabled={isSavingCloud}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                  >
                    {isSavingCloud ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CloudUpload className="h-3.5 w-3.5" />
                    )}
                    <span>{isSavingCloud ? 'Menyimpan...' : 'Simpan ke Cloud'}</span>
                  </button>
                </div>

                {/* Load Simulation from Cloud */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 font-bold text-xs text-slate-900 dark:text-white">
                      <CloudDownload className="h-4 w-4 text-emerald-600" />
                      <span>Muat Skenario Tersimpan</span>
                    </div>
                    {isLoadingCloud ? (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-2">
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Mengecek data cloud...</span>
                      </div>
                    ) : cloudData?.exists ? (
                      <div className="mt-1 space-y-1">
                        <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                          {cloudData.projectName}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                          <span>Nilai: <strong className="text-emerald-600">{cloudData.finalScore?.toFixed(2)}</strong></span>
                          <span>•</span>
                          <span>{cloudData.lastUpdated ? new Date(cloudData.lastUpdated).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Belum ada skenario yang tersimpan di Cloud untuk Satker ini.
                      </p>
                    )}
                  </div>
                  <button
                    onClick={handleLoadFromCloud}
                    disabled={isLoadingCloud || !cloudData?.exists}
                    className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CloudDownload className="h-3.5 w-3.5" />
                    <span>Muat ke Simulator Ini</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end bg-slate-50/50 dark:bg-slate-800/30">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
