import { useMemo, useState, useEffect } from 'react';
import { processRealAuctions } from '../services/realAuctionService';
import { useDebounce } from './useDebounce';
import {
  Category,
  SortOption,
  Filters,
  AuctionSearchResult,
  UseAuctionDataParams
} from '../types/auction';

export const useAuctionData = ({
  category,
  currentType,
  appliedFilters,
  sortOption,
  searchQuery,
  showExpiredAuctions,
  page = 1 // ✅ PAGINAÇÃO REAL: Receber página como parâmetro
}: UseAuctionDataParams): AuctionSearchResult & { loading: boolean; error: string | null } => {
  const [data, setData] = useState<AuctionSearchResult>({ auctions: [], totalSites: 0, newAuctions: 0 });
  const [loading, setLoading] = useState(false); // 🚀 UX CLEAN: Começar sem loading desnecessário
  const [error, setError] = useState<string | null>(null);

  // 🚀 UX CLEAN: Debounce otimizado para responsividade
  const debouncedSearchQuery = useDebounce(searchQuery, 300); // 300ms = responsivo

  // 🚀 OTIMIZAÇÃO: Memoizar filtros para evitar re-renders desnecessários
  const filters = useMemo((): Filters => {
    return category === 'imoveis' ? {
      format: appliedFilters.imoveis.formato || undefined,
      origin: appliedFilters.imoveis.origem.length > 0 ? appliedFilters.imoveis.origem : undefined,
      stage: appliedFilters.imoveis.etapa.length > 0 ? appliedFilters.imoveis.etapa : undefined,
      state: appliedFilters.imoveis.estado && appliedFilters.imoveis.estado !== "all" ? appliedFilters.imoveis.estado : undefined,
      city: appliedFilters.imoveis.cidade && appliedFilters.imoveis.cidade !== "all" ? appliedFilters.imoveis.cidade : undefined,
      useful_area_m2: (appliedFilters.imoveis.area[0] !== 0 || appliedFilters.imoveis.area[1] !== 0) ? appliedFilters.imoveis.area : undefined,
      initial_bid_value: (appliedFilters.imoveis.valor[0] !== 0 || appliedFilters.imoveis.valor[1] !== 0) ? appliedFilters.imoveis.valor : undefined
    } : {
      format: appliedFilters.veiculos.formato || undefined,
      origin: appliedFilters.veiculos.origem.length > 0 ? appliedFilters.veiculos.origem : undefined,
      stage: appliedFilters.veiculos.etapa.length > 0 ? appliedFilters.veiculos.etapa : undefined,
      state: appliedFilters.veiculos.estado && appliedFilters.veiculos.estado !== "all" ? appliedFilters.veiculos.estado : undefined,
      city: appliedFilters.veiculos.cidade && appliedFilters.veiculos.cidade !== "all" ? appliedFilters.veiculos.cidade : undefined,
      brand: appliedFilters.veiculos.marca && appliedFilters.veiculos.marca !== "all" ? appliedFilters.veiculos.marca : undefined,
      model: appliedFilters.veiculos.modelo && appliedFilters.veiculos.modelo !== "all" ? appliedFilters.veiculos.modelo : undefined,
      color: appliedFilters.veiculos.cor && appliedFilters.veiculos.cor !== "all" ? appliedFilters.veiculos.cor : undefined,
      year: (appliedFilters.veiculos.ano[0] !== 0 || appliedFilters.veiculos.ano[1] !== 0) ? appliedFilters.veiculos.ano : undefined,
      initial_bid_value: (appliedFilters.veiculos.preco[0] !== 0 || appliedFilters.veiculos.preco[1] !== 0) ? appliedFilters.veiculos.preco : undefined
    };
  }, [
    category,
    appliedFilters.imoveis.estado,
    appliedFilters.imoveis.cidade,
    appliedFilters.imoveis.formato,
    appliedFilters.imoveis.origem.join(','),
    appliedFilters.imoveis.etapa.join(','),
    appliedFilters.imoveis.area.join(','),
    appliedFilters.imoveis.valor.join(','),
    appliedFilters.veiculos.estado,
    appliedFilters.veiculos.cidade,
    appliedFilters.veiculos.marca,
    appliedFilters.veiculos.modelo,
    appliedFilters.veiculos.cor,
    appliedFilters.veiculos.formato,
    appliedFilters.veiculos.origem.join(','),
    appliedFilters.veiculos.etapa.join(','),
    appliedFilters.veiculos.ano.join(','),
    appliedFilters.veiculos.preco.join(',')
  ]);

  // Buscar dados quando dependências mudarem
  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      const startTime = Date.now();
      setError(null);

      // 🚀 UX CLEAN: Loading inteligente - só ativar se demorar > 200ms
      const loadingTimeout = setTimeout(() => {
        if (!isCancelled) {
          setLoading(true);
        }
      }, 200);

      try {
        // ✅ PAGINAÇÃO REAL: Usar página recebida como parâmetro
        const result = await processRealAuctions(
          category,
          currentType,
          filters,
          sortOption,
          debouncedSearchQuery, // 🚀 UX CLEAN: Debounce otimizado
          page, // ✅ CORREÇÃO: Usar página real
          showExpiredAuctions // ✅ NOVO: Passar parâmetro de leilões expirados
        );

        if (!isCancelled) {
          clearTimeout(loadingTimeout);
          setData(result);
        }
      } catch (err) {
        if (!isCancelled) {
          clearTimeout(loadingTimeout);
          console.error('Erro ao buscar leilões:', err);
          setError(err instanceof Error ? err.message : 'Erro desconhecido');
          setData({ auctions: [], totalSites: 0, newAuctions: 0 });
        }
      } finally {
        if (!isCancelled) {
          clearTimeout(loadingTimeout);
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [
    category,
    currentType, // ✅ SEGMENTAÇÃO: Incluir currentType nas dependências
    sortOption,
    debouncedSearchQuery, // ✅ CORREÇÃO: Usar searchQuery com debounce
    showExpiredAuctions, // ✅ NOVO: Incluir showExpiredAuctions nas dependências
    page, // ✅ PAGINAÇÃO REAL: Incluir page nas dependências
    // Usar o objeto filters memoizado
    filters
  ]);

  return {
    ...data,
    loading,
    error
  };
};