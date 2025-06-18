import * as React from "react"
import { Input } from "../ui/input"
import { cn } from "../../lib/utils"

interface RangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onValueChange: (value: [number, number]) => void
  prefix?: string
  suffix?: string
  className?: string
  formatValue?: (value: number) => string // ✅ NOVO: Formatação customizada
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onValueChange,
  prefix = "",
  suffix = "",
  className,
  formatValue
}) => {
  // 🔧 CORREÇÃO: Remover memoização desnecessária - validação simples
  const safeValue: [number, number] = (
    Array.isArray(value) && 
    value.length === 2 && 
    typeof value[0] === 'number' && 
    typeof value[1] === 'number' &&
    !isNaN(value[0]) && 
    !isNaN(value[1])
  ) ? value : [min, max];

  // ✅ NOVO: Formatação inteligente de valores
  const formatDisplayValue = (val: number): string => {
    if (formatValue) return formatValue(val);

    // ✅ CORREÇÃO: Anos no Brasil não têm pontos (2024, não 2.024)
    if (suffix === '' && val >= 1900 && val <= 2100) {
      return val.toString(); // Anos sem formatação
    }
    return val.toLocaleString('pt-BR');
  };

  // 🔧 CORREÇÃO: Handler simples não precisa de useCallback
  const handleInputChange = (index: 0 | 1, inputValue: string) => {
    const numValue = parseFloat(inputValue.replace(/\D/g, '')) || 0
    const clampedValue = Math.max(min, Math.min(max, numValue))
    const newValue: [number, number] = [...safeValue]
    newValue[index] = clampedValue

    // Ensure min <= max
    if (index === 0 && newValue[0] > newValue[1]) {
      newValue[1] = newValue[0]
    } else if (index === 1 && newValue[1] < newValue[0]) {
      newValue[0] = newValue[1]
    }

    onValueChange(newValue)
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Mínimo</label>
          <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {prefix}
            </span>
          )}
          <Input
            type="text"
            value={formatDisplayValue(safeValue[0])}
            onChange={(e) => handleInputChange(0, e.target.value)}
            className={cn("border-gray-200 rounded-xl", prefix && "pl-8", suffix && "pr-8")}
            placeholder="Mínimo"
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {suffix}
            </span>
          )}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs text-gray-500 font-medium">Máximo</label>
          <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {prefix}
            </span>
          )}
          <Input
            type="text"
            value={formatDisplayValue(safeValue[1])}
            onChange={(e) => handleInputChange(1, e.target.value)}
            className={cn("border-gray-200 rounded-xl", prefix && "pl-8", suffix && "pr-8")}
            placeholder="Máximo"
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {suffix}
            </span>
          )}
          </div>
        </div>
      </div>
    </div>
  )
};