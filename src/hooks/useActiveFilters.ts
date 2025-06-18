import { useMemo } from 'react';
import { Category, UseActiveFiltersParams } from '../types/auction';
import { FILTER_CONFIG } from '../config/constants';

export const useActiveFilters = ({ category, appliedFilters }: UseActiveFiltersParams): boolean => {
  // 🚀 OTIMIZAÇÃO: useMemo com dependências estáveis
  return useMemo(() => {
    const filters = category === 'imoveis' ? appliedFilters.imoveis : appliedFilters.veiculos;
    
    const hasActiveFilters = (
      (filters.estado && filters.estado !== "all") ||
      (filters.cidade && filters.cidade !== "all") ||
      filters.formato ||
      filters.origem.length > 0 ||
      filters.etapa.length > 0 ||
      (category === 'veiculos' && (
        (filters.marca && filters.marca !== "all") ||
        (filters.modelo && filters.modelo !== "all") ||
        (filters.cor && filters.cor !== "all") ||
        filters.ano[0] !== FILTER_CONFIG.DEFAULT_RANGES.VEHICLE_YEAR.MIN ||
        filters.ano[1] !== FILTER_CONFIG.DEFAULT_RANGES.VEHICLE_YEAR.MAX ||
        filters.preco[0] !== FILTER_CONFIG.DEFAULT_RANGES.VEHICLE_PRICE.MIN ||
        filters.preco[1] !== FILTER_CONFIG.DEFAULT_RANGES.VEHICLE_PRICE.MAX
      )) ||
      (category === 'imoveis' && (
        filters.area[0] !== FILTER_CONFIG.DEFAULT_RANGES.PROPERTY_AREA.MIN ||
        filters.area[1] !== FILTER_CONFIG.DEFAULT_RANGES.PROPERTY_AREA.MAX ||
        filters.valor[0] !== FILTER_CONFIG.DEFAULT_RANGES.PROPERTY_VALUE.MIN ||
        filters.valor[1] !== FILTER_CONFIG.DEFAULT_RANGES.PROPERTY_VALUE.MAX
      ))
    );
    
    return hasActiveFilters;
  }, [
    category,
    // 🔧 CORREÇÃO: Usar dependências específicas em vez de JSON.stringify
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
};