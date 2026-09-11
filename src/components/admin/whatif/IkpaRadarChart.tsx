import React, { useState } from 'react';
import { IndikatorIKPA } from '../../../types';

interface RadarChartProps {
  baseline: IndikatorIKPA;
  simulated: IndikatorIKPA;
  isDark?: boolean;
}

interface AxisConfig {
  key: keyof IndikatorIKPA;
  label: string;
  weight: number;
  angleDeg: number;
}

const AXES: AxisConfig[] = [
  { key: 'capaianOutput', label: 'Caput SAKTI', weight: 25, angleDeg: 0 },
  { key: 'deviasiHal3Dipa', label: 'Deviasi Hal III', weight: 15, angleDeg: 45 },
  { key: 'penyerapanAnggaran', label: 'Penyerapan Anggaran', weight: 20, angleDeg: 90 },
  { key: 'belanjaKontraktual', label: 'Data Kontrak', weight: 10, angleDeg: 135 },
  { key: 'penyelesaianTagihan', label: 'Penyelesaian Tagihan', weight: 10, angleDeg: 180 },
  { key: 'pengelolaanUpTup', label: 'Pengelolaan UP/TUP', weight: 10, angleDeg: 225 },
  { key: 'revisiDipa', label: 'Revisi DIPA', weight: 10, angleDeg: 270 },
  { key: 'dispensasiSpm', label: 'Dispensasi SPM', weight: 5, angleDeg: 315 },
];

export const IkpaRadarChart: React.FC<RadarChartProps> = ({
  baseline,
  simulated,
  isDark = false
}) => {
  const [showBaseline, setShowBaseline] = useState(true);
  const [showSimulated, setShowSimulated] = useState(true);
  const [showBenchmark, setShowBenchmark] = useState(true);
  const [hoveredAxis, setHoveredAxis] = useState<AxisConfig | null>(null);

  const size = 340;
  const center = size / 2;
  const radius = 115;

  // Helper to convert polar to cartesian
  const getCoordinates = (value: number, angleDeg: number) => {
    // 0 deg is at top (angle - 90 deg)
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    const clampedVal = Math.max(0, Math.min(100, value));
    const r = (clampedVal / 100) * radius;
    const x = center + r * Math.cos(angleRad);
    const y = center + r * Math.sin(angleRad);
    return { x, y };
  };

  // Build polygon path
  const createPolygonPoints = (values: IndikatorIKPA) => {
    return AXES.map(axis => {
      const val = values[axis.key] ?? 0;
      const { x, y } = getCoordinates(val, axis.angleDeg);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const createBenchmarkPoints = (targetVal: number) => {
    return AXES.map(axis => {
      const { x, y } = getCoordinates(targetVal, axis.angleDeg);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  };

  const gridLevels = [25, 50, 75, 100];

  return (
    <div className={`p-4 rounded-2xl border transition-all ${
      isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
    } shadow-sm space-y-3`}>
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
            <span>🕸️ Visualisasi Radar Kinerja 8 Indikator</span>
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Bandingkan polygon performa Satker Baseline vs Skenario What-If
          </p>
        </div>

        {/* Legend toggles */}
        <div className="flex items-center gap-1.5 text-[10px] font-bold">
          <button
            onClick={() => setShowBaseline(!showBaseline)}
            className={`px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
              showBaseline
                ? 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800'
                : 'opacity-40 line-through bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            ● Baseline
          </button>
          <button
            onClick={() => setShowSimulated(!showSimulated)}
            className={`px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
              showSimulated
                ? 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
                : 'opacity-40 line-through bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            ● Simulasi
          </button>
          <button
            onClick={() => setShowBenchmark(!showBenchmark)}
            className={`px-2 py-0.5 rounded-md border transition-all cursor-pointer ${
              showBenchmark
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                : 'opacity-40 line-through bg-slate-100 text-slate-500 border-slate-200'
            }`}
          >
            ┄ Target 95
          </button>
        </div>
      </div>

      <div className="relative flex justify-center items-center py-1">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="w-full max-w-[340px] h-auto overflow-visible select-none"
        >
          {/* Circular Grid Rings */}
          {gridLevels.map(level => {
            const r = (level / 100) * radius;
            return (
              <g key={level}>
                <circle
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke={isDark ? '#334155' : '#e2e8f0'}
                  strokeDasharray={level === 100 ? 'none' : '3,3'}
                  strokeWidth={level === 100 ? 1.5 : 1}
                />
                <text
                  x={center + 4}
                  y={center - r + 9}
                  fontSize="8"
                  fill={isDark ? '#64748b' : '#94a3b8'}
                  className="font-mono font-bold"
                >
                  {level}
                </text>
              </g>
            );
          })}

          {/* Radial Spokes (Axes) */}
          {AXES.map(axis => {
            const { x, y } = getCoordinates(100, axis.angleDeg);
            const isHovered = hoveredAxis?.key === axis.key;
            return (
              <line
                key={axis.key}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke={isHovered ? '#6366f1' : (isDark ? '#334155' : '#cbd5e1')}
                strokeWidth={isHovered ? 2 : 1}
              />
            );
          })}

          {/* 1. Benchmark Polygon (Target 95.00) */}
          {showBenchmark && (
            <polygon
              points={createBenchmarkPoints(95)}
              fill="rgba(16, 185, 129, 0.05)"
              stroke="#10b981"
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
          )}

          {/* 2. Baseline Polygon */}
          {showBaseline && (
            <polygon
              points={createPolygonPoints(baseline)}
              fill="rgba(14, 165, 233, 0.18)"
              stroke="#0ea5e9"
              strokeWidth={2}
              className="transition-all duration-300"
            />
          )}

          {/* 3. Simulated Polygon */}
          {showSimulated && (
            <polygon
              points={createPolygonPoints(simulated)}
              fill="rgba(168, 85, 247, 0.25)"
              stroke="#a855f7"
              strokeWidth={2.5}
              className="transition-all duration-300"
            />
          )}

          {/* Data Points on Axes */}
          {AXES.map(axis => {
            const baseVal = baseline[axis.key] ?? 0;
            const simVal = simulated[axis.key] ?? 0;
            const baseCoord = getCoordinates(baseVal, axis.angleDeg);
            const simCoord = getCoordinates(simVal, axis.angleDeg);
            const isHovered = hoveredAxis?.key === axis.key;

            return (
              <g key={axis.key}>
                {showBaseline && (
                  <circle
                    cx={baseCoord.x}
                    cy={baseCoord.y}
                    r={isHovered ? 4.5 : 3}
                    fill="#0284c7"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                )}
                {showSimulated && (
                  <circle
                    cx={simCoord.x}
                    cy={simCoord.y}
                    r={isHovered ? 5.5 : 4}
                    fill="#9333ea"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    className="cursor-pointer"
                  />
                )}
              </g>
            );
          })}

          {/* Axis Labels outside the radar */}
          {AXES.map(axis => {
            const angleRad = ((axis.angleDeg - 90) * Math.PI) / 180;
            const labelR = radius + 22;
            const x = center + labelR * Math.cos(angleRad);
            const y = center + labelR * Math.sin(angleRad);
            const isHovered = hoveredAxis?.key === axis.key;

            // Anchor alignment based on position
            let textAnchor: 'middle' | 'start' | 'end' = 'middle';
            if (axis.angleDeg > 15 && axis.angleDeg < 165) textAnchor = 'start';
            if (axis.angleDeg > 195 && axis.angleDeg < 345) textAnchor = 'end';

            return (
              <g
                key={axis.key}
                className="cursor-pointer transition-transform"
                onMouseEnter={() => setHoveredAxis(axis)}
                onMouseLeave={() => setHoveredAxis(null)}
              >
                <text
                  x={x}
                  y={y}
                  textAnchor={textAnchor}
                  fontSize="9"
                  fontWeight={isHovered ? '900' : '700'}
                  fill={isHovered ? '#6366f1' : (isDark ? '#cbd5e1' : '#334155')}
                >
                  {axis.label}
                </text>
                <text
                  x={x}
                  y={y + 9}
                  textAnchor={textAnchor}
                  fontSize="7.5"
                  fill={isDark ? '#64748b' : '#94a3b8'}
                  className="font-mono font-bold"
                >
                  ({axis.weight}%)
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hovered Axis Tooltip / Info box */}
      <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
        hoveredAxis
          ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800'
          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
      }`}>
        {hoveredAxis ? (
          <>
            <div>
              <span className="font-extrabold text-indigo-900 dark:text-indigo-200">
                {hoveredAxis.label}
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 ml-1.5 font-bold">
                (Bobot: {hoveredAxis.weight}%)
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[11px] font-black">
              <span className="text-sky-600 dark:text-sky-400">
                Base: {baseline[hoveredAxis.key] ?? 0}
              </span>
              <span className="text-purple-600 dark:text-purple-400">
                Simulasi: {simulated[hoveredAxis.key] ?? 0}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                (simulated[hoveredAxis.key] ?? 0) >= (baseline[hoveredAxis.key] ?? 0)
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {((simulated[hoveredAxis.key] ?? 0) - (baseline[hoveredAxis.key] ?? 0)).toFixed(1)}
              </span>
            </div>
          </>
        ) : (
          <div className="w-full text-center text-[11px] text-slate-500 dark:text-slate-400 italic">
            Arahkan kursor ke label indikator untuk melihat detail komparasi nilai
          </div>
        )}
      </div>
    </div>
  );
};
