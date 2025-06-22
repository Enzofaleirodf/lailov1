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
      (filters.origem && filters.origem.length > 0) ||
      (filters.etapa && filters.etapa.length > 0) ||
      (category === 'veiculos' && (
        (filters.marca && filters.marca !== "all") ||
        (filters.modelo && filters.modelo !== "all") ||
        (filters.cor && filters.cor !== "all") ||
        // ✅ CORREÇÃO: Verificar se há valores válidos (não undefined)
        (filters.ano && filters.ano.length > 0 && filters.ano[0] !== undefined && filters.ano[1] !== undefined && (filters.ano[0] > 0 || filters.ano[1] > 0)) ||
        (filters.valorAvaliacao && filters.valorAvaliacao.length > 0 && filters.valorAvaliacao[0] !== undefined && filters.valorAvaliacao[1] !== undefined && (filters.valorAvaliacao[0] > 0 || filters.valorAvaliacao[1] > 0)) ||
        (filters.valorDesconto && filters.valorDesconto.length > 0 && filters.valorDesconto[0] !== undefined && filters.valorDesconto[1] !== undefined && (filters.valorDesconto[0] > 0 || filters.valorDesconto[1] > 0))
      )) ||
      (category === 'imoveis' && (
        // ✅ CORREÇÃO: Verificar se há valores válidos (não undefined)
        (filters.areaM2 && filters.areaM2.length > 0 && filters.areaM2[0] !== undefined && filters.areaM2[1] !== undefined && (filters.areaM2[0] > 0 || filters.areaM2[1] > 0)) ||
        (filters.areaHectares && filters.areaHectares.length > 0 && filters.areaHectares[0] !== undefined && filters.areaHectares[1] !== undefined && (filters.areaHectares[0] > 0 || filters.areaHectares[1] > 0)) ||
        (filters.valorAvaliacao && filters.valorAvaliacao.length > 0 && filters.valorAvaliacao[0] !== undefined && filters.valorAvaliacao[1] !== undefined && (filters.valorAvaliacao[0] > 0 || filters.valorAvaliacao[1] > 0)) ||
        (filters.valorDesconto && filters.valorDesconto.length > 0 && filters.valorDesconto[0] !== undefined && filters.valorDesconto[1] !== undefined && (filters.valorDesconto[0] > 0 || filters.valorDesconto[1] > 0))
      ))
    );
    
    return hasActiveFilters;
  }, [
    category,
    // 🔧 CORREÇÃO: Usar dependências específicas em vez de JSON.stringify
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
};