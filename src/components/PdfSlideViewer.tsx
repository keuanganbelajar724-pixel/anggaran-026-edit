import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, FileText, AlertTriangle, RefreshCw, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

// Configure pdfjs worker to match the exact installed pdfjs-dist version
if (typeof window !== 'undefined') {
  try {
    const version = pdfjsLib.version || '6.2.108';
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('PDF.js worker initialization notice:', err);
  }
}

interface PdfSlideViewerProps {
  url?: string;
  currentPage: number;
  zoomLevel: number; // e.g. 100 = 100%
  rotation?: number; // 0, 90, 180, 270
  fitMode?: 'page' | 'width';
  onTotalPagesLoaded?: (totalPages: number) => void;
  onPageChange?: (page: number) => void;
  className?: string;
}

export const PdfSlideViewer: React.FC<PdfSlideViewerProps> = ({
  url,
  currentPage,
  zoomLevel,
  rotation = 0,
  fitMode = 'page',
  onTotalPagesLoaded,
  onPageChange,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({ width: 1200, height: 800 });
  const renderTaskRef = useRef<any>(null);

  // Resize Observer on container for crisp responsive scaling
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
          setContainerSize({
            width: entry.contentRect.width,
            height: entry.contentRect.height
          });
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Helper to extract or resolve URL if Google Drive
  const resolvePdfSource = (rawUrl: string): string => {
    if (!rawUrl) return '';
    const trimmed = rawUrl.trim();
    // If it's a Google Drive URL, try direct download / uc link or standard preview
    if (trimmed.includes('drive.google.com/file/d/')) {
      const match = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        // Direct streamable Google Drive view
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
      }
    }
    return trimmed;
  };

  // Load PDF Document when URL changes
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    setPdfDoc(null);

    if (!url || typeof url !== 'string' || url.trim() === '') {
      setIsLoading(false);
      setError('URL dokumen PDF tidak ditemukan atau kosong.');
      return;
    }

    const loadPdf = async () => {
      try {
        const resolvedUrl = resolvePdfSource(url);
        let sourceOptions: { data?: Uint8Array; url?: string; cMapUrl?: string; cMapPacked?: boolean };

        // 1. Data URL (Base64 PDF)
        if (resolvedUrl.startsWith('data:application/pdf;base64,') || resolvedUrl.startsWith('data:application/pdf;')) {
          const commaIdx = resolvedUrl.indexOf(',');
          const base64Data = commaIdx !== -1 ? resolvedUrl.slice(commaIdx + 1) : resolvedUrl;
          const binaryString = atob(base64Data);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          sourceOptions = { 
            data: bytes,
            cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '6.2.108'}/cmaps/`,
            cMapPacked: true
          };
        } else {
          // 2. HTTP/HTTPS or Blob URL
          sourceOptions = { 
            url: resolvedUrl,
            cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version || '6.2.108'}/cmaps/`,
            cMapPacked: true
          };
        }

        const loadingTask = pdfjsLib.getDocument(sourceOptions);
        const loadedDoc = await loadingTask.promise;

        if (isMounted) {
          setPdfDoc(loadedDoc);
          setIsLoading(false);
          if (onTotalPagesLoaded && loadedDoc.numPages) {
            onTotalPagesLoaded(loadedDoc.numPages);
          }
        }
      } catch (err: any) {
        console.error('Error loading PDF in PdfSlideViewer:', err);
        if (isMounted) {
          setError(err?.message || 'Gagal memuat dokumen PDF. Pastikan URL atau file PDF valid.');
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [url]);

  // Render specific page onto canvas with high-DPI crisp rendering
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

    const pageNum = Math.min(Math.max(1, currentPage), pdfDoc.numPages || 1);

    try {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }

      setIsRendering(true);
      const page = await pdfDoc.getPage(pageNum);

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) {
        setIsRendering(false);
        return;
      }

      // Calculate viewport rotation (Firefox PDF standard: 0, 90, 180, 270)
      const effectiveRotation = (rotation % 360 + 360) % 360;
      const unscaledViewport = page.getViewport({ scale: 1.0, rotation: effectiveRotation });

      const containerWidth = Math.max(containerSize.width, 300);
      const containerHeight = Math.max(containerSize.height, 300);

      // Fit calculation
      let baseScale = 1.0;
      if (fitMode === 'width') {
        baseScale = (containerWidth - 32) / unscaledViewport.width;
      } else {
        // Fit whole page (standard presentation mode)
        const scaleX = (containerWidth - 40) / unscaledViewport.width;
        const scaleY = (containerHeight - 40) / unscaledViewport.height;
        baseScale = Math.min(scaleX, scaleY);
      }

      if (baseScale <= 0 || isNaN(baseScale)) baseScale = 1.0;

      // Apply zoom multiplier
      const finalScale = baseScale * (zoomLevel / 100);

      // High DPI retina scaling for razor-sharp text
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      const viewport = page.getViewport({ scale: finalScale * dpr, rotation: effectiveRotation });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      // Fill white background first
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const renderTask = page.render({
        canvasContext: context,
        viewport: viewport,
        intent: 'display'
      });

      renderTaskRef.current = renderTask;
      await renderTask.promise;
      setIsRendering(false);
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error rendering PDF page in presentation mode:', err);
      }
      setIsRendering(false);
    }
  }, [pdfDoc, currentPage, zoomLevel, rotation, fitMode, containerSize]);

  useEffect(() => {
    renderPage();

    return () => {
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [renderPage]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-300 bg-slate-950 space-y-4">
        <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-md">
          <h4 className="text-sm font-extrabold text-white">Pratinjau Dokumen Slide</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Menampilkan slide dokumen melalui embed preview.
          </p>
        </div>
        {url && (
          <iframe
            src={url}
            title="Dokumen Slide"
            className="w-full h-[75vh] rounded-xl border border-slate-800 bg-slate-900 shadow-2xl"
            allowFullScreen
          />
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-auto bg-black p-2 sm:p-4 ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-xs space-y-3">
          <Loader2 className="w-9 h-9 text-indigo-400 animate-spin" />
          <div className="text-center">
            <p className="text-xs font-black text-white">Memuat Dokumen Slide Presentation...</p>
            <p className="text-[11px] text-slate-400">Menyiapkan mode presentasi PDF resolusi tinggi</p>
          </div>
        </div>
      )}

      {/* Slide Canvas Wrapper with smooth shadow */}
      <div 
        className="relative shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-md overflow-hidden bg-white max-w-full max-h-full flex items-center justify-center transition-all"
        style={{
          boxShadow: '0 10px 40px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)'
        }}
      >
        <canvas ref={canvasRef} className="block select-none" />
      </div>
    </div>
  );
};
