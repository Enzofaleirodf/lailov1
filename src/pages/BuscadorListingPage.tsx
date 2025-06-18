import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FilterSidebar } from '../components/FilterSidebar';
import { SortPopover } from '../components/SortPopover';
import { TypeNavigationTabs } from '../components/TypeNavigationTabs';
import { Pagination } from '../components/Pagination';
import { EmptyState } from '../components/EmptyState';
import { MobileActionBar } from '../components/layout/MobileActionBar';
import { DesktopHeader } from '../components/layout/DesktopHeader';
import { StatusHeader } from '../components/layout/StatusHeader';
import { AuctionGrid } from '../components/layout/AuctionGrid';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { FloatingSearchButton } from '../components/ui/FloatingSearchButton';
import { Category, SortOption } from '../types/auction';
import { MAPPINGS } from '../config/mappings';
import { useAppContext } from '../contexts/AppContext';
import { useAuctionData } from '../hooks/useAuctionData';
import { useActiveFilters } from '../hooks/useActiveFilters';
import { PAGINATION_CONFIG } from '../config/constants';

interface BuscadorListingPageProps {
  category: Category;
}

export const BuscadorListingPage: React.FC<BuscadorListingPageProps> = ({ category }) => {
  const { tipo } = useParams<{ tipo: string }>();
  const { state, actions } = useAppContext();
  
  // Estados locais (não persistidos)
  const [showFilters, setShowFilters] = useState(false);
  const [showSortPopover, setShowSortPopover] = useState(false);
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
  
  // Custom hooks para separar responsabilidades
  const { auctions: filteredAndSortedAuctions, totalSites, newAuctions, totalCount, loading, error } = useAuctionData({
    category,
    currentType,
    appliedFilters: state.appliedFilters,
    sortOption: state.sortOption,
    searchQuery: state.searchQuery,
    showExpiredAuctions: state.showExpiredAuctions, // ✅ NOVO: Passar estado de leilões expirados
    page: currentPage // ✅ PAGINAÇÃO REAL: Passar página atual
  });

  const hasActiveFilters = useActiveFilters({
    category,
    appliedFilters: state.appliedFilters
  });

  // ✅ PAGINAÇÃO REAL: Calcular total de páginas baseado no total de resultados do banco
  const totalPages = totalCount ? Math.ceil(totalCount / PAGINATION_CONFIG.ITEMS_PER_PAGE) : 0;

  // ✅ PAGINAÇÃO REAL: Handler para mudança de página
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ✅ PAGINAÇÃO REAL: Reset página quando filtros mudarem
  useEffect(() => {
    setCurrentPage(1);
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
    // Search is already handled by the useAuctionData hook
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
    setShowSortPopover(false);
  };

  // Close sort popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSortPopover) {
        const target = event.target as Element;
        if (!target.closest('[data-sort-container]')) {
          setShowSortPopover(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortPopover]);

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col h-screen pb-20 max-[767px]:pb-20 min-[768px]:pb-0 md:pl-20 overflow-x-hidden">
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
          onSortClick={() => setShowSortPopover(true)}
          onFiltersClick={() => setShowFilters(true)}
          onViewModeChange={actions.setViewMode}
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
                  <LoadingSpinner size="lg" />
                  <p className="mt-4 text-gray-600">Carregando leilões...</p>
                </div>
              </main>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col h-screen pb-20 max-[767px]:pb-20 min-[768px]:pb-0 md:pl-20 overflow-x-hidden">
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
          onSortClick={() => setShowSortPopover(true)}
          onFiltersClick={() => setShowFilters(true)}
          onViewModeChange={actions.setViewMode}
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
    <div className="flex flex-col h-screen pb-20 max-[767px]:pb-20 min-[768px]:pb-0 md:pl-20 overflow-x-hidden">
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
        onSortClick={() => setShowSortPopover(true)}
        onFiltersClick={() => setShowFilters(true)}
        onViewModeChange={actions.setViewMode}
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
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden pt-16 min-[768px]:pt-0">
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
                  totalSites={totalSites}
                  newAuctions={newAuctions}
                  sortOption={state.sortOption}
                  showSortPopover={showSortPopover}
                  showExpiredAuctions={state.showExpiredAuctions}
                  onSortToggle={() => setShowSortPopover(!showSortPopover)}
                  onSortChange={handleSortChange}
                  onSortClose={() => setShowSortPopover(false)}
                  onExpiredToggle={actions.setShowExpiredAuctions}
                />
              )}

              {/* Empty State or Auction Cards */}
              {showEmptyState ? (
                <EmptyState
                  category={category}
                  hasActiveFilters={hasActiveFilters}
                  onClearFilters={handleClearFilters}
                  onClearSearch={state.searchQuery ? handleClearSearch : undefined}
                  searchQuery={state.searchQuery}
                />
              ) : (
                <AuctionGrid
                  auctions={filteredAndSortedAuctions}
                  viewMode={state.viewMode}
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

      {/* Mobile Sort Popover */}
      <div className="min-[768px]:hidden">
        <SortPopover
          isOpen={showSortPopover}
          onClose={() => setShowSortPopover(false)}
          selectedSort={state.sortOption}
          onSortChange={handleSortChange}
          isMobile={true}
        />
      </div>

      {/* Desktop Floating Search Button */}
      <FloatingSearchButton
        searchQuery={state.searchQuery}
        onSearchChange={actions.setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
      />
    </div>
  );
};