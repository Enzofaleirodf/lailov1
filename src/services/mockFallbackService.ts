import {
  Auction,
  Category,
  SortOption,
  Filters,
  AuctionSearchResult
} from '../types/auction';
import { MAPPINGS } from '../config/mappings';

// 🎯 SERVICE DE FALLBACK: Usar dados mocados quando banco estiver vazio

// ✅ DADOS MOCADOS INLINE: Dados mínimos para fallback quando banco estiver vazio
const mockAuctions: Auction[] = [
  {
    _id: "1",
    type: "property",
    image: "",
    property_type: "Apartamento",
    property_category: "Apartamentos",
    useful_area_m2: 85,
    property_address: "Av. Paulista, 1000",
    city: "São Paulo",
    state: "SP",
    initial_bid_value: 180000,
    appraised_value: 220000,
    origin: "Judicial",
    stage: "1ª Praça",
    end_date: "2025-07-25T16:00:00.000Z",
    href: "#",
    website: "Leiloeira ABC",
    website_image: "",
    updated: "2025-06-15T12:00:00.000Z",
    data_scraped: "2025-06-17T12:00:00.000Z",
    docs: ["Matrícula", "IPTU"],
    format: "Online"
  },
  {
    _id: "2",
    type: "vehicle",
    image: "",
    vehicle_type: "Carros",
    brand: "Toyota",
    model: "Corolla",
    color: "Prata",
    year: 2020,
    city: "São Paulo",
    state: "SP",
    initial_bid_value: 45000,
    appraised_value: 60000,
    origin: "Extrajudicial",
    stage: "2ª Praça",
    end_date: "2025-07-28T14:00:00.000Z",
    href: "#",
    website: "Leiloeira AUTO",
    website_image: "",
    updated: "2025-06-14T10:30:00.000Z",
    data_scraped: "2025-06-14T10:30:00.000Z",
    docs: ["Documento do Veículo", "Laudo"],
    format: "Online"
  }
];

/**
 * Converte dados mocados para o formato esperado pelo realAuctionService
 */
function convertMockToRealFormat(auctions: Auction[]): Auction[] {
  return auctions.map(auction => ({
    ...auction,
    // Garantir que property_category existe para imóveis
    property_category: auction.type === 'property' ? auction.property_type : undefined,
    // Garantir que vehicle_type existe para veículos  
    vehicle_type: auction.type === 'vehicle' ? auction.vehicle_type : undefined
  }));
}

/**
 * Filtrar por categoria
 */
function filterByCategory(auctions: Auction[], category: Category): Auction[] {
  return auctions.filter(auction => {
    if (category === 'imoveis') return auction.type === 'property';
    if (category === 'veiculos') return auction.type === 'vehicle';
    return true;
  });
}

/**
 * Filtrar por tipo específico
 */
function filterByType(auctions: Auction[], category: Category, type?: string): Auction[] {
  if (!type || type === 'todos') return auctions;

  if (category === 'imoveis') {
    if (type === 'nao-informado') {
      return auctions.filter(a => !a.property_category || a.property_category.trim() === '');
    }
    
    const mappedTypes = MAPPINGS.PROPERTY_TYPE_MAP[type];
    if (mappedTypes) {
      return auctions.filter(a => 
        a.property_category && mappedTypes.includes(a.property_category)
      );
    }
  }

  if (category === 'veiculos') {
    if (type === 'nao-informado') {
      return auctions.filter(a => !a.vehicle_type || a.vehicle_type.trim() === '');
    }
    
    const mappedTypes = MAPPINGS.VEHICLE_TYPE_MAP[type];
    if (mappedTypes) {
      return auctions.filter(a => 
        a.vehicle_type && mappedTypes.includes(a.vehicle_type)
      );
    }
  }

  return auctions;
}

/**
 * Aplicar filtros
 */
function applyFilters(auctions: Auction[], filters?: Filters): Auction[] {
  if (!filters) return auctions;

  let filtered = auctions;

  // Filtro por estado
  if (filters.estado && filters.estado !== 'all') {
    filtered = filtered.filter(a => a.state === filters.estado);
  }

  // Filtro por cidade
  if (filters.cidade && filters.cidade !== 'all') {
    filtered = filtered.filter(a => a.city === filters.cidade);
  }

  // Filtros específicos por categoria
  const categoryFilters = filters.imoveis || filters.veiculos;
  if (categoryFilters) {
    // Filtro por origem
    if (categoryFilters.origem && categoryFilters.origem.length > 0) {
      filtered = filtered.filter(a => 
        a.origin && categoryFilters.origem.includes(a.origin)
      );
    }

    // Filtro por etapa
    if (categoryFilters.etapa && categoryFilters.etapa.length > 0) {
      filtered = filtered.filter(a => 
        a.stage && categoryFilters.etapa.includes(a.stage)
      );
    }

    // Filtros específicos de veículos
    if (filters.veiculos) {
      const vFilters = filters.veiculos;
      
      if (vFilters.marca && vFilters.marca !== 'all') {
        filtered = filtered.filter(a => a.brand === vFilters.marca);
      }
      
      if (vFilters.modelo && vFilters.modelo !== 'all') {
        filtered = filtered.filter(a => a.model === vFilters.modelo);
      }
      
      if (vFilters.cor && vFilters.cor !== 'all') {
        filtered = filtered.filter(a => a.color === vFilters.cor);
      }

      // Filtro por ano
      if (vFilters.ano && vFilters.ano[0] > 0 && vFilters.ano[1] > 0) {
        filtered = filtered.filter(a => 
          a.year && a.year >= vFilters.ano[0] && a.year <= vFilters.ano[1]
        );
      }

      // Filtro por preço
      if (vFilters.preco && vFilters.preco[0] > 0 && vFilters.preco[1] > 0) {
        filtered = filtered.filter(a => 
          a.initial_bid_value && 
          a.initial_bid_value >= vFilters.preco[0] && 
          a.initial_bid_value <= vFilters.preco[1]
        );
      }
    }

    // Filtros específicos de imóveis
    if (filters.imoveis) {
      const iFilters = filters.imoveis;
      
      // Filtro por área
      if (iFilters.area && iFilters.area[0] > 0 && iFilters.area[1] > 0) {
        filtered = filtered.filter(a => 
          a.useful_area_m2 && 
          a.useful_area_m2 >= iFilters.area[0] && 
          a.useful_area_m2 <= iFilters.area[1]
        );
      }

      // Filtro por valor
      if (iFilters.valor && iFilters.valor[0] > 0 && iFilters.valor[1] > 0) {
        filtered = filtered.filter(a => 
          a.initial_bid_value && 
          a.initial_bid_value >= iFilters.valor[0] && 
          a.initial_bid_value <= iFilters.valor[1]
        );
      }
    }
  }

  return filtered;
}

/**
 * Aplicar busca por texto
 */
function applySearch(auctions: Auction[], searchQuery?: string): Auction[] {
  if (!searchQuery || searchQuery.trim() === '') return auctions;

  const query = searchQuery.toLowerCase().trim();
  
  return auctions.filter(auction => {
    // Buscar em campos relevantes
    const searchFields = [
      auction.property_category,
      auction.property_address,
      auction.city,
      auction.state,
      auction.brand,
      auction.model,
      auction.vehicle_type,
      auction.origin,
      auction.stage
    ].filter(Boolean).map(field => field!.toLowerCase());

    return searchFields.some(field => field.includes(query));
  });
}

/**
 * Aplicar ordenação
 */
function applySorting(auctions: Auction[], sort?: SortOption): Auction[] {
  if (!sort || sort === 'newest') {
    return auctions.sort((a, b) => 
      new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime()
    );
  }

  switch (sort) {
    case 'lowest-bid':
      return auctions.sort((a, b) => 
        (a.initial_bid_value || 0) - (b.initial_bid_value || 0)
      );
    
    case 'highest-bid':
      return auctions.sort((a, b) => 
        (b.initial_bid_value || 0) - (a.initial_bid_value || 0)
      );
    
    case 'highest-discount':
      return auctions.sort((a, b) => {
        const discountA = a.appraised_value && a.initial_bid_value 
          ? ((a.appraised_value - a.initial_bid_value) / a.appraised_value) * 100 
          : 0;
        const discountB = b.appraised_value && b.initial_bid_value 
          ? ((b.appraised_value - b.initial_bid_value) / b.appraised_value) * 100 
          : 0;
        return discountB - discountA;
      });
    
    default:
      return auctions;
  }
}

/**
 * Função principal do service de fallback
 */
export async function processMockAuctions(
  category: Category,
  type?: string,
  filters?: Filters,
  sort?: SortOption,
  searchQuery?: string,
  page: number = 1,
  showExpiredAuctions: boolean = false
): Promise<AuctionSearchResult> {
  console.log('🎭 Usando dados MOCADOS como fallback');

  // Converter dados mocados
  let auctions = convertMockToRealFormat([...mockAuctions]);

  // Filtrar por data (simular filtro de expirados)
  if (!showExpiredAuctions) {
    const now = new Date();
    auctions = auctions.filter(a => 
      a.end_date && new Date(a.end_date) > now
    );
  }

  // Aplicar filtros sequencialmente
  auctions = filterByCategory(auctions, category);
  auctions = filterByType(auctions, category, type);
  auctions = applyFilters(auctions, filters);
  auctions = applySearch(auctions, searchQuery);
  auctions = applySorting(auctions, sort);

  // Simular paginação
  const limit = 30;
  const offset = (page - 1) * limit;
  const totalCount = auctions.length;
  const paginatedAuctions = auctions.slice(offset, offset + limit);

  // Simular estatísticas
  const uniqueSites = new Set(auctions.map(a => a.website).filter(Boolean));
  const totalSites = uniqueSites.size;
  const newAuctions = auctions.filter(a => 
    a.data_scraped && 
    new Date(a.data_scraped).toDateString() === new Date().toDateString()
  ).length;

  return {
    auctions: paginatedAuctions,
    totalSites,
    newAuctions,
    totalCount
  };
}
