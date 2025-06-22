import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { processRealAuctions } from '../services/realAuctionService';
import { useDebounce } from './useDebounce';
import { QUERY_KEYS, prefetchQueries } from '../lib/queryClient';
import { advancedCache } from '../lib/advancedCache';
import {
  Category,
  SortOption,
  Filters,
  AuctionSearchResult,
  UseAuctionDataParams
} from '../types/auction';

// 🚀 HOOK PRINCIPAL PARA LEILÕES COM REACT QUERY
export const useAuctionsQuery = ({
  category,
  currentType,
  appliedFilters,
  sortOption,
  searchQuery,
  showExpiredAuctions,
  page = 1
}: UseAuctionDataParams) => {
  const queryClient = useQueryClient();
  
  // 🚀 DEBOUNCE OTIMIZADO: 300ms para responsividade
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 🚀 MEMOIZAR FILTROS PARA EVITAR RE-RENDERS
  const filters = useMemo((): Filters => {
    return category === 'imoveis' ? {
      format: appliedFilters.imoveis.formato || undefined,
      origin: (appliedFilters.imoveis.origem || []).length > 0 ? appliedFilters.imoveis.origem : undefined,
      stage: (appliedFilters.imoveis.etapa || []).length > 0 ? appliedFilters.imoveis.etapa : undefined,
      state: appliedFilters.imoveis.estado && appliedFilters.imoveis.estado !== "all" ? appliedFilters.imoveis.estado : undefined,
      city: appliedFilters.imoveis.cidade && appliedFilters.imoveis.cidade !== "all" ? appliedFilters.imoveis.cidade : undefined,
      // ✅ CORREÇÃO: Verificar se há valores válidos (não undefined e não 0)
      useful_area_m2: (appliedFilters.imoveis.areaM2 &&
        appliedFilters.imoveis.areaM2[0] !== undefined &&
        appliedFilters.imoveis.areaM2[1] !== undefined &&
        (appliedFilters.imoveis.areaM2[0] > 0 || appliedFilters.imoveis.areaM2[1] > 0)) ? appliedFilters.imoveis.areaM2 : undefined,
      initial_bid_value: (appliedFilters.imoveis.valorAvaliacao &&
        appliedFilters.imoveis.valorAvaliacao[0] !== undefined &&
        appliedFilters.imoveis.valorAvaliacao[1] !== undefined &&
        (appliedFilters.imoveis.valorAvaliacao[0] > 0 || appliedFilters.imoveis.valorAvaliacao[1] > 0)) ? appliedFilters.imoveis.valorAvaliacao : undefined
    } : {
      format: appliedFilters.veiculos.formato || undefined,
      origin: (appliedFilters.veiculos.origem || []).length > 0 ? appliedFilters.veiculos.origem : undefined,
      stage: (appliedFilters.veiculos.etapa || []).length > 0 ? appliedFilters.veiculos.etapa : undefined,
      state: appliedFilters.veiculos.estado && appliedFilters.veiculos.estado !== "all" ? appliedFilters.veiculos.estado : undefined,
      city: appliedFilters.veiculos.cidade && appliedFilters.veiculos.cidade !== "all" ? appliedFilters.veiculos.cidade : undefined,
      brand: appliedFilters.veiculos.marca && appliedFilters.veiculos.marca !== "all" ? appliedFilters.veiculos.marca : undefined,
      model: appliedFilters.veiculos.modelo && appliedFilters.veiculos.modelo !== "all" ? appliedFilters.veiculos.modelo : undefined,
      color: appliedFilters.veiculos.cor && appliedFilters.veiculos.cor !== "all" ? appliedFilters.veiculos.cor : undefined,
      // ✅ CORREÇÃO: Verificar se há valores válidos (não undefined e não 0)
      year: (appliedFilters.veiculos.ano &&
        appliedFilters.veiculos.ano[0] !== undefined &&
        appliedFilters.veiculos.ano[1] !== undefined &&
        (appliedFilters.veiculos.ano[0] > 0 || appliedFilters.veiculos.ano[1] > 0)) ? appliedFilters.veiculos.ano : undefined,
      initial_bid_value: (appliedFilters.veiculos.valorAvaliacao &&
        appliedFilters.veiculos.valorAvaliacao[0] !== undefined &&
        appliedFilters.veiculos.valorAvaliacao[1] !== undefined &&
        (appliedFilters.veiculos.valorAvaliacao[0] > 0 || appliedFilters.veiculos.valorAvaliacao[1] > 0)) ? appliedFilters.veiculos.valorAvaliacao : undefined
    };
  }, [
    category,
    appliedFilters.imoveis.estado,
    appliedFilters.imoveis.cidade,
    appliedFilters.imoveis.formato,
    (appliedFilters.imoveis.origem || []).join(','),
    (appliedFilters.imoveis.etapa || []).join(','),
    // ✅ CORREÇÃO: Usar novos campos de área e valor
    appliedFilters.imoveis.areaM2?.join(',') || '',
    appliedFilters.imoveis.areaHectares?.join(',') || '',
    appliedFilters.imoveis.valorAvaliacao?.join(',') || '',
    appliedFilters.imoveis.valorDesconto?.join(',') || '',
    appliedFilters.veiculos.estado,
    appliedFilters.veiculos.cidade,
    appliedFilters.veiculos.marca,
    appliedFilters.veiculos.modelo,
    appliedFilters.veiculos.cor,
    appliedFilters.veiculos.formato,
    (appliedFilters.veiculos.origem || []).join(','),
    (appliedFilters.veiculos.etapa || []).join(','),
    appliedFilters.veiculos.ano?.join(',') || '',
    appliedFilters.veiculos.valorAvaliacao?.join(',') || '',
    appliedFilters.veiculos.valorDesconto?.join(',') || ''
  ]);

  // 🚀 QUERY KEY ÚNICO PARA CACHE INTELIGENTE
  const queryKey = QUERY_KEYS.auctions.list(
    category,
    currentType,
    filters,
    sortOption,
    debouncedSearchQuery,
    page,
    showExpiredAuctions
  );

  // 🚀 REACT QUERY COM CACHE INTELIGENTE
  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<AuctionSearchResult> => {
      console.log('🚀 Fetching auctions with React Query:', {
        category,
        currentType,
        filters,
        sortOption,
        search: debouncedSearchQuery,
        page,
        showExpiredAuctions
      });

      // 🔥 VERIFICAR CACHE AVANÇADO PRIMEIRO - COM TRATAMENTO DE ERRO
      let cached = null;
      try {
        const cacheKey = `${category}-${currentType}-${JSON.stringify(filters)}-${sortOption}-${debouncedSearchQuery}-${page}-${showExpiredAuctions}`;
        cached = advancedCache.get(cacheKey, 'auctions');

        if (cached) {
          console.log('📦 Advanced cache hit:', cacheKey);

          // ✅ VERIFICAÇÃO DE INTEGRIDADE: Se totalSites for muito baixo, invalidar cache
          if (cached.totalSites && cached.totalSites < 100) {
            console.warn('🚨 Cache com dados suspeitos (totalSites muito baixo), invalidando...', cached.totalSites);
            advancedCache.delete(cacheKey, 'auctions');
            cached = null;
          } else {
            return cached;
          }
        }
      } catch (error) {
        console.warn('Erro ao acessar cache avançado:', error);
        // Continuar sem cache se houver erro
      }

      // Buscar dados
      const result = await processRealAuctions(
        category,
        currentType,
        filters,
        sortOption,
        debouncedSearchQuery,
        page,
        showExpiredAuctions
      );

      // 🔥 SALVAR NO CACHE AVANÇADO - COM TRATAMENTO DE ERRO
      try {
        const cacheKey = `${category}-${currentType}-${JSON.stringify(filters)}-${sortOption}-${debouncedSearchQuery}-${page}-${showExpiredAuctions}`;
        advancedCache.set(cacheKey, result, 'auctions');
      } catch (error) {
        console.warn('Erro ao salvar no cache avançado:', error);
        // Continuar sem salvar no cache se houver erro
      }

      return result;
    },
    
    // 🔥 CONFIGURAÇÕES DE CACHE ESPECÍFICAS
    staleTime: 3 * 60 * 1000, // 3 minutos para leilões
    gcTime: 10 * 60 * 1000, // 10 minutos no cache
    
    // 🔥 REFETCH INTELIGENTE
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    
    // 🔥 RETRY CUSTOMIZADO
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false; // Não retry para erros 4xx
      }
      return failureCount < 2; // Máximo 2 tentativas
    },
    
    // 🔥 PLACEHOLDER DATA: Usar dados do cache enquanto carrega
    placeholderData: (previousData) => previousData,
    
    // 🔥 ENABLED: Só executar se tiver parâmetros válidos
    enabled: Boolean(category && currentType),
  });

  // 🚀 PREFETCH INTELIGENTE DE DADOS RELACIONADOS - DESABILITADO PARA EVITAR PROBLEMAS
  // useMemo(() => {
  //   if (query.isSuccess && !query.isFetching) {
  //     // Prefetch da categoria oposta após sucesso
  //     const timer = setTimeout(() => {
  //       prefetchQueries.relatedAuctions(category).catch(() => {
  //         // Ignorar erros de prefetch
  //       });
  //     }, 1000);

  //     return () => clearTimeout(timer);
  //   }
  // }, [query.isSuccess, query.isFetching, category]);

  // 🚀 RETORNAR DADOS COMPATÍVEIS COM useAuctionData
  return {
    auctions: query.data?.auctions || [],
    totalSites: query.data?.totalSites || 0,
    newAuctions: query.data?.newAuctions || 0,
    totalCount: query.data?.totalCount || 0, // Para paginação
    loading: query.isLoading || query.isFetching,
    error: query.error ? (query.error as Error).message : null,
    
    // 🚀 MÉTODOS ADICIONAIS DO REACT QUERY
    refetch: query.refetch,
    isStale: query.isStale,
    isFetching: query.isFetching,
    isPlaceholderData: query.isPlaceholderData,
    
    // 🚀 INVALIDAÇÃO MANUAL
    invalidate: () => {
      queryClient.invalidateQueries({ queryKey });
    },
    
    // 🚀 PREFETCH PRÓXIMA PÁGINA
    prefetchNextPage: () => {
      if (page < 10) { // Limite razoável
        const nextPageKey = QUERY_KEYS.auctions.list(
          category,
          currentType,
          filters,
          sortOption,
          debouncedSearchQuery,
          page + 1,
          showExpiredAuctions
        );
        
        queryClient.prefetchQuery({
          queryKey: nextPageKey,
          queryFn: () => processRealAuctions(
            category,
            currentType,
            filters,
            sortOption,
            debouncedSearchQuery,
            page + 1,
            showExpiredAuctions
          ),
          staleTime: 2 * 60 * 1000, // 2 minutos para prefetch
        });
      }
    }
  };
};

// 🚀 HOOK PARA INVALIDAR CACHE DE LEILÕES
export const useInvalidateAuctions = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.auctions.all });
    },
    
    invalidateCategory: (category: Category) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.auctions.lists(),
        predicate: (query) => {
          const data = query.queryKey[2] as any;
          return data?.category === category;
        }
      });
    },
    
    invalidateSpecific: (category: Category, currentType: string) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.auctions.lists(),
        predicate: (query) => {
          const data = query.queryKey[2] as any;
          return data?.category === category && data?.currentType === currentType;
        }
      });
    }
  };
};
