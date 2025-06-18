import React from 'react';
import { X } from 'lucide-react';
import { Category, ImoveisFilters, VeiculosFilters } from '../../types/auction';
import { FILTER_CONFIG } from '../../config/constants';

interface FilterTag {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface FilterTagsProps {
  category: Category;
  filters: ImoveisFilters | VeiculosFilters;
  onRemoveFilter: (filterKey: string, value?: string) => void;
  searchQuery?: string;
  onClearSearch?: () => void;
}

/**
 * Componente para exibir tags dos filtros ativos
 * Mostra no topo da barra de filtros e no modal
 */
export const FilterTags: React.FC<FilterTagsProps> = ({
  category,
  filters,
  onRemoveFilter,
  searchQuery,
  onClearSearch
}) => {
  const tags: FilterTag[] = [];

  // ✅ BUSCA POR TEXTO
  if (searchQuery && searchQuery.trim() !== '') {
    tags.push({
      key: 'search',
      label: 'Busca',
      value: `"${searchQuery}"`,
      onRemove: () => onClearSearch?.()
    });
  }

  if (category === 'imoveis') {
    const imoveisFilters = filters as ImoveisFilters;

    // ✅ ESTADO
    if (imoveisFilters.estado && imoveisFilters.estado !== 'all' && imoveisFilters.estado !== '') {
      tags.push({
        key: 'estado',
        label: 'Estado',
        value: imoveisFilters.estado,
        onRemove: () => onRemoveFilter('estado')
      });
    }

    // ✅ CIDADE
    if (imoveisFilters.cidade && imoveisFilters.cidade !== 'all' && imoveisFilters.cidade !== '') {
      tags.push({
        key: 'cidade',
        label: 'Cidade',
        value: imoveisFilters.cidade,
        onRemove: () => onRemoveFilter('cidade')
      });
    }

    // ✅ FORMATO
    if (imoveisFilters.formato && imoveisFilters.formato !== '') {
      const formatLabels: Record<string, string> = {
        'leilao': 'Leilão',
        'venda-direta': 'Venda direta',
        'alienacao-particular': 'Alienação particular'
      };
      tags.push({
        key: 'formato',
        label: 'Formato',
        value: formatLabels[imoveisFilters.formato] || imoveisFilters.formato,
        onRemove: () => onRemoveFilter('formato')
      });
    }

    // ✅ ORIGEM
    if (imoveisFilters.origem && imoveisFilters.origem.length > 0) {
      const origemLabels: Record<string, string> = {
        'judicial': 'Judicial',
        'extrajudicial': 'Extrajudicial',
        'publico': 'Público',
        'nao-informado': 'Não informado'
      };
      imoveisFilters.origem.forEach(origem => {
        tags.push({
          key: `origem-${origem}`,
          label: 'Origem',
          value: origemLabels[origem] || origem,
          onRemove: () => onRemoveFilter('origem', origem)
        });
      });
    }

    // ✅ ETAPA
    if (imoveisFilters.etapa && imoveisFilters.etapa.length > 0) {
      const etapaLabels: Record<string, string> = {
        'praca-unica': 'Praça única',
        'primeira': '1ª Praça',
        'segunda': '2ª Praça',
        'terceira': '3ª Praça',
        'nao-informado': 'Não informado'
      };
      imoveisFilters.etapa.forEach(etapa => {
        tags.push({
          key: `etapa-${etapa}`,
          label: 'Etapa',
          value: etapaLabels[etapa] || etapa,
          onRemove: () => onRemoveFilter('etapa', etapa)
        });
      });
    }

    // ✅ ÁREA (só mostrar se não for estado inicial [0,0])
    const hasAreaFilter = imoveisFilters.area[0] !== 0 || imoveisFilters.area[1] !== 0;
    if (hasAreaFilter) {
      tags.push({
        key: 'area',
        label: 'Área',
        value: `${imoveisFilters.area[0]}m² - ${imoveisFilters.area[1]}m²`,
        onRemove: () => onRemoveFilter('area')
      });
    }

    // ✅ VALOR (só mostrar se não for estado inicial [0,0])
    const hasValueFilter = imoveisFilters.valor[0] !== 0 || imoveisFilters.valor[1] !== 0;
    if (hasValueFilter) {
      // ✅ NOVO: Mostrar "0+" para valor mínimo 0
      const minValue = imoveisFilters.valor[0] === 0 ? "0+" : imoveisFilters.valor[0].toLocaleString();
      const maxValue = imoveisFilters.valor[1].toLocaleString();

      tags.push({
        key: 'valor',
        label: 'Valor do lance inicial',
        value: `R$ ${minValue} - R$ ${maxValue}`,
        onRemove: () => onRemoveFilter('valor')
      });
    }

  } else {
    // ✅ VEÍCULOS
    const veiculosFilters = filters as VeiculosFilters;

    // ✅ ESTADO
    if (veiculosFilters.estado && veiculosFilters.estado !== 'all' && veiculosFilters.estado !== '') {
      tags.push({
        key: 'estado',
        label: 'Estado',
        value: veiculosFilters.estado,
        onRemove: () => onRemoveFilter('estado')
      });
    }

    // ✅ CIDADE
    if (veiculosFilters.cidade && veiculosFilters.cidade !== 'all' && veiculosFilters.cidade !== '') {
      tags.push({
        key: 'cidade',
        label: 'Cidade',
        value: veiculosFilters.cidade,
        onRemove: () => onRemoveFilter('cidade')
      });
    }

    // ✅ MARCA
    if (veiculosFilters.marca && veiculosFilters.marca !== 'all' && veiculosFilters.marca !== '') {
      tags.push({
        key: 'marca',
        label: 'Marca',
        value: veiculosFilters.marca,
        onRemove: () => onRemoveFilter('marca')
      });
    }

    // ✅ MODELO
    if (veiculosFilters.modelo && veiculosFilters.modelo !== 'all' && veiculosFilters.modelo !== '') {
      tags.push({
        key: 'modelo',
        label: 'Modelo',
        value: veiculosFilters.modelo,
        onRemove: () => onRemoveFilter('modelo')
      });
    }

    // ✅ COR
    if (veiculosFilters.cor && veiculosFilters.cor !== 'all' && veiculosFilters.cor !== '') {
      tags.push({
        key: 'cor',
        label: 'Cor',
        value: veiculosFilters.cor,
        onRemove: () => onRemoveFilter('cor')
      });
    }

    // ✅ FORMATO
    if (veiculosFilters.formato && veiculosFilters.formato !== '') {
      const formatLabels: Record<string, string> = {
        'leilao': 'Leilão',
        'venda-direta': 'Venda direta',
        'alienacao-particular': 'Alienação particular'
      };
      tags.push({
        key: 'formato',
        label: 'Formato',
        value: formatLabels[veiculosFilters.formato] || veiculosFilters.formato,
        onRemove: () => onRemoveFilter('formato')
      });
    }

    // ✅ ORIGEM
    if (veiculosFilters.origem && veiculosFilters.origem.length > 0) {
      const origemLabels: Record<string, string> = {
        'judicial': 'Judicial',
        'extrajudicial': 'Extrajudicial',
        'publico': 'Público',
        'nao-informado': 'Não informado'
      };
      veiculosFilters.origem.forEach(origem => {
        tags.push({
          key: `origem-${origem}`,
          label: 'Origem',
          value: origemLabels[origem] || origem,
          onRemove: () => onRemoveFilter('origem', origem)
        });
      });
    }

    // ✅ ETAPA
    if (veiculosFilters.etapa && veiculosFilters.etapa.length > 0) {
      const etapaLabels: Record<string, string> = {
        'praca-unica': 'Praça única',
        'primeira': '1ª Praça',
        'segunda': '2ª Praça',
        'terceira': '3ª Praça',
        'nao-informado': 'Não informado'
      };
      veiculosFilters.etapa.forEach(etapa => {
        tags.push({
          key: `etapa-${etapa}`,
          label: 'Etapa',
          value: etapaLabels[etapa] || etapa,
          onRemove: () => onRemoveFilter('etapa', etapa)
        });
      });
    }

    // ✅ ANO (só mostrar se não for estado inicial [0,0])
    const hasYearFilter = veiculosFilters.ano[0] !== 0 || veiculosFilters.ano[1] !== 0;
    if (hasYearFilter) {
      tags.push({
        key: 'ano',
        label: 'Ano',
        value: `${veiculosFilters.ano[0]} - ${veiculosFilters.ano[1]}`,
        onRemove: () => onRemoveFilter('ano')
      });
    }

    // ✅ PREÇO (só mostrar se não for estado inicial [0,0])
    const hasPriceFilter = veiculosFilters.preco[0] !== 0 || veiculosFilters.preco[1] !== 0;
    if (hasPriceFilter) {
      tags.push({
        key: 'preco',
        label: 'Valor do lance inicial',
        value: `R$ ${veiculosFilters.preco[0].toLocaleString()} - R$ ${veiculosFilters.preco[1].toLocaleString()}`,
        onRemove: () => onRemoveFilter('preco')
      });
    }
  }

  // ✅ NÃO RENDERIZAR se não há tags
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-medium text-gray-700">Filtros ativos:</span>
        <span className="text-xs text-gray-500">({tags.length})</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <div
            key={tag.key}
            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md border border-blue-200"
          >
            <span className="font-medium">{tag.label}:</span>
            <span>{tag.value}</span>
            <button
              onClick={tag.onRemove}
              className="ml-1 p-0.5 hover:bg-blue-100 rounded-sm transition-colors"
              aria-label={`Remover filtro ${tag.label}`}
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
