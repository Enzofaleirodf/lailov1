import React, { memo, useMemo, Suspense } from 'react';
import { Auction, ViewMode } from '../../types/auction';
import { AuctionGrid } from './AuctionGrid';
import { LazyVirtualizedAuctionGrid, LazyGridWrapper } from '../lazy/LazyComponents';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useShouldVirtualize } from '../../hooks/useInfiniteAuctionsQuery';

interface SmartAuctionGridProps {
  auctions: Auction[];
  viewMode: ViewMode;

  // Para infinite scroll (opcional)
  onLoadMore?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;

  // Configurações de virtualização
  virtualizationThreshold?: number; // Padrão: 50 itens
  forceVirtualization?: boolean;
  disableVirtualization?: boolean;

  // 🚀 NOVO: Modo de paginação
  paginationMode?: 'traditional' | 'infinite'; // Padrão: traditional
}

// 🚀 COMPONENTE INTELIGENTE QUE ESCOLHE A MELHOR ESTRATÉGIA
const SmartAuctionGrid: React.FC<SmartAuctionGridProps> = memo(({
  auctions,
  viewMode,
  onLoadMore,
  hasNextPage = false,
  isFetchingNextPage = false,
  virtualizationThreshold = 50,
  forceVirtualization = false,
  disableVirtualization = false,
  paginationMode = 'traditional' // 🚀 PADRÃO: Paginação tradicional
}) => {
  
  // 🚀 DECIDIR SE DEVE VIRTUALIZAR (SIMPLES)
  const shouldVirtualize = auctions.length > virtualizationThreshold;
  const useVirtualization = useMemo(() => {
    // 🚀 NUNCA virtualizar em modo de paginação tradicional
    if (paginationMode === 'traditional') return false;

    if (disableVirtualization) return false;
    if (forceVirtualization) return true;
    return shouldVirtualize;
  }, [shouldVirtualize, forceVirtualization, disableVirtualization, paginationMode]);



  // 🚀 RENDERIZAR COMPONENTE APROPRIADO COM LAZY LOADING
  if (useVirtualization) {
    return (
      <div className="w-full">
        {/* 🚀 GRID VIRTUALIZADO LAZY PARA PERFORMANCE */}
        <LazyGridWrapper
          fallback={
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <LoadingSpinner size="md" />
                <p className="mt-3 text-sm text-gray-500">Carregando grid otimizado...</p>
              </div>
            </div>
          }
        >
          <LazyVirtualizedAuctionGrid
            auctions={auctions}
            viewMode={viewMode}
            onLoadMore={onLoadMore}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
          />
        </LazyGridWrapper>


      </div>
    );
  }

  // 🚀 GRID NORMAL PARA LISTAS PEQUENAS
  return (
    <div className="w-full">
      <AuctionGrid
        auctions={auctions}
        viewMode={viewMode}
      />
      
      {/* 🚀 INFINITE SCROLL MANUAL PARA GRID NORMAL */}
      {onLoadMore && hasNextPage && (
        <div className="mt-6 text-center">
          <button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            className="px-6 py-3 bg-auction-600 text-white font-medium rounded-xl hover:bg-auction-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isFetchingNextPage ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Carregando...
              </div>
            ) : (
              'Carregar Mais Leilões'
            )}
          </button>
        </div>
      )}
      

    </div>
  );
});

// 🚀 PERFORMANCE: DisplayName para debugging
SmartAuctionGrid.displayName = 'SmartAuctionGrid';

export { SmartAuctionGrid };
