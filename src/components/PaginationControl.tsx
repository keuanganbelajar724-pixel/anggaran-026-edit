import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight 
} from 'lucide-react';

export interface PaginationControlProps {
  currentPage: number;
  totalItems?: number;
  pageSize?: number;
  totalPages?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  isDark?: boolean;
  className?: string;
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage = 1,
  totalItems,
  pageSize = 10,
  totalPages: totalPagesProp,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100, -1],
  itemLabel = 'Data',
  isDark = false,
  className = ''
}) => {
  // Safe number extraction
  const safePageSize = typeof pageSize === 'number' && !isNaN(pageSize) && pageSize !== 0 ? pageSize : 10;
  
  // Resolve effective total items
  let effectiveTotalItems = 0;
  if (typeof totalItems === 'number' && !isNaN(totalItems)) {
    effectiveTotalItems = totalItems;
  } else if (typeof totalPagesProp === 'number' && !isNaN(totalPagesProp) && totalPagesProp > 0) {
    effectiveTotalItems = totalPagesProp * Math.abs(safePageSize);
  }

  // If no items and no pages, don't show pagination controls
  if (effectiveTotalItems === 0 && (!totalPagesProp || totalPagesProp <= 0)) return null;

  const effectivePageSize = safePageSize <= 0 ? Math.max(1, effectiveTotalItems) : safePageSize;
  const resolvedTotalPages = typeof totalPagesProp === 'number' && !isNaN(totalPagesProp) && totalPagesProp > 0
    ? totalPagesProp
    : Math.max(1, Math.ceil(effectiveTotalItems / effectivePageSize));

  const safeCurrentPage = typeof currentPage === 'number' && !isNaN(currentPage) ? currentPage : 1;
  const validCurrentPage = Math.min(Math.max(1, safeCurrentPage), resolvedTotalPages);

  const startItem = effectiveTotalItems > 0 ? (validCurrentPage - 1) * effectivePageSize + 1 : 1;
  const endItem = effectiveTotalItems > 0 ? Math.min(validCurrentPage * effectivePageSize, effectiveTotalItems) : resolvedTotalPages;

  // Generate visible page numbers
  const getPageNumbers = () => {
    if (resolvedTotalPages <= 7) {
      return Array.from({ length: resolvedTotalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    if (validCurrentPage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', resolvedTotalPages);
    } else if (validCurrentPage >= resolvedTotalPages - 3) {
      pages.push(1, '...', resolvedTotalPages - 4, resolvedTotalPages - 3, resolvedTotalPages - 2, resolvedTotalPages - 1, resolvedTotalPages);
    } else {
      pages.push(1, '...', validCurrentPage - 1, validCurrentPage, validCurrentPage + 1, '...', resolvedTotalPages);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      className={`px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
        isDark
          ? 'bg-slate-900/90 border-slate-800 text-slate-300'
          : 'bg-slate-50/90 border-slate-200 text-slate-700'
      } ${className}`}
    >
      {/* Range & Total Info */}
      <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
        {effectiveTotalItems > 0 && typeof totalItems === 'number' ? (
          <span>
            Menampilkan <strong className={isDark ? 'text-white' : 'text-slate-900'}>{startItem}</strong> -{' '}
            <strong className={isDark ? 'text-white' : 'text-slate-900'}>{endItem}</strong> dari total{' '}
            <strong className={isDark ? 'text-amber-400' : 'text-amber-600'}>{effectiveTotalItems}</strong> {itemLabel}
          </span>
        ) : (
          <span>
            Halaman <strong className={isDark ? 'text-white' : 'text-slate-900'}>{validCurrentPage}</strong> dari{' '}
            <strong className={isDark ? 'text-amber-400' : 'text-amber-600'}>{resolvedTotalPages}</strong>
          </span>
        )}
      </div>

      {/* Controls Container */}
      <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto">
        {/* Page Size Selector */}
        {Boolean(onPageSizeChange && pageSizeOptions && pageSizeOptions.length > 0) && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400 font-semibold hidden md:inline">Tampilkan:</span>
            <select
              value={safePageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                if (typeof onPageSizeChange === 'function') {
                  onPageSizeChange(newSize);
                }
                if (typeof onPageChange === 'function') {
                  onPageChange(1);
                }
              }}
              className={`px-2 py-1 rounded-lg border text-xs font-bold focus:outline-none cursor-pointer ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-800'
              }`}
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt === -1 ? `Semua (${effectiveTotalItems})` : `${opt} ${itemLabel}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page Nav Buttons (if multiple pages) */}
        {resolvedTotalPages > 1 && (
          <div className="flex items-center gap-1">
            {/* First Page */}
            <button
              onClick={() => onPageChange(1)}
              disabled={validCurrentPage === 1}
              className={`p-1.5 rounded-lg border transition-all ${
                validCurrentPage === 1
                  ? 'opacity-30 cursor-not-allowed border-transparent'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white cursor-pointer'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 cursor-pointer'
              }`}
              title="Halaman Pertama"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => onPageChange(Math.max(1, validCurrentPage - 1))}
              disabled={validCurrentPage === 1}
              className={`p-1.5 rounded-lg border transition-all ${
                validCurrentPage === 1
                  ? 'opacity-30 cursor-not-allowed border-transparent'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white cursor-pointer'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 cursor-pointer'
              }`}
              title="Halaman Sebelumnya"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Numbered Page Buttons */}
            <div className="hidden sm:flex items-center gap-1">
              {pages.map((p, idx) => {
                if (p === '...') {
                  return (
                    <span key={`dots-${idx}`} className="px-1.5 text-slate-400 font-bold">
                      ...
                    </span>
                  );
                }
                const pageNum = p as number;
                const isActive = pageNum === validCurrentPage;
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`min-w-[28px] h-7 px-1.5 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                        : isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            {/* Mobile simplified page text */}
            <span className="sm:hidden px-2 py-1 font-bold text-xs">
              {validCurrentPage} / {resolvedTotalPages}
            </span>

            {/* Next Page */}
            <button
              onClick={() => onPageChange(Math.min(resolvedTotalPages, validCurrentPage + 1))}
              disabled={validCurrentPage === resolvedTotalPages}
              className={`p-1.5 rounded-lg border transition-all ${
                validCurrentPage === resolvedTotalPages
                  ? 'opacity-30 cursor-not-allowed border-transparent'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white cursor-pointer'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 cursor-pointer'
              }`}
              title="Halaman Selanjutnya"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => onPageChange(resolvedTotalPages)}
              disabled={validCurrentPage === resolvedTotalPages}
              className={`p-1.5 rounded-lg border transition-all ${
                validCurrentPage === resolvedTotalPages
                  ? 'opacity-30 cursor-not-allowed border-transparent'
                  : isDark
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white cursor-pointer'
                  : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 cursor-pointer'
              }`}
              title="Halaman Terakhir"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
