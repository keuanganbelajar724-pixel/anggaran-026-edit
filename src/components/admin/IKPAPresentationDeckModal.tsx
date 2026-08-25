import React, { useState, useMemo } from 'react';
import { 
  Presentation, 
  Download, 
  Printer, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Award, 
  CheckSquare,
  Square,
  Bot, 
  Filter,
  Layers,
  Target
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  LineChart, 
  Line, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import pptxgen from 'pptxgenjs';
import { SatkerIKPA, DashboardConfig } from '../../types';
import { 
  PeriodScope, 
  SlideCategory, 
  DetailedSlideContent, 
  generate50PresentationSlides 
} from '../../data/presentationSlidesData';

interface IKPAPresentationDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  satkers: SatkerIKPA[];
  dashboardConfig: DashboardConfig;
  isDark?: boolean;
  onAskGeminiForTopic?: (topicPrompt: string) => void;
}

export const IKPAPresentationDeckModal: React.FC<IKPAPresentationDeckModalProps> = ({
  isOpen,
  onClose,
  satkers,
  isDark = false,
  onAskGeminiForTopic
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);
  const [periodScope, setPeriodScope] = useState<PeriodScope>('TW1');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<SlideCategory>('ALL');
  const [selectedSlideIds, setSelectedSlideIds] = useState<number[]>(
    Array.from({ length: 50 }, (_, i) => i + 1)
  );
  const [isExportingPPT, setIsExportingPPT] = useState<boolean>(false);

  // Generate 50 slides dynamically based on satker dataset & period
  const all50Slides: DetailedSlideContent[] = useMemo(() => {
    return generate50PresentationSlides(satkers, periodScope);
  }, [satkers, periodScope]);

  // Filtered Slides for list
  const displayedSlides = useMemo(() => {
    if (selectedCategoryFilter === 'ALL') return all50Slides;
    return all50Slides.filter(s => s.category === selectedCategoryFilter);
  }, [all50Slides, selectedCategoryFilter]);

  const currentSlide = all50Slides[currentSlideIndex] || all50Slides[0];

  if (!isOpen) return null;

  const toggleSlideSelection = (id: number) => {
    setSelectedSlideIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id].sort((a, b) => a - b)
    );
  };

  const selectAllSlides = () => setSelectedSlideIds(all50Slides.map(s => s.id));
  const deselectAllSlides = () => setSelectedSlideIds([]);

  // PPTX Generation with Native PowerPoint Charts and Rich In-depth Layouts
  const handleExportSelectedPPTX = async () => {
    if (selectedSlideIds.length === 0) {
      alert('Silakan pilih minimal 1 slide untuk diunduh.');
      return;
    }

    setIsExportingPPT(true);
    try {
      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_16x9';
      pptx.author = 'KPPN Semarang I';
      pptx.company = 'Direktorat Jenderal Perbendaharaan';
      pptx.title = `Paparan Evaluasi Kinerja IKPA ${periodScope} - KPPN Semarang I`;

      const slidesToExport = all50Slides.filter(s => selectedSlideIds.includes(s.id));

      slidesToExport.forEach((slideItem) => {
        const slide = pptx.addSlide();
        
        // Executive Dark Background
        slide.background = { color: '090D16' };

        // Top Accent Stripe
        slide.addShape(pptx.ShapeType.rect, {
          x: 0,
          y: 0,
          w: 13.33,
          h: 0.12,
          fill: { color: '6366F1' }
        });

        // Header Category Badge
        slide.addShape(pptx.ShapeType.roundRect, {
          x: 0.6,
          y: 0.35,
          w: 2.8,
          h: 0.35,
          fill: { color: '1E1B4B' },
          line: { color: '6366F1', width: 1 }
        });

        slide.addText(slideItem.category.replace('_', ' '), {
          x: 0.6,
          y: 0.35,
          w: 2.8,
          h: 0.35,
          fontSize: 8.5,
          bold: true,
          color: 'A5B4FC',
          align: 'center'
        });

        // Slide Number Pill
        slide.addText(`Slide ${slideItem.id} dari 50`, {
          x: 10.5,
          y: 0.35,
          w: 2.2,
          h: 0.35,
          fontSize: 8.5,
          color: '94A3B8',
          align: 'right'
        });

        // Slide Title & Subtitle
        slide.addText(slideItem.title, {
          x: 0.6,
          y: 0.8,
          w: 12.13,
          h: 0.5,
          fontSize: 16,
          bold: true,
          color: 'FFFFFF'
        });

        slide.addText(slideItem.subtitle, {
          x: 0.6,
          y: 1.3,
          w: 12.13,
          h: 0.3,
          fontSize: 10,
          color: '38BDF8',
          bold: true
        });

        const hasChart = !!slideItem.chartConfig;
        const leftWidth = hasChart ? 5.8 : 12.13;
        let leftY = 1.7;

        // Stats Highlight Cards if available
        if (slideItem.statsHighlight && slideItem.statsHighlight.length > 0) {
          const count = slideItem.statsHighlight.length;
          const cardWidth = hasChart ? (leftWidth - 0.2 * (count - 1)) / count : Math.min(3.6, 12.0 / count);

          slideItem.statsHighlight.forEach((stat, idx) => {
            const cardX = 0.6 + idx * (cardWidth + 0.2);
            slide.addShape(pptx.ShapeType.roundRect, {
              x: cardX,
              y: leftY,
              w: cardWidth,
              h: 0.85,
              fill: { color: '1E293B' },
              line: { color: '334155', width: 1 }
            });

            slide.addText(stat.label.toUpperCase(), {
              x: cardX + 0.05,
              y: leftY + 0.06,
              w: cardWidth - 0.1,
              h: 0.2,
              fontSize: 7,
              bold: true,
              color: '94A3B8',
              align: 'center'
            });

            slide.addText(stat.value, {
              x: cardX + 0.05,
              y: leftY + 0.26,
              w: cardWidth - 0.1,
              h: 0.35,
              fontSize: 13,
              bold: true,
              color: stat.color === 'emerald' ? '34D399' : stat.color === 'rose' ? 'F87171' : stat.color === 'amber' ? 'FBBF24' : '38BDF8',
              align: 'center'
            });

            if (stat.note) {
              slide.addText(stat.note, {
                x: cardX + 0.05,
                y: leftY + 0.62,
                w: cardWidth - 0.1,
                h: 0.18,
                fontSize: 6.5,
                color: 'CBD5E1',
                align: 'center'
              });
            }
          });
          leftY += 0.95;
        }

        // Deep Analysis Points
        if (slideItem.analysisPoints && slideItem.analysisPoints.length > 0) {
          slide.addText('Kajian Strategis & Fakta Pelaksanaan Anggaran:', {
            x: 0.6,
            y: leftY,
            w: leftWidth,
            h: 0.25,
            fontSize: 9.5,
            color: 'FBBF24',
            bold: true
          });

          const bulletText = slideItem.analysisPoints.map(p => `• ${p}`).join('\n');
          slide.addText(bulletText, {
            x: 0.6,
            y: leftY + 0.25,
            w: leftWidth,
            h: hasChart ? 2.1 : 1.8,
            fontSize: 8.5,
            color: 'E2E8F0',
            lineSpacing: 14
          });

          leftY += (hasChart ? 2.4 : 2.0);
        }

        // Table if available
        if (slideItem.tableData && slideItem.tableData.rows.length > 0 && !hasChart) {
          const formattedTableRows: any = [
            slideItem.tableData.headers.map(h => ({
              text: h,
              options: { bold: true, fill: { color: '312E81' }, color: 'FFFFFF', fontSize: 8.5 }
            }))
          ];

          slideItem.tableData.rows.forEach(row => {
            formattedTableRows.push(
              row.map(cell => ({
                text: String(cell),
                options: { fill: { color: '1E293B' }, color: 'E2E8F0', fontSize: 8 }
              }))
            );
          });

          (slide as any).addTable(formattedTableRows, {
            x: 0.6,
            y: leftY,
            w: 12.13,
            autoPage: false
          });

          leftY += Math.min(1.8, 0.3 + slideItem.tableData.rows.length * 0.25);
        }

        // Render Native PPT Chart on Right Side if ChartConfig exists
        if (hasChart && slideItem.chartConfig) {
          const cfg = slideItem.chartConfig;
          const chartX = 6.7;
          const chartY = 1.7;
          const chartW = 6.0;
          const chartH = 3.9;

          slide.addText(`Grafik: ${cfg.title}`, {
            x: chartX,
            y: chartY - 0.25,
            w: chartW,
            h: 0.22,
            fontSize: 9,
            color: '38BDF8',
            bold: true
          });

          try {
            if (cfg.type === 'donut' || cfg.type === 'gauge') {
              const pieData = [{
                name: cfg.title,
                labels: cfg.data.map(d => d.name),
                values: cfg.data.map(d => d.value)
              }];

              slide.addChart(pptx.ChartType.doughnut, pieData, {
                x: chartX,
                y: chartY,
                w: chartW,
                h: chartH,
                showLegend: true,
                legendPos: 'b',
                chartColors: ['10B981', '0EA5E9', 'F59E0B', 'F43F5E', '8B5CF6'],
                holeSize: 55,
                showPercent: true
              });
            } else if (cfg.type === 'line') {
              const lineData = [
                {
                  name: 'Realisasi / Proyeksi (%)',
                  labels: cfg.data.map(d => d.name),
                  values: cfg.data.map(d => d.value)
                },
                {
                  name: 'Target Nasional (%)',
                  labels: cfg.data.map(d => d.name),
                  values: cfg.data.map(d => d.target || 95)
                }
              ];

              slide.addChart(pptx.ChartType.line, lineData, {
                x: chartX,
                y: chartY,
                w: chartW,
                h: chartH,
                showLegend: true,
                legendPos: 'b',
                chartColors: ['10B981', 'F59E0B'],
                valAxisMaxVal: 100,
                valAxisMinVal: 0
              });
            } else {
              // Bar / Radar / Column Chart
              const barData = [
                {
                  name: 'Capaian Satker',
                  labels: cfg.data.map(d => d.name),
                  values: cfg.data.map(d => d.value)
                }
              ];

              if (cfg.data.some(d => d.target !== undefined)) {
                barData.push({
                  name: 'Target / Standar',
                  labels: cfg.data.map(d => d.name),
                  values: cfg.data.map(d => d.target || 100)
                });
              }

              slide.addChart(pptx.ChartType.bar, barData, {
                x: chartX,
                y: chartY,
                w: chartW,
                h: chartH,
                showLegend: true,
                legendPos: 'b',
                chartColors: ['6366F1', '10B981'],
                valAxisMaxVal: 100,
                valAxisMinVal: 0
              });
            }
          } catch (chartErr) {
            console.error('Error generating native chart in PPT:', chartErr);
          }
        }

        // Actionable Recommendation Box
        if (slideItem.recommendation) {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: 0.6,
            y: 5.85,
            w: 12.13,
            h: 0.7,
            fill: { color: '1E1B4B' },
            line: { color: '6366F1', width: 1 }
          });

          slide.addText(`REKOMENDASI TINDAKAN: ${slideItem.recommendation}`, {
            x: 0.8,
            y: 5.9,
            w: 11.7,
            h: 0.6,
            fontSize: 8.5,
            color: 'C7D2FE',
            bold: true
          });
        }

        // Footer Bar
        slide.addText('Portal ANGKASA V3.2  •  Seksi MSKI KPPN Semarang I  •  Layanan Bebas Biaya (Rp 0,-)', {
          x: 0.6,
          y: 6.8,
          w: 8.0,
          h: 0.3,
          fontSize: 7.5,
          color: '64748B'
        });

        if (slideItem.regulationRef) {
          slide.addText(slideItem.regulationRef, {
            x: 8.6,
            y: 6.8,
            w: 4.1,
            h: 0.3,
            fontSize: 7,
            color: '64748B',
            align: 'right'
          });
        }
      });

      const fileName = `Paparan_IKPA_${periodScope}_50Slide_KPPN_Semarang_I.pptx`;
      await pptx.writeFile({ fileName });
    } catch (err) {
      console.error(err);
      alert('Gagal menghasilkan file PowerPoint: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsExportingPPT(false);
    }
  };

  // Render Visual Dynamic Charts in Slide Preview
  const renderSlideChart = (cfg: NonNullable<DetailedSlideContent['chartConfig']>) => {
    return (
      <div className="h-full w-full flex flex-col p-3 rounded-2xl bg-slate-950/80 border border-slate-800 shadow-inner">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black text-sky-400 uppercase tracking-tight flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            {cfg.title}
          </span>
          {cfg.unit && (
            <span className="text-[9px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded">
              Satuan: {cfg.unit}
            </span>
          )}
        </div>

        <div className="flex-1 w-full min-h-[160px]">
          {cfg.type === 'donut' || cfg.type === 'gauge' ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={cfg.data}
                  cx="50%"
                  cy="50%"
                  innerRadius="50%"
                  outerRadius="80%"
                  paddingAngle={3}
                  dataKey="value"
                >
                  {cfg.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || '#6366F1'} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                  formatter={(val: any) => [`${val} ${cfg.unit || ''}`, 'Nilai']}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '4px' }}
                  formatter={(value) => <span className="text-slate-300 text-[10px]">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : cfg.type === 'radar' ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={cfg.data}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" tick={{ fontSize: 8, fill: '#64748b' }} />
                <Radar name="Capaian Satker" dataKey="value" stroke="#6366F1" fill="#6366F1" fillOpacity={0.4} />
                <Radar name="Target Nasional" dataKey="target" stroke="#10B981" fill="#10B981" fillOpacity={0.15} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : cfg.type === 'line' ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cfg.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="value" name="Realisasi/Capaian" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4, fill: '#10B981' }} />
                <Line type="monotone" dataKey="target" name="Target Ideal" stroke="#F59E0B" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3, fill: '#F59E0B' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cfg.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '11px', color: '#fff' }}
                  formatter={(val: any) => [`${val} ${cfg.unit || ''}`, 'Nilai']}
                />
                <Bar dataKey="value" name="Capaian" radius={[6, 6, 0, 0]}>
                  {cfg.data.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color || '#6366F1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    );
  };

  // Render Slide Stage Content (Rich Visual Preview)
  const renderSlideStage = (slide: DetailedSlideContent) => {
    return (
      <div className="h-full flex flex-col justify-between p-5 sm:p-6 bg-slate-900 text-white relative overflow-y-auto">
        {/* Ambient Backlight */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Top Slide Header */}
        <div className="border-b border-slate-800 pb-2 flex items-center justify-between relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-[10px] font-black uppercase">
              {slide.category.replace('_', ' ')}
            </span>
            <span className="text-xs text-slate-400 font-mono">Slide {slide.id} / 50</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSlideSelection(slide.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedSlideIds.includes(slide.id)
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {selectedSlideIds.includes(slide.id) ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Dipilih untuk PPTX</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Tidak Dipilih</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Slide Body */}
        <div className="my-auto py-2.5 space-y-3 relative z-10">
          
          {/* Titles */}
          <div>
            <div className="inline-flex items-center gap-1 text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-widest mb-0.5">
              <Target className="w-3 h-3 text-amber-400" />
              <span>{slide.badge}</span>
            </div>
            <h2 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">
              {slide.title}
            </h2>
            <p className="text-xs text-sky-400 font-semibold mt-0.5">
              {slide.subtitle}
            </p>
          </div>

          {/* Stats Highlight Cards */}
          {slide.statsHighlight && slide.statsHighlight.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {slide.statsHighlight.map((stat, sIdx) => (
                <div key={sIdx} className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-center">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase">{stat.label}</span>
                  <span className={`text-lg font-black block mt-0.5 ${
                    stat.color === 'emerald' ? 'text-emerald-400' :
                    stat.color === 'rose' ? 'text-rose-400' :
                    stat.color === 'amber' ? 'text-amber-400' : 'text-sky-400'
                  }`}>
                    {stat.value}
                  </span>
                  {stat.note && <span className="text-[9px] text-slate-400 block mt-0.5">{stat.note}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Split View: Left Content & Right Chart */}
          <div className={`grid gap-3 ${slide.chartConfig ? 'grid-cols-1 md:grid-cols-12' : 'grid-cols-1'}`}>
            
            {/* Left Content (Deep Analysis & Tables) */}
            <div className={`space-y-2 ${slide.chartConfig ? 'md:col-span-6' : 'w-full'}`}>
              {/* Deep Analysis Bullet Points */}
              {slide.analysisPoints && slide.analysisPoints.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/70 space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-400 font-black text-[11px] uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Kajian Strategis &amp; Fakta:</span>
                  </div>
                  <ul className="space-y-1 text-slate-200 text-[11px] leading-relaxed">
                    {slide.analysisPoints.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-1.5">
                        <span className="text-indigo-400 font-bold shrink-0">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Table Data if available */}
              {slide.tableData && slide.tableData.rows.length > 0 && (
                <div className="rounded-xl border border-slate-700/80 overflow-hidden bg-slate-950/60 max-h-[140px] overflow-y-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-indigo-950/80 text-indigo-200 uppercase font-black text-[10px] sticky top-0">
                      <tr>
                        {slide.tableData.headers.map((h, hIdx) => (
                          <th key={hIdx} className="p-1.5">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-[10px]">
                      {slide.tableData.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-800/50">
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-1.5 text-slate-200">{cell}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right Chart Canvas if chartConfig exists */}
            {slide.chartConfig && (
              <div className="md:col-span-6 h-[210px] flex items-center justify-center">
                {renderSlideChart(slide.chartConfig)}
              </div>
            )}

          </div>

          {/* Recommendation Box */}
          {slide.recommendation && (
            <div className="p-2 rounded-xl bg-indigo-950/70 border border-indigo-500/40 text-[11px] text-indigo-200 flex items-start gap-2">
              <Award className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-black text-amber-300 mr-1">Rekomendasi Tindakan:</span>
                <span>{slide.recommendation}</span>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Slide Footer */}
        <div className="border-t border-slate-800 pt-2 flex items-center justify-between text-xs text-slate-400 relative z-10 shrink-0">
          <div className="flex items-center gap-2">
            <span>KPPN Semarang I (026) • Seksi MSKI</span>
            {slide.regulationRef && (
              <span className="hidden sm:inline text-[10px] text-slate-500 font-mono truncate max-w-xs">
                | {slide.regulationRef}
              </span>
            )}
          </div>
          {onAskGeminiForTopic && (
            <button
              onClick={() => onAskGeminiForTopic(`Tolong buatkan kajian narasi mendalam, naskah pidato KPA, dan rekomendasi teknis untuk topik: ${slide.title} (${slide.subtitle}) berdasarkan regulasi perbendaharaan terbaru.`)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Perdalam Materi Ini dengan AI</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center p-2 sm:p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-7xl h-[94vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden ${
        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* Top Navigation & Control Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Presentation className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-[10px] font-black px-2 py-0.5 rounded-full mb-0.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>EXECUTIVE 50-SLIDE PPT STUDIO</span>
              </div>
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>Bank Paparan &amp; Analisis Komprehensif (50 Slide)</span>
                <span className="text-amber-400 text-xs font-mono font-bold">({periodScope})</span>
              </h3>
            </div>
          </div>

          {/* Period Scope Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['TW1', 'TW2', 'TW3', 'TW4', 'BULANAN', 'TAHUNAN'] as PeriodScope[]).map(scope => (
              <button
                key={scope}
                onClick={() => setPeriodScope(scope)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                  periodScope === scope 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {scope}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSelectedPPTX}
              disabled={isExportingPPT || selectedSlideIds.length === 0}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-black shadow-lg shadow-amber-950/40 flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-50 border border-amber-300/40"
              title="Unduh File PowerPoint (.pptx) Sesuai Slide yang Dipilih"
            >
              <Download className="w-4 h-4" />
              <span>{isExportingPPT ? 'Menyiapkan PPTX...' : `Unduh PPTX (${selectedSlideIds.length} Slide)`}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all"
              title="Cetak ke PDF"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto shrink-0 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-black uppercase text-slate-500 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>Topik:</span>
            </span>
            {[
              { key: 'ALL', label: 'Semua (50)' },
              { key: 'PEMBUKA', label: 'Pembuka' },
              { key: 'MAKRO', label: 'Makro' },
              { key: 'INDIKATOR_DETAIL', label: '8 Indikator' },
              { key: 'SATKER_RANKING', label: 'Ranking' },
              { key: 'DIAGNOSA_RISIKO', label: 'Diagnosa & Risiko' },
              { key: 'KEMENTERIAN', label: 'K/L Mitra' },
              { key: 'DIGITALISASI', label: 'Digitalisasi' },
              { key: 'REGULASI_HOT_TOPIC', label: 'Hot Topic' },
              { key: 'REKOMENDASI_AKSI', label: 'Rekomendasi' },
              { key: 'PENUTUP', label: 'Penutup' }
            ].map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategoryFilter(cat.key as SlideCategory)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategoryFilter === cat.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 shrink-0 text-[11px]">
            <button
              onClick={selectAllSlides}
              className="text-emerald-400 hover:underline font-bold cursor-pointer"
            >
              Pilih Semua (50)
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={deselectAllSlides}
              className="text-rose-400 hover:underline font-bold cursor-pointer"
            >
              Kosongkan
            </button>
          </div>
        </div>

        {/* Main Stage & Thumbnails Area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
          
          {/* Left Thumbnails Strip (Scrollable List of 50 Slides) */}
          <div className="hidden md:flex flex-col w-72 bg-slate-900/90 border-r border-slate-800 p-2 overflow-y-auto space-y-1.5 shrink-0">
            <div className="text-[10px] font-black uppercase text-slate-400 px-2 py-1 flex items-center justify-between">
              <span>Pilih Slide Paparan</span>
              <span className="text-amber-400 font-mono font-bold">
                {selectedSlideIds.length} / 50 Terpilih
              </span>
            </div>

            {displayedSlides.map((slide) => {
              const actualIdx = all50Slides.findIndex(s => s.id === slide.id);
              const isCurrent = currentSlideIndex === actualIdx;
              const isChecked = selectedSlideIds.includes(slide.id);

              return (
                <div
                  key={slide.id}
                  className={`w-full p-2 rounded-xl border transition-all flex items-center gap-2 ${
                    isCurrent 
                      ? 'bg-indigo-950/80 border-indigo-500 shadow-md scale-102' 
                      : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/80'
                  }`}
                >
                  <button
                    onClick={() => toggleSlideSelection(slide.id)}
                    className="p-1 text-slate-400 hover:text-white cursor-pointer"
                    title={isChecked ? 'Batalkan pilihan' : 'Pilih slide ini untuk diunduh'}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-600" />
                    )}
                  </button>

                  <button
                    onClick={() => setCurrentSlideIndex(actualIdx)}
                    className="flex-1 text-left flex items-center gap-2 truncate cursor-pointer"
                  >
                    <span className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center shrink-0 ${
                      isCurrent ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {slide.id}
                    </span>
                    <div className="truncate">
                      <span className={`text-[11px] block truncate ${isCurrent ? 'font-black text-white' : 'font-medium text-slate-300'}`}>
                        {slide.title}
                      </span>
                      <span className="text-[9px] text-slate-500 block truncate">
                        {slide.badge}
                      </span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Center Presentation Stage */}
          <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-5 overflow-hidden relative">
            <div className="w-full max-w-4xl aspect-[16/9] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden relative flex flex-col justify-between">
              {renderSlideStage(currentSlide)}
            </div>
          </div>
        </div>

        {/* Bottom Navigator Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300 shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Slide {currentSlide.id} dari 50:</span>
            <span className="text-slate-300 font-medium truncate max-w-xs">{currentSlide.title}</span>
            <span className="hidden sm:inline px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-400 font-mono">
              {currentSlide.badge}
            </span>
          </div>

          {/* Stepper Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
              disabled={currentSlideIndex === 0}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <button
              onClick={() => setCurrentSlideIndex(prev => Math.min(all50Slides.length - 1, prev + 1))}
              disabled={currentSlideIndex === all50Slides.length - 1}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
