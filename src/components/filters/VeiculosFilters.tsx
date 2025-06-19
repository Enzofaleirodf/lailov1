import * as React from "react"
import { useEffect } from "react"
import { ComboBoxSearch } from "./ComboBoxSearch"
import { RangeSlider } from "./RangeSlider"
import { BaseFilters } from "./BaseFilters"
import { useAppContext } from "../../contexts/AppContext"
import { useVehicleOptions } from "../../hooks/useVehicleOptions" // ✅ BUSCA DINÂMICA
import { LABEL_CONFIG } from "../../config/constants"
import { useRealRanges } from "../../hooks/useRealRanges"

interface VeiculosFiltersProps {
  currentVehicleType?: string;
}

export const VeiculosFilters: React.FC<VeiculosFiltersProps> = ({
  currentVehicleType = 'todos'
}) => {
  const { state, actions } = useAppContext();
  const filters = state.stagedFilters.veiculos;

  // ✅ BUSCA DINÂMICA: Usar hook para buscar dados reais do banco
  const { brands, models, colors, loading, error, fetchModels } = useVehicleOptions();

  // ✅ RANGES DINÂMICOS: Buscar valores reais do banco de dados
  const { priceRange, yearRange, loading: rangesLoading, error: rangesError } = useRealRanges({
    category: 'veiculos',
    currentType: currentVehicleType,
    showExpiredAuctions: state.showExpiredAuctions
  });

  // ✅ INICIALIZAÇÃO: Usar ranges reais como valores padrão dos sliders
  const effectiveYearRange = !rangesLoading && yearRange[0] !== 0 && yearRange[1] !== 0 ? yearRange : [1990, 2024];
  const effectivePriceRange = !rangesLoading && priceRange[0] !== 0 && priceRange[1] !== 0 ? priceRange : [0, 500000];

  const effectiveYearValue = filters.ano[0] === 0 && filters.ano[1] === 0 ? effectiveYearRange : filters.ano;

  // ✅ NOVO: Valor mínimo sempre inicia em 0 para preços
  const effectivePriceValue = filters.preco[0] === 0 && filters.preco[1] === 0
    ? [0, effectivePriceRange[1]] // Mínimo sempre 0, máximo do range real
    : filters.preco;



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



  // ✅ BUSCA DINÂMICA: Buscar modelos quando marca mudar
  useEffect(() => {
    if (filters.marca) {
      fetchModels(filters.marca);
    }
  }, [filters.marca, fetchModels]);
  
  const shouldShowBrandModelFilters = currentVehicleType !== 'todos' && currentVehicleType !== 'nao-informado';

  const handleEstadoChange = (value: string): void => {
    actions.setStagedVeiculosFilters({ estado: value });
  };

  const handleCidadeChange = (value: string): void => {
    actions.setStagedVeiculosFilters({ cidade: value });
  };

  const handleFormatoChange = (value: string): void => {
    actions.setStagedVeiculosFilters({ formato: value });
  };

  const handleOrigemChange = (value: string[]): void => {
    actions.setStagedVeiculosFilters({ origem: value });
  };

  const handleEtapaChange = (value: string[]): void => {
    actions.setStagedVeiculosFilters({ etapa: value });
  };

  const handleMarcaChange = (value: string): void => {
    actions.setStagedVeiculosFilters({ 
      marca: value,
      modelo: "" // Reset modelo when marca changes
    });
  };

  const handleModeloChange = (value: string): void => {
    actions.setStagedVeiculosFilters({ modelo: value });
  };

  const handleCorChange = (value: string): void => {
    actions.setStagedVeiculosFilters({ cor: value });
  };

  const handleAnoChange = (value: [number, number]): void => {
    actions.setStagedVeiculosFilters({ ano: value });
  };

  const handlePrecoChange = (value: [number, number]): void => {
    actions.setStagedVeiculosFilters({ preco: value });
  };

  return (
    <BaseFilters
      category="veiculos" // ✅ NOVO: Passar categoria
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
      {/* 🎯 2. CARACTERÍSTICAS DO VEÍCULO - PRIMÁRIO */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <label className="block text-base font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
          Características do Veículo
        </label>
        <div className="space-y-4">
          {/* Marca e Modelo */}
          {shouldShowBrandModelFilters && (
            <div>
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Marca e Modelo
              </label>
              <div className="grid grid-cols-1 gap-2">
                <ComboBoxSearch
                  options={brands}
                  value={filters.marca}
                  onValueChange={handleMarcaChange}
                  placeholder={loading ? "Carregando marcas..." : LABEL_CONFIG.PLACEHOLDERS.SELECT_BRAND}
                  searchPlaceholder={LABEL_CONFIG.PLACEHOLDERS.SEARCH_BRAND}
                  disabled={loading}
                />
                <ComboBoxSearch
                  options={models}
                  value={filters.modelo}
                  onValueChange={handleModeloChange}
                  placeholder={LABEL_CONFIG.PLACEHOLDERS.SELECT_MODEL}
                  searchPlaceholder={LABEL_CONFIG.PLACEHOLDERS.SEARCH_MODEL}
                  disabled={!filters.marca || filters.marca === "all" || loading}
                />
              </div>
            </div>
          )}

          {/* Cor */}
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">
              Cor
            </label>
            <ComboBoxSearch
              options={colors}
              value={filters.cor}
              onValueChange={handleCorChange}
              placeholder={loading ? "Carregando cores..." : LABEL_CONFIG.PLACEHOLDERS.SELECT_COLOR}
              searchPlaceholder={LABEL_CONFIG.PLACEHOLDERS.SEARCH_COLOR}
              disabled={loading}
            />
          </div>

          {/* Ano */}
          <div>
            <label className="block text-sm font-medium text-blue-800 mb-2">
              Ano
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
                min={effectiveYearRange[0]}
                max={effectiveYearRange[1]}
                value={effectiveYearValue}
                onValueChange={handleAnoChange}
              />
            )}
            {rangesError && (
              <p className="text-xs text-amber-600 mt-1">{rangesError}</p>
            )}
          </div>
        </div>
      </div>

      {/* 🎯 3. VALOR DO LANCE - PRIMÁRIO */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
        <label className="block text-base font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
          Valor do Lance
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
            onValueChange={handlePrecoChange}
            prefix="R$ "
          />
        )}
        {rangesError && (
          <p className="text-xs text-amber-600 mt-1">{rangesError}</p>
        )}
      </div>
    </BaseFilters>
  )
};