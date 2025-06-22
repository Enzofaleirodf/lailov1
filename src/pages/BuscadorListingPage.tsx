import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { FilterSidebar } from '../components/FilterSidebar';
import { MobileSortModal } from '../components/MobileSortModal';
import { TypeNavigationTabs } from '../components/TypeNavigationTabs';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';
import { MobileActionBar } from '../components/layout/MobileActionBar';
import { DesktopHeader } from '../components/layout/DesktopHeader';
import { StatusHeader } from '../components/layout/StatusHeader';
import { SmartAuctionGrid } from '../components/layout/SmartAuctionGrid';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { FloatingSearchButton } from '../components/ui/FloatingSearchButton';
import { Category, SortOption } from '../types/auction';
import { MAPPINGS } from '../config/mappings';
import { useAppContext } from '../contexts/AppContext';
import { useAuctionsQuery } from '../hooks/useAuctionsQuery';
import { useActiveFilters } from '../hooks/useActiveFilters';
import { PAGINATION_CONFIG } from '../config/constants';

interface BuscadorListingPageProps {
  category: Category;
}

const BuscadorListingPage: React.FC<BuscadorListingPageProps> = ({ category }) => {
  const { tipo } = useParams<{ tipo: string }>();
  const { state, actions } = useAppContext();

  // 🚀 REF PARA O CONTAINER DE SCROLL CORRETO
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Estados locais (não persistidos)
  const [showFilters, setShowFilters] = useState(false);
  const [showDesktopSort, setShowDesktopSort] = useState(false);
  const [showMobileSort, setShowMobileSort] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // ✅ PAGINAÇÃO REAL: Estado da página atual

  // Validar e normalizar o tipo
  const getCurrentType = (): string => {
    if (!tipo) return 'todos';
    
    if (category === 'veiculos') {
      return MAPPINGS.isValidVehicleType(tipo) ? tipo : 'todos';
    } else {
      return MAPPINGS.isValidPropertyType(tipo) ? tipo : 'todos';
    }
  };

  const currentType = getCurrentType();

  // 🚀 FUNÇÃO UTILITÁRIA PARA SCROLL TO TOP ROBUSTO
  const scrollToTop = () => {
    console.log('🚀 ScrollToTop chamado!', {
      hasScrollContainer: !!scrollContainerRef.current,
      currentScrollTop: scrollContainerRef.current?.scrollTop,
      windowScrollY: window.scrollY
    });

    // 1. Tentar scroll no container principal (mais importante)
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      console.log('✅ Scroll container executado');
    }

    // 2. Scroll da janela como backup
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('✅ Window scroll executado');

    // 3. Scroll imediato como último recurso (para casos de problemas com smooth)
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
        console.log('✅ Scroll imediato executado', scrollContainerRef.current.scrollTop);
      }
      window.scrollTo(0, 0);
    }, 100);
  };

  // 🚀 REACT QUERY: Hook otimizado com cache inteligente
  const {
    auctions: filteredAndSortedAuctions,
    totalSites,
    newAuctions,
    totalCount,
    loading,
    error,
    refetch,
    isStale,
    prefetchNextPage
  } = useAuctionsQuery({
    category,
    currentType,
    appliedFilters: state.appliedFilters,
    sortOption: state.sortOption,
    searchQuery: state.searchQuery,
    showExpiredAuctions: state.showExpiredAuctions,
    page: currentPage
  });

  const hasActiveFilters = useActiveFilters({
    category,
    appliedFilters: state.appliedFilters
  });

  // Calcular número de filtros ativos para badge
  const activeFiltersCount = (() => {
    const filters = category === 'imoveis' ? state.appliedFilters.imoveis : state.appliedFilters.veiculos;
    let count = 0;

    if (filters.estado && filters.estado !== "all") count++;
    if (filters.cidade && filters.cidade !== "all") count++;
    if (filters.formato) count++;
    if (filters.origem && filters.origem.length > 0) count++;
    if (filters.etapa && filters.etapa.length > 0) count++;

    if (category === 'veiculos') {
      if (filters.marca && filters.marca !== "all") count++;
      if (filters.modelo && filters.modelo !== "all") count++;
      if (filters.cor && filters.cor !== "all") count++;
      // ✅ CORREÇÃO: Verificar se há valores válidos (não undefined)
      if (filters.ano && filters.ano.length > 0 && filters.ano[0] !== undefined && filters.ano[1] !== undefined && (filters.ano[0] > 0 || filters.ano[1] > 0)) count++;
      if (filters.valorAvaliacao && filters.valorAvaliacao.length > 0 && filters.valorAvaliacao[0] !== undefined && filters.valorAvaliacao[1] !== undefined && (filters.valorAvaliacao[0] > 0 || filters.valorAvaliacao[1] > 0)) count++;
      if (filters.valorDesconto && filters.valorDesconto.length > 0 && filters.valorDesconto[0] !== undefined && filters.valorDesconto[1] !== undefined && (filters.valorDesconto[0] > 0 || filters.valorDesconto[1] > 0)) count++;
    } else {
      // ✅ CORREÇÃO: Verificar se há valores válidos (não undefined)
      if (filters.areaM2 && filters.areaM2.length > 0 && filters.areaM2[0] !== undefined && filters.areaM2[1] !== undefined && (filters.areaM2[0] > 0 || filters.areaM2[1] > 0)) count++;
      if (filters.areaHectares && filters.areaHectares.length > 0 && filters.areaHectares[0] !== undefined && filters.areaHectares[1] !== undefined && (filters.areaHectares[0] > 0 || filters.areaHectares[1] > 0)) count++;
      if (filters.valorAvaliacao && filters.valorAvaliacao.length > 0 && filters.valorAvaliacao[0] !== undefined && filters.valorAvaliacao[1] !== undefined && (filters.valorAvaliacao[0] > 0 || filters.valorAvaliacao[1] > 0)) count++;
      if (filters.valorDesconto && filters.valorDesconto.length > 0 && filters.valorDesconto[0] !== undefined && filters.valorDesconto[1] !== undefined && (filters.valorDesconto[0] > 0 || filters.valorDesconto[1] > 0)) count++;
    }

    if (state.searchQuery && state.searchQuery.trim() !== '') count++;

    return count;
  })();

  // ✅ PAGINAÇÃO REAL: Calcular total de páginas baseado no total de resultados do banco
  const totalPages = totalCount ? Math.ceil(totalCount / PAGINATION_CONFIG.ITEMS_PER_PAGE) : 0;

  // ✅ PAGINAÇÃO REAL: Handler para mudança de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    scrollToTop(); // 🚀 USAR FUNÇÃO UTILITÁRIA
  };

  // ✅ PAGINAÇÃO REAL: Reset página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
    scrollToTop(); // 🚀 USAR FUNÇÃO UTILITÁRIA
  }, [state.appliedFilters, state.sortOption, state.searchQuery, currentType]);

  // Event handlers
  const handleSearchToggle = () => {
    setShowSearch(!showSearch);
    if (showSearch) {
      actions.setSearchQuery('');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 🚀 Search is already handled by the useAuctionsQuery hook
  };

  const handleClearFilters = () => {
    if (category === 'imoveis') {
      actions.clearImoveisFilters();
    } else {
      actions.clearVeiculosFilters();
    }
  };

  const handleClearSearch = () => {
    actions.setSearchQuery('');
    setShowSearch(false);
  };

  const handleSortChange = (sort: SortOption) => {
    actions.setSortOption(sort);
    setShowDesktopSort(false);
    setShowMobileSort(false);
  };

  // Close sort popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDesktopSort) {
        const target = event.target as Element;
        if (!target.closest('[data-sort-container]')) {
          setShowDesktopSort(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDesktopSort]);

  // 🚀 UX CLEAN: Remover loading state gigante desnecessário

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col h-screen pb-20 max-[767px]:pb-20 min-[768px]:pb-0 md:pl-16 overflow-x-hidden">
        {/* Desktop Header */}
        <DesktopHeader
          category={category}
          viewMode={state.viewMode}
          onViewModeChange={actions.setViewMode}
        />

        {/* Mobile Action Bar */}
        <MobileActionBar
          showSearch={showSearch}
          searchQuery={state.searchQuery}
          viewMode={state.viewMode}
          onSearchToggle={handleSearchToggle}
          onSearchChange={actions.setSearchQuery}
          onSearchSubmit={handleSearchSubmit}
          onSortClick={() => setShowMobileSort(true)}
          onFiltersClick={() => setShowFilters(true)}
          onViewModeChange={actions.setViewMode}
          hasActiveFilters={hasActiveFilters}
          activeFiltersCount={activeFiltersCount}
        />

        <div className="flex flex-1 min-h-0 overflow-x-hidden">
          {/* Desktop Sidebar */}
          <div className="hidden min-[768px]:block w-[35%] max-w-md flex-shrink-0">
            <FilterSidebar
              category={category}
              currentVehicleType={category === 'veiculos' ? (tipo || 'todos') : undefined}
              currentPropertyType={category === 'imoveis' ? (tipo || 'todos') : undefined}
            />
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-x-hidden">
            <div className="flex-1 overflow-y-auto overflow-x-hidden pt-16 min-[768px]:pt-0">
              {/* Mobile Type Navigation Tabs */}
              <div className="min-[768px]:hidden overflow-x-hidden bg-white border-b border-gray-100">
                <div className="px-4">
                  <TypeNavigationTabs category={category} />
                </div>
              </div>
              
              <main className="w-full px-4 md:px-6 overflow-x-hidden min-h-[calc(100vh-200px)] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-red-600 text-2xl">⚠️</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Erro ao Carregar
                  </h3>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Tentar Novamente
                  </button>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show empty state if no auctions found
  const showEmptyState = filteredAndSortedAuctions.length === 0;

  return (
    <div className="flex flex-col h-screen pb-20 max-[767px]:pb-20 min-[768px]:pb-0 md:pl-16 overflow-x-hidden">
      {/* Desktop Header */}
      <DesktopHeader
        category={category}
        viewMode={state.viewMode}
        onViewModeChange={actions.setViewMode}
      />

      {/* Mobile Action Bar */}
      <MobileActionBar
        showSearch={showSearch}
        searchQuery={state.searchQuery}
        viewMode={state.viewMode}
        onSearchToggle={handleSearchToggle}
        onSearchChange={actions.setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onSortClick={() => setShowMobileSort(true)}
        onFiltersClick={() => setShowFilters(true)}
        onViewModeChange={actions.setViewMode}
        hasActiveFilters={hasActiveFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <div className="flex flex-1 min-h-0 overflow-x-hidden">
        {/* Desktop Sidebar - Otimizada para 1024px com espaço extra */}
        <div className="hidden min-[768px]:block w-[32%] max-w-md flex-shrink-0">
          <FilterSidebar
            category={category}
            currentVehicleType={category === 'veiculos' ? (tipo || 'todos') : undefined}
            currentPropertyType={category === 'imoveis' ? (tipo || 'todos') : undefined}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-x-hidden">
          {/* 🚀 SCROLLABLE CONTENT AREA: Container de scroll principal */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden pt-16 min-[768px]:pt-0"
          >
            {/* Mobile Type Navigation Tabs */}
            <div className="min-[768px]:hidden overflow-x-hidden bg-white border-b border-gray-100">
              <div className="px-4">
                <TypeNavigationTabs category={category} />
              </div>
            </div>

            <main className="w-full px-4 md:px-6 overflow-x-hidden min-h-[calc(100vh-200px)]">
              {/* Status Header - Only show if there are results */}
              {!showEmptyState && (
                <StatusHeader
                  totalAuctions={totalCount || 0}
                  newAuctions={newAuctions}
                  sortOption={state.sortOption}
                  showSortPopover={showDesktopSort}
                  showExpiredAuctions={state.showExpiredAuctions}
                  onSortToggle={() => setShowDesktopSort(!showDesktopSort)}
                  onSortChange={handleSortChange}
                  onSortClose={() => setShowDesktopSort(false)}
                  onExpiredToggle={actions.setShowExpiredAuctions}
                />
              )}

              {/* 🚀 SMART GRID: Virtualização automática para listas grandes */}
              {filteredAndSortedAuctions.length > 0 ? (
                <div className="relative">
                  <SmartAuctionGrid
                    auctions={filteredAndSortedAuctions}
                    viewMode={state.viewMode}
                    virtualizationThreshold={20} // 🚀 THRESHOLD OTIMIZADO: 20 itens
                    paginationMode="traditional"
                    disableVirtualization={false} // 🚀 REATIVAR VIRTUALIZAÇÃO!
                  />
                  {/* Loading discreto no canto */}
                  {loading && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin bg-white/80 backdrop-blur-sm p-2"></div>
                    </div>
                  )}
                </div>
              ) : loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="text-center">
                    <LoadingSpinner size="md" />
                    <p className="mt-3 text-sm text-gray-500">Carregando leilões...</p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  category={category}
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={handleClearFilters}
                  onClearSearch={state.searchQuery ? handleClearSearch : undefined}
                  searchQuery={state.searchQuery}
                />
              )}

              {/* Pagination Container */}
              <div className="mt-8 mb-8 w-full overflow-x-auto h-[72px] flex items-center justify-center">
                {!showEmptyState && totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      <FilterSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        isMobile={true}
        category={category}
        currentVehicleType={category === 'veiculos' ? (tipo || 'todos') : undefined}
        currentPropertyType={category === 'imoveis' ? (tipo || 'todos') : undefined}
      />

      {/* Mobile Sort Modal */}
      <MobileSortModal
        isOpen={showMobileSort}
        onClose={() => setShowMobileSort(false)}
        selectedSort={state.sortOption}
        onSortChange={handleSortChange}
      />

      {/* Desktop Floating Search Button */}
      <FloatingSearchButton
        searchQuery={state.searchQuery}
        onSearchChange={actions.setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />
    </div>
  );
};

export default BuscadorListingPage;