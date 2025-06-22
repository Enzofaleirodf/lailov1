import * as React from "react"
import { SwitchableRangeFilter } from "./SwitchableRangeFilter"
import { BaseFilters } from "./BaseFilters"
import { useAppContext } from "../../contexts/AppContext"
import { useRealRanges } from "../../hooks/useRealRanges"

interface ImoveisFiltersProps {
  currentPropertyType?: string;
}

export const ImoveisFilters: React.FC<ImoveisFiltersProps> = ({
  currentPropertyType = 'todos'
}) => {
  const { state, actions } = useAppContext();
  const filters = state.stagedFilters.imoveis;

  // ✅ RANGES DINÂMICOS: Buscar valores reais do banco de dados baseados na rota
  const { areaRange, priceRange, loading: rangesLoading, error } = useRealRanges({
    category: 'imoveis',
    currentType: currentPropertyType,
    showExpiredAuctions: state.showExpiredAuctions
  });

  // ✅ CORREÇÃO: Usar ranges grandes para permitir qualquer valor
  const effectiveAreaRange: [number, number] = [0, 999999];
  const effectivePriceRange: [number, number] = [0, 999999999];

  // ✅ CORREÇÃO: Usar ranges dinâmicos do banco de dados
  const areaOptions = [
    {
      id: 'm2',
      label: 'm²',
      suffix: 'm²',
      range: areaRange && areaRange[0] !== 0 && areaRange[1] !== 0 ? areaRange : [0, 999999] as [number, number],
      value: filters.areaM2
    },
    {
      id: 'hectares',
      label: 'ha',
      suffix: 'ha',
      range: areaRange && areaRange[0] !== 0 && areaRange[1] !== 0 ? [Math.floor(areaRange[0] / 10000), Math.ceil(areaRange[1] / 10000)] : [0, 100] as [number, number],
      value: filters.areaHectares
    }
  ];

  const valorOptions = [
    {
      id: 'avaliacao',
      label: 'Avaliação',
      prefix: 'R$ ',
      range: priceRange && priceRange[0] !== 0 && priceRange[1] !== 0 ? priceRange : [0, 999999999] as [number, number],
      value: filters.valorAvaliacao
    },
    {
      id: 'desconto',
      label: 'com desconto',
      prefix: 'R$ ',
      range: priceRange && priceRange[0] !== 0 && priceRange[1] !== 0 ? priceRange : [0, 999999999] as [number, number],
      value: filters.valorDesconto
    }
  ];



  // ✅ FORMATAÇÃO CORRETA: M só para milhões (1.000.000+), B só para bilhões (1.000.000.000+)
  const formatPriceValue = (value: number): string => {
    if (value >= 1000000000) {
      // Bilhões: 1.000.000.000+ → "1B", "1.5B"
      return `${(value / 1000000000).toFixed(1).replace('.0', '')}B`;
    }
    if (value >= 1000000) {
      // Milhões: 1.000.000+ → "1M", "1.5M"
      return `${(value / 1000000).toFixed(1).replace('.0', '')}M`;
    }
    // Abaixo de 1 milhão: formatação brasileira padrão
    return value.toLocaleString('pt-BR');
  };



  // 🔧 CORREÇÃO: Handlers simples não precisam de useCallback
  const handleEstadoChange = (value: string) => {
    actions.setStagedImoveisFilters({ estado: value });
  };

  const handleCidadeChange = (value: string) => {
    actions.setStagedImoveisFilters({ cidade: value });
  };

  const handleFormatoChange = (value: string) => {
    actions.setStagedImoveisFilters({ formato: value });
  };

  const handleOrigemChange = (value: string[]) => {
    actions.setStagedImoveisFilters({ origem: value });
  };

  const handleEtapaChange = (value: string[]) => {
    actions.setStagedImoveisFilters({ etapa: value });
  };

  // ✅ NOVO: Handlers para filtros com switch
  const handleAreaTypeChange = (areaType: string) => {
    actions.setStagedImoveisFilters({ areaType: areaType as 'm2' | 'hectares' });
  };

  const handleAreaValueChange = (optionId: string, value: [number, number]) => {
    if (optionId === 'm2') {
      actions.setStagedImoveisFilters({ areaM2: value });
    } else if (optionId === 'hectares') {
      actions.setStagedImoveisFilters({ areaHectares: value });
    }
  };

  const handleValorTypeChange = (valorType: string) => {
    // 🔧 CORREÇÃO UX: Limpar range anterior ao trocar switch
    if (valorType === 'avaliacao') {
      actions.setStagedImoveisFilters({
        valorType: 'avaliacao',
        valorDesconto: [0, 0]  // Limpar valores de desconto
      });
    } else {
      actions.setStagedImoveisFilters({
        valorType: 'desconto',
        valorAvaliacao: [0, 0]  // Limpar valores de avaliação
      });
    }
  };

  const handleValorValueChange = (optionId: string, value: [number, number]) => {
    if (optionId === 'avaliacao') {
      actions.setStagedImoveisFilters({ valorAvaliacao: value });
    } else if (optionId === 'desconto') {
      actions.setStagedImoveisFilters({ valorDesconto: value });
    }
  };

  return (
    <BaseFilters
      category="imoveis" // ✅ NOVO: Passar categoria
      estado={filters.estado}
      cidade={filters.cidade}
      formato={filters.formato}
      origem={filters.origem}
      etapa={filters.etapa}
      onEstadoChange={handleEstadoChange}
      onCidadeChange={handleCidadeChange}
      onFormatoChange={handleFormatoChange}
      onOrigemChange={handleOrigemChange}
      onEtapaChange={handleEtapaChange}
    >
      {/* 🎯 2. ÁREA COM SWITCH - PRIMÁRIO */}
      <SwitchableRangeFilter
        title="Área"
        options={areaOptions}
        activeOption={filters.areaType}
        onOptionChange={handleAreaTypeChange}
        onValueChange={handleAreaValueChange}
      />

      {/* 🎯 3. VALOR COM SWITCH - PRIMÁRIO */}
      <SwitchableRangeFilter
        title="Valor"
        options={valorOptions}
        activeOption={filters.valorType}
        onOptionChange={handleValorTypeChange}
        onValueChange={handleValorValueChange}
      />
    </BaseFilters>
  )
};