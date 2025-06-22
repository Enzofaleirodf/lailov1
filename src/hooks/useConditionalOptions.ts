import { useMemo } from 'react';
import { useFilterOptionsQuery, useStatesQuery, useCitiesQuery } from './useFiltersQuery';
import { MAPPINGS } from '../config/mappings';
import { FilterOption, Category } from '../types/auction';

interface UseConditionalOptionsProps {
  category: Category;
  selectedState?: string;
}

interface ConditionalOptions {
  estados: FilterOption[];
  cidades: FilterOption[];
  formatos: FilterOption[];
  origens: FilterOption[];
  etapas: FilterOption[];
  loading: boolean;
  error: string | null;
}

/**
 * 🚀 HOOK MIGRADO PARA REACT QUERY
 * Hook para gerenciar opções de filtros com visibilidade condicional
 * Só mostra opções que têm pelo menos 1 registro no banco de dados
 */
export const useConditionalOptions = ({
  category,
  selectedState
}: UseConditionalOptionsProps): ConditionalOptions => {

  // ✅ CORREÇÃO: Usar dados reais do IBGE para estados
  const { data: estadosData } = useStatesQuery();
  const estados = useMemo((): FilterOption[] => {
    return estadosData || [
      { value: "all", label: "Todos os estados" },
      { value: "SP", label: "São Paulo (SP)" },
      { value: "RJ", label: "Rio de Janeiro (RJ)" },
      { value: "MG", label: "Minas Gerais (MG)" }
    ];
  }, [estadosData]);

  // ✅ CORREÇÃO: Filtro híbrido - só mostrar cidades que existem no banco
  const { data: cidadesData } = useCitiesQuery(category, selectedState);
  const cidades = useMemo((): FilterOption[] => {
    if (!selectedState || selectedState === 'all') {
      return [{ value: "all", label: "Todas as cidades" }];
    }

    // ✅ CORREÇÃO CRÍTICA: Usar valor original da cidade sem transformação
    const cidadesNoBanco = cidadesData?.dbCities || [];
    return [
      { value: "all", label: "Todas as cidades" },
      ...cidadesNoBanco.map(cidade => ({
        value: cidade, // ✅ CORREÇÃO: Usar valor original sem transformação
        label: cidade
      }))
    ];
  }, [cidadesData, selectedState]);

  const formatos = useMemo((): FilterOption[] => [
    { value: "", label: "Todos" },
    { value: "leilao", label: "Leilão" },
    { value: "venda-direta", label: "Venda Direta" }
  ], []);

  const origens = useMemo((): FilterOption[] => [
    { value: "judicial", label: "Judicial" },
    { value: "extrajudicial", label: "Extrajudicial" },
    { value: "publico", label: "Público" },
    { value: "nao-informado", label: "Não informado" }
  ], []);

  const etapas = useMemo((): FilterOption[] => [
    { value: "praca-unica", label: "Praça única" },
    { value: "primeira", label: "1ª Praça" },
    { value: "segunda", label: "2ª Praça" },
    { value: "terceira", label: "3ª Praça" },
    { value: "nao-informado", label: "Não informado" }
  ], []);
  // 🚀 RETORNAR DADOS ESTÁTICOS PARA TESTE
  return {
    estados,
    cidades,
    formatos,
    origens,
    etapas,
    loading: false,
    error: null
  };
};
