import React, { memo, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

// 🚀 PERFORMANCE: Memoizar componente para evitar re-renders desnecessários
export const Pagination: React.FC<PaginationProps> = memo(({
  currentPage,
  totalPages,
  onPageChange,
  className = ''
}) => {
  // 🛡️ CORREÇÃO: Verificação defensiva para evitar erro #130
  if (typeof currentPage !== 'number' || typeof totalPages !== 'number' || 
      currentPage < 1 || totalPages < 1 || !onPageChange) {
    return null;
  }

  if (totalPages <= 1) {
    return null;
  }

  // 🚀 PERFORMANCE: Memoizar cálculo de páginas visíveis
  const visiblePages = useMemo(() => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  }, [currentPage, totalPages]); // 🔥 DEPENDÊNCIAS: currentPage, totalPages

  // 🚀 PERFORMANCE: Memoizar handlers para evitar re-renders
  const handlePageClick = useCallback((page: number | string) => {
    if (typeof page === 'number' && page !== currentPage && page >= 1 && page <= totalPages) {
      try {
        onPageChange(page);
      } catch (error) {
        console.error('Erro ao mudar página:', error);
      }
    }
  }, [currentPage, totalPages, onPageChange]); // 🔥 DEPENDÊNCIAS: currentPage, totalPages, onPageChange

  const handlePrevious = useCallback(() => {
    if (currentPage > 1) {
      handlePageClick(currentPage - 1);
    }
  }, [currentPage, handlePageClick]); // 🔥 DEPENDÊNCIAS: currentPage, handlePageClick

  const handleNext = useCallback(() => {
    if (currentPage < totalPages) {
      handlePageClick(currentPage + 1);
    }
  }, [currentPage, totalPages, handlePageClick]); // 🔥 DEPENDÊNCIAS: currentPage, totalPages, handlePageClick

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200 ${
          currentPage === 1
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-95'
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-1">
        {visiblePages.map((page, index) => {
          if (page === '...') {
            return (
              <div
                key={`dots-${index}`}
                className="flex items-center justify-center w-10 h-10 text-gray-400"
              >
                <MoreHorizontal className="w-4 h-4" />
              </div>
            );
          }

          const pageNumber = page as number;
          const isActive = pageNumber === currentPage;

          return (
            <button
              key={pageNumber}
              onClick={() => handlePageClick(pageNumber)}
              className={`flex items-center justify-center w-10 h-10 rounded-xl font-semibold transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'bg-auction-600 text-white shadow-sm'
                  : 'border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              {pageNumber}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200 ${
          currentPage === totalPages
            ? 'border-gray-200 text-gray-400 cursor-not-allowed'
            : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 active:scale-95'
        }`}
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
});

// 🚀 PERFORMANCE: DisplayName para debugging
Pagination.displayName = 'Pagination';