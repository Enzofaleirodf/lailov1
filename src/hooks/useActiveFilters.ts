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
        // ✅ CORREÇÃO: Só considerar ativo se não estiver no estado inicial [0,0]
        !(filters.ano[0] === 0 && filters.ano[1] === 0) ||
        !(filters.preco[0] === 0 && filters.preco[1] === 0)
      )) ||
      (category === 'imoveis' && (
        // ✅ CORREÇÃO: Só considerar ativo se não estiver no estado inicial [0,0]
        !(filters.area[0] === 0 && filters.area[1] === 0) ||
        !(filters.valor[0] === 0 && filters.valor[1] === 0)
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