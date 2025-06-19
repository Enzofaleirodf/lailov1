import React from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { SortOption } from '../types/auction';
import { MAPPINGS } from '../config/mappings';

interface MobileSortModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedSort: SortOption;
  onSortChange: (sort: SortOption) => void;
}

export const MobileSortModal: React.FC<MobileSortModalProps> = ({
  isOpen,
  onClose,
  selectedSort,
  onSortChange
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
    onSortChange(value);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl p-6 shadow-2xl z-[100000]">
        {/* Handle */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-6" />
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ChevronDown className="w-5 h-5 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Ordenar por</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Options */}
        <div className="space-y-2">
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 rounded-xl transition-colors"
            >
              <span className="text-gray-900 font-medium">{option.label}</span>
              {selectedSort === option.value && (
                <Check className="w-5 h-5 text-blue-600" />
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
