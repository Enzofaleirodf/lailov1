import { useState, useEffect, useRef } from 'react';
import { Category } from '../types/auction';
import { FILTER_CONFIG } from '../config/constants';
import { MAPPINGS } from '../config/mappings';
import { startTimer, endTimer } from '../utils/performance';

// ✅ FASE 3: Cache inteligente para ranges
interface CacheEntry {
  data: RealRanges;
  timestamp: number;
  key: string;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos
const rangeCache = new Map<string, CacheEntry>();

interface RealRanges {
  areaRange: [number, number];
  priceRange: [number, number];
  yearRange: [number, number];
  loading: boolean;
  error: string | null;
}

interface UseRealRangesParams {
  category: Category;
  currentType?: string;
  showExpiredAuctions?: boolean;
}

/**
 * Hook para buscar ranges reais (min/max) do banco de dados
 * Substitui valores hardcoded por dados reais
 */
export const useRealRanges = ({
  category,
  currentType,
  showExpiredAuctions = false
}: UseRealRangesParams): RealRanges => {
  // 🚀 UX CLEAN: Começar com ranges padrão válidos para permitir input
  const [ranges, setRanges] = useState<RealRanges>({
    areaRange: category === 'imoveis' ? [0, 999999] : [0, 0],
    priceRange: [0, 999999999],
    yearRange: category === 'veiculos' ? [1900, new Date().getFullYear() + 1] : [0, 0],
    loading: false, // 🔥 MUDANÇA: Não mostrar loading inicial
    error: null
  });

  // ✅ FASE 3: Ref para evitar requests duplicados
  const requestInProgress = useRef(false);

  useEffect(() => {
    const fetchRealRanges = async () => {
      // ✅ FASE 3: Gerar chave de cache
      const cacheKey = `${category}-${currentType || 'todos'}-${showExpiredAuctions}`;

      // ✅ FASE 3: Verificar cache primeiro
      const cached = rangeCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('📦 Cache hit para ranges:', cacheKey);
        endTimer(`ranges-${cacheKey}`, { cacheHit: true, category: 'ranges' });
        setRanges(cached.data);
        return;
      }

      // ✅ FASE 3: Iniciar timer de performance
      startTimer(`ranges-${cacheKey}`);

      // ✅ FASE 3: Evitar requests duplicados
      if (requestInProgress.current) {
        console.log('⏳ Request já em andamento, aguardando...');
        return;
      }

      requestInProgress.current = true;
      try {
        // 🚀 UX CLEAN: Loading discreto apenas durante fetch
        setRanges(prev => ({ ...prev, loading: true, error: null }));

        if (category === 'imoveis') {
          // ✅ BUSCAR RANGES REAIS DE IMÓVEIS
          let propertyCategories: string[] | undefined;
          
          // Mapear currentType para filtro do banco
          if (currentType && currentType !== 'todos') {
            if (currentType === 'nao-informado') {
              propertyCategories = [''];
            } else {
              const mappedCategories = MAPPINGS.PROPERTY_TYPE_MAP[currentType];
              propertyCategories = mappedCategories;
            }
          }

          // 🚀 DYNAMIC IMPORT para evitar conflito de code splitting
          const { auctions } = await import('../lib/database');

          // 🚀 PERFORMANCE BOOST: Usar agregação otimizada em vez de buscar 10k registros
          const ranges = await auctions.getPropertyRanges({
            showExpiredAuctions,
            ...(propertyCategories ? { property_categories: propertyCategories } : {})
          });

          // Definir ranges ou usar fallback
          const areaRange: [number, number] = (ranges.minArea !== null && ranges.maxArea !== null)
            ? [ranges.minArea, ranges.maxArea]
            : [FILTER_CONFIG.DEFAULT_RANGES.PROPERTY_AREA.MIN, FILTER_CONFIG.DEFAULT_RANGES.PROPERTY_AREA.MAX];

          const priceRange: [number, number] = (ranges.minPrice !== null && ranges.maxPrice !== null)
            ? [ranges.minPrice, ranges.maxPrice]
            : [FILTER_CONFIG.DEFAULT_RANGES.PROPERTY_VALUE.MIN, FILTER_CONFIG.DEFAULT_RANGES.PROPERTY_VALUE.MAX];

          const result = {
            areaRange,
            priceRange,
            yearRange: [0, 0], // Imóveis não têm ano
            loading: false,
            error: null
          };

          // ✅ FASE 3: Salvar no cache
          rangeCache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
            key: cacheKey
          });

          // ✅ FASE 3: Finalizar timer
          endTimer(`ranges-${cacheKey}`, { cacheHit: false, category: 'ranges' });

          setRanges(result);

        } else {
          // ✅ BUSCAR RANGES REAIS DE VEÍCULOS
          let vehicleTypes: string[] | undefined;
          
          // Mapear currentType para filtro do banco
          if (currentType && currentType !== 'todos') {
            if (currentType === 'nao-informado') {
              vehicleTypes = [''];
            } else {
              const mappedTypes = MAPPINGS.VEHICLE_TYPE_MAP[currentType];
              vehicleTypes = mappedTypes;
            }
          }

          // 🚀 DYNAMIC IMPORT para evitar conflito de code splitting
          const { auctions } = await import('../lib/database');

          // 🚀 PERFORMANCE BOOST: Usar agregação otimizada em vez de buscar 10k registros
          const ranges = await auctions.getVehicleRanges({
            showExpiredAuctions,
            ...(vehicleTypes ? { vehicle_types: vehicleTypes } : {})
          });

          // Definir ranges ou usar fallback
          const yearRange: [number, number] = (ranges.minYear !== null && ranges.maxYear !== null)
            ? [ranges.minYear, ranges.maxYear]
            : [FILTER_CONFIG.DEFAULT_RANGES.VEHICLE_YEAR.MIN, FILTER_CONFIG.DEFAULT_RANGES.VEHICLE_YEAR.MAX];

          const priceRange: [number, number] = (ranges.minPrice !== null && ranges.maxPrice !== null)
            ? [ranges.minPrice, ranges.maxPrice]
            : [FILTER_CONFIG.DEFAULT_RANGES.VEHICLE_PRICE.MIN, FILTER_CONFIG.DEFAULT_RANGES.VEHICLE_PRICE.MAX];

          const result = {
            areaRange: [0, 0], // Veículos não têm área
            priceRange,
            yearRange,
            loading: false,
            error: null
          };

          // ✅ FASE 3: Salvar no cache
          rangeCache.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
            key: cacheKey
          });

          // ✅ FASE 3: Finalizar timer
          endTimer(`ranges-${cacheKey}`, { cacheHit: false, category: 'ranges' });

          setRanges(result);
        }

      } catch (error) {
        console.error('Erro ao buscar ranges reais:', error);
        
        // ✅ FALLBACK: Usar valores hardcoded se API falhar
        const fallbackRanges = category === 'imoveis' ? {
          areaRange: [FILTER_CONFIG.DEFAULT_RANGES.PROPERTY_AREA.MIN, FILTER_CONFIG.DEFAULT_RANGES.PROPERTY_AREA.MAX] as [number, number],
          priceRange: [FILTER_CONFIG.DEFAULT_RANGES.PROPERTY_VALUE.MIN, FILTER_CONFIG.DEFAULT_RANGES.PROPERTY_VALUE.MAX] as [number, number],
          yearRange: [0, 0] as [number, number]
        } : {
          areaRange: [0, 0] as [number, number],
          priceRange: [FILTER_CONFIG.DEFAULT_RANGES.VEHICLE_PRICE.MIN, FILTER_CONFIG.DEFAULT_RANGES.VEHICLE_PRICE.MAX] as [number, number],
          yearRange: [FILTER_CONFIG.DEFAULT_RANGES.VEHICLE_YEAR.MIN, FILTER_CONFIG.DEFAULT_RANGES.VEHICLE_YEAR.MAX] as [number, number]
        };

        setRanges({
          ...fallbackRanges,
          loading: false,
          error: 'Erro ao carregar ranges. Usando valores padrão.'
        });
      } finally {
        // ✅ FASE 3: Liberar flag de request
        requestInProgress.current = false;
      }
    };

    fetchRealRanges();
  }, [category, currentType, showExpiredAuctions]);

  return ranges;
};
