import * as React from "react"
import { memo, useCallback } from "react"
import { cn } from "../../lib/utils"
import { FilterOption } from "../../types/auction"

interface MultiToggleGridProps {
  options: FilterOption[]
  value: string[]
  onValueChange?: (value: string[]) => void
  className?: string
  disabled?: boolean
}

// 🚀 PERFORMANCE: Memoizar componente para evitar re-renders desnecessários
export const MultiToggleGrid: React.FC<MultiToggleGridProps> = memo(({
  options,
  value = [], // Garantir que value nunca seja undefined
  onValueChange,
  className,
  disabled = false
}) => {
  // 🚀 PERFORMANCE: Memoizar handler para evitar re-renders dos botões
  const handleToggle = useCallback((optionValue: string): void => {
    if (disabled || !onValueChange) return;
    
    const currentValues = Array.isArray(value) ? value : [];
    let newValues: string[];
    
    if (currentValues.includes(optionValue)) {
      // Remove o valor se já estiver selecionado
      newValues = currentValues.filter(v => v !== optionValue);
    } else {
      // Adiciona o valor se não estiver selecionado
      newValues = [...currentValues, optionValue];
    }

    onValueChange(newValues);
  }, [value, onValueChange, disabled]); // 🔥 DEPENDÊNCIAS: value, onValueChange, disabled

  return (
    <div className={cn("grid grid-cols-2 gap-2 w-full", className)}>
      {options.map((option) => {
        const isSelected = Array.isArray(value) && value.includes(option.value);

        return (
          <button
            key={option.value}
            onClick={() => handleToggle(option.value)}
            disabled={disabled}
            className={cn(
              "relative p-2 rounded-xl border text-center font-medium text-xs transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:ring-offset-1",
              isSelected
                ? "border-indigo-500 bg-white text-indigo-800 shadow-md font-semibold"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700 hover:shadow-sm",
              disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
});

// 🚀 PERFORMANCE: DisplayName para debugging
MultiToggleGrid.displayName = 'MultiToggleGrid';