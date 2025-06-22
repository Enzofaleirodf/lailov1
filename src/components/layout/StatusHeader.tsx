import React, { memo, useCallback, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
import { SortOption } from '../../types/auction';
import { SortPopover } from '../SortPopover';
import { Switch } from '../ui/Switch';
import { MAPPINGS } from '../../config/mappings';

interface StatusHeaderProps {
  totalAuctions: number;
  newAuctions: number;
  sortOption: SortOption;
  showSortPopover: boolean;
  showExpiredAuctions: boolean; // ✅ NOVO: Estado dos leilões encerrados
  onSortToggle: () => void;
  onSortChange: (sort: SortOption) => void;
  onSortClose: () => void;
  onExpiredToggle: (show: boolean) => void; // ✅ NOVO: Toggle leilões encerrados
}

// 🚀 PERFORMANCE: Memoizar componente para evitar re-renders desnecessários
export const StatusHeader: React.FC<StatusHeaderProps> = memo(({
  totalAuctions,
  newAuctions,
  sortOption,
  showSortPopover,
  showExpiredAuctions,
  onSortToggle,
  onSortChange,
  onSortClose,
  onExpiredToggle
}) => {
  // 🚀 PERFORMANCE: Memoizar função de label
  const getSortLabel = useCallback((sort: SortOption) => {
    return MAPPINGS.SORT_LABELS[sort];
  }, []); // 🔥 DEPENDÊNCIAS: Vazio pois MAPPINGS é constante

  // 🚀 PERFORMANCE: Memoizar texto de status
  const statusText = useMemo(() => (
    <>
      <span className="font-medium">Encontramos</span> <span className="font-semibold text-auction-600">{totalAuctions}</span> <span className="font-medium">leilões</span>
      {newAuctions > 0 && (
        <> <span className="font-medium">•</span> <span className="font-semibold text-auction-600">{newAuctions}</span> <span className="font-medium">novos hoje</span></>
      )}
    </>
  ), [totalAuctions, newAuctions]); // 🔥 DEPENDÊNCIAS: totalAuctions, newAuctions

  return (
    <div className="flex flex-col min-[768px]:flex-row min-[768px]:items-center min-[768px]:justify-between py-4 gap-3 w-full">
      {/* Mobile Layout: Status + Toggle */}
      <div className="min-[768px]:hidden flex items-center justify-between gap-3 w-full min-w-0">
        <div className="min-w-0 flex-1">
          <p className="text-gray-600 text-sm break-words">
            {statusText}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs max-[399px]:text-[11px] text-gray-600 whitespace-nowrap">Encerrados</span>
          <Switch
            checked={showExpiredAuctions}
            onCheckedChange={onExpiredToggle}
            size="sm"
            className="max-[399px]:w-7 max-[399px]:h-3.5"
          />
        </div>
      </div>

      {/* Desktop Layout: Status only */}
      <div className="hidden min-[768px]:block min-w-0 flex-1">
        <p className="text-gray-600 text-sm break-words">
          {statusText}
        </p>
      </div>

      {/* Desktop Sort Control Only (768px+) */}
      <div className="hidden min-[768px]:flex items-center gap-3 flex-shrink-0">
        {/* Expired Toggle for Desktop */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">Encerrados</span>
          <Switch
            checked={showExpiredAuctions}
            onCheckedChange={onExpiredToggle}
            size="sm"
          />
        </div>

        <div className="relative" data-sort-container>
          <button
            onClick={onSortToggle}
            className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap w-36"
          >
            <span className="text-left">{getSortLabel(sortOption)}</span>
            <ChevronDown className="w-4 h-4 flex-shrink-0" />
          </button>

          {/* Desktop Sort Popover - Only show on desktop when popover is open */}
          <SortPopover
            isOpen={showSortPopover}
            onClose={onSortClose}
            selectedSort={sortOption}
            onSortChange={onSortChange}
            isMobile={false}
          />
        </div>
      </div>
    </div>
  );
});

// 🚀 PERFORMANCE: DisplayName para debugging
StatusHeader.displayName = 'StatusHeader';