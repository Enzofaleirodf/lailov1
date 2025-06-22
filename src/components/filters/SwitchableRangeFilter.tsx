import * as React from "react"
import { RangeSlider } from "./RangeSlider"
import { cn } from "../../lib/utils"

interface FilterOption {
  id: string
  label: string
  prefix?: string
  suffix?: string
  range: [number, number]
  value: [number, number]
}

interface SwitchableRangeFilterProps {
  title: string
  options: FilterOption[]
  activeOption: string
  onOptionChange: (optionId: string) => void
  onValueChange: (optionId: string, value: [number, number]) => void
  className?: string
}

export const SwitchableRangeFilter: React.FC<SwitchableRangeFilterProps> = ({
  title,
  options,
  activeOption,
  onOptionChange,
  onValueChange,
  className
}) => {
  const currentOption = options.find(opt => opt.id === activeOption) || options[0];

  // 🔧 CORREÇÃO: Handler simples sem debounce conflitante
  const handleValueChange = React.useCallback((value: [number, number]) => {
    onValueChange(currentOption.id, value);
  }, [currentOption.id, onValueChange]);

  return (
    <div className={cn("bg-gray-50 border border-gray-200 rounded-xl p-3", className)}>
      {/* Header com título e switch */}
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-auction-600 rounded-full"></span>
          {title}
        </label>
        
        {/* Switch toggle */}
        <div className="flex bg-white rounded-lg p-0.5 border border-gray-200">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onOptionChange(option.id)}
              className={cn(
                "px-2 py-1 text-[10px] font-medium rounded-md transition-all duration-200",
                activeOption === option.id
                  ? "bg-auction-600 text-white shadow-sm"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Range slider para a opção ativa */}
      <RangeSlider
        min={currentOption.range[0]}
        max={currentOption.range[1]}
        value={currentOption.value}
        onValueChange={handleValueChange}
        prefix={currentOption.prefix}
        suffix={currentOption.suffix}
      />
    </div>
  )
}
