import React, { memo, useMemo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Auction, ViewMode } from '../../types/auction';
import { AuctionCard } from '../AuctionCard';

interface VirtualizedAuctionGridProps {
  auctions: Auction[];
  viewMode: ViewMode;
  onLoadMore?: () => void; // Para infinite scroll
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

// 🚀 CONFIGURAÇÕES DE VIRTUALIZAÇÃO
const VIRTUALIZATION_CONFIG = {
  // Altura estimada dos itens
  estimateSize: (viewMode: ViewMode) => viewMode === 'horizontal' ? 120 : 280,
  
  // Overscan: quantos itens renderizar fora da viewport
  overscan: 5,
  
  // Gap entre itens
  gap: 12,
  
  // Colunas por viewport
  getColumns: (viewMode: ViewMode, containerWidth: number) => {
    if (viewMode === 'horizontal') return 1;
    
    // Grid responsivo para modo vertical
    if (containerWidth >= 1024) return 3; // lg: 3 colunas
    if (containerWidth >= 768) return 2;  // md: 2 colunas
    return 1; // sm: 1 coluna
  }
};

// 🚀 COMPONENTE VIRTUALIZADO BRUTAL
const VirtualizedAuctionGrid: React.FC<VirtualizedAuctionGridProps> = memo(({
  auctions,
  viewMode,
  onLoadMore,
  hasNextPage = false,
  isFetchingNextPage = false
}) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);

  // 🚀 DETECTAR LARGURA DO CONTAINER PARA GRID RESPONSIVO
  useEffect(() => {
    const updateWidth = () => {
      if (parentRef.current) {
        setContainerWidth(parentRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // 🚀 CALCULAR CONFIGURAÇÕES DINÂMICAS
  const columns = VIRTUALIZATION_CONFIG.getColumns(viewMode, containerWidth);
  const itemHeight = VIRTUALIZATION_CONFIG.estimateSize(viewMode);
  
  // 🚀 ORGANIZAR ITENS EM ROWS PARA GRID
  const rows = useMemo(() => {
    if (viewMode === 'horizontal') {
      // Modo horizontal: 1 item por row
      return auctions.map((auction, index) => ({
        items: [auction],
        index
      }));
    } else {
      // Modo vertical: múltiplas colunas por row
      const rows = [];
      for (let i = 0; i < auctions.length; i += columns) {
        rows.push({
          items: auctions.slice(i, i + columns),
          index: Math.floor(i / columns)
        });
      }
      return rows;
    }
  }, [auctions, columns, viewMode]);

  // 🚀 CONFIGURAR VIRTUALIZER
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: VIRTUALIZATION_CONFIG.overscan,
    gap: VIRTUALIZATION_CONFIG.gap,
  });

  // 🚀 PRELOAD INTELIGENTE: Apenas itens visíveis + overscan
  const visibleItems = virtualizer.getVirtualItems();
  const visibleAuctions = useMemo(() => {
    return visibleItems.flatMap(virtualItem => 
      rows[virtualItem.index]?.items || []
    );
  }, [visibleItems, rows]);

  // 🚀 PRELOAD REMOVIDO: Simplificação para evitar loops

  // 🚀 INFINITE SCROLL: Detectar quando chegou no final
  useEffect(() => {
    if (!onLoadMore || !hasNextPage || isFetchingNextPage) return;

    const lastItem = visibleItems[visibleItems.length - 1];
    if (!lastItem) return;

    // Se está renderizando os últimos 3 itens, carregar mais
    if (lastItem.index >= rows.length - 3) {
      onLoadMore();
    }
  }, [visibleItems, rows.length, onLoadMore, hasNextPage, isFetchingNextPage]);

  // 🚀 SCROLL TO TOP QUANDO MUDAR PÁGINA
  React.useEffect(() => {
    if (parentRef.current) {
      parentRef.current.scrollTop = 0;
    }
  }, [auctions.length]); // Reset scroll quando lista mudar

  // 🚀 RENDER OTIMIZADO COM ALTURA RESPONSIVA
  return (
    <div
      ref={parentRef}
      className="w-full overflow-auto" // Remover altura fixa
      style={{
        contain: 'strict', // Otimização de performance
        height: 'calc(100vh - 200px)', // Altura responsiva baseada na viewport
        minHeight: '400px', // Altura mínima
        maxHeight: '800px', // Altura máxima
      }}
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {visibleItems.map((virtualItem) => {
          const row = rows[virtualItem.index];
          if (!row) return null;

          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {viewMode === 'horizontal' ? (
                // 🚀 MODO HORIZONTAL: 1 item por row
                <div className="w-full px-3">
                  <AuctionCard
                    auction={row.items[0]}
                    viewMode="horizontal"
                    priority={virtualItem.index < 3} // Prioridade para primeiros 3
                  />
                </div>
              ) : (
                // 🚀 MODO VERTICAL: Grid responsivo
                <div 
                  className="grid gap-3 px-3"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, 1fr)`
                  }}
                >
                  {row.items.map((auction, itemIndex) => (
                    <AuctionCard
                      key={auction._id}
                      auction={auction}
                      viewMode="vertical"
                      priority={virtualItem.index === 0 && itemIndex < 3} // Prioridade para primeira row
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* 🚀 LOADING INDICATOR PARA INFINITE SCROLL */}
        {isFetchingNextPage && (
          <div
            style={{
              position: 'absolute',
              top: virtualizer.getTotalSize(),
              left: 0,
              width: '100%',
              height: '60px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div className="flex items-center gap-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm">Carregando mais leilões...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

// 🚀 PERFORMANCE: DisplayName para debugging
VirtualizedAuctionGrid.displayName = 'VirtualizedAuctionGrid';

export { VirtualizedAuctionGrid };
