import { auctions, PropertyAuction, VehicleAuction } from '../lib/database';
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
import { processMockAuctions } from './mockFallbackService';

/**
 * Service para operações com leilões reais do Supabase
 * Substitui o mockAuctions.ts para usar dados reais
 */

// ===== UTILITY FUNCTIONS =====

/**
 * Converte valores numéricos de etapa do banco (1, 2, 3) para formato de exibição
 */
function convertStageFromDatabase(stage: string | number | null | undefined): string {
  if (!stage) return '';

  const stageStr = String(stage).trim();

  // Converter valores numéricos do banco para formato de exibição
  switch (stageStr) {
    case '1':
      return '1ª Praça';
    case '2':
      return '2ª Praça';
    case '3':
      return '3ª Praça';
    default:
      // Se já está no formato correto ou é outro valor, retornar como está
      return stageStr;
  }
}



/**
 * Converte PropertyAuction do banco para Auction do frontend
 */
function convertPropertyToAuction(property: PropertyAuction): Auction {
  return {
    _id: property._id,
    type: 'property',
    image: property.image || '',
    property_type: property.property_type || undefined,
    property_category: property.property_category || undefined, // ✅ CORREÇÃO: Mapear property_category
    useful_area_m2: property.useful_area_m2 || undefined,
    property_address: property.property_address || undefined,
    city: property.city || '',
    state: property.state || '',
    // ✅ CORREÇÃO CRÍTICA: Não usar fallback - manter valores reais do banco
    initial_bid_value: property.initial_bid_value || 0, // Manter 0 apenas se for null
    appraised_value: property.appraised_value,
    origin: property.origin || '',
    stage: convertStageFromDatabase(property.stage),
    end_date: property.end_date || '',
    href: property.href || '',
    website: property.website || '',
    website_image: property.website_image || '',
    updated: property.updated || '',
    data_scraped: property.updated || '', // Usar updated como data_scraped
    docs: property.docs || [],
    format: property.format || ''
  };
}

/**
 * Converte VehicleAuction do banco para Auction do frontend
 */
function convertVehicleToAuction(vehicle: VehicleAuction): Auction {
  return {
    _id: vehicle._id,
    type: 'vehicle',
    image: vehicle.image || '',
    vehicle_type: vehicle.vehicle_type || undefined,
    brand: vehicle.brand || undefined,
    model: vehicle.model || undefined,
    color: vehicle.color || undefined,
    year: vehicle.year ? parseInt(vehicle.year) : undefined,
    city: vehicle.city || '',
    state: vehicle.state || '',
    initial_bid_value: vehicle.initial_bid_value || 0,
    // ✅ CORREÇÃO CRÍTICA: Não usar fallback para appraised_value - manter null se for null
    appraised_value: vehicle.appraised_value,
    origin: vehicle.origin || '',
    stage: convertStageFromDatabase(vehicle.stage),
    end_date: vehicle.end_date || '',
    href: vehicle.href || '',
    website: vehicle.website || '',
    website_image: vehicle.website_image || '',
    updated: vehicle.updated || '',
    data_scraped: vehicle.updated || '', // Usar updated como data_scraped
    docs: vehicle.docs || [],
    format: vehicle.format || ''
  };
}

/**
 * ✅ CORREÇÃO CRÍTICA: Mapeia tipo de categoria para filtros do banco
 * Implementa as 3 regras: 'todos', 'nao-informado', e tipos específicos
 */
function getVehicleTypeFilter(type: string): { types?: string[]; isNaoInformado?: boolean } {
  if (type === 'todos') {
    // ✅ REGRA 1: 'todos' = sem filtro, retorna TODOS os registros
    return {};
  }

  if (type === 'nao-informado') {
    // ✅ REGRA 2: 'nao-informado' = WHERE vehicle_category IS NULL OR TRIM(vehicle_category) = ''
    return { isNaoInformado: true };
  }

  // ✅ REGRA 3: Tipo específico = usar mapeamento slug → nome real
  const mappedTypes = MAPPINGS.VEHICLE_TYPE_MAP[type];
  return mappedTypes ? { types: mappedTypes } : {};
}

function getPropertyTypeFilter(type: string): { types?: string[]; isNaoInformado?: boolean } {
  if (type === 'todos') {
    // ✅ REGRA 1: 'todos' = sem filtro, retorna TODOS os registros
    return {};
  }

  if (type === 'nao-informado') {
    // ✅ REGRA 2: 'nao-informado' = WHERE property_category IS NULL OR TRIM(property_category) = ''
    return { isNaoInformado: true };
  }

  // ✅ REGRA 3: Tipo específico = usar mapeamento slug → nome real
  const mappedTypes = MAPPINGS.PROPERTY_TYPE_MAP[type];
  return mappedTypes ? { types: mappedTypes } : {};
}

/**
 * Aplica ordenação aos leilões
 */
function applySorting(auctions: Auction[], sort?: SortOption): Auction[] {
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
          // ✅ CORREÇÃO CRÍTICA: Aplicar mesma lógica do AuctionCard para filtrar dados suspeitos
          const appraisedA = Number(a.appraised_value);
          const appraisedB = Number(b.appraised_value);
          const bidA = Number(a.initial_bid_value) || 0;
          const bidB = Number(b.initial_bid_value) || 0;

          // ✅ FILTRAR DADOS SUSPEITOS: Aplicar mesma lógica do AuctionCard
          const isValidDiscountA = !isNaN(appraisedA) && !isNaN(bidA) &&
                                   appraisedA > 0 && bidA > 0 &&
                                   appraisedA > bidA &&
                                   bidA >= 100 && // Lance inicial não muito baixo
                                   ((appraisedA - bidA) / appraisedA) * 100 <= 95 && // Desconto não muito alto
                                   appraisedA / bidA <= 1000; // Proporção não muito alta

          const isValidDiscountB = !isNaN(appraisedB) && !isNaN(bidB) &&
                                   appraisedB > 0 && bidB > 0 &&
                                   appraisedB > bidB &&
                                   bidB >= 100 && // Lance inicial não muito baixo
                                   ((appraisedB - bidB) / appraisedB) * 100 <= 95 && // Desconto não muito alto
                                   appraisedB / bidB <= 1000; // Proporção não muito alta

          // Calcular descontos apenas se válidos
          const discountA = isValidDiscountA ? ((appraisedA - bidA) / appraisedA) * 100 : -1;
          const discountB = isValidDiscountB ? ((appraisedB - bidB) / appraisedB) * 100 : -1;

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

/**
 * Aplica busca por texto
 */
function applySearch(auctions: Auction[], searchQuery?: string): Auction[] {
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

/**
 * Calcula estatísticas dos leilões
 */
function calculateStatistics(auctions: Auction[]): { totalSites: number; newAuctions: number } {
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
 * ✅ FUNÇÃO PRINCIPAL CORRIGIDA
 * Agora implementa paginação real de 30 itens por página com ordenação e busca no banco
 */
export async function processRealAuctions(
  category: Category,
  type?: string,
  filters?: Filters,
  sort?: SortOption,
  searchQuery?: string,
  page: number = 1, // ✅ PAGINAÇÃO REAL: Receber número da página
  showExpiredAuctions: boolean = false // ✅ NOVO: Mostrar leilões expirados
): Promise<AuctionSearchResult> {
  try {
    // 🎭 FALLBACK: Verificar se banco tem dados de forma mais segura
    let testQuery = 0;
    try {
      testQuery = await auctions.countProperties({
        showExpiredAuctions: false // Parâmetro mínimo necessário
      });
    } catch (error) {
      console.warn('🎭 Erro ao verificar banco, usando dados MOCADOS:', error);
      return await processMockAuctions(
        category,
        type,
        filters,
        sort,
        searchQuery,
        page,
        showExpiredAuctions
      );
    }

    if (testQuery === 0) {
      console.log('🎭 Banco vazio, usando dados MOCADOS');
      return await processMockAuctions(
        category,
        type,
        filters,
        sort,
        searchQuery,
        page,
        showExpiredAuctions
      );
    }

    // ✅ PAGINAÇÃO REAL: Calcular limit e offset corretos
    const limit = 30; // 30 itens por página
    const offset = (page - 1) * limit; // offset baseado na página

    let processedAuctions: Auction[] = [];
    let totalCount = 0; // ✅ PAGINAÇÃO REAL: Contar total de resultados

    if (category === 'imoveis') {
      // ✅ CORREÇÃO CRÍTICA: Buscar imóveis com filtro correto por tipo
      const typeFilterResult = getPropertyTypeFilter(type || 'todos');

      // ✅ CORREÇÃO: Aplicar mapeamentos antes de enviar para o banco
      // ✅ NOVO: Se formato mapeia para array vazio (= "Qualquer Tipo"), não aplicar filtro
      const mappedFormat = filters?.format ? (() => {
        const mapped = MAPPINGS.FORMAT_MAP[filters.format];
        return mapped && mapped.length > 0 ? mapped[0] : undefined;
      })() : undefined;

      // ✅ CORREÇÃO: Mapear corretamente incluindo "nao-informado"
      const mappedOrigin = filters?.origin && filters.origin.length > 0
        ? (() => {
            const mapped = filters.origin.map(o => MAPPINGS.ORIGIN_MAP[o]).filter(value => value !== undefined);
            return mapped.length > 0 ? mapped : ['__VALOR_INEXISTENTE__']; // Forçar zero resultados se não há mapeamento válido
          })()
        : undefined;

      const mappedStage = filters?.stage && filters.stage.length > 0
        ? (() => {
            const mapped = filters.stage.map(s => MAPPINGS.STAGE_MAP[s]).filter(value => value !== undefined);
            return mapped.length > 0 ? mapped : ['__VALOR_INEXISTENTE__']; // Forçar zero resultados se não há mapeamento válido
          })()
        : undefined;

      // ✅ CORREÇÃO CRÍTICA: Construir filterParams baseado no tipo de filtro
      const filterParams: any = {
        state: filters?.state && filters.state !== 'all' && filters.state !== '' ? filters.state : undefined,
        city: filters?.city && filters.city !== 'all' && filters.city !== '' ? filters.city : undefined, // ✅ CORREÇÃO: Verificar string vazia
        format: mappedFormat, // ✅ CORREÇÃO: Usar valor mapeado
        origin: mappedOrigin, // ✅ CORREÇÃO: Usar valores mapeados
        stage: mappedStage, // ✅ CORREÇÃO: Usar valores mapeados
        min_area: filters?.useful_area_m2 && filters.useful_area_m2[0] !== undefined ? filters.useful_area_m2[0] : undefined,
        max_area: filters?.useful_area_m2 && filters.useful_area_m2[1] !== undefined ? filters.useful_area_m2[1] : undefined,
        min_value: filters?.initial_bid_value && filters.initial_bid_value[0] !== undefined ? filters.initial_bid_value[0] : undefined,
        max_value: filters?.initial_bid_value && filters.initial_bid_value[1] !== undefined ? filters.initial_bid_value[1] : undefined,
        search: searchQuery || undefined, // ✅ CORREÇÃO: Busca aplicada no banco
        sort: sort || 'newest', // ✅ CORREÇÃO: Ordenação aplicada no banco
        showExpiredAuctions // ✅ NOVO: Filtro para leilões expirados
      };

      // 🔍 DEBUG: Log dos filtros aplicados
      console.log('🔍 DEBUG Imóveis - Filtros aplicados:', {
        originalFilters: filters,
        processedFilterParams: filterParams,
        typeFilterResult
      });

      // ✅ CORREÇÃO CRÍTICA: Aplicar filtro de tipo baseado nas regras
      if (typeFilterResult.types) {
        filterParams.property_categories = typeFilterResult.types; // ✅ USAR property_categories
      } else if (typeFilterResult.isNaoInformado) {
        filterParams.property_categories = ['__NAO_INFORMADO__']; // ✅ Sinalizar filtro especial
      }
      // Se não tem types nem isNaoInformado = 'todos' = sem filtro

      // ✅ CORREÇÃO: Para ordenação por desconto, buscar todos os dados primeiro
      if (sort === 'highest-discount') {
        // Buscar todos os dados sem paginação para ordenar corretamente
        const [allProperties, count] = await Promise.all([
          auctions.getProperties({
            ...filterParams
            // Sem limit/offset para buscar todos
          }),
          auctions.countProperties(filterParams)
        ]);

        // Converter para formato padrão
        let allAuctions = allProperties.map(convertPropertyToAuction);

        // Aplicar ordenação por desconto
        allAuctions = applySorting(allAuctions, sort);

        // Aplicar paginação manualmente
        processedAuctions = allAuctions.slice(offset, offset + limit);
        totalCount = count;
      } else {
        // ✅ PAGINAÇÃO NORMAL: Para outras ordenações, usar paginação no banco
        const [properties, count] = await Promise.all([
          auctions.getProperties({
            ...filterParams,
            limit, // ✅ PAGINAÇÃO: 30 itens por página
            offset // ✅ PAGINAÇÃO: offset calculado corretamente
          }),
          auctions.countProperties(filterParams)
        ]);

        processedAuctions = properties.map(convertPropertyToAuction);
        // ✅ CORREÇÃO: Aplicar ordenação para todas as opções
        processedAuctions = applySorting(processedAuctions, sort);
        totalCount = count;
      }
    } else {
      // ✅ CORREÇÃO CRÍTICA: Buscar veículos com filtro correto por tipo
      const typeFilterResult = getVehicleTypeFilter(type || 'todos');

      // ✅ CORREÇÃO: Aplicar mapeamentos antes de enviar para o banco
      // ✅ NOVO: Se formato mapeia para array vazio (= "Qualquer Tipo"), não aplicar filtro
      const mappedFormat = filters?.format ? (() => {
        const mapped = MAPPINGS.FORMAT_MAP[filters.format];
        return mapped && mapped.length > 0 ? mapped[0] : undefined;
      })() : undefined;

      // ✅ CORREÇÃO: Mapear corretamente incluindo "nao-informado"
      const mappedOrigin = filters?.origin && filters.origin.length > 0
        ? (() => {
            const mapped = filters.origin.map(o => MAPPINGS.ORIGIN_MAP[o]).filter(value => value !== undefined);
            return mapped.length > 0 ? mapped : ['__VALOR_INEXISTENTE__']; // Forçar zero resultados se não há mapeamento válido
          })()
        : undefined;

      const mappedStage = filters?.stage && filters.stage.length > 0
        ? (() => {
            const mapped = filters.stage.map(s => MAPPINGS.STAGE_MAP[s]).filter(value => value !== undefined);
            return mapped.length > 0 ? mapped : ['__VALOR_INEXISTENTE__']; // Forçar zero resultados se não há mapeamento válido
          })()
        : undefined;

      // ✅ CONVERSÃO SIMPLIFICADA: Converter slugs básicos para nomes
      const realBrandName = filters?.brand && filters.brand !== 'all'
        ? filters.brand.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : undefined;
      const realModelName = filters?.model && filters.model !== 'all'
        ? filters.model.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : undefined;
      const realColorName = filters?.color && filters.color !== 'all'
        ? filters.color.charAt(0).toUpperCase() + filters.color.slice(1)
        : undefined;

      // ✅ CORREÇÃO CRÍTICA: Construir filterParams baseado no tipo de filtro
      const filterParams: any = {
        state: filters?.state && filters.state !== 'all' && filters.state !== '' ? filters.state : undefined,
        city: filters?.city && filters.city !== 'all' && filters.city !== '' ? filters.city : undefined, // ✅ CORREÇÃO: Verificar string vazia
        brand: realBrandName, // ✅ CORREÇÃO: Usar nome real da marca
        model: realModelName, // ✅ CORREÇÃO: Usar nome real do modelo
        color: realColorName, // ✅ CORREÇÃO: Usar nome real da cor
        format: mappedFormat, // ✅ CORREÇÃO: Usar valor mapeado
        origin: mappedOrigin, // ✅ CORREÇÃO: Usar valores mapeados
        stage: mappedStage, // ✅ CORREÇÃO: Usar valores mapeados
        min_year: filters?.year && filters.year[0] !== undefined ? filters.year[0] : undefined,
        max_year: filters?.year && filters.year[1] !== undefined ? filters.year[1] : undefined,
        min_value: filters?.initial_bid_value && filters.initial_bid_value[0] !== undefined ? filters.initial_bid_value[0] : undefined,
        max_value: filters?.initial_bid_value && filters.initial_bid_value[1] !== undefined ? filters.initial_bid_value[1] : undefined,
        search: searchQuery || undefined, // ✅ CORREÇÃO: Busca aplicada no banco
        sort: sort || 'newest', // ✅ CORREÇÃO: Ordenação aplicada no banco
        showExpiredAuctions // ✅ NOVO: Filtro para leilões expirados
      };

      // ✅ CORREÇÃO CRÍTICA: Aplicar filtro de tipo baseado nas regras
      if (typeFilterResult.types) {
        filterParams.vehicle_types = typeFilterResult.types; // ✅ USAR vehicle_types
      } else if (typeFilterResult.isNaoInformado) {
        filterParams.vehicle_types = ['__NAO_INFORMADO__']; // ✅ Sinalizar filtro especial
      }
      // Se não tem types nem isNaoInformado = 'todos' = sem filtro

      // ✅ CORREÇÃO: Para ordenação por desconto, buscar todos os dados primeiro
      if (sort === 'highest-discount') {
        // Buscar todos os dados sem paginação para ordenar corretamente
        const [allVehicles, count] = await Promise.all([
          auctions.getVehicles({
            ...filterParams
            // Sem limit/offset para buscar todos
          }),
          auctions.countVehicles(filterParams)
        ]);

        // Converter para formato padrão
        let allAuctions = allVehicles.map(convertVehicleToAuction);

        // Aplicar ordenação por desconto
        allAuctions = applySorting(allAuctions, sort);

        // Aplicar paginação manualmente
        processedAuctions = allAuctions.slice(offset, offset + limit);
        totalCount = count;
      } else {
        // ✅ PAGINAÇÃO NORMAL: Para outras ordenações, usar paginação no banco
        const [vehicles, count] = await Promise.all([
          auctions.getVehicles({
            ...filterParams,
            limit, // ✅ PAGINAÇÃO: 30 itens por página
            offset // ✅ PAGINAÇÃO: offset calculado corretamente
          }),
          auctions.countVehicles(filterParams)
        ]);

        processedAuctions = vehicles.map(convertVehicleToAuction);
        // ✅ CORREÇÃO: Aplicar ordenação para todas as opções
        processedAuctions = applySorting(processedAuctions, sort);
        totalCount = count;
      }
    }

    // ✅ CORREÇÃO: Ordenação por desconto já foi aplicada acima quando necessário
    // ✅ CORREÇÃO: Busca já foi aplicada no banco
    // processedAuctions = applySearch(processedAuctions, searchQuery); // ❌ REMOVIDO: Duplicado
    // processedAuctions = applySorting(processedAuctions, sort); // ❌ REMOVIDO: Duplicado

    // ✅ CORREÇÃO: Buscar estatísticas reais baseadas no total de resultados
    // Usar os filterParams do bloco correto baseado na categoria
    let sitesCount = 0;
    if (category === 'imoveis') {
      // Reconstruir filterParams para imóveis
      const typeFilterResult = getPropertyTypeFilter(type || 'todos');
      const mappedFormat = filters?.format ? (() => {
        const mapped = MAPPINGS.FORMAT_MAP[filters.format];
        return mapped && mapped.length > 0 ? mapped[0] : undefined;
      })() : undefined;
      const mappedOrigin = filters?.origin && filters.origin.length > 0
        ? (() => {
            const mapped = filters.origin.map(o => MAPPINGS.ORIGIN_MAP[o]).filter(value => value !== undefined);
            return mapped.length > 0 ? mapped : ['__VALOR_INEXISTENTE__'];
          })()
        : undefined;
      const mappedStage = filters?.stage && filters.stage.length > 0
        ? (() => {
            const mapped = filters.stage.map(s => MAPPINGS.STAGE_MAP[s]).filter(value => value !== undefined);
            return mapped.length > 0 ? mapped : ['__VALOR_INEXISTENTE__'];
          })()
        : undefined;

      // ✅ CORREÇÃO CRÍTICA: Usar property_categories
      const propertyFilterParams: any = {
        state: filters?.state && filters.state !== 'all' ? filters.state : undefined,
        city: filters?.city && filters.city !== 'all' ? filters.city : undefined,
        format: mappedFormat,
        origin: mappedOrigin,
        stage: mappedStage,
        min_area: filters?.useful_area_m2 && filters.useful_area_m2[0] !== undefined ? filters.useful_area_m2[0] : undefined,
        max_area: filters?.useful_area_m2 && filters.useful_area_m2[1] !== undefined ? filters.useful_area_m2[1] : undefined,
        min_value: filters?.initial_bid_value && filters.initial_bid_value[0] !== undefined ? filters.initial_bid_value[0] : undefined,
        max_value: filters?.initial_bid_value && filters.initial_bid_value[1] !== undefined ? filters.initial_bid_value[1] : undefined,
        search: searchQuery || undefined
      };

      // ✅ CORREÇÃO CRÍTICA: Aplicar filtro de tipo APENAS quando não for 'todos'
      if (typeFilterResult.types) {
        propertyFilterParams.property_categories = typeFilterResult.types;
      } else if (typeFilterResult.isNaoInformado) {
        propertyFilterParams.property_categories = ['__NAO_INFORMADO__'];
      }
      // ✅ CORREÇÃO: Para 'todos', não aplicar filtro de tipo (deixar undefined)

      // ✅ CORREÇÃO CRÍTICA: Remover propriedades undefined antes de enviar
      const cleanPropertyFilters = Object.fromEntries(
        Object.entries(propertyFilterParams).filter(([key, value]) => {
          if (value === undefined || value === null || value === '') return false;
          if (Array.isArray(value) && value.length === 0) return false;
          if (Array.isArray(value) && value.every(v => v === undefined || v === null || v === '')) return false;
          return true;
        })
      );

      // ✅ CORREÇÃO CRÍTICA: Só adicionar showExpiredAuctions se não for o valor padrão
      // Para evitar que um objeto vazio seja considerado como "com filtros"
      if (showExpiredAuctions !== false) {
        cleanPropertyFilters.showExpiredAuctions = showExpiredAuctions;
      }

      console.log('🏢 DEBUG - cleanPropertyFilters final:', cleanPropertyFilters);
      sitesCount = await auctions.getPropertySitesCount(cleanPropertyFilters);
    } else {
      // Reconstruir filterParams para veículos
      const typeFilterResult = getVehicleTypeFilter(type || 'todos');
      const mappedFormat = filters?.format ? (() => {
        const mapped = MAPPINGS.FORMAT_MAP[filters.format];
        return mapped && mapped.length > 0 ? mapped[0] : undefined;
      })() : undefined;
      const mappedOrigin = filters?.origin && filters.origin.length > 0
        ? (() => {
            const mapped = filters.origin.map(o => MAPPINGS.ORIGIN_MAP[o]).filter(value => value !== undefined);
            return mapped.length > 0 ? mapped : ['__VALOR_INEXISTENTE__'];
          })()
        : undefined;
      const mappedStage = filters?.stage && filters.stage.length > 0
        ? (() => {
            const mapped = filters.stage.map(s => MAPPINGS.STAGE_MAP[s]).filter(value => value !== undefined);
            return mapped.length > 0 ? mapped : ['__VALOR_INEXISTENTE__'];
          })()
        : undefined;

      // ✅ CORREÇÃO CRÍTICA: Aplicar MESMA transformação usada na busca de leilões
      const realBrandName = filters?.brand && filters.brand !== 'all'
        ? filters.brand.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : undefined;
      const realModelName = filters?.model && filters.model !== 'all'
        ? filters.model.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        : undefined;
      const realColorName = filters?.color && filters.color !== 'all'
        ? filters.color.charAt(0).toUpperCase() + filters.color.slice(1)
        : undefined;

      // ✅ CORREÇÃO CRÍTICA: Usar vehicle_types com transformação consistente
      const vehicleFilterParams: any = {
        state: filters?.state && filters.state !== 'all' ? filters.state : undefined,
        city: filters?.city && filters.city !== 'all' ? filters.city : undefined,
        brand: realBrandName, // ✅ CORREÇÃO: Usar mesma transformação
        model: realModelName, // ✅ CORREÇÃO: Usar mesma transformação
        color: realColorName, // ✅ CORREÇÃO: Usar mesma transformação
        format: mappedFormat,
        origin: mappedOrigin,
        stage: mappedStage,
        min_year: filters?.year && filters.year[0] !== undefined ? filters.year[0] : undefined,
        max_year: filters?.year && filters.year[1] !== undefined ? filters.year[1] : undefined,
        min_value: filters?.initial_bid_value && filters.initial_bid_value[0] !== undefined ? filters.initial_bid_value[0] : undefined,
        max_value: filters?.initial_bid_value && filters.initial_bid_value[1] !== undefined ? filters.initial_bid_value[1] : undefined,
        search: searchQuery || undefined
      };

      // ✅ CORREÇÃO CRÍTICA: Aplicar filtro de tipo APENAS quando não for 'todos'
      if (typeFilterResult.types) {
        vehicleFilterParams.vehicle_types = typeFilterResult.types;
      } else if (typeFilterResult.isNaoInformado) {
        vehicleFilterParams.vehicle_types = ['__NAO_INFORMADO__'];
      }
      // ✅ CORREÇÃO: Para 'todos', não aplicar filtro de tipo (deixar undefined)

      // 🔍 DEBUG: Log da transformação de filtros para veículos
      console.log('🚗 DEBUG Vehicle Filter Transformation:', {
        type,
        typeFilterResult,
        originalFilters: {
          brand: filters?.brand,
          model: filters?.model,
          color: filters?.color
        },
        transformedFilters: {
          brand: realBrandName,
          model: realModelName,
          color: realColorName
        },
        vehicleFilterParams
      });

      // ✅ CORREÇÃO CRÍTICA: Remover propriedades undefined antes de enviar
      const cleanVehicleFilters = Object.fromEntries(
        Object.entries(vehicleFilterParams).filter(([key, value]) => {
          if (value === undefined || value === null || value === '') return false;
          if (Array.isArray(value) && value.length === 0) return false;
          if (Array.isArray(value) && value.every(v => v === undefined || v === null || v === '')) return false;
          return true;
        })
      );

      // ✅ CORREÇÃO CRÍTICA: Só adicionar showExpiredAuctions se não for o valor padrão
      // Para evitar que um objeto vazio seja considerado como "com filtros"
      if (showExpiredAuctions !== false) {
        cleanVehicleFilters.showExpiredAuctions = showExpiredAuctions;
      }

      console.log('🚗 DEBUG - cleanVehicleFilters final:', cleanVehicleFilters);
      sitesCount = await auctions.getVehicleSitesCount(cleanVehicleFilters);
    }

    const totalSites = sitesCount;
    const newAuctions = 0; // TODO: Implementar contagem de novos leilões se necessário

    // 🔍 DEBUG: Log da contagem de sites
    console.log('🌐 DEBUG Sites Count:', {
      sitesCount,
      totalSites,
      category,
      type,
      hasFilters: filters ? Object.keys(filters).length > 0 : false,
      showExpiredAuctions
    });

    // ✅ CORREÇÃO CRÍTICA: Remover fallback problemático
    // O fallback estava usando apenas sites da página atual (30 leilões)
    // Se sitesCount for 0, significa que há um problema na função de contagem
    // que deve ser investigado, não mascarado com fallback incorreto
    const finalTotalSites = totalSites;

    return {
      auctions: processedAuctions,
      totalSites: finalTotalSites,
      newAuctions,
      totalCount // ✅ PAGINAÇÃO REAL: Retornar total de resultados
    };
  } catch (error) {
    console.error('Erro ao processar leilões reais:', error);
    throw error; // Re-throw para mostrar erro na UI
  }
}