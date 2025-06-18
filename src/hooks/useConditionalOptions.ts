import { useState, useEffect, useMemo, useRef } from 'react';
import { auctions } from '../lib/database';
import { getEstadosOptions, getMunicipiosOptions, fetchMunicipiosByEstado } from '../utils/ibgeApi';
import { MAPPINGS } from '../config/mappings';
import { FilterOption, IBGEMunicipio, Category } from '../types/auction';

// ✅ FASE 3: Cache para opções de filtros
interface OptionsCacheEntry {
  data: any;
  timestamp: number;
}

const OPTIONS_CACHE_DURATION = 10 * 60 * 1000; // 10 minutos
const optionsCache = new Map<string, OptionsCacheEntry>();

interface UseConditionalOptionsProps {
  category: Category;
  selectedState?: string;
}

interface ConditionalOptions {
  estados: FilterOption[];
  cidades: FilterOption[];
  formatos: FilterOption[];
  origens: FilterOption[];
  etapas: FilterOption[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook para gerenciar opções de filtros com visibilidade condicional
 * Só mostra opções que têm pelo menos 1 registro no banco de dados
 */
export const useConditionalOptions = ({
  category,
  selectedState
}: UseConditionalOptionsProps): ConditionalOptions => {
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [availableFormats, setAvailableFormats] = useState<string[]>([]);
  const [availableOrigins, setAvailableOrigins] = useState<string[]>([]);
  const [availableStages, setAvailableStages] = useState<string[]>([]);
  const [municipios, setMunicipios] = useState<IBGEMunicipio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ FASE 3: Refs para otimização
  const requestInProgress = useRef(false);
  const citiesRequestInProgress = useRef(false);

  // ✅ FASE 3: Carregar dados disponíveis no banco com cache
  useEffect(() => {
    const loadAvailableOptions = async () => {
      // ✅ FASE 3: Verificar cache primeiro
      const cacheKey = `options-${category}`;
      const cached = optionsCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < OPTIONS_CACHE_DURATION) {
        console.log('📦 Cache hit para opções:', cacheKey);
        const { states, formats, origins, stages } = cached.data;
        setAvailableStates(states);
        setAvailableFormats(formats);
        setAvailableOrigins(origins);
        setAvailableStages(stages);
        setLoading(false);
        return;
      }

      // ✅ FASE 3: Evitar requests duplicados
      if (requestInProgress.current) {
        console.log('⏳ Request de opções já em andamento');
        return;
      }

      try {
        requestInProgress.current = true;
        setLoading(true);
        setError(null);

        const [states, formats, origins, stages] = await Promise.all([
          auctions.getAvailableStates(category),
          auctions.getAvailableFormats(category),
          auctions.getAvailableOrigins(category),
          auctions.getAvailableStages(category)
        ]);

        // ✅ FASE 3: Salvar no cache
        optionsCache.set(cacheKey, {
          data: { states, formats, origins, stages },
          timestamp: Date.now()
        });

        setAvailableStates(states);
        setAvailableFormats(formats);
        setAvailableOrigins(origins);
        setAvailableStages(stages);
      } catch (err) {
        console.error('Erro ao carregar opções disponíveis:', err);
        setError('Erro ao carregar filtros');
      } finally {
        setLoading(false);
        requestInProgress.current = false;
      }
    };

    loadAvailableOptions();
  }, [category]);

  // ✅ FASE 3: Carregar cidades quando estado mudar com cache
  useEffect(() => {
    const loadCities = async () => {
      if (!selectedState || selectedState === 'all') {
        setAvailableCities([]);
        setMunicipios([]);
        return;
      }

      // ✅ FASE 3: Cache para cidades
      const cacheKey = `cities-${category}-${selectedState}`;
      const cached = optionsCache.get(cacheKey);

      if (cached && Date.now() - cached.timestamp < OPTIONS_CACHE_DURATION) {
        console.log('📦 Cache hit para cidades:', cacheKey);
        const { ibgeCities, dbCities } = cached.data;
        setMunicipios(ibgeCities);
        setAvailableCities(dbCities);
        return;
      }

      // ✅ FASE 3: Evitar requests duplicados de cidades
      if (citiesRequestInProgress.current) {
        console.log('⏳ Request de cidades já em andamento');
        return;
      }

      try {
        citiesRequestInProgress.current = true;

        // Buscar cidades do IBGE e do banco em paralelo
        const [ibgeCities, dbCities] = await Promise.all([
          fetchMunicipiosByEstado(selectedState),
          auctions.getAvailableCities(category, selectedState)
        ]);

        // ✅ FASE 3: Salvar no cache
        optionsCache.set(cacheKey, {
          data: { ibgeCities, dbCities },
          timestamp: Date.now()
        });

        setMunicipios(ibgeCities);
        setAvailableCities(dbCities);
      } catch (err) {
        console.error('Erro ao carregar cidades:', err);
        setAvailableCities([]);
        setMunicipios([]);
      } finally {
        citiesRequestInProgress.current = false;
      }
    };

    loadCities();
  }, [category, selectedState]);

  // Filtrar estados que têm registros
  const estados = useMemo(() => {
    const allStates = getEstadosOptions();
    return [
      allStates[0], // "Todos os estados"
      ...allStates.slice(1).filter(state => 
        availableStates.includes(state.value)
      )
    ];
  }, [availableStates]);

  // Filtrar cidades que têm registros
  const cidades = useMemo(() => {
    if (!selectedState || selectedState === 'all') {
      return [{ value: 'all', label: 'Todas as cidades' }];
    }

    const allCities = getMunicipiosOptions(municipios);
    return [
      allCities[0], // "Todas as cidades"
      ...allCities.slice(1).filter(city => 
        availableCities.includes(city.value)
      )
    ];
  }, [municipios, availableCities, selectedState]);

  // Filtrar formatos que têm registros
  const formatos = useMemo(() => {
    const formatOptions = [
      { value: "", label: "Qualquer Tipo" }, // Sempre disponível
      { value: "leilao", label: "Leilão" },
      { value: "venda-direta", label: "Venda Direta" },
      { value: "alienacao-particular", label: "Alienação Particular" }
    ];

    return formatOptions.filter(format => {
      if (format.value === "") return true; // "Qualquer Tipo" sempre disponível
      
      const mappedValues = MAPPINGS.FORMAT_MAP[format.value];
      if (!mappedValues || mappedValues.length === 0) return false;
      
      return mappedValues.some(value => availableFormats.includes(value));
    });
  }, [availableFormats]);

  // Filtrar origens que têm registros
  const origens = useMemo(() => {
    const originOptions = [
      { value: "judicial", label: "Judicial" },
      { value: "extrajudicial", label: "Extrajudicial" },
      { value: "publico", label: "Público" },
      { value: "nao-informado", label: "Não informado" }
    ];

    return originOptions.filter(origin => {
      if (origin.value === "nao-informado") {
        return availableOrigins.includes('__NAO_INFORMADO__');
      }
      
      const mappedValue = MAPPINGS.ORIGIN_MAP[origin.value];
      return mappedValue && availableOrigins.includes(mappedValue);
    });
  }, [availableOrigins]);

  // Filtrar etapas que têm registros
  const etapas = useMemo(() => {
    const stageOptions = [
      { value: "praca-unica", label: "Praça única" },
      { value: "primeira", label: "1ª Praça" },
      { value: "segunda", label: "2ª Praça" },
      { value: "terceira", label: "3ª Praça" },
      { value: "nao-informado", label: "Não informado" }
    ];

    return stageOptions.filter(stage => {
      if (stage.value === "nao-informado") {
        return availableStages.includes('__NAO_INFORMADO__');
      }
      
      const mappedValue = MAPPINGS.STAGE_MAP[stage.value];
      return mappedValue && availableStages.includes(mappedValue);
    });
  }, [availableStages]);

  return {
    estados,
    cidades,
    formatos,
    origens,
    etapas,
    loading,
    error
  };
};
