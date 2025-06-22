import React from 'react';
import { cn } from '../../lib/utils';

interface ToggleOption {
  value: string;
  label: string;
}

interface ToggleGroupProps {
  options: ToggleOption[];
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
}

/**
 * Componente Toggle Group Button horizontal interligado
 * Botões conectados visualmente como um grupo único (estilo Airbnb)
 */
export const ToggleGroup: React.FC<ToggleGroupProps> = ({
  options,
  value,
  onValueChange,
  className
}) => {
  if (options.length === 0) return null;

  return (
    <div className={cn("flex w-full", className)}>
      {options.map((option, index) => {
        const isSelected = value === option.value;
        const isFirst = index === 0;
        const isLast = index === options.length - 1;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onValueChange(option.value)}
            className={cn(
              // Base styles - mesma altura dos botões de origem/etapa
              "px-4 py-3 text-sm font-medium border transition-all duration-200",
              "hover:z-10 focus:outline-none focus:ring-2 focus:ring-auction-500 focus:ring-offset-0",
              "whitespace-nowrap relative",
              // ✅ NOVO: Largura igual para todos os botões
              "flex-1",
              // Border radius - apenas nas extremidades
              isFirst && "rounded-l-lg",
              isLast && "rounded-r-lg",
              // Border handling - remover borda direita exceto no último
              !isLast && "-mr-px",
              // Selected state - usar cor da marca
              isSelected
                ? "bg-auction-600 text-white border-auction-600 shadow-sm z-10"
                : "bg-white text-gray-700 border-gray-300 hover:bg-neutral-50"
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
