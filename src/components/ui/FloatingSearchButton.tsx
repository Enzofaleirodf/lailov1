import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { LABEL_CONFIG } from '../../config/constants';

interface FloatingSearchButtonProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
}

export const FloatingSearchButton: React.FC<FloatingSearchButtonProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    if (isExpanded && searchQuery) {
      onSearchChange('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit(e);
    // ✅ CORREÇÃO: Não fechar automaticamente, deixar o usuário decidir
    // setIsExpanded(false);
  };

  return (
    <div className="hidden min-[768px]:block fixed bottom-6 right-6 z-50">
      {isExpanded ? (
        // Expanded search form
        <div className="bg-white rounded-full shadow-lg border border-gray-200 p-2 flex items-center gap-2 min-w-[300px]">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 w-full">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Pesquisar palavra-chave"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={handleToggle}
              className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        // Collapsed search button
        <button
          onClick={handleToggle}
          className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-colors"
        >
          <Search className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
