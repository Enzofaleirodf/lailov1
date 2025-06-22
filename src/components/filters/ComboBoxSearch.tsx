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
import { ComboBoxLoading } from "../ui/filter-loading"

interface ComboBoxSearchProps {
  options: FilterOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
  className?: string
  loading?: boolean
  loadingMessage?: string
}

export const ComboBoxSearch: React.FC<ComboBoxSearchProps> = ({
  options,
  value,
  onValueChange,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  disabled = false,
  className,
  loading = false,
  loadingMessage = "Carregando..."
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

      // Para cidades e cores, comparação case-insensitive
      return option.value.toLowerCase() === value.toLowerCase();
    });

    return found || null
  }, [options, value])

  const handleSelect = (selectedValue: string): void => {
    // ✅ CORREÇÃO CRÍTICA: CommandItem converte automaticamente para minúsculo
    // Precisamos encontrar o valor original da opção correspondente
    const originalOption = options.find(option =>
      option.value.toLowerCase() === selectedValue.toLowerCase()
    );

    // Usar o valor original da opção, não o valor normalizado pelo Command
    const originalValue = originalOption?.value || selectedValue;

    // 🔍 DEBUG: Log da seleção
    console.log('🔍 ComboBox selecionado:', originalValue);

    // CORREÇÃO: Converter para maiúsculas se for um estado (sigla de 2 caracteres)
    let normalizedValue = originalValue;
    if (originalValue.length === 2 && /^[a-zA-Z]{2}$/.test(originalValue)) {
      normalizedValue = originalValue.toUpperCase();
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
          className={cn(
            "w-full justify-between rounded-xl relative z-10 h-10 shadow-sm text-xs",
            // ✅ CORREÇÃO: Hover mais suave e profissional
            "border-gray-200 bg-white hover:border-auction-300 hover:bg-auction-50 transition-colors",
            className
          )}
          disabled={disabled}
        >
          <span className={cn(
            "truncate text-left flex-1 min-w-0",
            !selectedOption && "text-gray-500"
          )}>
            {selectedOption?.label || placeholder}
          </span>
          <ChevronDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            {loading ? (
              <ComboBoxLoading message={loadingMessage} />
            ) : (
              <>
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
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}