import * as React from "react"
import { ComboBoxSearch } from "./ComboBoxSearch"
import { FormatToggle } from "./FormatToggle"
import { MultiToggleGrid } from "./MultiToggleGrid"
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
      {/* Localização */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Localização
        </label>
        <div className="grid grid-cols-1 gap-2">
          <ComboBoxSearch
            options={estados}
            value={estado}
            onValueChange={handleEstadoChange}
            placeholder={loading ? "Carregando estados..." : "Estado"}
            searchPlaceholder="Buscar estado..."
            disabled={loading}
          />
          <ComboBoxSearch
            options={cidades}
            value={cidade}
            onValueChange={handleCidadeChange}
            placeholder={loading ? "Carregando cidades..." : "Cidade"}
            searchPlaceholder="Buscar cidade..."
            disabled={!estado || estado === "all" || loading}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 my-6"></div>

      {/* Filtros específicos da categoria (área, marca, etc.) */}
      {children}

      {/* Divider */}
      <div className="h-px bg-gray-200 my-6"></div>

      {/* Formato */}
      <FormatToggle
        value={formato}
        onValueChange={onFormatoChange}
        options={formatos} // ✅ NOVO: Passar opções condicionais
        disabled={loading}
      />

      {/* Divider */}
      <div className="h-px bg-gray-200 my-6"></div>

      {/* Origem */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Origem
        </label>
        <MultiToggleGrid
          options={origens} // ✅ NOVO: Usar opções condicionais
          value={origem}
          onValueChange={onOrigemChange}
          disabled={loading}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-gray-200 my-6"></div>

      {/* Etapa */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Etapa
        </label>
        <MultiToggleGrid
          options={etapas} // ✅ NOVO: Usar opções condicionais
          value={etapa}
          onValueChange={onEtapaChange}
          disabled={isVendaDireta || loading}
        />
        {/* Espaço reservado para mensagem condicional para evitar layout shift */}
        <div className="min-h-[16px] mt-2">
          {isVendaDireta && (
            <p className="text-xs text-gray-500">
              Etapas não se aplicam à venda direta
            </p>
          )}
        </div>
      </div>

      {/* Mostrar erro se houver */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}
    </div>
  )
};