import * as React from "react"
import { SegmentedToggle } from "../ui/SegmentedToggle"
import { cn } from "../../lib/utils"
import { FilterOption } from "../../types/auction"

interface FormatToggleProps {
  value?: string
  onValueChange?: (value: string) => void
  options?: FilterOption[] // ✅ NOVO: Opções condicionais
  className?: string
  disabled?: boolean
}

export const FormatToggle: React.FC<FormatToggleProps> = ({
  value,
  onValueChange,
  options: providedOptions, // ✅ NOVO: Receber opções condicionais
  className,
  disabled = false
}) => {
  // ✅ NOVO: Usar opções condicionais ou fallback para opções fixas
  const defaultOptions = [
    { value: "", label: "Qualquer Tipo" }, // ✅ Valor vazio = sem filtro
    { value: "leilao", label: "Leilão" },
    { value: "venda-direta", label: "Venda Direta" }
  ];

  // ✅ CONVERTER: FilterOption[] para SegmentedToggleOption[]
  const segmentedOptions = (providedOptions || defaultOptions).map(option => ({
    id: option.value,
    label: option.label
  }));

  // ✅ NOVO: Comportamento de seleção única (não permite deselecionar)
  const handleSelect = (optionValue: string) => {
    if (!onValueChange || disabled) return;
    onValueChange(optionValue); // Sempre seleciona a opção clicada
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="text-sm font-medium text-gray-700 mb-3">
        Formato
      </div>
      <SegmentedToggle
        options={segmentedOptions}
        value={value || ""}
        onChange={handleSelect}
        size="md"
        className={cn("w-full", disabled && "opacity-50 pointer-events-none")}
        disabled={disabled}
      />
    </div>
  )
};