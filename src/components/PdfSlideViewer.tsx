import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { AlertTriangle, Loader2, FileText, ExternalLink } from 'lucide-react';

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
  onTotalPagesLoaded?: (totalPages: number) => void;
  className?: string;
}

export const PdfSlideViewer: React.FC<PdfSlideViewerProps> = ({
  url,
  currentPage,
  zoomLevel,
  onTotalPagesLoaded,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [renderTask, setRenderTask] = useState<any>(null);

  // Load PDF Document when url changes
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
        let sourceOptions: { data?: Uint8Array; url?: string; cMapUrl?: string; cMapPacked?: boolean };

        // 1. Data URL (Base64 PDF)
        if (url.startsWith('data:application/pdf;base64,') || url.startsWith('data:application/pdf;')) {
          const commaIdx = url.indexOf(',');
          const base64Data = commaIdx !== -1 ? url.slice(commaIdx + 1) : url;
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
            url: url.trim(),
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
          setError(err?.message || 'Gagal memuat dokumen PDF untuk Slide Show.');
          setIsLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [url]);

  // Render specific page onto canvas when pdfDoc, currentPage, or zoomLevel changes
  useEffect(() => {
    let cancelRender = false;

    const renderPage = async () => {
      if (!pdfDoc || !canvasRef.current || !containerRef.current) return;

      const pageNum = Math.min(Math.max(1, currentPage), pdfDoc.numPages || 1);

      try {
        // Cancel existing render task if in progress
        if (renderTask) {
          try {
            renderTask.cancel();
          } catch {
            // ignore cancel
          }
        }

        const page = await pdfDoc.getPage(pageNum);
        if (cancelRender) return;

        const canvas = canvasRef.current;
        const container = containerRef.current;
        const context = canvas.getContext('2d');
        if (!context) return;

        // Determine optimal scale to fit container width & height
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const containerWidth = container.clientWidth || 900;
        const containerHeight = container.clientHeight || 600;

        const scaleX = (containerWidth - 32) / unscaledViewport.width;
        const scaleY = (containerHeight - 32) / unscaledViewport.height;
        const baseScale = Math.min(scaleX, scaleY, 2.5);
        const finalScale = (baseScale > 0.1 ? baseScale : 1.0) * (zoomLevel / 100);

        const dpr = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale: finalScale * dpr });

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / dpr}px`;
        canvas.style.height = `${viewport.height / dpr}px`;

        const newRenderTask = page.render({
          canvasContext: context,
          viewport: viewport,
          intent: 'display'
        });

        setRenderTask(newRenderTask);
        await newRenderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error('Error rendering PDF page:', err);
        }
      }
    };

    renderPage();

    return () => {
      cancelRender = true;
      if (renderTask) {
        try {
          renderTask.cancel();
        } catch {
          // ignore
        }
      }
    };
  }, [pdfDoc, currentPage, zoomLevel]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-300 bg-slate-950 space-y-4">
        <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-1 max-w-md">
          <h4 className="text-sm font-extrabold text-white">Pratinjau Dokumen Slide</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Menampilkan pratinjau langsung melalui browser preview frame.
          </p>
        </div>
        {/* Fallback iframe */}
        {url && (
          <iframe
            src={url}
            title="PDF Fallback"
            className="w-full h-96 rounded-xl border border-slate-800 bg-slate-900"
          />
        )}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center overflow-auto bg-slate-950 p-4 ${className}`}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs space-y-2">
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
          <span className="text-xs font-bold text-slate-300">Menyiapkan Slide PDF Halaman {currentPage}...</span>
        </div>
      )}

      <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white max-w-full max-h-full flex items-center justify-center">
        <canvas ref={canvasRef} className="block select-none" />
      </div>
    </div>
  );
};
