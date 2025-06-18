import * as React from "react"
import { RangeSlider } from "./RangeSlider"
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

  // ✅ INICIALIZAÇÃO: Usar ranges reais como valores padrão dos sliders
  const effectiveAreaRange = !rangesLoading && areaRange[0] !== 0 && areaRange[1] !== 0 ? areaRange : [0, 1000];
  const effectivePriceRange = !rangesLoading && priceRange[0] !== 0 && priceRange[1] !== 0 ? priceRange : [0, 5000000];

  // ✅ NOVO: Valor mínimo sempre inicia em 0 para área
  const effectiveAreaValue = filters.area[0] === 0 && filters.area[1] === 0
    ? [0, effectiveAreaRange[1]] // Mínimo sempre 0, máximo do range real
    : filters.area;

  // ✅ NOVO: Valor mínimo sempre inicia em 0 para preços
  const effectivePriceValue = filters.valor[0] === 0 && filters.valor[1] === 0
    ? [0, effectivePriceRange[1]] // Mínimo sempre 0, máximo do range real
    : filters.valor;



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

  const handleAreaChange = (value: [number, number]) => {
    actions.setStagedImoveisFilters({ area: value });
  };

  const handleValorChange = (value: [number, number]) => {
    actions.setStagedImoveisFilters({ valor: value });
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
      {/* Filtros específicos de imóveis */}
      
      {/* Área */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Área
        </label>
        {rangesLoading ? (
          <div className="space-y-4">
            <div className="h-2 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>
            </div>
          </div>
        ) : (
          <RangeSlider
            min={effectiveAreaRange[0]}
            max={effectiveAreaRange[1]}
            value={effectiveAreaValue}
            onValueChange={handleAreaChange}
            suffix="m²"
          />
        )}
        {error && (
          <p className="text-xs text-amber-600 mt-1">{error}</p>
        )}
      </div>

      {/* Valor do lance inicial */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Valor do lance inicial
        </label>
        {rangesLoading ? (
          <div className="space-y-4">
            <div className="h-2 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse"></div>
            </div>
          </div>
        ) : (
          <RangeSlider
            min={effectivePriceRange[0]}
            max={effectivePriceRange[1]}
            value={effectivePriceValue}
            onValueChange={handleValorChange}
            prefix="R$ "
          />
        )}
        {error && (
          <p className="text-xs text-amber-600 mt-1">{error}</p>
        )}
      </div>
    </BaseFilters>
  )
};