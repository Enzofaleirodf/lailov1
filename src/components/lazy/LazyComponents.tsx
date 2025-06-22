import React, { Suspense, lazy } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

// 🚀 LAZY LOADING: Componentes pesados carregados sob demanda

// Componentes de filtros (pesados devido às queries)
export const LazyImoveisFilters = lazy(() => 
  import('../filters/ImoveisFilters').then(module => ({ default: module.ImoveisFilters }))
);

export const LazyVeiculosFilters = lazy(() => 
  import('../filters/VeiculosFilters').then(module => ({ default: module.VeiculosFilters }))
);

// Componentes de visualização (pesados devido à virtualização)
export const LazyVirtualizedAuctionGrid = lazy(() => 
  import('../layout/VirtualizedAuctionGrid').then(module => ({ default: module.VirtualizedAuctionGrid }))
);

// Dashboard de performance (pesado devido aos gráficos)
export const LazyPerformanceDashboard = lazy(() => 
  import('../PerformanceDashboard').then(module => ({ default: module.PerformanceDashboard }))
);

// 🚀 WRAPPER COMPONENTS: Com fallbacks otimizados

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minHeight?: string;
}

const DefaultFallback: React.FC<{ minHeight?: string }> = ({ minHeight = '200px' }) => (
  <div 
    className="flex items-center justify-center w-full"
    style={{ minHeight }}
  >
    <LoadingSpinner size="sm" />
  </div>
);

export const LazyFiltersWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback,
  minHeight = '300px' 
}) => (
  <Suspense fallback={fallback || <DefaultFallback minHeight={minHeight} />}>
    {children}
  </Suspense>
);

export const LazyGridWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback,
  minHeight = '400px' 
}) => (
  <Suspense fallback={fallback || <DefaultFallback minHeight={minHeight} />}>
    {children}
  </Suspense>
);

export const LazyDashboardWrapper: React.FC<LazyWrapperProps> = ({ 
  children, 
  fallback,
  minHeight = '500px' 
}) => (
  <Suspense fallback={fallback || <DefaultFallback minHeight={minHeight} />}>
    {children}
  </Suspense>
);

// 🚀 PRELOAD FUNCTIONS: Para precarregar componentes quando necessário

export const preloadFilters = {
  imoveis: () => import('../filters/ImoveisFilters'),
  veiculos: () => import('../filters/VeiculosFilters')
};

export const preloadGrid = () => import('../layout/VirtualizedAuctionGrid');

export const preloadDashboard = () => import('../PerformanceDashboard');

// 🚀 SMART PRELOADER: Precarrega baseado no contexto
export const useSmartPreload = () => {
  const preloadBasedOnRoute = React.useCallback((route: string) => {
    if (route.includes('/imoveis')) {
      preloadFilters.imoveis();
    } else if (route.includes('/veiculos')) {
      preloadFilters.veiculos();
    }
  }, []);

  const preloadBasedOnInteraction = React.useCallback((interaction: string) => {
    switch (interaction) {
      case 'filter-hover':
        // Precarregar filtros quando usuário hover no botão
        preloadFilters.imoveis();
        preloadFilters.veiculos();
        break;
      case 'grid-scroll':
        // Precarregar grid virtualizado quando scroll intenso
        preloadGrid();
        break;
      case 'performance-key':
        // Precarregar dashboard quando teclas de performance
        preloadDashboard();
        break;
    }
  }, []);

  return {
    preloadBasedOnRoute,
    preloadBasedOnInteraction
  };
};
