import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getEstadosOptions, fetchMunicipiosByEstado } from '../utils/ibgeApi';
import { QUERY_KEYS } from '../lib/queryClient';
import { Category, IBGEMunicipio } from '../types/auction';

// 🚀 HOOK PARA OPÇÕES DE FILTROS COM REACT QUERY
export const useFilterOptionsQuery = (category: Category) => {
  return useQuery({
    queryKey: QUERY_KEYS.filters.options(category),
    queryFn: async () => {
      console.log('🚀 Fetching filter options with React Query:', category);

      // 🚀 DYNAMIC IMPORT para evitar conflito de code splitting
      const { auctions } = await import('../lib/database');

      const [states, formats, origins, stages] = await Promise.all([
        auctions.getAvailableStates(category),
        auctions.getAvailableFormats(category),
        auctions.getAvailableOrigins(category),
        auctions.getAvailableStages(category)
      ]);

      return { states, formats, origins, stages };
    },
    
    // 🔥 CACHE LONGO PARA FILTROS (DADOS ESTÁTICOS)
    staleTime: 10 * 60 * 1000, // 10 minutos
    gcTime: 30 * 60 * 1000, // 30 minutos no cache
    
    // 🔥 REFETCH APENAS QUANDO NECESSÁRIO
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    
    // 🔥 RETRY LIMITADO PARA FILTROS
    retry: 1,
  });
};

// 🚀 HOOK PARA RANGES DE FILTROS COM REACT QUERY
export const useFilterRangesQuery = (
  category: Category,
  currentType?: string,
  showExpiredAuctions: boolean = false
) => {
  return useQuery({
    queryKey: QUERY_KEYS.filters.ranges(category, currentType || 'todos', showExpiredAuctions),
    queryFn: async () => {
      console.log('🚀 Fetching filter ranges with React Query:', { category, currentType, showExpiredAuctions });

      // 🚀 DYNAMIC IMPORT para evitar conflito de code splitting
      const { auctions } = await import('../lib/database');

      const [areaRange, priceRange, yearRange] = await Promise.all([
        auctions.getAreaRange(category, currentType, showExpiredAuctions),
        auctions.getPriceRange(category, currentType, showExpiredAuctions),
        auctions.getYearRange(category, currentType, showExpiredAuctions)
      ]);

      return {
        areaRange: areaRange || [0, 0],
        priceRange: priceRange || [0, 0],
        yearRange: yearRange || [0, 0]
      };
    },
    
    // 🔥 CACHE MÉDIO PARA RANGES (PODEM MUDAR COM NOVOS LEILÕES)
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000, // 15 minutos no cache
    
    // 🔥 REFETCH QUANDO NECESSÁRIO
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    
    // 🔥 ENABLED APENAS SE TIVER CATEGORIA
    enabled: Boolean(category),
    
    // 🔥 PLACEHOLDER DATA
    placeholderData: {
      areaRange: [0, 0] as [number, number],
      priceRange: [0, 0] as [number, number],
      yearRange: [0, 0] as [number, number]
    },
  });
};

// 🚀 HOOK PARA CIDADES COM REACT QUERY
export const useCitiesQuery = (
  category: Category,
  selectedState?: string
) => {
  return useQuery({
    queryKey: QUERY_KEYS.filters.cities(category, selectedState || ''),
    queryFn: async () => {
      if (!selectedState || selectedState === 'all') {
        return { ibgeCities: [], dbCities: [] };
      }

      console.log('🚀 Fetching cities with React Query:', { category, selectedState });
      
      // 🚀 DYNAMIC IMPORT para evitar conflito de code splitting
      const { auctions } = await import('../lib/database');

      // Buscar cidades do IBGE e do banco em paralelo
      const [ibgeCities, dbCities] = await Promise.all([
        fetchMunicipiosByEstado(selectedState),
        auctions.getAvailableCities(category, selectedState)
      ]);

      return { ibgeCities, dbCities };
    },
    
    // 🔥 CACHE LONGO PARA CIDADES (DADOS ESTÁTICOS)
    staleTime: 15 * 60 * 1000, // 15 minutos
    gcTime: 60 * 60 * 1000, // 1 hora no cache
    
    // 🔥 REFETCH APENAS QUANDO NECESSÁRIO
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    
    // 🔥 ENABLED APENAS SE TIVER ESTADO SELECIONADO
    enabled: Boolean(selectedState && selectedState !== 'all'),
    
    // 🔥 PLACEHOLDER DATA
    placeholderData: { ibgeCities: [], dbCities: [] },
  });
};

// 🚀 HOOK PARA ESTADOS (IBGE) COM REACT QUERY
export const useStatesQuery = () => {
  return useQuery({
    queryKey: ['states', 'ibge'],
    queryFn: async () => {
      console.log('🚀 Fetching states with React Query');
      return await getEstadosOptions();
    },
    
    // 🔥 CACHE MUITO LONGO PARA ESTADOS (DADOS ESTÁTICOS)
    staleTime: 60 * 60 * 1000, // 1 hora
    gcTime: 24 * 60 * 60 * 1000, // 24 horas no cache
    
    // 🔥 NUNCA REFETCH (DADOS ESTÁTICOS)
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    
    // 🔥 SEM RETRY (DADOS CRÍTICOS)
    retry: false,
  });
};

// 🚀 HOOK COMBINADO PARA TODOS OS FILTROS
export const useAllFiltersQuery = (
  category: Category,
  currentType?: string,
  selectedState?: string,
  showExpiredAuctions: boolean = false
) => {
  const optionsQuery = useFilterOptionsQuery(category);
  const rangesQuery = useFilterRangesQuery(category, currentType, showExpiredAuctions);
  const citiesQuery = useCitiesQuery(category, selectedState);
  const statesQuery = useStatesQuery();

  return {
    // Dados
    options: optionsQuery.data,
    ranges: rangesQuery.data,
    cities: citiesQuery.data,
    states: statesQuery.data,
    
    // Estados de loading
    isLoading: optionsQuery.isLoading || rangesQuery.isLoading || statesQuery.isLoading,
    isFetching: optionsQuery.isFetching || rangesQuery.isFetching || citiesQuery.isFetching || statesQuery.isFetching,
    
    // Erros
    error: optionsQuery.error || rangesQuery.error || citiesQuery.error || statesQuery.error,
    
    // Métodos de refetch
    refetchOptions: optionsQuery.refetch,
    refetchRanges: rangesQuery.refetch,
    refetchCities: citiesQuery.refetch,
    refetchStates: statesQuery.refetch,
    
    // Refetch tudo
    refetchAll: () => {
      optionsQuery.refetch();
      rangesQuery.refetch();
      if (selectedState && selectedState !== 'all') {
        citiesQuery.refetch();
      }
      statesQuery.refetch();
    }
  };
};

// 🚀 HOOK PARA INVALIDAR CACHE DE FILTROS
export const useInvalidateFilters = () => {
  const queryClient = useQueryClient();
  
  return {
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.filters.all });
    },
    
    invalidateOptions: (category: Category) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.filters.options(category) });
    },
    
    invalidateRanges: (category: Category) => {
      queryClient.invalidateQueries({ 
        queryKey: QUERY_KEYS.filters.all,
        predicate: (query) => {
          return query.queryKey[1] === 'ranges' && 
                 (query.queryKey[2] as any)?.category === category;
        }
      });
    },
    
    invalidateCities: (category: Category, state?: string) => {
      if (state) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.filters.cities(category, state) });
      } else {
        queryClient.invalidateQueries({ 
          queryKey: QUERY_KEYS.filters.all,
          predicate: (query) => {
            return query.queryKey[1] === 'cities' && 
                   (query.queryKey[2] as any)?.category === category;
          }
        });
      }
    }
  };
};
