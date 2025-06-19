import * as React from "react"
import { cn } from "../../lib/utils"
import { FilterOption } from "../../types/auction"

interface MultiToggleGridProps {
  options: FilterOption[]
  value: string[]
  onValueChange?: (value: string[]) => void
  className?: string
  disabled?: boolean
}

export const MultiToggleGrid: React.FC<MultiToggleGridProps> = ({
  options,
  value = [], // Garantir que value nunca seja undefined
  onValueChange,
  className,
  disabled = false
}) => {
  // 🔧 CORREÇÃO: Handler simples não precisa de useCallback
  const handleToggle = (optionValue: string): void => {
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
  };

  return (
    <div className={cn("grid grid-cols-2 gap-3 w-full", className)}>
      {options.map((option) => {
        const isSelected = Array.isArray(value) && value.includes(option.value);
        
        return (
          <button
            key={option.value}
            onClick={() => handleToggle(option.value)}
            disabled={disabled}
            className={cn(
              "relative p-3 rounded-xl border text-center transition-all duration-200 active:scale-[0.98] font-medium text-sm shadow-sm",
              isSelected
                ? "border-blue-500 bg-white text-blue-800 shadow-md font-medium"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};