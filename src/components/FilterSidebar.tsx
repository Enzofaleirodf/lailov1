import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Category } from '../types/auction';
import { ImoveisFilters } from './filters/ImoveisFilters';
import { VeiculosFilters } from './filters/VeiculosFilters';
import { FilterTags } from './filters/FilterTags'; // ✅ NOVO: Tags de filtros
import { Switch } from './ui/Switch'; // ✅ NOVO: Switch para leilões expirados
import { useAppContext } from '../contexts/AppContext';
import { useFilterCount } from '../hooks/useFilterCount'; // ✅ CONTAGEM DINÂMICA
import { formatFilterCount } from '../utils/formatFilterCount'; // ✅ FORMATAÇÃO
import { UI_CONFIG } from '../config/constants';

interface FilterSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
  category: Category;
  currentVehicleType?: string;
  currentPropertyType?: string; // ✅ NOVO: Para imóveis
}

export const FilterSidebar: React.FC<FilterSidebarProps> = ({
  isOpen = true,
  onClose,
  isMobile = false,
  category,
  currentVehicleType = 'todos',
  currentPropertyType = 'todos' // ✅ NOVO: Para imóveis
}) => {
  const { state, actions } = useAppContext();
  const [isApplying, setIsApplying] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // ✅ NOVO: Salvar estado inicial dos filtros quando abrir o modal
  const [initialFilters, setInitialFilters] = useState(() => {
    return category === 'imoveis'
      ? { ...state.stagedFilters.imoveis }
      : { ...state.stagedFilters.veiculos };
  });

  // ✅ NOVO: Atualizar filtros iniciais quando o modal abrir
  useEffect(() => {
    if (isOpen && isMobile) {
      setInitialFilters(
        category === 'imoveis'
          ? { ...state.stagedFilters.imoveis }
          : { ...state.stagedFilters.veiculos }
      );
    }
  }, [isOpen, isMobile, category, state.stagedFilters]);

  // ✅ CONTAGEM DINÂMICA: Buscar quantos leilões serão mostrados com os filtros atuais
  const stagedFilters = category === 'imoveis' ? state.stagedFilters.imoveis : state.stagedFilters.veiculos;
  const currentType = category === 'imoveis' ? currentPropertyType : currentVehicleType;

  // ✅ NOVO: Função para resetar filtros e voltar ao topo
  const handleModalClose = () => {
    if (isMobile) {
      // Resetar filtros para o estado inicial
      if (category === 'imoveis') {
        actions.setStagedImoveisFilters(initialFilters);
      } else {
        actions.setStagedVeiculosFilters(initialFilters);
      }

      // Scroll para o topo do modal
      const modalContent = document.querySelector('[data-filter-modal-content]');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }

    onClose?.();
  };
  const { count, loading: countLoading, hasUserFilters } = useFilterCount(
    category,
    currentType,
    stagedFilters,
    state.searchQuery,
    state.showExpiredAuctions // ✅ NOVO: Passar estado de leilões expirados
  );

  // ✅ CORREÇÃO: Remover de appliedFilters E aplicar imediatamente
  const handleRemoveFilter = (filterKey: string, value?: string) => {
    if (category === 'imoveis') {
      actions.removeImoveisFilter(filterKey as keyof typeof stagedFilters, value);
    } else {
      actions.removeVeiculosFilter(filterKey as keyof typeof stagedFilters, value);
    }
  };

  const handleClearSearch = () => {
    actions.setSearchQuery('');
  };

  if (!category) {
    return null;
  }

  const handleApplyFilters = async () => {
    setIsApplying(true);
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      if (category === 'imoveis') {
        actions.applyImoveisFilters();
      } else {
        actions.applyVeiculosFilters();
      }
    } catch (error) {
      console.error('Erro ao aplicar filtros:', error);
    }
    
    setIsApplying(false);
    
    if (isMobile && onClose) {
      onClose();
    }
  };

  const handleClearFilters = async () => {
    setIsClearing(true);
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      if (category === 'imoveis') {
        actions.clearImoveisFilters();
      } else {
        actions.clearVeiculosFilters();
      }
    } catch (error) {
      console.error('Erro ao limpar filtros:', error);
    }
    
    setIsClearing(false);
  };

  if (isMobile) {
    return (
      <>
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50"
            style={{ zIndex: UI_CONFIG.Z_INDEX.MODAL_BACKDROP }}
            onClick={handleModalClose}
          />
        )}
        
        {/* Modal */}
        <div
          className={`fixed inset-0 bg-white transform transition-transform duration-300 flex flex-col ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ zIndex: UI_CONFIG.Z_INDEX.FILTER_SIDEBAR }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white flex-shrink-0 relative"
            style={{ zIndex: UI_CONFIG.Z_INDEX.FILTER_SIDEBAR + 10 }}
          >
            <div className="flex items-center justify-between flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Filtros</h2>
            </div>
            <button
              onClick={handleModalClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
              style={{ zIndex: UI_CONFIG.Z_INDEX.FILTER_SIDEBAR + 10 }}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filters content */}
          <div
            className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide relative"
            style={{ zIndex: UI_CONFIG.Z_INDEX.FILTER_SIDEBAR + 5 }}
            data-filter-modal-content
          >
            {/* ✅ CORREÇÃO: Mostrar apenas filtros APLICADOS */}
            <FilterTags
              category={category}
              filters={category === 'imoveis' ? state.appliedFilters.imoveis : state.appliedFilters.veiculos}
              onRemoveFilter={handleRemoveFilter}
              searchQuery={state.searchQuery}
              onClearSearch={handleClearSearch}
              currentType={currentType}
              showExpiredAuctions={state.showExpiredAuctions}
            />

            {category === 'imoveis' ? (
              <ImoveisFilters currentPropertyType={currentPropertyType} />
            ) : (
              <VeiculosFilters currentVehicleType={currentVehicleType} />
            )}
          </div>

          {/* Footer */}
          <div
            className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
            style={{ zIndex: UI_CONFIG.Z_INDEX.FILTER_SIDEBAR + 10 }}
          >
            <div className="flex flex-col gap-3">
              <button
                onClick={handleApplyFilters}
                disabled={isApplying || isClearing || countLoading}
                className={`w-full px-4 py-3 bg-gray-900 text-white rounded-xl transition-all duration-200 font-normal ${
                  isApplying || countLoading
                    ? 'bg-gray-700 cursor-not-allowed'
                    : 'hover:bg-black active:scale-[0.98] shadow-sm hover:shadow-md'
                }`}
              >
                {isApplying
                  ? 'Aplicando...'
                  : hasUserFilters
                    ? formatFilterCount(count, countLoading)
                    : 'Aplicar filtros'
                }
              </button>
              <button
                onClick={handleClearFilters}
                disabled={isClearing || isApplying}
                className={`w-full px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl transition-all duration-200 font-normal ${
                  isClearing
                    ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                    : 'hover:bg-gray-50 hover:border-gray-400 active:scale-[0.98]'
                }`}
              >
                {isClearing ? 'Limpando...' : 'Limpar filtros'}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop version
  return (
    <div className="relative w-full h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div
        className="absolute top-4 left-0 right-0 px-4 md:px-6 py-3 border-b border-gray-200 bg-white"
        style={{ zIndex: UI_CONFIG.Z_INDEX.DROPDOWN }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Filtros</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Encerrados</span>
            <Switch
              checked={state.showExpiredAuctions}
              onCheckedChange={actions.setShowExpiredAuctions}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Filters content */}
      <div className="absolute top-16 bottom-16 left-0 right-0 overflow-y-auto px-4 md:px-6 py-3 scrollbar-hide">
        {/* ✅ CORREÇÃO: Mostrar apenas filtros APLICADOS */}
        <FilterTags
          category={category}
          filters={category === 'imoveis' ? state.appliedFilters.imoveis : state.appliedFilters.veiculos}
          onRemoveFilter={handleRemoveFilter}
          searchQuery={state.searchQuery}
          onClearSearch={handleClearSearch}
          currentType={currentType}
          showExpiredAuctions={state.showExpiredAuctions}
        />

        {category === 'imoveis' ? (
          <ImoveisFilters currentPropertyType={currentPropertyType} />
        ) : (
          <VeiculosFilters currentVehicleType={currentVehicleType} />
        )}
      </div>

      {/* Footer */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 md:px-6 py-3 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
        style={{ zIndex: UI_CONFIG.Z_INDEX.DROPDOWN }}
      >
        <div className="flex gap-2">
          <button
            onClick={handleClearFilters}
            disabled={isClearing || isApplying}
            className={`flex-1 px-3 py-3 text-sm text-gray-700 bg-white border border-gray-300 rounded-xl transition-all duration-200 font-normal ${
              isClearing
                ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
                : 'hover:bg-gray-50 hover:border-gray-400 active:scale-[0.98]'
            }`}
          >
            {isClearing ? 'Limpando...' : 'Limpar filtros'}
          </button>
          <button
            onClick={handleApplyFilters}
            disabled={isApplying || isClearing || countLoading}
            className={`flex-1 px-3 py-3 text-sm bg-gray-900 text-white rounded-xl transition-all duration-200 font-normal ${
              isApplying || countLoading
                ? 'bg-gray-700 cursor-not-allowed'
                : 'hover:bg-black active:scale-[0.98] shadow-sm hover:shadow-md'
            }`}
          >
            {isApplying
              ? 'Aplicando...'
              : hasUserFilters
                ? formatFilterCount(count, countLoading)
                : 'Aplicar filtros'
            }
          </button>
        </div>
      </div>
    </div>
  );
};