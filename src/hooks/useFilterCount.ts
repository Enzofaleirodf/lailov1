import { useState, useEffect, useCallback, useRef } from 'react';
import { auctions } from '../lib/database';
import { Category, ImoveisFilters, VeiculosFilters } from '../types/auction';
import { FILTER_CONFIG } from '../config/constants';
import * as MAPPINGS from '../config/mappings';
import { startTimer, endTimer } from '../utils/performance';

// ✅ FASE 3: Cache para contagem de filtros
interface CountCacheEntry {
  count: number;
  timestamp: number;
}

const COUNT_CACHE_DURATION = 2 * 60 * 1000; // 2 minutos
const countCache = new Map<string, CountCacheEntry>();

interface FilterCountResult {
  count: number;
  loading: boolean;
  error: string | null;
  hasUserFilters: boolean; // ✅ NOVO: Indica se há filtros do usuário ativos
}

/**
 * Hook para contar quantos leilões serão retornados com os filtros aplicados
 * Usado para mostrar feedback dinâmico no botão "Aplicar filtros"
 */
export const useFilterCount = (
  category: Category,
  currentType: string,
  stagedFilters: ImoveisFilters | VeiculosFilters,
  searchQuery?: string,
  showExpiredAuctions: boolean = false // ✅ NOVO: Parâmetro para leilões expirados
): FilterCountResult => {
  const [result, setResult] = useState<FilterCountResult>({
    count: 0,
    loading: false,
    error: null,
    hasUserFilters: false
  });

  // ✅ FASE 3: Refs para otimização
  const debounceRef = useRef<NodeJS.Timeout>();
  const requestInProgress = useRef(false);
  const lastRequestKey = useRef<string>('');

  // ✅ DETECTAR: Se há filtros do usuário ativos (não incluir tipo da rota)
  const hasUserFilters = (() => {
    if (category === 'imoveis') {
      const filters = stagedFilters as ImoveisFilters;
      return (
        (filters.estado && filters.estado !== '' && filters.estado !== 'all') ||
        (filters.cidade && filters.cidade !== '' && filters.cidade !== 'all') ||
        (filters.formato && filters.formato !== '') ||
        (filters.origem && filters.origem.length > 0) ||
        (filters.etapa && filters.etapa.length > 0) ||
        (filters.area[0] !== 0 || filters.area[1] !== 0) ||
        (filters.valor[0] !== 0 || filters.valor[1] !== 0) ||
        (searchQuery && searchQuery.trim() !== '')
      );
    } else {
      const filters = stagedFilters as VeiculosFilters;
      return (
        (filters.estado && filters.estado !== '' && filters.estado !== 'all') ||
        (filters.cidade && filters.cidade !== '' && filters.cidade !== 'all') ||
        (filters.marca && filters.marca !== '' && filters.marca !== 'all') ||
        (filters.modelo && filters.modelo !== '' && filters.modelo !== 'all') ||
        (filters.cor && filters.cor !== '' && filters.cor !== 'all') ||
        (filters.formato && filters.formato !== '') ||
        (filters.origem && filters.origem.length > 0) ||
        (filters.etapa && filters.etapa.length > 0) ||
        (filters.ano[0] !== 0 || filters.ano[1] !== 0) ||
        (filters.preco[0] !== 0 || filters.preco[1] !== 0) ||
        (searchQuery && searchQuery.trim() !== '')
      );
    }
  })();



  const fetchCount = useCallback(async () => {
    try {
      // ✅ CORREÇÃO: Só fazer contagem se há filtros do usuário ativos
      if (!hasUserFilters) {
        setResult({ count: 0, loading: false, error: null, hasUserFilters: false });
        return;
      }

      // ✅ FASE 3: Gerar chave de cache
      const cacheKey = `${category}-${currentType}-${JSON.stringify(stagedFilters)}-${searchQuery || ''}-${showExpiredAuctions}`;

      // ✅ FASE 3: Verificar cache primeiro
      const cached = countCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < COUNT_CACHE_DURATION) {
        console.log('📦 Cache hit para contagem:', cacheKey.substring(0, 50) + '...');
        endTimer(`filter-count-${category}`, { cacheHit: true, category: 'filter-count' });
        setResult({ count: cached.count, loading: false, error: null, hasUserFilters: true });
        return;
      }

      // ✅ FASE 3: Iniciar timer de performance
      startTimer(`filter-count-${category}`);

      // ✅ FASE 3: Evitar requests duplicados
      if (requestInProgress.current && lastRequestKey.current === cacheKey) {
        console.log('⏳ Request duplicado evitado');
        return;
      }

      requestInProgress.current = true;
      lastRequestKey.current = cacheKey;

      setResult(prev => ({ ...prev, loading: true, error: null, hasUserFilters: true }));

      if (category === 'imoveis') {
        const imoveisFilters = stagedFilters as ImoveisFilters;

        // ✅ CORREÇÃO CRÍTICA: Aplicar filtro de tipo da rota usando nova lógica
        const typeFilterResult = currentType === 'todos' ? {} :
                                 currentType === 'nao-informado' ? { isNaoInformado: true } :
                                 { types: MAPPINGS.PROPERTY_TYPE_MAP[currentType] };

        const typeFilter = typeFilterResult.types ||
                          (typeFilterResult.isNaoInformado ? ['__NAO_INFORMADO__'] : undefined);
        const mappedFormat = imoveisFilters.formato ? MAPPINGS.FORMAT_MAP[imoveisFilters.formato]?.[0] : undefined;
        const mappedOrigin = imoveisFilters.origem && imoveisFilters.origem.length > 0
          ? (() => {
              const mapped = imoveisFilters.origem.map(o => MAPPINGS.ORIGIN_MAP[o]).filter(value => value !== undefined);
              return mapped.length > 0 ? mapped : ['__VALOR_INEXISTENTE__'];
            })()
          : undefined;
        const mappedStage = imoveisFilters.etapa && imoveisFilters.etapa.length > 0
          ? (() => {
              const mapped = imoveisFilters.etapa.map(s => MAPPINGS.STAGE_MAP[s]).filter(value => value !== undefined);
              return mapped.length > 0 ? mapped : ['__VALOR_INEXISTENTE__'];
            })()
          : undefined;

        // ✅ CORREÇÃO: Não aplicar filtros de range quando estão no estado inicial [0,0]
        const isAreaDefault = imoveisFilters.area[0] === 0 && imoveisFilters.area[1] === 0;
        const isValueDefault = imoveisFilters.valor[0] === 0 && imoveisFilters.valor[1] === 0;

        const count = await auctions.countProperties({
          state: imoveisFilters.estado && imoveisFilters.estado !== 'all' && imoveisFilters.estado !== '' ? imoveisFilters.estado : undefined,
          city: imoveisFilters.cidade && imoveisFilters.cidade !== 'all' && imoveisFilters.cidade !== '' ? imoveisFilters.cidade : undefined,
          property_categories: typeFilter, // ✅ CORREÇÃO CRÍTICA: Usar property_categories
          format: mappedFormat,
          origin: mappedOrigin,
          stage: mappedStage,
          min_area: !isAreaDefault ? imoveisFilters.area[0] : undefined,
          max_area: !isAreaDefault ? imoveisFilters.area[1] : undefined,
          min_value: !isValueDefault ? imoveisFilters.valor[0] : undefined,
          max_value: !isValueDefault ? imoveisFilters.valor[1] : undefined,
          search: searchQuery || undefined,
          showExpiredAuctions // ✅ NOVO: Incluir filtro de leilões expirados
        });

        // ✅ FASE 3: Salvar no cache
        countCache.set(cacheKey, {
          count,
          timestamp: Date.now()
        });

        // ✅ FASE 3: Finalizar timer
        endTimer(`filter-count-${category}`, { cacheHit: false, category: 'filter-count' });

        setResult({ count, loading: false, error: null, hasUserFilters: true });
      } else {
        const veiculosFilters = stagedFilters as VeiculosFilters;

        // ✅ CORREÇÃO CRÍTICA: Aplicar filtro de tipo da rota usando nova lógica
        const typeFilterResult = currentType === 'todos' ? {} :
                                 currentType === 'nao-informado' ? { isNaoInformado: true } :
                                 { types: MAPPINGS.VEHICLE_TYPE_MAP[currentType] };

        const typeFilter = typeFilterResult.types ||
                          (typeFilterResult.isNaoInformado ? ['__NAO_INFORMADO__'] : undefined);
        const mappedFormat = veiculosFilters.formato ? MAPPINGS.FORMAT_MAP[veiculosFilters.formato]?.[0] : undefined;
        const mappedOrigin = veiculosFilters.origem && veiculosFilters.origem.length > 0
          ? (() => {
              const mapped = veiculosFilters.origem.map(o => MAPPINGS.ORIGIN_MAP[o]).filter(value => value !== undefined);
              return mapped.length > 0 ? mapped : ['__VALOR_INEXISTENTE__'];
            })()
          : undefined;
        const mappedStage = veiculosFilters.etapa && veiculosFilters.etapa.length > 0
          ? (() => {
              const mapped = veiculosFilters.etapa.map(s => MAPPINGS.STAGE_MAP[s]).filter(value => value !== undefined);
              return mapped.length > 0 ? mapped : ['__VALOR_INEXISTENTE__'];
            })()
          : undefined;

        // ✅ CORREÇÃO: Não aplicar filtros de range quando estão no estado inicial [0,0]
        const isYearDefault = veiculosFilters.ano[0] === 0 && veiculosFilters.ano[1] === 0;
        const isPriceDefault = veiculosFilters.preco[0] === 0 && veiculosFilters.preco[1] === 0;

        const count = await auctions.countVehicles({
          state: veiculosFilters.estado && veiculosFilters.estado !== 'all' && veiculosFilters.estado !== '' ? veiculosFilters.estado : undefined,
          city: veiculosFilters.cidade && veiculosFilters.cidade !== 'all' && veiculosFilters.cidade !== '' ? veiculosFilters.cidade : undefined,
          vehicle_types: typeFilter,
          brand: veiculosFilters.marca && veiculosFilters.marca !== 'all' && veiculosFilters.marca !== '' ? veiculosFilters.marca : undefined,
          model: veiculosFilters.modelo && veiculosFilters.modelo !== 'all' && veiculosFilters.modelo !== '' ? veiculosFilters.modelo : undefined,
          color: veiculosFilters.cor && veiculosFilters.cor !== 'all' && veiculosFilters.cor !== '' ? veiculosFilters.cor : undefined,
          format: mappedFormat,
          origin: mappedOrigin,
          stage: mappedStage,
          min_year: !isYearDefault ? veiculosFilters.ano[0] : undefined,
          max_year: !isYearDefault ? veiculosFilters.ano[1] : undefined,
          min_value: !isPriceDefault ? veiculosFilters.preco[0] : undefined,
          max_value: !isPriceDefault ? veiculosFilters.preco[1] : undefined,
          search: searchQuery || undefined,
          showExpiredAuctions // ✅ NOVO: Incluir filtro de leilões expirados
        });

        // ✅ FASE 3: Salvar no cache
        countCache.set(cacheKey, {
          count,
          timestamp: Date.now()
        });

        // ✅ FASE 3: Finalizar timer
        endTimer(`filter-count-${category}`, { cacheHit: false, category: 'filter-count' });

        setResult({ count, loading: false, error: null, hasUserFilters: true });
      }
    } catch (err) {
      console.error('Erro ao contar filtros:', err);
      setResult({ count: 0, loading: false, error: 'Erro ao carregar contagem', hasUserFilters: false });
    } finally {
      // ✅ FASE 3: Liberar flag de request
      requestInProgress.current = false;
    }
  }, [
    category,
    currentType,
    hasUserFilters, // ✅ NOVO: Monitorar se há filtros do usuário
    // ✅ CORREÇÃO: Monitorar o objeto completo de filtros para detectar mudanças
    JSON.stringify(stagedFilters),
    searchQuery,
    showExpiredAuctions // ✅ NOVO: Monitorar mudanças no filtro de leilões expirados
  ]);

  // ✅ FASE 3: Debounce otimizado com cancelamento
  useEffect(() => {
    // Cancelar debounce anterior se existir
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // ✅ FASE 3: Debounce adaptativo - mais rápido para mudanças simples
    const delay = hasUserFilters ? 300 : 100; // Mais rápido quando há filtros

    debounceRef.current = setTimeout(() => {
      fetchCount();
    }, delay);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [fetchCount, hasUserFilters]);

  return result;
};
