import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';
import { FilterOption } from '../../types/auction';

interface CheckboxGroupProps {
  options: FilterOption[];
  value: string[];
  onValueChange?: (value: string[]) => void;
  className?: string;
  disabled?: boolean;
}

export const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
  options,
  value = [],
  onValueChange,
  className,
  disabled = false
}) => {
  const handleToggle = (optionValue: string) => {
    if (disabled || !onValueChange) return;
    
    const currentValues = Array.isArray(value) ? value : [];
    let newValues: string[];
    
    if (currentValues.includes(optionValue)) {
      // Remove if already selected
      newValues = currentValues.filter(v => v !== optionValue);
    } else {
      // Add if not selected
      newValues = [...currentValues, optionValue];
    }
    
    onValueChange(newValues);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {options.map((option) => {
        const isSelected = Array.isArray(value) && value.includes(option.value);

        return (
          <label
            key={option.value}
            className={cn(
              "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all duration-200 active:scale-[0.98] focus-within:ring-2 focus-within:ring-indigo-500/20",
              isSelected
                ? "bg-white"
                : "hover:bg-gray-50",
              disabled && "opacity-50 cursor-not-allowed pointer-events-none"
            )}
          >
            {/* Custom Checkbox - Refinado */}
            <div className="relative flex-shrink-0">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => handleToggle(option.value)}
                disabled={disabled}
                className="sr-only"
              />
              <div
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-all duration-200",
                  isSelected
                    ? "border-auction-500 bg-auction-500 shadow-sm"
                    : "border-gray-300 bg-white hover:border-auction-400"
                )}
              >
                {isSelected && (
                  <Check className="w-3 h-3 text-white stroke-[2.5]" />
                )}
              </div>
            </div>

            {/* Label - Consistente */}
            <span
              className={cn(
                "text-xs font-medium transition-colors duration-200 select-none",
                isSelected
                  ? "text-auction-800 font-semibold"
                  : "text-gray-500"
              )}
            >
              {option.label}
            </span>
          </label>
        );
      })}
    </div>
  );
};
