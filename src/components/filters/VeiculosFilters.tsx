import * as React from "react"
import { useEffect } from "react"
import { ComboBoxSearch } from "./ComboBoxSearch"
import { RangeSlider } from "./RangeSlider"
import { SwitchableRangeFilter } from "./SwitchableRangeFilter"
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

  // 🎯 MAPEAMENTO: Converter slug da URL para categoria do banco
  const getCategoryFromType = (type: string): string | undefined => {
    const categoryMap: Record<string, string> = {
      'carros': 'Carros',
      'motos': 'Motos',
      'caminhoes': 'Caminhões',
      'onibus': 'Ônibus',
      'maquinas': 'Maquinas',
      'apoio': 'Apoio',
      'embarcacoes': 'Embarcações',
      'recreativos': 'Recreativos',
      'nao-informado': 'Não Informado'
    };
    return type === 'todos' ? undefined : categoryMap[type];
  };

  const vehicleCategory = getCategoryFromType(currentVehicleType);

  // ✅ BUSCA DINÂMICA: Usar hook para buscar dados reais do banco (POR CATEGORIA)
  const { brands, models, colors, loading, loadingModels, error, fetchModels } = useVehicleOptions(vehicleCategory);

  // ✅ RANGES DINÂMICOS: Buscar valores reais do banco de dados
  const { priceRange, yearRange, loading: rangesLoading, error: rangesError } = useRealRanges({
    category: 'veiculos',
    currentType: currentVehicleType,
    showExpiredAuctions: state.showExpiredAuctions
  });

  // ✅ CORREÇÃO: Usar ranges dinâmicos do banco de dados
  const effectiveYearRange: [number, number] = yearRange && yearRange[0] !== 0 && yearRange[1] !== 0 ? yearRange : [1900, new Date().getFullYear() + 1];
  const effectivePriceRange: [number, number] = priceRange && priceRange[0] !== 0 && priceRange[1] !== 0 ? priceRange : [0, 999999999];

  // ✅ NOVO: Inputs vazios por padrão - usuário define os valores
  const effectiveYearValue = filters.ano;

  // ✅ CORREÇÃO: Preparar opções para filtro de valor com ranges dinâmicos
  const valorOptions = [
    {
      id: 'avaliacao',
      label: 'Avaliação',
      prefix: 'R$ ',
      range: effectivePriceRange,
      value: filters.valorAvaliacao
    },
    {
      id: 'desconto',
      label: 'com desconto',
      prefix: 'R$ ',
      range: effectivePriceRange,
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



  // ✅ BUSCA DINÂMICA: Buscar modelos quando marca mudar
  useEffect(() => {
    if (filters.marca) {
      fetchModels(filters.marca);
    }
  }, [filters.marca, fetchModels]);
  
  // ✅ CORREÇÃO: Mostrar filtros de marca/modelo apenas para categorias específicas
  const shouldShowBrandModelFilters = currentVehicleType !== 'todos' &&
    currentVehicleType !== 'recreativos' &&
    currentVehicleType !== 'nao-informado';

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

  // ✅ NOVO: Handlers para filtro de valor com switch
  const handleValorTypeChange = (valorType: string): void => {
    // 🔧 CORREÇÃO UX: Limpar range anterior ao trocar switch
    if (valorType === 'avaliacao') {
      actions.setStagedVeiculosFilters({
        valorType: 'avaliacao',
        valorDesconto: [0, 0]  // Limpar valores de desconto
      });
    } else {
      actions.setStagedVeiculosFilters({
        valorType: 'desconto',
        valorAvaliacao: [0, 0]  // Limpar valores de avaliação
      });
    }
  };

  const handleValorValueChange = (optionId: string, value: [number, number]): void => {
    if (optionId === 'avaliacao') {
      actions.setStagedVeiculosFilters({ valorAvaliacao: value });
    } else if (optionId === 'desconto') {
      actions.setStagedVeiculosFilters({ valorDesconto: value });
    }
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
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
        <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-auction-600 rounded-full"></span>
          Características do Veículo
        </label>
        <div className="space-y-3">
          {/* Marca e Modelo */}
          {shouldShowBrandModelFilters && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Marca e Modelo
              </label>
              <div className="grid grid-cols-1 gap-2">
                <ComboBoxSearch
                  options={brands}
                  value={filters.marca}
                  onValueChange={handleMarcaChange}
                  placeholder="Marca (em breve)"
                  searchPlaceholder={LABEL_CONFIG.PLACEHOLDERS.SEARCH_BRAND}
                  disabled={true}
                  loading={false}
                  loadingMessage="Funcionalidade em desenvolvimento..."
                />
                <ComboBoxSearch
                  options={models}
                  value={filters.modelo}
                  onValueChange={handleModeloChange}
                  placeholder="Modelo (em breve)"
                  searchPlaceholder={LABEL_CONFIG.PLACEHOLDERS.SEARCH_MODEL}
                  disabled={true}
                  loading={false}
                  loadingMessage="Funcionalidade em desenvolvimento..."
                />
              </div>
            </div>
          )}

          {/* Cor */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Cor
            </label>
            <ComboBoxSearch
              options={colors}
              value={filters.cor}
              onValueChange={handleCorChange}
              placeholder={LABEL_CONFIG.PLACEHOLDERS.SELECT_COLOR}
              searchPlaceholder={LABEL_CONFIG.PLACEHOLDERS.SEARCH_COLOR}
              disabled={loading}
              loading={loading}
              loadingMessage="Carregando cores..."
            />
          </div>

          {/* Ano */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">
              Ano
            </label>
            <RangeSlider
              min={effectiveYearRange[0]}
              max={effectiveYearRange[1]}
              value={effectiveYearValue}
              onValueChange={handleAnoChange}
            />
            {rangesError && (
              <p className="text-xs text-amber-600 mt-1">{rangesError}</p>
            )}
          </div>
        </div>
      </div>

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