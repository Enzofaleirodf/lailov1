import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "../ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover"
import { FilterOption } from "../../types/auction"

interface ComboBoxSearchProps {
  options: FilterOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
}

export const ComboBoxSearch: React.FC<ComboBoxSearchProps> = ({
  options,
  value,
  onValueChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  disabled = false,
  className
}) => {
  const [open, setOpen] = React.useState<boolean>(false)

  // Find the selected option based on the current value
  const selectedOption = React.useMemo((): FilterOption | null => {
    if (!value) {
      return null
    }
    
    // CORREÇÃO: Buscar a opção correspondente com comparação mais robusta
    const found = options.find((option): boolean => {
      // Comparação exata primeiro
      if (option.value === value) return true;
      
      // Para estados, também aceitar comparação case-insensitive
      if (value.length === 2 && option.value.length === 2) {
        return option.value.toLowerCase() === value.toLowerCase();
      }
      
      // Para cidades, comparação case-insensitive
      return option.value.toLowerCase() === value.toLowerCase();
    });
    
    return found || null
  }, [options, value])

  const handleSelect = (selectedValue: string): void => {
    // CORREÇÃO: Converter para maiúsculas se for um estado (sigla de 2 caracteres)
    // Isso garante consistência com os valores esperados nas opções
    let normalizedValue = selectedValue
    
    // Se for uma sigla de estado (2 caracteres), converter para maiúsculas
    if (selectedValue.length === 2 && /^[a-zA-Z]{2}$/.test(selectedValue)) {
      normalizedValue = selectedValue.toUpperCase()
    }
    
    // NOVA LÓGICA: Se clicar na opção "all", desmarcar (voltar para "")
    if (normalizedValue === "all") {
      if (value === "all") {
        // Se já está selecionado "all", desmarcar
        onValueChange?.("")
      } else {
        // Se não está selecionado "all", selecionar
        onValueChange?.("all")
      }
    } else {
      // Para outras opções, comportamento normal
      if (normalizedValue === value) {
        onValueChange?.("")
      } else {
        onValueChange?.(normalizedValue)
      }
    }
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between border-gray-200 hover:border-gray-300 rounded-xl relative z-10 h-12 shadow-sm", className)}
          disabled={disabled}
        >
          <span className={cn(
            "truncate text-left",
            !selectedOption && "text-gray-500"
          )}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={handleSelect}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}