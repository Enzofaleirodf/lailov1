import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createCacheWarming, getCacheWarming } from '../lib/cacheWarming';
import { useBehaviorTracker } from './useBehaviorTracker';

// 🚀 HOOK PARA CACHE WARMING INTELIGENTE
export const useCacheWarming = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const { getBehavior } = useBehaviorTracker();

  // 🔥 INICIALIZAR CACHE WARMING
  const initializeCacheWarming = useCallback(() => {
    try {
      createCacheWarming(queryClient);
      console.log('🔥 Cache warming initialized');
    } catch (error) {
      console.warn('Cache warming initialization failed:', error);
    }
  }, [queryClient]);

  // 🔥 WARM BASEADO NA ROTA ATUAL
  const warmForCurrentRoute = useCallback(() => {
    const cacheWarming = getCacheWarming();
    if (!cacheWarming) return;

    const currentRoute = location.pathname;
    
    // Extrair categoria e tipo da rota
    const veiculosMatch = currentRoute.match(/\/buscador\/veiculos\/(.+)/);
    const imoveisMatch = currentRoute.match(/\/buscador\/imoveis\/(.+)/);

    if (veiculosMatch) {
      const tipo = veiculosMatch[1];
      const userBehavior = getBehavior();
      
      cacheWarming.warmForContext({
        currentCategory: 'veiculos',
        currentType: tipo,
        userBehavior
      });
      
    } else if (imoveisMatch) {
      const tipo = imoveisMatch[1];
      const userBehavior = getBehavior();
      
      cacheWarming.warmForContext({
        currentCategory: 'imoveis',
        currentType: tipo,
        userBehavior
      });
      
    } else if (currentRoute === '/' || currentRoute === '/buscador') {
      // Primeira visita ou página inicial
      cacheWarming.warmForFirstVisit();
    }
  }, [location.pathname, getBehavior]);

  // 🔥 WARM MANUAL PARA ROTA ESPECÍFICA
  const warmRoute = useCallback((category: 'veiculos' | 'imoveis', type: string, priority: number = 5) => {
    const cacheWarming = getCacheWarming();
    if (!cacheWarming) return;

    cacheWarming.addTask({
      key: `${category}-${type}-manual`,
      priority,
      estimatedTime: 1500,
      queryFn: async () => {
        const { processRealAuctions } = await import('../services/realAuctionService');
        return processRealAuctions(category, type, {}, 'relevancia', '', 1, false);
      },
      cacheType: 'auctions'
    });

    cacheWarming.startWarming();
  }, []);

  // 🔥 OBTER ESTATÍSTICAS DO CACHE WARMING
  const getWarmingStats = useCallback(() => {
    const cacheWarming = getCacheWarming();
    return cacheWarming?.getStats() || {
      queueLength: 0,
      activeTasks: 0,
      isWarming: false
    };
  }, []);

  // 🔥 LIMPAR FILA DE WARMING
  const clearWarmingQueue = useCallback(() => {
    const cacheWarming = getCacheWarming();
    cacheWarming?.clearQueue();
  }, []);

  // 🚨 SETUP DESABILITADO PARA EVITAR LOOPS
  // useEffect(() => {
  //   initializeCacheWarming();
  // }, [initializeCacheWarming]);

  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     warmForCurrentRoute();
  //   }, 2000);
  //   return () => clearTimeout(timer);
  // }, [location.pathname, warmForCurrentRoute]);

  return {
    warmRoute,
    getWarmingStats,
    clearWarmingQueue,
    warmForCurrentRoute
  };
};

// 🚀 HOOK PARA INVALIDAÇÃO INTELIGENTE DE CACHE
export const useCacheInvalidation = () => {
  const queryClient = useQueryClient();

  // 🔥 INVALIDAR CACHE POR CATEGORIA
  const invalidateCategory = useCallback((category: 'veiculos' | 'imoveis') => {
    // Invalidar React Query
    queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && queryKey.some(key => 
          typeof key === 'string' && key.includes(category)
        );
      }
    });

    // Invalidar cache avançado
    const { advancedCache } = require('../lib/advancedCache');
    advancedCache.invalidatePattern(`auctions-.*${category}`);

    console.log(`🔄 Cache invalidated for category: ${category}`);
  }, [queryClient]);

  // 🔥 INVALIDAR CACHE POR FILTROS
  const invalidateFilters = useCallback((category?: 'veiculos' | 'imoveis') => {
    // Invalidar React Query
    queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        return Array.isArray(queryKey) && queryKey.some(key => 
          typeof key === 'string' && (
            key.includes('filters') || 
            key.includes('options') ||
            key.includes('ranges')
          )
        );
      }
    });

    // Invalidar cache avançado
    const { advancedCache } = require('../lib/advancedCache');
    if (category) {
      advancedCache.invalidatePattern(`filters-.*${category}`);
    } else {
      advancedCache.invalidatePattern('filters-');
    }

    console.log(`🔄 Filters cache invalidated${category ? ` for ${category}` : ''}`);
  }, [queryClient]);

  // 🔥 INVALIDAR TUDO
  const invalidateAll = useCallback(() => {
    // Invalidar React Query
    queryClient.invalidateQueries();

    // Limpar cache avançado
    const { advancedCache } = require('../lib/advancedCache');
    advancedCache.invalidatePattern('.*');

    console.log('🔄 All cache invalidated');
  }, [queryClient]);

  // 🔥 INVALIDAR CACHE EXPIRADO
  const cleanupExpiredCache = useCallback(() => {
    const { advancedCache } = require('../lib/advancedCache');
    advancedCache.cleanup();

    // Limpar queries inativas do React Query
    queryClient.getQueryCache().clear();

    console.log('🧹 Expired cache cleaned up');
  }, [queryClient]);

  return {
    invalidateCategory,
    invalidateFilters,
    invalidateAll,
    cleanupExpiredCache
  };
};

// 🚀 HOOK PARA ESTATÍSTICAS DE CACHE
export const useCacheStats = () => {
  const queryClient = useQueryClient();

  const getCacheStats = useCallback(() => {
    // Estatísticas do React Query
    const queryCache = queryClient.getQueryCache();
    const queries = queryCache.getAll();
    
    const reactQueryStats = {
      totalQueries: queries.length,
      activeQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
      staleQueries: queries.filter(q => q.isStale()).length,
      cachedQueries: queries.filter(q => q.state.data !== undefined).length
    };

    // Estatísticas do cache avançado
    const { advancedCache } = require('../lib/advancedCache');
    const advancedStats = advancedCache.getStats();

    // Estatísticas do cache warming
    const cacheWarming = getCacheWarming();
    const warmingStats = cacheWarming?.getStats() || {
      queueLength: 0,
      activeTasks: 0,
      isWarming: false
    };

    return {
      reactQuery: reactQueryStats,
      advanced: advancedStats,
      warming: warmingStats
    };
  }, [queryClient]);

  return {
    getCacheStats
  };
};
