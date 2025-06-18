import { 
  Auction, 
  Category, 
  SortOption, 
  Filters, 
  AuctionSearchResult,
  isValidAuction 
} from '../types/auction';
import { DateUtils } from '../utils/dateUtils';
import { MAPPINGS } from '../config/mappings';
import { DATE_CONFIG } from '../config/constants';

/**
 * Service para operações com leilões
 * Separação clara de responsabilidades: filtros, busca, ordenação
 */

// ===== UTILITY FUNCTIONS =====

/**
 * Normaliza string para comparação (remove acentos, espaços extras, etc.)
 */
function normalizeString(str: string): string {
  if (!str || typeof str !== 'string') return '';
  
  return str
    .normalize('NFD') // Decompor caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // Normalizar espaços
}

/**
 * Compara duas strings de forma robusta (case-insensitive, sem acentos)
 */
function compareStrings(str1: string, str2: string): boolean {
  return normalizeString(str1) === normalizeString(str2);
}

/**
 * Type guard para validar se um valor é um array de strings
 */
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

/**
 * Type guard para validar se um valor é um range numérico
 */
function isNumberRange(value: unknown): value is [number, number] {
  return Array.isArray(value) && 
         value.length === 2 && 
         typeof value[0] === 'number' && 
         typeof value[1] === 'number';
}

// ===== FILTER FUNCTIONS =====

/**
 * Filtra leilões por categoria e status ativo
 */
export function filterByCategory(auctions: Auction[], category: Category): Auction[] {
  const now = DateUtils.getNow();
  
  return auctions.filter((auction): auction is Auction => {
    if (!isValidAuction(auction)) {
      return false;
    }
    
    const endDate = DateUtils.parse(auction.end_date);
    if (!endDate) {
      return false;
    }
    
    const isActive = DateUtils.isFuture(endDate);
    const matchesCategory = category === 'imoveis' ? auction.type === 'property' : auction.type === 'vehicle';
    
    return isActive && matchesCategory;
  });
}

/**
 * Filtra leilões por tipo específico
 */
export function filterByType(auctions: Auction[], category: Category, type?: string): Auction[] {
  if (!type || type === 'todos') {
    return auctions;
  }

  return auctions.filter((auction) => {
    if (category === 'veiculos') {
      const allowedTypes = MAPPINGS.VEHICLE_TYPE_MAP[type];
      return allowedTypes && allowedTypes.includes(auction.vehicle_type || '');
    } else {
      const allowedTypes = MAPPINGS.PROPERTY_TYPE_MAP[type];
      return allowedTypes && allowedTypes.includes(auction.property_type || '');
    }
  });
}

/**
 * Aplica filtros gerais (formato, origem, etapa, localização)
 */
export function applyGeneralFilters(auctions: Auction[], filters: Filters): Auction[] {
  return auctions.filter((auction): boolean => {
    if (!isValidAuction(auction)) {
      return false;
    }
    
    // Format filter
    if (filters.format) {
      const allowedFormats = MAPPINGS.FORMAT_MAP[filters.format];
      if (filters.format === 'leilao') {
        if (!allowedFormats.includes(auction.format)) {
          return false;
        }
      } else if (allowedFormats && !allowedFormats.includes(auction.format)) {
        return false;
      }
    }

    // Origin filter (multiple choice)
    if (filters.origin && isStringArray(filters.origin) && filters.origin.length > 0) {
      const mappedOrigins = filters.origin.map(o => MAPPINGS.ORIGIN_MAP[o] || o);
      if (!mappedOrigins.includes(auction.origin)) {
        return false;
      }
    }

    // Stage filter (multiple choice)
    if (filters.stage && isStringArray(filters.stage) && filters.stage.length > 0) {
      const mappedStages = filters.stage.map(s => MAPPINGS.STAGE_MAP[s] || s);
      if (!mappedStages.includes(auction.stage)) {
        return false;
      }
    }

    // State filter
    if (filters.state && filters.state !== "all" && auction.state !== filters.state) {
      return false;
    }

    // City filter
    if (filters.city && filters.city !== "all") {
      const cityMatches = compareStrings(auction.city, filters.city);
      if (!cityMatches) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Aplica filtros específicos de propriedades
 */
export function applyPropertyFilters(auctions: Auction[], filters: Filters): Auction[] {
  return auctions.filter((auction): boolean => {
    if (auction.type !== 'property') {
      return true; // Não filtrar veículos
    }

    // Useful area filter
    if (filters.useful_area_m2 && isNumberRange(filters.useful_area_m2) && auction.useful_area_m2) {
      const [min, max] = filters.useful_area_m2;
      if (auction.useful_area_m2 < min || auction.useful_area_m2 > max) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Aplica filtros específicos de veículos
 */
export function applyVehicleFilters(auctions: Auction[], filters: Filters): Auction[] {
  return auctions.filter((auction): boolean => {
    if (auction.type !== 'vehicle') {
      return true; // Não filtrar propriedades
    }

    // Brand filter
    if (filters.brand && filters.brand !== "all") {
      const brandMatches = compareStrings(auction.brand || '', filters.brand);
      if (!brandMatches) {
        return false;
      }
    }

    // Model filter
    if (filters.model && filters.model !== "all") {
      const modelMatches = compareStrings(auction.model || '', filters.model);
      if (!modelMatches) {
        return false;
      }
    }

    // Color filter
    if (filters.color && filters.color !== "all") {
      const colorMatches = compareStrings(auction.color || '', filters.color);
      if (!colorMatches) {
        return false;
      }
    }

    // Year filter
    if (filters.year && isNumberRange(filters.year) && auction.year) {
      const [min, max] = filters.year;
      if (auction.year < min || auction.year > max) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Aplica filtro de valor do lance inicial
 */
export function applyPriceFilter(auctions: Auction[], filters: Filters): Auction[] {
  if (!filters.initial_bid_value || !isNumberRange(filters.initial_bid_value)) {
    return auctions;
  }

  const [min, max] = filters.initial_bid_value;
  
  return auctions.filter((auction) => {
    return auction.initial_bid_value >= min && auction.initial_bid_value <= max;
  });
}

// ===== SEARCH FUNCTIONS =====

/**
 * Aplica busca por texto
 */
export function applySearch(auctions: Auction[], searchQuery?: string): Auction[] {
  if (!searchQuery || typeof searchQuery !== 'string' || !searchQuery.trim()) {
    return auctions;
  }

  const query = searchQuery.toLowerCase().trim();
  
  return auctions.filter((auction): boolean => {
    if (!isValidAuction(auction)) {
      return false;
    }
    
    const searchableText = [
      auction.property_type,
      auction.property_address,
      auction.vehicle_type,
      auction.brand,
      auction.model,
      auction.city,
      auction.state,
      auction.website
    ].filter((item): item is string => typeof item === 'string').join(' ').toLowerCase();
    
    return searchableText.includes(query);
  });
}

// ===== SORT FUNCTIONS =====

/**
 * Aplica ordenação aos leilões
 */
export function applySorting(auctions: Auction[], sort?: SortOption): Auction[] {
  if (!sort || auctions.length === 0) {
    return auctions;
  }

  try {
    return [...auctions].sort((a, b): number => {
      if (!isValidAuction(a) || !isValidAuction(b)) {
        return 0;
      }
      
      switch (sort) {
        case 'newest':
          const dateA = DateUtils.parse(a.updated);
          const dateB = DateUtils.parse(b.updated);
          if (!dateA || !dateB) return 0;
          return dateB.getTime() - dateA.getTime();
          
        case 'lowest-bid':
          return a.initial_bid_value - b.initial_bid_value;
          
        case 'highest-bid':
          return b.initial_bid_value - a.initial_bid_value;
          
        case 'highest-discount':
          // ✅ CORREÇÃO: Aplicar mesma lógica do AuctionCard
          const bidA = a.initial_bid_value || 0;
          const bidB = b.initial_bid_value || 0;

          // Se um dos lances é 0, colocar por último
          if (bidA === 0 && bidB !== 0) return 1;
          if (bidB === 0 && bidA !== 0) return -1;
          if (bidA === 0 && bidB === 0) return 0;

          // ✅ CORREÇÃO: Calcular desconto apenas se valor de avaliação > 0 e lance > 0
          const discountA = (a.appraised_value &&
                           typeof a.appraised_value === 'number' &&
                           a.appraised_value > 0 && // ✅ NOVO: Verificar se valor avaliado > 0
                           bidA > 0 &&
                           a.appraised_value > bidA)
            ? ((a.appraised_value - bidA) / a.appraised_value) * 100
            : -1; // -1 para itens sem desconto válido
          const discountB = (b.appraised_value &&
                           typeof b.appraised_value === 'number' &&
                           b.appraised_value > 0 && // ✅ NOVO: Verificar se valor avaliado > 0
                           bidB > 0 &&
                           b.appraised_value > bidB)
            ? ((b.appraised_value - bidB) / b.appraised_value) * 100
            : -1;

          // Se um não tem desconto válido, colocar por último
          if (discountA === -1 && discountB !== -1) return 1;
          if (discountB === -1 && discountA !== -1) return -1;
          if (discountA === -1 && discountB === -1) return 0;

          // Ordenar por maior desconto
          return discountB - discountA;
          
        case 'nearest':
          const endA = DateUtils.parse(a.end_date);
          const endB = DateUtils.parse(b.end_date);
          if (!endA || !endB) return 0;
          return endA.getTime() - endB.getTime();
          
        default:
          return 0;
      }
    });
  } catch (error) {
    console.error('Erro ao ordenar leilões:', error);
    return auctions;
  }
}

// ===== STATISTICS FUNCTIONS =====

/**
 * Calcula estatísticas dos leilões
 */
export function calculateStatistics(auctions: Auction[]): { totalSites: number; newAuctions: number } {
  try {
    // Calcular "novos hoje"
    const newAuctions = auctions.filter((auction): boolean => {
      if (!isValidAuction(auction) || !auction.data_scraped) return false;
      return DateUtils.isWithinLastHours(auction.data_scraped, DATE_CONFIG.NEW_AUCTION_THRESHOLD_HOURS);
    }).length;

    // Calcular sites únicos
    const uniqueSites = new Set(
      auctions
        .map(auction => auction.website)
        .filter((site): site is string => typeof site === 'string')
    );
    const totalSites = uniqueSites.size;

    return { totalSites, newAuctions };
  } catch (error) {
    console.error('Erro ao calcular estatísticas:', error);
    return { totalSites: 0, newAuctions: 0 };
  }
}

// ===== MAIN SERVICE FUNCTION =====

/**
 * Função principal do service - aplica todos os filtros em sequência
 */
export function processAuctions(
  auctions: Auction[],
  category: Category,
  type?: string,
  filters?: Filters,
  sort?: SortOption,
  searchQuery?: string
): AuctionSearchResult {
  try {
    // Pipeline de processamento
    let processedAuctions = auctions;

    // 1. Filtrar por categoria e status ativo
    processedAuctions = filterByCategory(processedAuctions, category);

    // 2. Filtrar por tipo específico
    processedAuctions = filterByType(processedAuctions, category, type);

    // 3. Aplicar filtros gerais
    if (filters) {
      processedAuctions = applyGeneralFilters(processedAuctions, filters);
      processedAuctions = applyPropertyFilters(processedAuctions, filters);
      processedAuctions = applyVehicleFilters(processedAuctions, filters);
      processedAuctions = applyPriceFilter(processedAuctions, filters);
    }

    // 4. Aplicar busca
    processedAuctions = applySearch(processedAuctions, searchQuery);

    // 5. Aplicar ordenação
    processedAuctions = applySorting(processedAuctions, sort);

    // 6. Calcular estatísticas
    const { totalSites, newAuctions } = calculateStatistics(processedAuctions);

    return {
      auctions: processedAuctions,
      totalSites,
      newAuctions
    };
  } catch (error) {
    console.error('Erro ao processar leilões:', error);
    return { auctions: [], totalSites: 0, newAuctions: 0 };
  }
}