import * as React from "react"
import { ComboBoxSearch } from "./ComboBoxSearch"
import { FormatToggle } from "./FormatToggle"
import { MultiToggleGrid } from "./MultiToggleGrid"
import { CheckboxGroup } from "../ui/CheckboxGroup"
import { useConditionalOptions } from "../../hooks/useConditionalOptions"
import { Category } from "../../types/auction"

interface BaseFiltersProps {
  // ✅ NOVO: Categoria para buscar opções corretas
  category: Category;

  // Dados dos filtros
  estado: string;
  cidade: string;
  formato: string;
  origem: string[];
  etapa: string[];

  // Callbacks para mudanças
  onEstadoChange: (value: string) => void;
  onCidadeChange: (value: string) => void;
  onFormatoChange: (value: string) => void;
  onOrigemChange: (value: string[]) => void;
  onEtapaChange: (value: string[]) => void;

  // Props específicas por categoria
  children?: React.ReactNode; // Para filtros específicos (área, marca, etc.)
}

export const BaseFilters: React.FC<BaseFiltersProps> = ({
  category, // ✅ NOVO: Receber categoria
  estado,
  cidade,
  formato,
  origem,
  etapa,
  onEstadoChange,
  onCidadeChange,
  onFormatoChange,
  onOrigemChange,
  onEtapaChange,
  children
}) => {
  // ✅ NOVO: Usar opções condicionais baseadas no banco de dados
  const {
    estados,
    cidades,
    formatos,
    origens,
    etapas,
    loading,
    error
  } = useConditionalOptions({
    category,
    selectedState: estado
  });

  // 🔧 CORREÇÃO: Remover memoização desnecessária - cálculo simples
  const isVendaDireta = formato === "venda-direta";

  // ✅ NOVO: Limpar etapa automaticamente quando venda direta for selecionada
  React.useEffect(() => {
    if (isVendaDireta && etapa.length > 0) {
      onEtapaChange([]);
    }
  }, [isVendaDireta, etapa.length, onEtapaChange]);

  // 🔧 CORREÇÃO: Handlers simples não precisam de useCallback
  const handleEstadoChange = (value: string): void => {
    onEstadoChange(value)
    onCidadeChange("") // Reset cidade when estado changes
  };

  const handleCidadeChange = (value: string): void => {
    onCidadeChange(value)
  };

  return (
    <div className="space-y-6">
      {/* 🎯 1. LOCALIZAÇÃO - PRIMÁRIO */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
        <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-auction-600 rounded-full"></span>
          Localização
        </label>
        <div className="grid grid-cols-1 gap-2">
          <ComboBoxSearch
            options={estados}
            value={estado}
            onValueChange={handleEstadoChange}
            placeholder="Estado"
            searchPlaceholder="Buscar estado..."
            disabled={loading}
          />
          <ComboBoxSearch
            options={cidades}
            value={cidade}
            onValueChange={handleCidadeChange}
            placeholder="Cidade"
            searchPlaceholder="Buscar cidade..."
            disabled={!estado || estado === "all" || loading}
          />
        </div>
      </div>

      {/* Filtros específicos da categoria (área, preço, marca, etc.) - PRIMÁRIOS */}
      {children}

      {/* 🎛️ FILTROS AVANÇADOS */}
      <div className="space-y-4 pt-3 border-t border-gray-200">
        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          Filtros Avançados
        </div>

        {/* Formato - PROFISSIONAL */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-auction-600 rounded-full"></span>
            Formato
          </label>
          <FormatToggle
            value={formato}
            onValueChange={onFormatoChange}
            options={formatos}
            disabled={loading}
          />
        </div>

        {/* Origem - PROFISSIONAL */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-auction-600 rounded-full"></span>
            Origem
          </label>
          <CheckboxGroup
            options={origens}
            value={origem}
            onValueChange={onOrigemChange}
            disabled={loading}
          />
        </div>

        {/* Etapa - PROFISSIONAL */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
          <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-auction-600 rounded-full"></span>
            Etapa
          </label>
          <CheckboxGroup
            options={etapas}
            value={etapa}
            onValueChange={onEtapaChange}
            disabled={isVendaDireta || loading}
          />
          {/* Espaço reservado para mensagem condicional para evitar layout shift */}
          <div className="min-h-[14px] mt-2">
            {isVendaDireta && (
              <p className="text-xs text-gray-500">
                Etapas não se aplicam à venda direta
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Mostrar erro se houver */}
      {error && (
        <div className="text-sm text-error-600 bg-error-50 p-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
};