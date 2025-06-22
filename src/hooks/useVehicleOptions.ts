import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FilterOption } from '../types/auction';

/**
 * 🚀 HOOK DINÂMICO COM REACT QUERY - Hook para buscar opções dinâmicas de veículos
 */
export const useVehicleOptions = (category?: string) => {
  const [models, setModels] = useState<FilterOption[]>([{ value: "all", label: "Todos os modelos" }]);
  const [loadingModels, setLoadingModels] = useState(false);

  // 🚀 BUSCAR MARCAS COM REACT QUERY (HÍBRIDO)
  const { data: brandsData, isLoading: brandsLoading, error: brandsError } = useQuery({
    queryKey: ['vehicle-brands-hybrid', 'v3-category', category || 'todos'],
    queryFn: async () => {
      const { auctions } = await import('../lib/database');
      return await auctions.getVehicleBrands(category);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });

  // 🚀 PROCESSAR MARCAS PARA FORMATO DE FILTRO
  const brands: FilterOption[] = brandsData ? [
    { value: "all", label: "Todas as marcas" },
    ...brandsData.map(brand => ({
      value: brand, // ✅ CORREÇÃO: Usar valor original sem transformação
      label: brand
    }))
  ] : [{ value: "all", label: "Todas as marcas" }];



  // 🚀 BUSCAR CORES COM REACT QUERY (HÍBRIDO)
  const { data: colorsData, isLoading: colorsLoading, error: colorsError } = useQuery({
    queryKey: ['vehicle-colors-hybrid', 'v2-category', category || 'todos'],
    queryFn: async () => {
      const { auctions } = await import('../lib/database');
      return await auctions.getVehicleColors(category);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 2,
  });

  // 🚀 PROCESSAR CORES PARA FORMATO DE FILTRO
  const colors: FilterOption[] = colorsData ? [
    { value: "all", label: "Todas as cores" },
    ...colorsData.map(color => ({
      value: color, // ✅ CORREÇÃO: Usar valor original sem transformação
      label: color
    }))
  ] : [{ value: "all", label: "Todas as cores" }];



  // 🚀 FUNÇÃO DINÂMICA PARA BUSCAR MODELOS
  const fetchModels = useCallback(async (selectedBrand: string) => {
    try {
      if (!selectedBrand || selectedBrand === 'all') {
        setModels([{ value: "all", label: "Todos os modelos" }]);
        return;
      }

      setLoadingModels(true);

      // ✅ CORREÇÃO: Usar o valor da marca diretamente (agora é o nome original)
      const brandName = selectedBrand;
      console.log('🚗 Buscando modelos para marca:', brandName);

      // 🚀 BUSCAR MODELOS DO BANCO DE DADOS
      const { auctions } = await import('../lib/database');
      const modelsData = await auctions.getVehicleModels(brandName);

      console.log('🚗 Modelos encontrados:', modelsData.length);

      const modelOptions: FilterOption[] = [
        { value: "all", label: "Todos os modelos" },
        ...modelsData.map(model => ({
          value: model, // ✅ CORREÇÃO: Usar valor original sem transformação
          label: model
        }))
      ];

      setModels(modelOptions);

    } catch (err) {
      console.error('❌ Erro ao buscar modelos:', err);
      setModels([{ value: "all", label: "Todos os modelos" }]);
    } finally {
      setLoadingModels(false);
    }
  }, [brands]);

  return {
    brands,
    models,
    colors,
    loading: brandsLoading || colorsLoading,
    loadingModels,
    error: brandsError || colorsError,
    fetchModels
  };
};
