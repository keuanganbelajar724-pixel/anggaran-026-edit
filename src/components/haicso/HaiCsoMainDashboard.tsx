import React, { useState } from 'react';
import {
  Ticket,
  Shield,
  Eye,
  Settings,
  AlertTriangle,
  Lock,
  ArrowRight
} from 'lucide-react';
import {
  HAICSOTicket,
  HAICSOUploadBatch,
  HAICSODashboardSettings,
  MasterSatker
} from '../../types';
import { HaiCsoAdminDashboard } from './HaiCsoAdminDashboard';
import { HaiCsoSatkerDashboard } from './HaiCsoSatkerDashboard';

interface HaiCsoMainDashboardProps {
  isAdmin: boolean;
  tickets: HAICSOTicket[];
  batches: HAICSOUploadBatch[];
  settings: HAICSODashboardSettings;
  masterSatkers?: MasterSatker[];
  onUpdateTickets: (newTickets: HAICSOTicket[], newBatches: HAICSOUploadBatch[]) => void;
  onUpdateSettings: (newSettings: HAICSODashboardSettings) => void;
  isDark?: boolean;
}

export const HaiCsoMainDashboard: React.FC<HaiCsoMainDashboardProps> = ({
  isAdmin,
  tickets,
  batches,
  settings,
  masterSatkers = [],
  onUpdateTickets,
  onUpdateSettings,
  isDark = false
}) => {
  // If admin, allow switching between Admin Management View and Satker Preview View
  const [adminViewMode, setAdminViewMode] = useState<'admin' | 'preview_satker'>('admin');

  // If not admin and module is deactivated by admin
  if (!isAdmin && !settings.is_active) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-xl mx-auto my-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
          <Lock className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Monitoring Tiket HAICSO Sedang Dinonaktifkan
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
            Modul Monitoring Tiket HAICSO saat ini belum diaktifkan oleh Administrator KPPN Semarang I. Silakan hubungi petugas KPPN untuk informasi lebih lanjut.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Mode Switcher Banner (Only shown if user is Admin) */}
      {isAdmin && (
        <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Mode Akses Administrator KPPN
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
              | Status Dashboard Satker:{' '}
              <strong className={settings.is_active ? 'text-emerald-600' : 'text-rose-600'}>
                {settings.is_active ? 'AKTIF' : 'NONAKTIF'}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold self-stretch sm:self-auto justify-center">
            <button
              onClick={() => setAdminViewMode('admin')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                adminViewMode === 'admin'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Tampilan Admin
            </button>
            <button
              onClick={() => setAdminViewMode('preview_satker')}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all ${
                adminViewMode === 'preview_satker'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview Tampilan Satker</span>
            </button>
          </div>
        </div>
      )}

      {/* Render Appropriate View */}
      {isAdmin && adminViewMode === 'admin' ? (
        <HaiCsoAdminDashboard
          tickets={tickets}
          batches={batches}
          settings={settings}
          masterSatkers={masterSatkers}
          onUpdateTickets={onUpdateTickets}
          onUpdateSettings={onUpdateSettings}
          isDark={isDark}
          viewMode="monitoring_only"
        />
      ) : (
        <HaiCsoSatkerDashboard
          tickets={tickets}
          isDark={isDark}
        />
      )}
    </div>
  );
};
