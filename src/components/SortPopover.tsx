import React from 'react';
import { Check, X, ChevronDown } from 'lucide-react';
import { SortOption } from '../types/auction';
import { MAPPINGS } from '../config/mappings';

interface SortPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSort: SortOption;
  onSortChange: (sort: SortOption) => void;
  isMobile?: boolean;
}

export const SortPopover: React.FC<SortPopoverProps> = ({
  isOpen,
  onClose,
  selectedSort,
  onSortChange,
  isMobile = false
}) => {
  if (!isOpen) {
    return null;
  }

  const sortOptions = [
    { value: 'newest' as SortOption, label: MAPPINGS.SORT_LABELS.newest },
    { value: 'lowest-bid' as SortOption, label: MAPPINGS.SORT_LABELS['lowest-bid'] },
    { value: 'highest-bid' as SortOption, label: MAPPINGS.SORT_LABELS['highest-bid'] },
    { value: 'highest-discount' as SortOption, label: MAPPINGS.SORT_LABELS['highest-discount'] },
    { value: 'nearest' as SortOption, label: MAPPINGS.SORT_LABELS.nearest },
  ];

  const handleSelect = (value: SortOption) => {
    try {
      onSortChange(value);
    } catch (error) {
      console.error('Erro ao alterar ordenação:', error);
    }
  };

  // DESKTOP VERSION ONLY - Mobile agora usa MobileSortModal
  return (
    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50 overflow-hidden">
      <div className="py-1">
        {sortOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className="w-full flex items-center justify-between px-3 py-2.5 text-left hover:bg-gray-50 transition-colors"
          >
            <span className={`text-sm ${selectedSort === option.value ? 'text-blue-600 font-medium' : 'text-gray-900'}`}>
              {option.label}
            </span>
            {selectedSort === option.value && (
              <Check className="w-4 h-4 text-blue-600" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};