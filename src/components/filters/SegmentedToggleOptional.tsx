import * as React from "react"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import { cn } from "../../lib/utils"

interface SegmentedToggleOptionalProps {
  options: Array<{ value: string; label: string }>
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  disabled?: boolean
}

export const SegmentedToggleOptional: React.FC<SegmentedToggleOptionalProps> = ({
  options,
  value,
  onValueChange,
  className,
  disabled = false
}) => {
  const handleValueChange = (newValue: string) => {
    // If clicking the same value, deselect it (optional behavior)
    if (newValue === value) {
      onValueChange?.("")
    } else {
      onValueChange?.(newValue)
    }
  }

  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={handleValueChange}
      className={cn("grid grid-cols-2 w-full", className)}
      disabled={disabled}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={option.value}
          variant="outline"
          className="data-[state=on]:bg-blue-600 data-[state=on]:text-white"
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}