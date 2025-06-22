# 🔧 SISTEMA DE FILTROS - LAILO

Sistema completo de filtros para leilões de imóveis e veículos.

## 📁 ESTRUTURA DOS ARQUIVOS

```
src/components/filters/
├── BaseFilters.tsx          # Filtros base (estado, cidade, formato, etc.)
├── ImoveisFilters.tsx       # Filtros específicos para imóveis
├── VeiculosFilters.tsx      # Filtros específicos para veículos
├── SwitchableRangeFilter.tsx # Filtro com switch (área m²/ha, valor)
├── RangeSlider.tsx          # Slider de range com inputs
├── ComboBoxSearch.tsx       # Dropdown com busca
├── FilterTags.tsx           # Tags de filtros ativos
└── README.md               # Este arquivo
```

## 🚀 COMPONENTES PRINCIPAIS

### BaseFilters
**Uso**: Filtros comuns a imóveis e veículos
**Props**:
- `category`: 'imoveis' | 'veiculos'
- `estado`, `cidade`, `formato`, `origem`, `etapa`
- Handlers para cada filtro

```tsx
<BaseFilters
  category="imoveis"
  estado={filters.estado}
  onEstadoChange={handleEstadoChange}
  // ... outros props
>
  {/* Filtros específicos aqui */}
</BaseFilters>
```

### SwitchableRangeFilter
**Uso**: Filtros com switch entre opções (área m²/ha, valor avaliação/desconto)
**Props**:
- `title`: Título do filtro
- `options`: Array de opções com ranges
- `activeOption`: Opção ativa
- `onOptionChange`: Callback para mudança de opção
- `onValueChange`: Callback para mudança de valor

```tsx
<SwitchableRangeFilter
  title="Área"
  options={areaOptions}
  activeOption={filters.areaType}
  onOptionChange={handleAreaTypeChange}
  onValueChange={handleAreaValueChange}
/>
```

### ComboBoxSearch
**Uso**: Dropdown com busca (estados, cidades, marcas, etc.)
**Props**:
- `options`: Array de opções
- `value`: Valor selecionado
- `onValueChange`: Callback para mudança
- `loading`: Estado de carregamento
- `loadingMessage`: Mensagem durante carregamento

```tsx
<ComboBoxSearch
  options={brands}
  value={filters.marca}
  onValueChange={handleMarcaChange}
  loading={isLoading}
  loadingMessage="Carregando marcas..."
/>
```

## 🔄 FLUXO DE DADOS

### 1. Estado dos Filtros
```
AppContext (Zustand)
├── stagedFilters    # Filtros sendo editados
│   ├── imoveis
│   └── veiculos
└── appliedFilters   # Filtros aplicados (usados nas queries)
    ├── imoveis
    └── veiculos
```

### 2. Aplicação de Filtros
```
1. Usuário edita filtros → stagedFilters
2. Clica "Aplicar" → copia staged para applied
3. Query usa appliedFilters
4. Resultados são atualizados
```

### 3. Dados Dinâmicos
```
useVehicleOptions → React Query → Database
├── Marcas (cache 30min)
├── Cores (cache 30min)  
└── Modelos (sem cache, dependente da marca)

useRealRanges → React Query → Database
├── Área (cache 10min)
├── Preço (cache 10min)
└── Ano (cache 10min)
```

## 🎯 HOOKS PRINCIPAIS

### useVehicleOptions
**Uso**: Buscar marcas, modelos e cores de veículos
```tsx
const { 
  brands, 
  models, 
  colors, 
  loading, 
  loadingModels, 
  fetchModels 
} = useVehicleOptions();

// Buscar modelos quando marca mudar
useEffect(() => {
  if (marca) fetchModels(marca);
}, [marca, fetchModels]);
```

### useRealRanges
**Uso**: Buscar ranges dinâmicos do banco
```tsx
const { 
  areaRange, 
  priceRange, 
  yearRange, 
  loading 
} = useRealRanges({
  category: 'imoveis',
  currentType: 'apartamentos',
  showExpiredAuctions: false
});
```

### useFilterCount
**Uso**: Contar resultados com filtros atuais
```tsx
const { 
  count, 
  loading, 
  hasUserFilters 
} = useFilterCount(
  category,
  currentType,
  stagedFilters,
  searchQuery,
  showExpiredAuctions
);
```

## 🔧 CONFIGURAÇÃO

### Constantes
**Arquivo**: `src/config/constants.ts`
```tsx
export const FILTER_CONFIG = {
  DEBOUNCE_MS: 300,
  DEFAULT_RANGES: {
    AREA: [0, 999999],
    PRICE: [0, 999999999],
    YEAR: [1900, new Date().getFullYear() + 1]
  }
};
```

### Mapeamentos
**Arquivo**: `src/config/mappings.ts`
```tsx
export const PROPERTY_TYPE_MAP = {
  'apartamentos': ['Apartamentos'],
  'casas': ['Casas'],
  'todos': [] // Todos os tipos
};
```

## 🧪 TESTES E DEBUG

### Diagnósticos (Desenvolvimento)
```tsx
import { FilterDiagnostics } from '../debug/FilterDiagnostics';

// Adicionar ao componente principal
{process.env.NODE_ENV === 'development' && <FilterDiagnostics />}
```

### Testes Manuais
```tsx
import { runQuickTests } from '../../utils/filterTester';

// Executar testes
await runQuickTests();
```

### Performance
```tsx
import { runQuickPerformanceTests } from '../../utils/performanceTester';

// Testar performance
const report = await runQuickPerformanceTests();
```

## 🚀 MELHORIAS IMPLEMENTADAS

### ✅ Correções Críticas
- SwitchableRangeFilter com ranges dinâmicos
- useRealRanges funcionando corretamente
- FilterTags sem props inexistentes
- Lógica staged vs applied simplificada

### ✅ Performance
- Cache inteligente com TTL
- Debounce otimizado para ranges
- React Query para dados dinâmicos
- Loading states informativos

### ✅ UX
- Feedback visual durante carregamento
- Spinners em botões de ação
- Mensagens de loading contextuais
- Diagnósticos em tempo real

## 🔍 TROUBLESHOOTING

### Filtros não aceitam valores
- Verificar se ranges não são [0,0]
- Verificar se useRealRanges está retornando dados
- Verificar console para erros

### Dados não carregam
- Verificar conexão com banco de dados
- Verificar React Query devtools
- Verificar se hooks estão sendo chamados

### Performance lenta
- Verificar cache hit rate
- Verificar se debounce está ativo
- Executar testes de performance

---

**Última atualização**: 2025-01-21  
**Versão**: 2.0
