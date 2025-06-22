import * as React from "react"
import { Input } from "../ui/input"
import { cn } from "../../lib/utils"

interface RangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number | undefined, number | undefined]
  onValueChange: (value: [number | undefined, number | undefined]) => void
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
  // ✅ CORREÇÃO: Validação simples que aceita undefined como 0
  const safeValue: [number, number] = React.useMemo(() => {
    if (!Array.isArray(value) || value.length !== 2) {
      return [0, 0];
    }

    // Converter undefined para 0, mas manter 0 explícito como 0
    const val0 = typeof value[0] === 'number' && !isNaN(value[0]) ? value[0] : 0;
    const val1 = typeof value[1] === 'number' && !isNaN(value[1]) ? value[1] : 0;

    return [val0, val1];
  }, [value]);

  // ✅ CORREÇÃO: Formatação brasileira correta
  const formatDisplayValue = (val: number): string => {
    if (formatValue) return formatValue(val);

    // ✅ CORREÇÃO: Anos SEM pontuação (2024, não 2.024)
    if (suffix === '' && val >= 1900 && val <= 2100) {
      return val.toString(); // Anos sem formatação
    }

    // ✅ CORREÇÃO: Área e valor COM pontos (padrão brasileiro: 1.000.000)
    if (prefix === 'R$ ' || suffix === 'm²' || suffix === 'ha') {
      return val.toLocaleString('pt-BR'); // Formato brasileiro com pontos
    }

    // ✅ DEFAULT: Sem formatação para outros casos
    return val.toString();
  };

  // 🔧 ACEITAR 0: Permitir qualquer valor, incluindo 0 explícito
  const handleInputChange = (index: 0 | 1, inputValue: string) => {
    if (inputValue === '') {
      // Campo vazio = undefined para indicar que não há filtro
      const newValue: [number | undefined, number | undefined] = [
        index === 0 ? undefined : (value?.[1] ?? undefined),
        index === 1 ? undefined : (value?.[0] ?? undefined)
      ];
      onValueChange(newValue);
      return;
    }

    // ✅ CORREÇÃO: Remover formatação brasileira (pontos) e converter vírgula para ponto
    const cleanValue = inputValue
      .replace(/\./g, '') // Remove pontos (separadores de milhares)
      .replace(',', '.'); // Converte vírgula para ponto decimal

    // Verificar se é um número válido
    const numValue = parseFloat(cleanValue);

    if (!isNaN(numValue) && numValue >= 0) {
      // Aceitar qualquer valor >= 0, incluindo 0
      const newValue: [number | undefined, number | undefined] = [
        index === 0 ? numValue : (value?.[0] ?? undefined),
        index === 1 ? numValue : (value?.[1] ?? undefined)
      ];
      onValueChange(newValue);
    }
  };

  return (
    <div className={cn("", className)}>
      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {prefix}
            </span>
          )}
          <Input
            type="text"
            value={value?.[0] === undefined ? "" : formatDisplayValue(safeValue[0])}
            onChange={(e) => handleInputChange(0, e.target.value)}
            className={cn("border-gray-200 rounded-xl h-12 shadow-sm text-xs", prefix && "pl-8", suffix && "pr-8")}
            placeholder="Mínimo"
          />
          {suffix && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {suffix}
            </span>
          )}
        </div>
        <div className="relative">
          {prefix && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              {prefix}
            </span>
          )}
          <Input
            type="text"
            value={value?.[1] === undefined ? "" : formatDisplayValue(safeValue[1])}
            onChange={(e) => handleInputChange(1, e.target.value)}
            className={cn("border-gray-200 rounded-xl h-12 shadow-sm text-xs", prefix && "pl-8", suffix && "pr-8")}
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
  )
};