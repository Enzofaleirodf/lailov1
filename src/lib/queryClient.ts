import { QueryClient } from '@tanstack/react-query';
import { createPersistentQueryClient } from './advancedCache';
import { performanceMonitor } from './performanceMonitor';

// 🚀 CONFIGURAÇÃO BRUTAL DO REACT QUERY COM CACHE PERSISTENTE E PERFORMANCE MONITORING
export const queryClient = createPersistentQueryClient();

// 🚨 PERFORMANCE MONITORING DESABILITADO PARA EVITAR LOOPS
// queryClient.getQueryCache().subscribe(...) - REMOVIDO

// 🚀 CONFIGURAÇÃO ADICIONAL (já incluída no createPersistentQueryClient)

// 🚀 QUERY KEYS PADRONIZADOS
export const QUERY_KEYS = {
  // Leilões
  auctions: {
    all: ['auctions'] as const,
    lists: () => [...QUERY_KEYS.auctions.all, 'list'] as const,
    list: (category: string, type: string, filters: any, sort: string, search: string, page: number, showExpired: boolean) => 
      [...QUERY_KEYS.auctions.lists(), { category, type, filters, sort, search, page, showExpired }] as const,
    detail: (id: string) => [...QUERY_KEYS.auctions.all, 'detail', id] as const,
  },
  
  // Filtros
  filters: {
    all: ['filters'] as const,
    options: (category: string) => [...QUERY_KEYS.filters.all, 'options', category] as const,
    ranges: (category: string, type: string, showExpired: boolean) => 
      [...QUERY_KEYS.filters.all, 'ranges', { category, type, showExpired }] as const,
    cities: (category: string, state: string) => 
      [...QUERY_KEYS.filters.all, 'cities', { category, state }] as const,
  },
  
  // Favoritos
  favorites: {
    all: ['favorites'] as const,
    lists: () => [...QUERY_KEYS.favorites.all, 'list'] as const,
    list: (userId: string) => [...QUERY_KEYS.favorites.lists(), userId] as const,
    ids: (userId: string) => [...QUERY_KEYS.favorites.all, 'ids', userId] as const,
  },
  
  // Usuário
  user: {
    all: ['user'] as const,
    profile: (userId: string) => [...QUERY_KEYS.user.all, 'profile', userId] as const,
  },
} as const;

// 🚀 INVALIDATION HELPERS
export const invalidateQueries = {
  // Invalidar todos os leilões
  allAuctions: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auctions.all }),
  
  // Invalidar leilões específicos
  auctionsList: (category?: string) => {
    if (category) {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.auctions.lists(),
        predicate: (query) => {
          const data = query.queryKey[2] as any;
          return data?.category === category;
        }
      });
    } else {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auctions.lists() });
    }
  },
  
  // Invalidar filtros
  allFilters: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.filters.all }),
  filterOptions: (category: string) => 
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.filters.options(category) }),
  
  // Invalidar favoritos
  allFavorites: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites.all }),
  userFavorites: (userId: string) => 
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.favorites.list(userId) }),
};

// 🚀 PREFETCH HELPERS
export const prefetchQueries = {
  // Prefetch de leilões relacionados
  relatedAuctions: async (currentCategory: string) => {
    const otherCategory = currentCategory === 'imoveis' ? 'veiculos' : 'imoveis';
    
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.auctions.list(otherCategory, 'todos', {}, 'relevancia', '', 1, false),
      queryFn: () => import('../services/realAuctionService').then(module => 
        module.processRealAuctions(otherCategory as any, 'todos', {}, 'relevancia', '', 1, false)
      ),
      staleTime: 2 * 60 * 1000, // 2 minutos para prefetch
    });
  },
  
  // Prefetch de filtros
  filterOptions: async (category: string) => {
    await queryClient.prefetchQuery({
      queryKey: QUERY_KEYS.filters.options(category),
      queryFn: () => import('../lib/database').then(module => 
        Promise.all([
          module.auctions.getAvailableStates(category as any),
          module.auctions.getAvailableFormats(category as any),
          module.auctions.getAvailableOrigins(category as any),
          module.auctions.getAvailableStages(category as any)
        ])
      ),
      staleTime: 10 * 60 * 1000, // 10 minutos para filtros
    });
  },
};

// 🚀 PERFORMANCE MONITORING - DESABILITADO PARA EVITAR PROBLEMAS DE INICIALIZAÇÃO
if (process.env.NODE_ENV === 'development') {
  // 🔧 CORREÇÃO: Desabilitar monitoring na inicialização
  // setTimeout(() => {
  //   try {
  //     queryClient.getQueryCache().subscribe((event) => {
  //       if (event?.type === 'updated' && event.query.state.status === 'success') {
  //         const queryKey = event.query.queryKey;
  //         const dataUpdatedAt = event.query.state.dataUpdatedAt;
  //         const fetchTime = Date.now() - dataUpdatedAt;
  //
  //         if (fetchTime > 1000) {
  //           console.warn(`🐌 Slow query detected:`, queryKey, `${fetchTime}ms`);
  //         }
  //       }
  //     });
  //   } catch (error) {
  //     console.warn('Erro no performance monitoring:', error);
  //   }
  // }, 5000); // Aguardar 5 segundos após inicialização
}
