import React, { memo } from 'react';
import { Auction, ViewMode } from '../../types/auction';
import { AuctionCard } from '../AuctionCard';

interface AuctionGridProps {
  auctions: Auction[];
  viewMode: ViewMode;
}

// 🚀 PERFORMANCE BOOST: Memoizar componente para evitar re-renders desnecessários
const AuctionGrid: React.FC<AuctionGridProps> = memo(({ auctions, viewMode }) => {

  return (
    <div className={
      viewMode === 'horizontal'
        ? 'space-y-3 w-full min-h-[400px]'
        : 'grid grid-cols-1 md:grid-cols-2 gap-3 w-full min-h-[400px]'
    }>
      {auctions.map((auction, index) => (
        <AuctionCard
          key={auction._id}
          auction={auction}
          viewMode={viewMode}
          priority={index < 3} // 🚀 CRITICAL: Apenas 3 primeiras imagens com prioridade alta
        />
      ))}
    </div>
  );
});

// 🚀 PERFORMANCE: DisplayName para debugging
AuctionGrid.displayName = 'AuctionGrid';

export { AuctionGrid };