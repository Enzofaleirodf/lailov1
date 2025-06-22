import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { processRealAuctions } from '../services/realAuctionService';
import { useDebounce } from './useDebounce';
import { QUERY_KEYS } from '../lib/queryClient';
import {
  Category,
  SortOption,
  Filters,
  AuctionSearchResult,
  UseAuctionDataParams,
  Auction
} from '../types/auction';

// 🚀 INTERFACE PARA INFINITE SCROLL
interface UseInfiniteAuctionsParams extends Omit<UseAuctionDataParams, 'page'> {
  enabled?: boolean;
}

interface InfiniteAuctionsResult {
  auctions: Auction[];
  totalSites: number;
  newAuctions: number;
  totalCount: number;
  loading: boolean;
  error: string | null;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
}

// 🚀 HOOK PARA INFINITE SCROLL COM REACT QUERY
export const useInfiniteAuctionsQuery = ({
  category,
  currentType,
  appliedFilters,
  sortOption,
  searchQuery,
  showExpiredAuctions,
  enabled = true
}: UseInfiniteAuctionsParams): InfiniteAuctionsResult => {
  
  // 🚀 DEBOUNCE OTIMIZADO: 300ms para responsividade
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 🚀 MEMOIZAR FILTROS PARA EVITAR RE-RENDERS
  const filters = useMemo((): Filters => {
    return category === 'imoveis' ? {
      format: appliedFilters.imoveis.formato || undefined,
      origin: appliedFilters.imoveis.origem.length > 0 ? appliedFilters.imoveis.origem : undefined,
      stage: appliedFilters.imoveis.etapa.length > 0 ? appliedFilters.imoveis.etapa : undefined,
      state: appliedFilters.imoveis.estado && appliedFilters.imoveis.estado !== "all" ? appliedFilters.imoveis.estado : undefined,
      city: appliedFilters.imoveis.cidade && appliedFilters.imoveis.cidade !== "all" ? appliedFilters.imoveis.cidade : undefined,
      useful_area_m2: (appliedFilters.imoveis.area[0] !== 0 || appliedFilters.imoveis.area[1] !== 0) ? appliedFilters.imoveis.area : undefined,
      initial_bid_value: (appliedFilters.imoveis.valor[0] !== 0 || appliedFilters.imoveis.valor[1] !== 0) ? appliedFilters.imoveis.valor : undefined
    } : {
      format: appliedFilters.veiculos.formato || undefined,
      origin: appliedFilters.veiculos.origem.length > 0 ? appliedFilters.veiculos.origem : undefined,
      stage: appliedFilters.veiculos.etapa.length > 0 ? appliedFilters.veiculos.etapa : undefined,
      state: appliedFilters.veiculos.estado && appliedFilters.veiculos.estado !== "all" ? appliedFilters.veiculos.estado : undefined,
      city: appliedFilters.veiculos.cidade && appliedFilters.veiculos.cidade !== "all" ? appliedFilters.veiculos.cidade : undefined,
      brand: appliedFilters.veiculos.marca && appliedFilters.veiculos.marca !== "all" ? appliedFilters.veiculos.marca : undefined,
      model: appliedFilters.veiculos.modelo && appliedFilters.veiculos.modelo !== "all" ? appliedFilters.veiculos.modelo : undefined,
      color: appliedFilters.veiculos.cor && appliedFilters.veiculos.cor !== "all" ? appliedFilters.veiculos.cor : undefined,
      year: (appliedFilters.veiculos.ano[0] !== 0 || appliedFilters.veiculos.ano[1] !== 0) ? appliedFilters.veiculos.ano : undefined,
      initial_bid_value: (appliedFilters.veiculos.preco[0] !== 0 || appliedFilters.veiculos.preco[1] !== 0) ? appliedFilters.veiculos.preco : undefined
    };
  }, [
    category,
    appliedFilters.imoveis.estado,
    appliedFilters.imoveis.cidade,
    appliedFilters.imoveis.formato,
    appliedFilters.imoveis.origem.join(','),
    appliedFilters.imoveis.etapa.join(','),
    appliedFilters.imoveis.area.join(','),
    appliedFilters.imoveis.valor.join(','),
    appliedFilters.veiculos.estado,
    appliedFilters.veiculos.cidade,
    appliedFilters.veiculos.marca,
    appliedFilters.veiculos.modelo,
    appliedFilters.veiculos.cor,
    appliedFilters.veiculos.formato,
    appliedFilters.veiculos.origem.join(','),
    appliedFilters.veiculos.etapa.join(','),
    appliedFilters.veiculos.ano.join(','),
    appliedFilters.veiculos.preco.join(',')
  ]);

  // 🚀 INFINITE QUERY COM REACT QUERY
  const query = useInfiniteQuery({
    queryKey: [
      ...QUERY_KEYS.auctions.all,
      'infinite',
      {
        category,
        currentType,
        filters,
        sortOption,
        search: debouncedSearchQuery,
        showExpiredAuctions
      }
    ],
    
    queryFn: async ({ pageParam = 1 }): Promise<AuctionSearchResult> => {
      console.log('🚀 Fetching infinite auctions page:', pageParam, {
        category,
        currentType,
        filters,
        sortOption,
        search: debouncedSearchQuery,
        showExpiredAuctions
      });

      return await processRealAuctions(
        category,
        currentType,
        filters,
        sortOption,
        debouncedSearchQuery,
        pageParam,
        showExpiredAuctions
      );
    },

    // 🔥 CONFIGURAÇÃO DE PÁGINAS
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      // Se a última página tem menos de 30 itens, não há próxima página
      if (!lastPage.auctions || lastPage.auctions.length < 30) {
        return undefined;
      }
      
      // Próxima página
      return allPages.length + 1;
    },

    // 🔥 CONFIGURAÇÕES DE CACHE
    staleTime: 3 * 60 * 1000, // 3 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos

    // 🔥 REFETCH INTELIGENTE
    refetchOnWindowFocus: false, // Desabilitar para infinite scroll
    refetchOnReconnect: true,

    // 🔥 ENABLED: Só executar se tiver parâmetros válidos
    enabled: enabled && Boolean(category && currentType),

    // 🔥 RETRY CUSTOMIZADO
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 2;
    },
  });

  // 🚀 COMBINAR TODAS AS PÁGINAS EM UMA LISTA ÚNICA
  const allAuctions = useMemo(() => {
    if (!query.data?.pages) return [];
    
    return query.data.pages.flatMap(page => page.auctions || []);
  }, [query.data?.pages]);

  // 🚀 EXTRAIR METADADOS DA PRIMEIRA PÁGINA
  const firstPage = query.data?.pages?.[0];
  const totalSites = firstPage?.totalSites || 0;
  const newAuctions = firstPage?.newAuctions || 0;
  const totalCount = firstPage?.totalCount || 0;

  // 🚀 RETORNAR INTERFACE COMPATÍVEL
  return {
    auctions: allAuctions,
    totalSites,
    newAuctions,
    totalCount,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    hasNextPage: query.hasNextPage || false,
    isFetchingNextPage: query.isFetchingNextPage,
    fetchNextPage: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) {
        query.fetchNextPage();
      }
    },
    refetch: query.refetch,
  };
};

// 🚀 HOOK PARA DETECTAR SE DEVE USAR VIRTUALIZAÇÃO
export const useShouldVirtualize = (itemCount: number, threshold: number = 50): boolean => {
  return useMemo(() => {
    // Virtualizar se:
    // 1. Mais de 50 itens
    // 2. Dispositivo móvel com mais de 30 itens
    // 3. Performance baixa detectada
    
    const isMobile = window.innerWidth < 768;
    const mobileThreshold = 30;
    
    if (isMobile && itemCount > mobileThreshold) return true;
    if (itemCount > threshold) return true;
    
    return false;
  }, [itemCount, threshold]);
};
