import React, { useState, useEffect, memo, useCallback } from 'react';
import { X } from 'lucide-react';
import { Category } from '../types/auction';
import { LazyImoveisFilters, LazyVeiculosFilters, LazyFiltersWrapper } from './lazy/LazyComponents';
import { LoadingSpinner } from './ui/LoadingSpinner';
import { ButtonLoading } from './ui/filter-loading';
import { FilterTags } from './filters/FilterTags'; // ✅ NOVO: Tags de filtros
import { useAppContext } from '../contexts/AppContext';
import { useFilterCount } from '../hooks/useFilterCount'; // ✅ CONTAGEM DINÂMICA
import { formatFilterCount } from '../utils/formatFilterCount'; // ✅ FORMATAÇÃO
import { UI_CONFIG } from '../config/constants';
import { cn } from '../lib/utils';

interface FilterSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
  category: Category;
  currentVehicleType?: string;
  currentPropertyType?: string; // ✅ NOVO: Para imóveis
}

export const FilterSidebar: React.FC<FilterSidebarProps> = memo(({
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

  // ✅ CONTAGEM DINÂMICA: Buscar quantos leilões serão mostrados com os filtros atuais
  const stagedFilters = category === 'imoveis' ? state.stagedFilters.imoveis : state.stagedFilters.veiculos;
  const currentType = category === 'imoveis' ? currentPropertyType : currentVehicleType;

  // ✅ SIMPLIFICADO: Função para fechar modal sem resetar filtros
  const handleModalClose = useCallback(() => {
    if (isMobile) {
      // Scroll para o topo do modal
      const modalContent = document.querySelector('[data-filter-modal-content]');
      if (modalContent) {
        modalContent.scrollTop = 0;
      }
    }

    onClose?.();
  }, [isMobile, onClose]);
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

  const handleApplyFilters = useCallback(async () => {
    console.log('🚀 Aplicando filtros para categoria:', category);
    setIsApplying(true);

    await new Promise(resolve => setTimeout(resolve, 300));

    try {
      if (category === 'imoveis') {
        actions.applyImoveisFilters();
      } else {
        actions.applyVeiculosFilters();
      }
    } catch (error) {
      console.error('❌ Erro ao aplicar filtros:', error);
    }

    setIsApplying(false);

    if (isMobile && onClose) {
      onClose();
    }
  }, [category, actions, isMobile, onClose]);

  const handleClearFilters = useCallback(() => {
    console.log('🧹 Iniciando limpeza de filtros para categoria:', category);
    setIsClearing(true);

    try {
      // ✅ CORREÇÃO: Simplificar limpeza sem async
      if (category === 'imoveis') {
        console.log('🧹 Limpando filtros de imóveis');
        actions.clearImoveisFilters();
      } else {
        console.log('🧹 Limpando filtros de veículos');
        actions.clearVeiculosFilters();
      }

      // ✅ CORREÇÃO: Limpar localStorage também
      try {
        localStorage.removeItem('buscador-preferences');
        console.log('🧹 localStorage limpo');
      } catch (storageError) {
        console.warn('Erro ao limpar localStorage:', storageError);
      }

      console.log('🧹 Limpeza concluída com sucesso');

      // ✅ CORREÇÃO: Fechar modal após limpeza
      if (onClose) {
        console.log('🧹 Fechando modal');
        onClose();
      }

    } catch (error) {
      console.error('❌ Erro ao limpar filtros:', error);
    }

    // ✅ CORREÇÃO: Usar setTimeout para garantir que o estado seja atualizado
    setTimeout(() => {
      setIsClearing(false);
      console.log('🧹 Estado de limpeza resetado');
    }, 200);
  }, [category, actions, onClose]);

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
        
        {/* Premium Modal */}
        <div
          className={`fixed inset-0 glass-effect transform transition-transform duration-300 flex flex-col ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ zIndex: UI_CONFIG.Z_INDEX.FILTER_SIDEBAR }}
        >
          {/* Premium Header */}
          <div
            className="flex items-center justify-between px-6 py-5 border-b border-slate-200/60 bg-white/95 backdrop-blur-sm flex-shrink-0 relative"
            style={{ zIndex: UI_CONFIG.Z_INDEX.FILTER_SIDEBAR + 10 }}
          >
            <div className="flex items-center justify-between flex-1">
              <h2 className="text-xl font-bold text-slate-900 text-gradient">Filtros</h2>
            </div>
            <button
              onClick={handleModalClose}
              className="p-3 hover:bg-slate-100 rounded-auction transition-all duration-200 active:scale-95 relative"
              style={{ zIndex: UI_CONFIG.Z_INDEX.FILTER_SIDEBAR + 10 }}
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Filters content */}
          <div
            className="flex-1 overflow-y-auto px-6 py-4 pb-6 scrollbar-hide relative"
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
            />

            <LazyFiltersWrapper
              fallback={
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <LoadingSpinner size="sm" />
                    <p className="mt-2 text-xs text-gray-500">Carregando filtros...</p>
                  </div>
                </div>
              }
            >
              {category === 'imoveis' ? (
                <LazyImoveisFilters currentPropertyType={currentPropertyType} />
              ) : (
                <LazyVeiculosFilters currentVehicleType={currentVehicleType} />
              )}
            </LazyFiltersWrapper>
          </div>

          {/* Premium Footer */}
          <div
            className="px-6 py-5 border-t border-slate-200/60 bg-white/95 backdrop-blur-sm flex-shrink-0 relative shadow-auction-lg"
            style={{ zIndex: UI_CONFIG.Z_INDEX.FILTER_SIDEBAR + 10 }}
          >
            <div className="flex flex-col gap-3">
              <button
                onClick={handleApplyFilters}
                disabled={isApplying || isClearing || countLoading}
                className={cn(
                  "w-full px-6 py-4 text-base font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-auction-500/20 focus:ring-offset-2",
                  (isApplying || countLoading)
                    ? "bg-gray-400 text-white cursor-not-allowed opacity-50"
                    : "bg-auction-600 text-white hover:bg-auction-700 shadow-lg hover:shadow-xl"
                )}
              >
                <div className="flex items-center justify-center">
                  {isApplying && <ButtonLoading size="sm" />}
                  {isApplying
                    ? 'Aplicando...'
                    : hasUserFilters
                      ? formatFilterCount(count, countLoading)
                      : 'Aplicar filtros'
                  }
                </div>
              </button>
              <button
                onClick={handleClearFilters}
                disabled={isClearing || isApplying}
                className={cn(
                  "w-full px-6 py-4 text-base font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500/20 focus:ring-offset-2",
                  isClearing
                    ? "bg-gray-50 text-gray-500 cursor-not-allowed opacity-50"
                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400 shadow-sm hover:shadow-md"
                )}
              >
                <div className="flex items-center justify-center">
                  {isClearing && <ButtonLoading size="sm" />}
                  {isClearing ? 'Limpando...' : 'Limpar'}
                </div>
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
        </div>
      </div>

      {/* Filters content */}
      <div className="absolute top-16 bottom-20 left-0 right-0 overflow-y-auto px-4 md:px-6 py-3 scrollbar-hide">
        {/* ✅ CORREÇÃO: Mostrar apenas filtros APLICADOS */}
        <FilterTags
          category={category}
          filters={category === 'imoveis' ? state.appliedFilters.imoveis : state.appliedFilters.veiculos}
          onRemoveFilter={handleRemoveFilter}
          searchQuery={state.searchQuery}
          onClearSearch={handleClearSearch}
        />

        <LazyFiltersWrapper
          fallback={
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <LoadingSpinner size="sm" />
                <p className="mt-2 text-xs text-gray-500">Carregando filtros...</p>
              </div>
            </div>
          }
        >
          {category === 'imoveis' ? (
            <LazyImoveisFilters currentPropertyType={currentPropertyType} />
          ) : (
            <LazyVeiculosFilters currentVehicleType={currentVehicleType} />
          )}
        </LazyFiltersWrapper>
      </div>

      {/* Footer */}
      <div
        className="absolute bottom-0 left-0 right-0 px-4 md:px-6 py-3 border-t border-gray-200 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
        style={{ zIndex: UI_CONFIG.Z_INDEX.DROPDOWN }}
      >
        <div className="flex flex-col gap-2">
          <button
            onClick={handleApplyFilters}
            disabled={isApplying || isClearing || countLoading}
            className={cn(
              "w-full px-3 py-3 text-xs font-semibold rounded-lg transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-auction-500/20",
              (isApplying || countLoading)
                ? "bg-gray-400 text-white cursor-not-allowed opacity-50"
                : "bg-auction-600 text-white hover:bg-auction-700 shadow-lg hover:shadow-xl"
            )}
          >
            <div className="flex items-center justify-center">
              {isApplying && <ButtonLoading size="sm" />}
              {isApplying
                ? 'Aplicando...'
                : hasUserFilters
                  ? formatFilterCount(count, countLoading)
                  : 'Aplicar filtros'
              }
            </div>
          </button>
          <button
            onClick={handleClearFilters}
            disabled={isClearing || isApplying}
            className={cn(
              "w-full px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-gray-500/20",
              isClearing
                ? "bg-gray-50 text-gray-500 cursor-not-allowed opacity-50"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400"
            )}
          >
            <div className="flex items-center justify-center">
              {isClearing && <ButtonLoading size="sm" />}
              {isClearing ? 'Limpando...' : 'Limpar'}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
});

// 🚀 PERFORMANCE: DisplayName para debugging
FilterSidebar.displayName = 'FilterSidebar';