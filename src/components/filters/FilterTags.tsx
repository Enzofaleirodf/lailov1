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

    // ✅ ÁREA M² (só mostrar se há valores válidos)
    const hasAreaM2Filter = imoveisFilters.areaM2 &&
      imoveisFilters.areaM2.length > 0 &&
      imoveisFilters.areaM2[0] !== undefined &&
      imoveisFilters.areaM2[1] !== undefined &&
      (imoveisFilters.areaM2[0] > 0 || imoveisFilters.areaM2[1] > 0);
    if (hasAreaM2Filter) {
      tags.push({
        key: 'areaM2',
        label: 'Área (m²)',
        value: `${imoveisFilters.areaM2[0] || 0}m² - ${imoveisFilters.areaM2[1] || 0}m²`,
        onRemove: () => onRemoveFilter('areaM2')
      });
    }

    // ✅ ÁREA HECTARES (só mostrar se há valores válidos)
    const hasAreaHectaresFilter = imoveisFilters.areaHectares &&
      imoveisFilters.areaHectares.length > 0 &&
      imoveisFilters.areaHectares[0] !== undefined &&
      imoveisFilters.areaHectares[1] !== undefined &&
      (imoveisFilters.areaHectares[0] > 0 || imoveisFilters.areaHectares[1] > 0);
    if (hasAreaHectaresFilter) {
      tags.push({
        key: 'areaHectares',
        label: 'Área (ha)',
        value: `${imoveisFilters.areaHectares[0] || 0}ha - ${imoveisFilters.areaHectares[1] || 0}ha`,
        onRemove: () => onRemoveFilter('areaHectares')
      });
    }

    // ✅ VALOR AVALIAÇÃO (só mostrar se há valores válidos)
    const hasValueAvaliacaoFilter = imoveisFilters.valorAvaliacao &&
      imoveisFilters.valorAvaliacao.length > 0 &&
      imoveisFilters.valorAvaliacao[0] !== undefined &&
      imoveisFilters.valorAvaliacao[1] !== undefined &&
      (imoveisFilters.valorAvaliacao[0] > 0 || imoveisFilters.valorAvaliacao[1] > 0);
    if (hasValueAvaliacaoFilter) {
      // ✅ CORREÇÃO: Verificar se valores não são undefined antes de chamar toLocaleString
      const minValue = imoveisFilters.valorAvaliacao[0] === 0 ? "0+" : (imoveisFilters.valorAvaliacao[0] || 0).toLocaleString();
      const maxValue = (imoveisFilters.valorAvaliacao[1] || 0).toLocaleString();

      tags.push({
        key: 'valorAvaliacao',
        label: 'Valor de avaliação',
        value: `R$ ${minValue} - R$ ${maxValue}`,
        onRemove: () => onRemoveFilter('valorAvaliacao')
      });
    }

    // ✅ VALOR DESCONTO (só mostrar se há valores válidos)
    const hasValueDescontoFilter = imoveisFilters.valorDesconto &&
      imoveisFilters.valorDesconto.length > 0 &&
      imoveisFilters.valorDesconto[0] !== undefined &&
      imoveisFilters.valorDesconto[1] !== undefined &&
      (imoveisFilters.valorDesconto[0] > 0 || imoveisFilters.valorDesconto[1] > 0);
    if (hasValueDescontoFilter) {
      // ✅ CORREÇÃO: Verificar se valores não são undefined antes de chamar toLocaleString
      const minValue = imoveisFilters.valorDesconto[0] === 0 ? "0+" : (imoveisFilters.valorDesconto[0] || 0).toLocaleString();
      const maxValue = (imoveisFilters.valorDesconto[1] || 0).toLocaleString();

      tags.push({
        key: 'valorDesconto',
        label: 'Valor com desconto',
        value: `R$ ${minValue} - R$ ${maxValue}`,
        onRemove: () => onRemoveFilter('valorDesconto')
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

    // ✅ ANO (só mostrar se há valores válidos)
    const hasYearFilter = veiculosFilters.ano &&
      veiculosFilters.ano.length > 0 &&
      veiculosFilters.ano[0] !== undefined &&
      veiculosFilters.ano[1] !== undefined &&
      (veiculosFilters.ano[0] > 0 || veiculosFilters.ano[1] > 0);
    if (hasYearFilter) {
      tags.push({
        key: 'ano',
        label: 'Ano',
        value: `${veiculosFilters.ano[0] || 0} - ${veiculosFilters.ano[1] || 0}`,
        onRemove: () => onRemoveFilter('ano')
      });
    }

    // ✅ VALOR AVALIAÇÃO (só mostrar se há valores válidos)
    const hasValueAvaliacaoVeiculosFilter = veiculosFilters.valorAvaliacao &&
      veiculosFilters.valorAvaliacao.length > 0 &&
      veiculosFilters.valorAvaliacao[0] !== undefined &&
      veiculosFilters.valorAvaliacao[1] !== undefined &&
      (veiculosFilters.valorAvaliacao[0] > 0 || veiculosFilters.valorAvaliacao[1] > 0);
    if (hasValueAvaliacaoVeiculosFilter) {
      tags.push({
        key: 'valorAvaliacao',
        label: 'Valor de avaliação',
        value: `R$ ${(veiculosFilters.valorAvaliacao[0] || 0).toLocaleString()} - R$ ${(veiculosFilters.valorAvaliacao[1] || 0).toLocaleString()}`,
        onRemove: () => onRemoveFilter('valorAvaliacao')
      });
    }

    // ✅ VALOR DESCONTO (só mostrar se há valores válidos)
    const hasValueDescontoVeiculosFilter = veiculosFilters.valorDesconto &&
      veiculosFilters.valorDesconto.length > 0 &&
      veiculosFilters.valorDesconto[0] !== undefined &&
      veiculosFilters.valorDesconto[1] !== undefined &&
      (veiculosFilters.valorDesconto[0] > 0 || veiculosFilters.valorDesconto[1] > 0);
    if (hasValueDescontoVeiculosFilter) {
      tags.push({
        key: 'valorDesconto',
        label: 'Valor com desconto',
        value: `R$ ${(veiculosFilters.valorDesconto[0] || 0).toLocaleString()} - R$ ${(veiculosFilters.valorDesconto[1] || 0).toLocaleString()}`,
        onRemove: () => onRemoveFilter('valorDesconto')
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
            className="inline-flex items-center gap-1 px-2 py-1 bg-auction-50 text-auction-700 text-xs rounded-md border border-auction-200"
          >
            <span className="font-medium">{tag.label}:</span>
            <span>{tag.value}</span>
            <button
              onClick={tag.onRemove}
              className="ml-1 p-0.5 hover:bg-auction-100 rounded-sm transition-colors"
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
