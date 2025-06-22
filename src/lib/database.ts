import { supabase } from './supabase';
import type { UserProfile } from './supabase';

// ===== FAVORITES =====

export interface Favorite {
  id: string;
  user_id: string;
  auction_id: string;
  auction_type: 'property' | 'vehicle';
  created_at: string;
}

export const favorites = {
  // Obter favoritos do usuário
  async getUserFavorites(userId: string): Promise<Favorite[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Adicionar aos favoritos
  async addFavorite(userId: string, auctionId: string, auctionType: 'property' | 'vehicle'): Promise<Favorite> {
    const { data, error } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        auction_id: auctionId,
        auction_type: auctionType
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Remover dos favoritos
  async removeFavorite(userId: string, auctionId: string): Promise<void> {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('auction_id', auctionId);
    
    if (error) throw error;
  },

  // Verificar se é favorito
  async isFavorite(userId: string, auctionId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('auction_id', auctionId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return !!data;
  },

  // Obter IDs dos favoritos (para otimização)
  async getFavoriteIds(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('favorites')
      .select('auction_id')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data?.map(f => f.auction_id) || [];
  }
};

// ===== AUCTIONS DATA =====

export interface PropertyAuction {
  _id: string;
  href: string | null;
  image: string | null;
  title: string | null;
  state: string | null;
  city: string | null;
  origin: string | null;
  modality: string | null;
  format: string | null;
  stage: string | null;
  start_date: string | null;
  end_date: string | null;
  appraised_value: number | null;
  initial_bid_value: number | null;
  docs: string[] | null;
  property_type: string | null;
  property_address_raw: string | null;
  property_address: string | null;
  useful_area: string | null;
  useful_area_m2: number | null;
  website: string | null;
  website_image: string | null;
  updated: string | null;
  property_category: string | null;
}

export interface VehicleAuction {
  _id: string;
  href: string | null;
  image: string | null;
  title: string | null;
  state: string | null;
  city: string | null;
  origin: string | null;
  modality: string | null;
  format: string | null;
  stage: string | null;
  start_date: string | null;
  end_date: string | null;
  appraised_value: number | null;
  initial_bid_value: number | null;
  docs: string[] | null;
  vehicle_type: string | null;
  brand: string | null;
  model: string | null;
  year: string | null;
  mileage: string | null;
  color: string | null;
  website: string | null;
  website_image: string | null;
  updated: string | null;
}

export const auctions = {
  // ✅ PAGINAÇÃO REAL: Buscar imóveis com paginação correta
  async getProperties(filters: {
    state?: string;
    city?: string;
    property_categories?: string[]; // ✅ CORREÇÃO CRÍTICA: Usar property_categories
    format?: string;
    origin?: string[];
    stage?: string[];
    min_area?: number;
    max_area?: number;
    min_value?: number;
    max_value?: number;
    search?: string;
    sort?: string; // ✅ NOVO: Parâmetro de ordenação
    showExpiredAuctions?: boolean; // ✅ NOVO: Mostrar leilões expirados
    limit?: number;
    offset?: number;
  } = {}): Promise<PropertyAuction[]> {
    let query = supabase
      .from('lots_property')
      .select('*');

    // Aplicar filtros
    if (filters.state && filters.state !== 'all') {
      query = query.eq('state', filters.state);
    }

    if (filters.city && filters.city !== 'all') {
      // 🔍 DEBUG: Log do filtro de cidade
      console.log('🔍 DEBUG Properties - Aplicando filtro de cidade:', {
        originalCity: filters.city,
        cityType: typeof filters.city,
        cityLength: filters.city.length
      });
      query = query.eq('city', filters.city);
    }

    // ✅ CORREÇÃO CRÍTICA: Filtro correto por tipos de propriedade usando property_category
    if (filters.property_categories && filters.property_categories.length > 0) {
      if (filters.property_categories.includes('__NAO_INFORMADO__')) {
        // ✅ REGRA 2: 'nao-informado' = WHERE property_category IS NULL OR TRIM(property_category) = ''
        query = query.or('property_category.is.null,property_category.eq.');
      } else {
        // ✅ REGRA 3: Tipos específicos = WHERE property_category IN (...)
        const validTypes = filters.property_categories.filter(type => type !== null && type !== undefined && type !== '');
        if (validTypes.length > 0) {
          query = query.in('property_category', validTypes);
        }
      }
    }
    // ✅ REGRA 1: Se não tem property_categories = 'todos' = sem filtro

    if (filters.format) {
      query = query.eq('format', filters.format);
    }

    // ✅ CORREÇÃO: Tratar filtro "Não informado" para origem
    if (filters.origin && filters.origin.length > 0) {
      if (filters.origin.includes('__NAO_INFORMADO__')) {
        // Se inclui "Não informado", buscar registros que NÃO estão nas outras categorias
        const otherOrigins = filters.origin.filter(o => o !== '__NAO_INFORMADO__');
        if (otherOrigins.length > 0) {
          // Se tem outras origens também, usar OR logic
          query = query.or(`origin.in.(${otherOrigins.join(',')}),origin.is.null,origin.eq.`);
        } else {
          // Se só tem "Não informado", buscar apenas null/empty
          query = query.or('origin.is.null,origin.eq.');
        }
      } else {
        query = query.in('origin', filters.origin);
      }
    }

    // ✅ CORREÇÃO: Tratar filtro "Não informado" para etapa
    if (filters.stage && filters.stage.length > 0) {
      if (filters.stage.includes('__NAO_INFORMADO__')) {
        // Se inclui "Não informado", buscar registros que NÃO estão nas outras categorias
        const otherStages = filters.stage.filter(s => s !== '__NAO_INFORMADO__');
        if (otherStages.length > 0) {
          // Se tem outras etapas também, usar OR logic
          query = query.or(`stage.in.(${otherStages.join(',')}),stage.is.null,stage.eq.`);
        } else {
          // Se só tem "Não informado", buscar apenas null/empty
          query = query.or('stage.is.null,stage.eq.');
        }
      } else {
        query = query.in('stage', filters.stage);
      }
    }

    if (filters.min_area !== undefined) {
      query = query.gte('useful_area_m2', filters.min_area);
    }

    if (filters.max_area !== undefined) {
      query = query.lte('useful_area_m2', filters.max_area);
    }

    if (filters.min_value !== undefined) {
      query = query.gte('initial_bid_value', filters.min_value);
    }

    if (filters.max_value !== undefined) {
      query = query.lte('initial_bid_value', filters.max_value);
    }

    if (filters.search) {
      // ✅ CORREÇÃO CRÍTICA: Buscar em múltiplos campos relevantes
      query = query.or(`property_type.ilike.%${filters.search}%,property_category.ilike.%${filters.search}%,property_address.ilike.%${filters.search}%,city.ilike.%${filters.search}%,state.ilike.%${filters.search}%`);
    }

    // ✅ NOVO: Filtro por data de expiração com horário de Brasília
    if (filters.showExpiredAuctions !== undefined) {
      // ✅ CORREÇÃO: Usar horário de Brasília (UTC-3)
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();

      console.log('🔍 DEBUG Properties - Filtro de data:', {
        showExpiredAuctions: filters.showExpiredAuctions,
        nowBrasilia
      });

      if (filters.showExpiredAuctions) {
        // ✅ CORREÇÃO: Mostrar apenas leilões expirados (end_date < now Brasília)
        query = query.not('end_date', 'is', null).lt('end_date', nowBrasilia);
        console.log('🔍 DEBUG Properties - Aplicando filtro para leilões EXPIRADOS');
      } else {
        // ✅ CORREÇÃO: Mostrar apenas leilões ativos (end_date >= now Brasília)
        query = query.not('end_date', 'is', null).gte('end_date', nowBrasilia);
        console.log('🔍 DEBUG Properties - Aplicando filtro para leilões ATIVOS');
      }
    } else {
      // ✅ PADRÃO: Mostrar apenas leilões ativos se não especificado
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();
      query = query.not('end_date', 'is', null).gte('end_date', nowBrasilia);
      console.log('🔍 DEBUG Properties - Aplicando filtro PADRÃO para leilões ativos');
    }

    // ✅ CORREÇÃO: Aplicar ordenação baseada no parâmetro sort
    if (filters.sort) {
      switch (filters.sort) {
        case 'newest':
          query = query.order('updated', { ascending: false });
          break;
        case 'lowest-bid':
          query = query.order('initial_bid_value', { ascending: true, nullsLast: true });
          break;
        case 'highest-bid':
          query = query.order('initial_bid_value', { ascending: false, nullsLast: true });
          break;
        case 'highest-discount':
          // Para desconto, não aplicamos ordenação no banco
          // A ordenação será aplicada no código após buscar os dados
          // Usar ordenação padrão para manter consistência
          query = query.order('updated', { ascending: false });
          break;
        case 'nearest':
          query = query.order('end_date', { ascending: true });
          break;
        default:
          query = query.order('updated', { ascending: false });
      }
    } else {
      // Ordenação padrão
      query = query.order('updated', { ascending: false });
    }

    // ✅ PAGINAÇÃO REAL: Implementar range corretamente
    if (filters.limit && filters.offset !== undefined) {
      const from = filters.offset;
      const to = filters.offset + filters.limit - 1;
      query = query.range(from, to);
    } else if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  // ✅ PAGINAÇÃO REAL: Buscar veículos com paginação correta
  async getVehicles(filters: {
    state?: string;
    city?: string;
    vehicle_types?: string[];
    brand?: string;
    model?: string;
    color?: string;
    format?: string;
    origin?: string[];
    stage?: string[];
    min_year?: number;
    max_year?: number;
    min_value?: number;
    max_value?: number;
    search?: string;
    sort?: string; // ✅ NOVO: Parâmetro de ordenação
    showExpiredAuctions?: boolean; // ✅ NOVO: Mostrar leilões expirados
    limit?: number;
    offset?: number;
  } = {}): Promise<VehicleAuction[]> {
    let query = supabase
      .from('lots_vehicle')
      .select('*');

    // Aplicar filtros
    if (filters.state && filters.state !== 'all') {
      query = query.eq('state', filters.state);
    }

    if (filters.city && filters.city !== 'all') {
      // 🔍 DEBUG: Log do filtro de cidade
      console.log('🔍 DEBUG Vehicles - Aplicando filtro de cidade:', {
        originalCity: filters.city,
        cityType: typeof filters.city,
        cityLength: filters.city.length
      });
      query = query.eq('city', filters.city);
    }

    // ✅ CORREÇÃO CRÍTICA: Filtro correto por tipos de veículo
    if (filters.vehicle_types && filters.vehicle_types.length > 0) {
      if (filters.vehicle_types.includes('__NAO_INFORMADO__')) {
        // ✅ REGRA 2: 'nao-informado' = WHERE vehicle_category IS NULL OR TRIM(vehicle_category) = ''
        query = query.or('vehicle_category.is.null,vehicle_category.eq.');
      } else {
        // ✅ REGRA 3: Tipos específicos = WHERE vehicle_category IN (...)
        const validTypes = filters.vehicle_types.filter(type => type !== null && type !== undefined && type !== '');
        if (validTypes.length > 0) {
          query = query.in('vehicle_category', validTypes);
        }
      }
    }
    // ✅ REGRA 1: Se não tem vehicle_types = 'todos' = sem filtro

    if (filters.brand && filters.brand !== 'all') {
      query = query.eq('brand', filters.brand);
    }

    if (filters.model && filters.model !== 'all') {
      query = query.eq('model', filters.model);
    }

    if (filters.color && filters.color !== 'all') {
      // 🔍 DEBUG: Log do filtro de cor
      console.log('🔍 DEBUG Vehicles - Aplicando filtro de cor:', {
        originalColor: filters.color,
        colorType: typeof filters.color,
        colorLength: filters.color.length
      });
      query = query.eq('color', filters.color);
    }

    if (filters.format) {
      query = query.eq('format', filters.format);
    }

    // ✅ CORREÇÃO: Tratar filtro "Não informado" para origem
    if (filters.origin && filters.origin.length > 0) {
      if (filters.origin.includes('__NAO_INFORMADO__')) {
        // Se inclui "Não informado", buscar registros que NÃO estão nas outras categorias
        const otherOrigins = filters.origin.filter(o => o !== '__NAO_INFORMADO__');
        if (otherOrigins.length > 0) {
          // Se tem outras origens também, usar OR logic
          query = query.or(`origin.in.(${otherOrigins.join(',')}),origin.is.null,origin.eq.`);
        } else {
          // Se só tem "Não informado", buscar apenas null/empty
          query = query.or('origin.is.null,origin.eq.');
        }
      } else {
        query = query.in('origin', filters.origin);
      }
    }

    // ✅ CORREÇÃO: Tratar filtro "Não informado" para etapa
    if (filters.stage && filters.stage.length > 0) {
      if (filters.stage.includes('__NAO_INFORMADO__')) {
        // Se inclui "Não informado", buscar registros que NÃO estão nas outras categorias
        const otherStages = filters.stage.filter(s => s !== '__NAO_INFORMADO__');
        if (otherStages.length > 0) {
          // Se tem outras etapas também, usar OR logic
          query = query.or(`stage.in.(${otherStages.join(',')}),stage.is.null,stage.eq.`);
        } else {
          // Se só tem "Não informado", buscar apenas null/empty
          query = query.or('stage.is.null,stage.eq.');
        }
      } else {
        query = query.in('stage', filters.stage);
      }
    }

    if (filters.min_year !== undefined) {
      query = query.gte('year', filters.min_year.toString());
    }

    if (filters.max_year !== undefined) {
      query = query.lte('year', filters.max_year.toString());
    }

    if (filters.min_value !== undefined) {
      query = query.gte('initial_bid_value', filters.min_value);
    }

    if (filters.max_value !== undefined) {
      query = query.lte('initial_bid_value', filters.max_value);
    }

    if (filters.search) {
      // ✅ CORREÇÃO CRÍTICA: Buscar em múltiplos campos relevantes
      query = query.or(`vehicle_type.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,city.ilike.%${filters.search}%,state.ilike.%${filters.search}%,color.ilike.%${filters.search}%`);
    }

    // ✅ NOVO: Filtro por data de expiração com horário de Brasília
    if (filters.showExpiredAuctions !== undefined) {
      // ✅ CORREÇÃO: Usar horário de Brasília (UTC-3)
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();

      if (filters.showExpiredAuctions) {
        // ✅ CORREÇÃO: Mostrar apenas leilões expirados (end_date < now Brasília)
        query = query.not('end_date', 'is', null).lt('end_date', nowBrasilia);
      } else {
        // ✅ CORREÇÃO: Mostrar apenas leilões ativos (end_date >= now Brasília)
        query = query.not('end_date', 'is', null).gte('end_date', nowBrasilia);
      }
    } else {
      // ✅ PADRÃO: Mostrar apenas leilões ativos se não especificado
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();
      query = query.not('end_date', 'is', null).gte('end_date', nowBrasilia);
    }

    // ✅ CORREÇÃO: Aplicar ordenação baseada no parâmetro sort
    if (filters.sort) {
      switch (filters.sort) {
        case 'newest':
          query = query.order('updated', { ascending: false });
          break;
        case 'lowest-bid':
          query = query.order('initial_bid_value', { ascending: true, nullsLast: true });
          break;
        case 'highest-bid':
          query = query.order('initial_bid_value', { ascending: false, nullsLast: true });
          break;
        case 'highest-discount':
          // Para desconto, não aplicamos ordenação no banco
          // A ordenação será aplicada no código após buscar os dados
          // Usar ordenação padrão para manter consistência
          query = query.order('updated', { ascending: false });
          break;
        case 'nearest':
          query = query.order('end_date', { ascending: true });
          break;
        default:
          query = query.order('updated', { ascending: false });
      }
    } else {
      // Ordenação padrão
      query = query.order('updated', { ascending: false });
    }

    // ✅ PAGINAÇÃO REAL: Implementar range corretamente
    if (filters.limit && filters.offset !== undefined) {
      const from = filters.offset;
      const to = filters.offset + filters.limit - 1;
      query = query.range(from, to);
    } else if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  // Buscar leilão específico por ID
  async getAuctionById(id: string, type: 'property' | 'vehicle'): Promise<PropertyAuction | VehicleAuction | null> {
    const table = type === 'property' ? 'lots_property' : 'lots_vehicle';
    
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('_id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
  },

  // ✅ PAGINAÇÃO REAL: Contar total de registros para paginação
  async countProperties(filters: {
    state?: string;
    city?: string;
    property_categories?: string[]; // ✅ CORREÇÃO CRÍTICA: Usar property_categories
    format?: string;
    origin?: string[];
    stage?: string[];
    // ✅ CORREÇÃO: Novos parâmetros de área
    min_area_m2?: number;
    max_area_m2?: number;
    min_area_hectares?: number;
    max_area_hectares?: number;
    // ✅ CORREÇÃO: Novos parâmetros de valor
    min_value_avaliacao?: number;
    max_value_avaliacao?: number;
    min_value_desconto?: number;
    max_value_desconto?: number;
    // ✅ MANTER: Parâmetros antigos para compatibilidade
    min_area?: number;
    max_area?: number;
    min_value?: number;
    max_value?: number;
    search?: string;
    showExpiredAuctions?: boolean; // ✅ NOVO: Mostrar leilões expirados
  } = {}): Promise<number> {
    let query = supabase
      .from('lots_property')
      .select('*', { count: 'exact', head: true });

    // Aplicar os mesmos filtros da busca
    if (filters.state && filters.state !== 'all') {
      query = query.eq('state', filters.state);
    }

    if (filters.city && filters.city !== 'all') {
      query = query.eq('city', filters.city);
    }

    // ✅ CORREÇÃO CRÍTICA: Aplicar mesma lógica de filtro por categoria
    if (filters.property_categories && filters.property_categories.length > 0) {
      if (filters.property_categories.includes('__NAO_INFORMADO__')) {
        query = query.or('property_category.is.null,property_category.eq.');
      } else {
        const validTypes = filters.property_categories.filter(type => type !== null && type !== undefined && type !== '');
        if (validTypes.length > 0) {
          query = query.in('property_category', validTypes);
        }
      }
    }

    if (filters.format) {
      query = query.eq('format', filters.format);
    }

    // ✅ CORREÇÃO: Tratar filtro "Não informado" para origem
    if (filters.origin && filters.origin.length > 0) {
      if (filters.origin.includes('__NAO_INFORMADO__')) {
        // Se inclui "Não informado", buscar registros que NÃO estão nas outras categorias
        const otherOrigins = filters.origin.filter(o => o !== '__NAO_INFORMADO__');
        if (otherOrigins.length > 0) {
          // Se tem outras origens também, usar OR logic
          query = query.or(`origin.in.(${otherOrigins.join(',')}),origin.is.null,origin.eq.`);
        } else {
          // Se só tem "Não informado", buscar apenas null/empty
          query = query.or('origin.is.null,origin.eq.');
        }
      } else {
        query = query.in('origin', filters.origin);
      }
    }

    // ✅ CORREÇÃO: Tratar filtro "Não informado" para etapa
    if (filters.stage && filters.stage.length > 0) {
      if (filters.stage.includes('__NAO_INFORMADO__')) {
        // Se inclui "Não informado", buscar registros que NÃO estão nas outras categorias
        const otherStages = filters.stage.filter(s => s !== '__NAO_INFORMADO__');
        if (otherStages.length > 0) {
          // Se tem outras etapas também, usar OR logic
          query = query.or(`stage.in.(${otherStages.join(',')}),stage.is.null,stage.eq.`);
        } else {
          // Se só tem "Não informado", buscar apenas null/empty
          query = query.or('stage.is.null,stage.eq.');
        }
      } else {
        query = query.in('stage', filters.stage);
      }
    }

    // 🔧 CORREÇÃO: Novos filtros de área (m² e hectares) com inclusão de NULL/0
    if (filters.min_area_m2 !== undefined || filters.max_area_m2 !== undefined) {
      const minArea = filters.min_area_m2 || 0;
      const maxArea = filters.max_area_m2 || 999999;

      // Se range é muito amplo (praticamente "todos"), incluir NULL/0
      const isVeryBroadRange = minArea <= 1 && maxArea >= 100000;

      if (isVeryBroadRange) {
        // Incluir registros com área válida OU NULL/0/vazio
        const conditions = [];
        if (filters.min_area_m2 !== undefined) {
          conditions.push(`useful_area_m2.gte.${filters.min_area_m2}`);
        }
        if (filters.max_area_m2 !== undefined) {
          conditions.push(`useful_area_m2.lte.${filters.max_area_m2}`);
        }
        conditions.push('useful_area_m2.is.null');
        conditions.push('useful_area_m2.eq.0');

        query = query.or(conditions.join(','));
      } else {
        // Range específico - só valores válidos
        if (filters.min_area_m2 !== undefined) {
          query = query.gte('useful_area_m2', filters.min_area_m2);
        }
        if (filters.max_area_m2 !== undefined) {
          query = query.lte('useful_area_m2', filters.max_area_m2);
        }
      }
    }

    if (filters.min_area_hectares !== undefined || filters.max_area_hectares !== undefined) {
      const minAreaHa = filters.min_area_hectares || 0;
      const maxAreaHa = filters.max_area_hectares || 999;

      // Converter hectares para m² (1 hectare = 10.000 m²)
      const minAreaM2 = minAreaHa * 10000;
      const maxAreaM2 = maxAreaHa * 10000;

      // Se range é muito amplo (praticamente "todos"), incluir NULL/0
      const isVeryBroadRange = minAreaHa <= 0.1 && maxAreaHa >= 100;

      if (isVeryBroadRange) {
        // Incluir registros com área válida OU NULL/0/vazio
        const conditions = [];
        if (filters.min_area_hectares !== undefined) {
          conditions.push(`useful_area_m2.gte.${minAreaM2}`);
        }
        if (filters.max_area_hectares !== undefined) {
          conditions.push(`useful_area_m2.lte.${maxAreaM2}`);
        }
        conditions.push('useful_area_m2.is.null');
        conditions.push('useful_area_m2.eq.0');

        query = query.or(conditions.join(','));
      } else {
        // Range específico - só valores válidos
        if (filters.min_area_hectares !== undefined) {
          query = query.gte('useful_area_m2', minAreaM2);
        }
        if (filters.max_area_hectares !== undefined) {
          query = query.lte('useful_area_m2', maxAreaM2);
        }
      }
    }

    // 🔧 CORREÇÃO: Novos filtros de valor (avaliação e desconto) com inclusão de NULL/0
    if (filters.min_value_avaliacao !== undefined || filters.max_value_avaliacao !== undefined) {
      const minValue = filters.min_value_avaliacao || 0;
      const maxValue = filters.max_value_avaliacao || 999999999;

      // Se range é muito amplo (praticamente "todos"), incluir NULL/0
      const isVeryBroadRange = minValue <= 1000 && maxValue >= 10000000;

      if (isVeryBroadRange) {
        // Incluir registros com valor válido OU NULL/0/vazio
        const conditions = [];
        if (filters.min_value_avaliacao !== undefined) {
          conditions.push(`appraised_value.gte.${filters.min_value_avaliacao}`);
        }
        if (filters.max_value_avaliacao !== undefined) {
          conditions.push(`appraised_value.lte.${filters.max_value_avaliacao}`);
        }
        conditions.push('appraised_value.is.null');
        conditions.push('appraised_value.eq.0');

        query = query.or(conditions.join(','));
      } else {
        // Range específico - só valores válidos
        if (filters.min_value_avaliacao !== undefined) {
          query = query.gte('appraised_value', filters.min_value_avaliacao);
        }
        if (filters.max_value_avaliacao !== undefined) {
          query = query.lte('appraised_value', filters.max_value_avaliacao);
        }
      }
    }

    if (filters.min_value_desconto !== undefined || filters.max_value_desconto !== undefined) {
      const minValue = filters.min_value_desconto || 0;
      const maxValue = filters.max_value_desconto || 999999999;

      // Se range é muito amplo (praticamente "todos"), incluir NULL/0
      const isVeryBroadRange = minValue <= 1000 && maxValue >= 10000000;

      if (isVeryBroadRange) {
        // Incluir registros com valor válido OU NULL/0/vazio
        const conditions = [];
        if (filters.min_value_desconto !== undefined) {
          conditions.push(`initial_bid_value.gte.${filters.min_value_desconto}`);
        }
        if (filters.max_value_desconto !== undefined) {
          conditions.push(`initial_bid_value.lte.${filters.max_value_desconto}`);
        }
        conditions.push('initial_bid_value.is.null');
        conditions.push('initial_bid_value.eq.0');

        query = query.or(conditions.join(','));
      } else {
        // Range específico - só valores válidos
        if (filters.min_value_desconto !== undefined) {
          query = query.gte('initial_bid_value', filters.min_value_desconto);
        }
        if (filters.max_value_desconto !== undefined) {
          query = query.lte('initial_bid_value', filters.max_value_desconto);
        }
      }
    }

    // ✅ MANTER: Filtros antigos para compatibilidade
    if (filters.min_area !== undefined) {
      query = query.gte('useful_area_m2', filters.min_area);
    }

    if (filters.max_area !== undefined) {
      query = query.lte('useful_area_m2', filters.max_area);
    }

    if (filters.min_value !== undefined) {
      query = query.gte('initial_bid_value', filters.min_value);
    }

    if (filters.max_value !== undefined) {
      query = query.lte('initial_bid_value', filters.max_value);
    }

    if (filters.search) {
      // ✅ CORREÇÃO CRÍTICA: Buscar em múltiplos campos relevantes
      query = query.or(`property_type.ilike.%${filters.search}%,property_category.ilike.%${filters.search}%,property_address.ilike.%${filters.search}%,city.ilike.%${filters.search}%,state.ilike.%${filters.search}%`);
    }

    // ✅ NOVO: Filtro por data de expiração com horário de Brasília
    if (filters.showExpiredAuctions !== undefined) {
      // ✅ CORREÇÃO: Usar horário de Brasília (UTC-3)
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();

      if (filters.showExpiredAuctions) {
        // ✅ CORREÇÃO: Mostrar apenas leilões expirados (end_date < now Brasília)
        query = query.not('end_date', 'is', null).lt('end_date', nowBrasilia);
      } else {
        // ✅ CORREÇÃO: Mostrar apenas leilões ativos (end_date >= now Brasília)
        query = query.not('end_date', 'is', null).gte('end_date', nowBrasilia);
      }
    } else {
      // ✅ PADRÃO: Mostrar apenas leilões ativos se não especificado
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();
      query = query.not('end_date', 'is', null).gte('end_date', nowBrasilia);
    }

    const { count, error } = await query;
    
    if (error) throw error;
    return count || 0;
  },

  // ✅ PAGINAÇÃO REAL: Contar total de veículos para paginação
  async countVehicles(filters: {
    state?: string;
    city?: string;
    vehicle_types?: string[];
    brand?: string;
    model?: string;
    color?: string;
    format?: string;
    origin?: string[];
    stage?: string[];
    min_year?: number;
    max_year?: number;
    // ✅ CORREÇÃO: Novos parâmetros de valor
    min_value_avaliacao?: number;
    max_value_avaliacao?: number;
    min_value_desconto?: number;
    max_value_desconto?: number;
    // ✅ MANTER: Parâmetros antigos para compatibilidade
    min_value?: number;
    max_value?: number;
    search?: string;
    showExpiredAuctions?: boolean; // ✅ NOVO: Mostrar leilões expirados
  } = {}): Promise<number> {
    let query = supabase
      .from('lots_vehicle')
      .select('*', { count: 'exact', head: true });

    // Aplicar os mesmos filtros da busca
    if (filters.state && filters.state !== 'all') {
      query = query.eq('state', filters.state);
    }

    if (filters.city && filters.city !== 'all') {
      query = query.eq('city', filters.city);
    }

    // ✅ CORREÇÃO CRÍTICA: Aplicar mesma lógica de filtro por tipo
    if (filters.vehicle_types && filters.vehicle_types.length > 0) {
      if (filters.vehicle_types.includes('__NAO_INFORMADO__')) {
        query = query.or('vehicle_category.is.null,vehicle_category.eq.');
      } else {
        const validTypes = filters.vehicle_types.filter(type => type !== null && type !== undefined && type !== '');
        if (validTypes.length > 0) {
          query = query.in('vehicle_category', validTypes);
        }
      }
    }

    if (filters.brand && filters.brand !== 'all') {
      query = query.eq('brand', filters.brand);
    }

    if (filters.model && filters.model !== 'all') {
      query = query.eq('model', filters.model);
    }

    if (filters.color && filters.color !== 'all') {
      // 🔍 DEBUG: Log do filtro de cor no count
      console.log('🔍 DEBUG Count Vehicles - Aplicando filtro de cor:', {
        originalColor: filters.color,
        colorType: typeof filters.color,
        colorLength: filters.color.length
      });
      query = query.eq('color', filters.color);
    }

    if (filters.format) {
      query = query.eq('format', filters.format);
    }

    // ✅ CORREÇÃO: Tratar filtro "Não informado" para origem
    if (filters.origin && filters.origin.length > 0) {
      if (filters.origin.includes('__NAO_INFORMADO__')) {
        // Se inclui "Não informado", buscar registros que NÃO estão nas outras categorias
        const otherOrigins = filters.origin.filter(o => o !== '__NAO_INFORMADO__');
        if (otherOrigins.length > 0) {
          // Se tem outras origens também, usar OR logic
          query = query.or(`origin.in.(${otherOrigins.join(',')}),origin.is.null,origin.eq.`);
        } else {
          // Se só tem "Não informado", buscar apenas null/empty
          query = query.or('origin.is.null,origin.eq.');
        }
      } else {
        query = query.in('origin', filters.origin);
      }
    }

    // ✅ CORREÇÃO: Tratar filtro "Não informado" para etapa
    if (filters.stage && filters.stage.length > 0) {
      if (filters.stage.includes('__NAO_INFORMADO__')) {
        // Se inclui "Não informado", buscar registros que NÃO estão nas outras categorias
        const otherStages = filters.stage.filter(s => s !== '__NAO_INFORMADO__');
        if (otherStages.length > 0) {
          // Se tem outras etapas também, usar OR logic
          query = query.or(`stage.in.(${otherStages.join(',')}),stage.is.null,stage.eq.`);
        } else {
          // Se só tem "Não informado", buscar apenas null/empty
          query = query.or('stage.is.null,stage.eq.');
        }
      } else {
        query = query.in('stage', filters.stage);
      }
    }

    // 🔧 CORREÇÃO: Incluir valores NULL/0 quando range é muito amplo
    if (filters.min_year !== undefined || filters.max_year !== undefined) {
      const minYear = filters.min_year || 1900;
      const maxYear = filters.max_year || new Date().getFullYear() + 1;

      // Se range é muito amplo (praticamente "todos"), incluir NULL/0
      const isVeryBroadRange = minYear <= 1900 && maxYear >= new Date().getFullYear();

      if (isVeryBroadRange) {
        // Incluir registros com ano válido OU NULL/0/vazio
        // Usar OR para incluir todos os casos possíveis
        const conditions = [];
        if (filters.min_year !== undefined) {
          conditions.push(`year.gte.${filters.min_year}`);
        }
        if (filters.max_year !== undefined) {
          conditions.push(`year.lte.${filters.max_year}`);
        }
        conditions.push('year.is.null');
        conditions.push('year.eq.0');
        conditions.push('year.eq.');

        query = query.or(conditions.join(','));
      } else {
        // Range específico - só valores válidos
        if (filters.min_year !== undefined) {
          query = query.gte('year', filters.min_year.toString());
        }
        if (filters.max_year !== undefined) {
          query = query.lte('year', filters.max_year.toString());
        }
      }
    }

    // 🔧 CORREÇÃO: Novos filtros de valor (avaliação e desconto) com inclusão de NULL/0
    if (filters.min_value_avaliacao !== undefined || filters.max_value_avaliacao !== undefined) {
      const minValue = filters.min_value_avaliacao || 0;
      const maxValue = filters.max_value_avaliacao || 999999999;

      // Se range é muito amplo (praticamente "todos"), incluir NULL/0
      const isVeryBroadRange = minValue <= 1000 && maxValue >= 10000000;

      if (isVeryBroadRange) {
        // Incluir registros com valor válido OU NULL/0/vazio
        const conditions = [];
        if (filters.min_value_avaliacao !== undefined) {
          conditions.push(`appraised_value.gte.${filters.min_value_avaliacao}`);
        }
        if (filters.max_value_avaliacao !== undefined) {
          conditions.push(`appraised_value.lte.${filters.max_value_avaliacao}`);
        }
        conditions.push('appraised_value.is.null');
        conditions.push('appraised_value.eq.0');

        query = query.or(conditions.join(','));
      } else {
        // Range específico - só valores válidos
        if (filters.min_value_avaliacao !== undefined) {
          query = query.gte('appraised_value', filters.min_value_avaliacao);
        }
        if (filters.max_value_avaliacao !== undefined) {
          query = query.lte('appraised_value', filters.max_value_avaliacao);
        }
      }
    }

    if (filters.min_value_desconto !== undefined || filters.max_value_desconto !== undefined) {
      const minValue = filters.min_value_desconto || 0;
      const maxValue = filters.max_value_desconto || 999999999;

      // Se range é muito amplo (praticamente "todos"), incluir NULL/0
      const isVeryBroadRange = minValue <= 1000 && maxValue >= 10000000;

      if (isVeryBroadRange) {
        // Incluir registros com valor válido OU NULL/0/vazio
        const conditions = [];
        if (filters.min_value_desconto !== undefined) {
          conditions.push(`initial_bid_value.gte.${filters.min_value_desconto}`);
        }
        if (filters.max_value_desconto !== undefined) {
          conditions.push(`initial_bid_value.lte.${filters.max_value_desconto}`);
        }
        conditions.push('initial_bid_value.is.null');
        conditions.push('initial_bid_value.eq.0');

        query = query.or(conditions.join(','));
      } else {
        // Range específico - só valores válidos
        if (filters.min_value_desconto !== undefined) {
          query = query.gte('initial_bid_value', filters.min_value_desconto);
        }
        if (filters.max_value_desconto !== undefined) {
          query = query.lte('initial_bid_value', filters.max_value_desconto);
        }
      }
    }

    // ✅ MANTER: Filtros antigos para compatibilidade
    if (filters.min_value !== undefined) {
      query = query.gte('initial_bid_value', filters.min_value);
    }

    if (filters.max_value !== undefined) {
      query = query.lte('initial_bid_value', filters.max_value);
    }

    if (filters.search) {
      query = query.or(`vehicle_type.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
    }

    // ✅ NOVO: Filtro por data de expiração com horário de Brasília
    if (filters.showExpiredAuctions !== undefined) {
      // ✅ CORREÇÃO: Usar horário de Brasília (UTC-3)
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();

      if (filters.showExpiredAuctions) {
        // ✅ CORREÇÃO: Mostrar apenas leilões expirados (end_date < now Brasília)
        query = query.not('end_date', 'is', null).lt('end_date', nowBrasilia);
      } else {
        // ✅ CORREÇÃO: Mostrar apenas leilões ativos (end_date >= now Brasília)
        query = query.not('end_date', 'is', null).gte('end_date', nowBrasilia);
      }
    } else {
      // ✅ PADRÃO: Filtrar apenas leilões ativos se não especificado
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();
      query = query.not('end_date', 'is', null).gte('end_date', nowBrasilia);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  },

  // ✅ BUSCA HÍBRIDA: Marcas fixas filtradas pelo que existe no banco
  async getVehicleBrands(category?: string): Promise<string[]> {
    try {
      console.log('🚗 [DATABASE] Iniciando busca híbrida de marcas...');

      // 🚗 MARCAS FIXAS: Lista corrigida com case exato do banco de dados
      const FIXED_BRANDS = [
        'Agrale', 'Alfa Romeo', 'Americar', 'Asia', 'Aston Martin', 'Audi', 'Austin-healey', 'Avallone',
        'Bentley', 'BMW', 'Brm', 'Bugre', 'Bugway', 'BYD', 'Cadillac', 'Caoa Chery', 'Cbt', 'Chamonix',
        'Chevrolet', 'Chrysler', 'Citroën', 'Daewoo', 'Daihatsu', 'Dkw-vemag', 'Dodge', 'Effa', 'Ego',
        'Emis', 'Engesa', 'Envemo', 'Farus', 'Fercar Buggy', 'Ferrari', 'Fever', 'Fiat', 'Fnm', 'Ford',
        'Fyber', 'Geely', 'Giants', 'GMC', 'Gurgel', 'GWM', 'Hafei', 'Honda', 'Hummer', 'Hyundai',
        'Infiniti', 'International', 'Iveco', 'JAC', 'Jaecoo', 'Jaguar', 'Jeep', 'Jinbei', 'Jpx', 'Kaiser',
        'Kia', 'Lada', 'Lamborghini', 'Land Rover', 'Lexus', 'Lifan', 'Lincoln', 'Lotus', 'Lucid',
        'Mahindra', 'Marcopolo', 'Maserati', 'Matra', 'Mazda', 'Mclaren', 'Mercedes-Benz', 'Mercury',
        'Mg', 'Mini', 'Mitsubishi', 'Miura', 'Morgan', 'Morris', 'Mp Lafer', 'Mplm', 'Nash', 'Neta',
        'Nissan', 'Oldsmobile', 'Omoda', 'Opel', 'Packard', 'Peugeot', 'Plymouth', 'Pontiac', 'Porsche',
        'Puma', 'Ram', 'Renault', 'Rivian', 'Rolls-royce', 'Santa Matilde', 'Saturn', 'Seat', 'Seres',
        'Shelby', 'Shineray', 'Smart', 'Ssangyong', 'Studebaker', 'Subaru', 'Suzuki', 'Tac', 'Tesla',
        'Toyota', 'Troller', 'Volkswagen', 'Volvo', 'Wake', 'Way Brasil', 'Willys', 'Willys Overland', 'Zeekr'
      ];

      // ✅ BUSCAR MARCAS EXISTENTES NO BANCO (COM FILTRO DE CATEGORIA)
      let query = supabase
        .from('lots_vehicle')
        .select('brand')
        .not('brand', 'is', null)
        .neq('brand', '')
        .limit(10000);

      // 🎯 FILTRAR POR CATEGORIA SE ESPECIFICADA
      if (category && category !== 'todos') {
        query = query.eq('vehicle_category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar marcas do banco:', error);
        return FIXED_BRANDS; // Fallback para lista completa
      }

      if (!data || data.length === 0) {
        console.log('⚠️ Nenhuma marca encontrada no banco');
        return [];
      }

      // ✅ EXTRAIR MARCAS ÚNICAS DO BANCO
      const dbBrands = [...new Set(data.map(item => item.brand).filter(Boolean))];

      // ✅ FILTRAR MARCAS FIXAS: Mostrar apenas as que existem no banco
      const availableBrands = FIXED_BRANDS.filter(fixedBrand => {
        return dbBrands.some(dbBrand =>
          dbBrand.toLowerCase().trim() === fixedBrand.toLowerCase().trim()
        );
      });

      console.log('🚗 [DATABASE] Marcas híbridas processadas:', {
        category: category || 'todas',
        totalDbBrands: dbBrands.length,
        fixedBrandsCount: FIXED_BRANDS.length,
        availableBrands: availableBrands.length,
        brandsAfterC: availableBrands.filter(brand => brand.toLowerCase().charAt(0) > 'c').length
      });

      return availableBrands;

    } catch (err) {
      console.error('❌ Erro inesperado ao buscar marcas:', err);
      return [];
    }
  },

  // ✅ BUSCA DINÂMICA: Buscar modelos por marca
  async getVehicleModels(brand?: string): Promise<string[]> {
    let query = supabase
      .from('lots_vehicle')
      .select('model')
      .not('model', 'is', null)
      .neq('model', '');
      // ✅ CORREÇÃO: Incluir todos os leilões para ter mais modelos disponíveis

    if (brand && brand !== 'all') {
      query = query.eq('brand', brand);
    }

    const { data, error } = await query.order('model');

    if (error) {
      console.error('Erro ao buscar modelos:', error);
      return [];
    }

    // Extrair valores únicos e ordenar
    const uniqueModels = [...new Set(data.map(item => item.model).filter(Boolean))];
    return uniqueModels.sort();
  },

  // ✅ BUSCA HÍBRIDA: Cores fixas filtradas pelo que existe no banco
  async getVehicleColors(category?: string): Promise<string[]> {
    try {
      console.log('🎨 [DATABASE] Iniciando busca híbrida de cores...');

      // 🎨 CORES FIXAS: Lista completa de cores possíveis
      const FIXED_COLORS = [
        'Amarelo',
        'Azul',
        'Bege',
        'Branco',
        'Bronze',
        'Cinza',
        'Dourado',
        'Grafite',
        'Laranja',
        'Marrom',
        'Prata',
        'Preto',
        'Rosa',
        'Roxo',
        'Verde',
        'Vermelho',
        'Vinho'
      ];

      // ✅ BUSCAR CORES EXISTENTES NO BANCO (COM FILTRO DE CATEGORIA)
      let query = supabase
        .from('lots_vehicle')
        .select('color')
        .not('color', 'is', null)
        .neq('color', '')
        .limit(10000);

      // 🎯 FILTRAR POR CATEGORIA SE ESPECIFICADA
      if (category && category !== 'todos') {
        query = query.eq('vehicle_category', category);
      }

      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar cores do banco:', error);
        return FIXED_COLORS; // Fallback para lista completa
      }

      if (!data || data.length === 0) {
        console.log('⚠️ Nenhuma cor encontrada no banco');
        return [];
      }

      // ✅ EXTRAIR CORES ÚNICAS DO BANCO
      const dbColors = [...new Set(data.map(item => item.color).filter(Boolean))];

      // ✅ FILTRAR CORES FIXAS: Mostrar apenas as que existem no banco
      const availableColors = FIXED_COLORS.filter(fixedColor => {
        return dbColors.some(dbColor =>
          dbColor.toLowerCase().trim() === fixedColor.toLowerCase().trim()
        );
      });

      console.log('🎨 [DATABASE] Cores híbridas processadas:', {
        category: category || 'todas',
        totalDbColors: dbColors.length,
        fixedColorsCount: FIXED_COLORS.length,
        availableColors: availableColors.length,
        availableColorsList: availableColors
      });

      return availableColors;

    } catch (err) {
      console.error('❌ Erro inesperado ao buscar cores:', err);
      return [];
    }
  },

  // ✅ ESTATÍSTICAS: Buscar TODOS os sites únicos (imóveis + veículos)
  async getAllSitesCount(): Promise<number> {
    try {
      // Buscar sites únicos de ambas as tabelas
      const { data: propertySites, error: propertyError } = await supabase
        .from('lots_property')
        .select('website')
        .not('website', 'is', null)
        .neq('website', '');

      const { data: vehicleSites, error: vehicleError } = await supabase
        .from('lots_vehicle')
        .select('website')
        .not('website', 'is', null)
        .neq('website', '');

      if (propertyError || vehicleError) {
        console.error('Erro ao buscar sites:', { propertyError, vehicleError });
        return 0;
      }

      // Combinar e contar sites únicos
      const allSites = new Set();

      if (propertySites) {
        propertySites.forEach(item => {
          if (item.website) allSites.add(item.website);
        });
      }

      if (vehicleSites) {
        vehicleSites.forEach(item => {
          if (item.website) allSites.add(item.website);
        });
      }

      return allSites.size;
    } catch (error) {
      console.error('Erro ao buscar todos os sites:', error);
      return 0;
    }
  },

  // ✅ ESTATÍSTICAS: Buscar sites únicos para imóveis
  async getPropertySitesCount(filters: {
    state?: string;
    city?: string;
    property_categories?: string[]; // ✅ CORREÇÃO CRÍTICA: Usar property_categories
    format?: string;
    origin?: string[];
    stage?: string[];
    min_area?: number;
    max_area?: number;
    min_value?: number;
    max_value?: number;
    search?: string;
    showExpiredAuctions?: boolean; // ✅ NOVO: Parâmetro para leilões expirados
  } = {}): Promise<number> {
    console.log('🏢 INICIANDO contagem de sites de imóveis:', { filtersCount: Object.keys(filters).length, filters });

    // ✅ CORREÇÃO CRÍTICA: Usar horário de Brasília igual às outras funções
    const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();
    console.log('🏢 Data Brasília para filtro:', nowBrasilia);

    // ✅ CORREÇÃO CRÍTICA: Verificar se há filtros reais (excluindo showExpiredAuctions e valores undefined/null)
    const realFilters = { ...filters };
    delete realFilters.showExpiredAuctions; // Remover parâmetro de controle

    // ✅ CORREÇÃO CRÍTICA: Contar apenas filtros que realmente existem no objeto
    const filterKeys = Object.keys(realFilters);
    console.log('🏢 DEBUG - Filtros recebidos:', { filterKeys, realFilters });

    // ✅ CORREÇÃO CRÍTICA: Verificar se há filtros reais de forma mais rigorosa
    const hasRealFilters = filterKeys.length > 0 && Object.entries(realFilters).some(([key, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (Array.isArray(value) && value.every(v => v === undefined || v === null || v === '')) return false;
      return true;
    });

    console.log('🏢 DEBUG - hasRealFilters:', hasRealFilters);

    if (!hasRealFilters) {
      console.log('🏢 EXECUTANDO query SEM FILTROS para imóveis');
      const { data, error } = await supabase
        .from('lots_property')
        .select('website')
        .not('website', 'is', null)
        .neq('website', '')
        .not('end_date', 'is', null) // ✅ CORREÇÃO: Filtrar end_date null (agora TIMESTAMP)
        .gte('end_date', nowBrasilia); // ✅ CORREÇÃO: Usar horário de Brasília

      if (error) {
        console.error('❌ Erro ao buscar todos os sites de imóveis:', error);
        return 0;
      }

      const uniqueSites = new Set(data.map(item => item.website).filter(Boolean));
      console.log('🏢 Sites únicos encontrados (sem filtros):', uniqueSites.size);
      return uniqueSites.size;
    }

    console.log('🏢 EXECUTANDO query COM FILTROS para imóveis');
    let query = supabase
      .from('lots_property')
      .select('website')
      .not('website', 'is', null)
      .neq('website', '')
      .not('end_date', 'is', null) // ✅ CORREÇÃO: Filtrar end_date null (agora TIMESTAMP)

    // ✅ CORREÇÃO CRÍTICA: Aplicar filtro de data baseado no parâmetro
    if (!filters.showExpiredAuctions) {
      query = query.gte('end_date', nowBrasilia); // ✅ CORREÇÃO CRÍTICA: Usar horário de Brasília
    }

    // Aplicar os mesmos filtros da busca principal
    if (filters.state && filters.state !== 'all') {
      query = query.eq('state', filters.state);
    }

    if (filters.city && filters.city !== 'all') {
      query = query.eq('city', filters.city);
    }

    // ✅ CORREÇÃO CRÍTICA: Aplicar mesma lógica de filtro por categoria
    if (filters.property_categories && filters.property_categories.length > 0) {
      if (filters.property_categories.includes('__NAO_INFORMADO__')) {
        query = query.or('property_category.is.null,property_category.eq.');
      } else {
        const validTypes = filters.property_categories.filter(type => type !== null && type !== undefined && type !== '');
        if (validTypes.length > 0) {
          query = query.in('property_category', validTypes);
        }
      }
    }

    if (filters.format) {
      query = query.eq('format', filters.format);
    }

    // Aplicar filtros especiais de origem e etapa
    if (filters.origin && filters.origin.length > 0) {
      if (filters.origin.includes('__NAO_INFORMADO__')) {
        query = query.not('origin', 'in', ['Judicial', 'Extrajudicial', 'Público']);
      } else {
        query = query.in('origin', filters.origin);
      }
    }

    if (filters.stage && filters.stage.length > 0) {
      if (filters.stage.includes('__NAO_INFORMADO__')) {
        // ✅ CORREÇÃO: Banco usa valores 1, 2, 3 e "Praça Única"
        query = query.not('stage', 'in', ['Praça Única', '1', '2', '3']);
      } else {
        query = query.in('stage', filters.stage);
      }
    }

    if (filters.min_area !== undefined) {
      query = query.gte('useful_area_m2', filters.min_area);
    }

    if (filters.max_area !== undefined) {
      query = query.lte('useful_area_m2', filters.max_area);
    }

    if (filters.min_value !== undefined) {
      query = query.gte('initial_bid_value', filters.min_value);
    }

    if (filters.max_value !== undefined) {
      query = query.lte('initial_bid_value', filters.max_value);
    }

    if (filters.search) {
      // ✅ CORREÇÃO CRÍTICA: Buscar em property_type
      query = query.or(`property_type.ilike.%${filters.search}%,property_address.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar sites de imóveis:', error);
      return 0;
    }

    console.log('🏢 Resposta do Supabase (imóveis):', {
      dataLength: data?.length || 0,
      firstFewSites: data?.slice(0, 5)?.map(item => item.website) || []
    });

    // Contar sites únicos
    const uniqueSites = new Set(data.map(item => item.website).filter(Boolean));
    console.log('🏢 Sites únicos finais (imóveis):', uniqueSites.size, Array.from(uniqueSites).slice(0, 10));

    return uniqueSites.size;
  },

  // ✅ ESTATÍSTICAS: Buscar sites únicos para veículos
  async getVehicleSitesCount(filters: {
    state?: string;
    city?: string;
    vehicle_types?: string[];
    brand?: string;
    model?: string;
    color?: string;
    format?: string;
    origin?: string[];
    stage?: string[];
    min_year?: number;
    max_year?: number;
    min_value?: number;
    max_value?: number;
    search?: string;
    showExpiredAuctions?: boolean; // ✅ NOVO: Parâmetro para leilões expirados
  } = {}): Promise<number> {
    console.log('🚗 INICIANDO contagem de sites de veículos:', { filtersCount: Object.keys(filters).length, filters });

    // ✅ CORREÇÃO CRÍTICA: Usar horário de Brasília igual às outras funções
    const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();
    console.log('🚗 Data Brasília para filtro:', nowBrasilia);

    // ✅ CORREÇÃO CRÍTICA: Verificar se há filtros reais (excluindo showExpiredAuctions e valores undefined/null)
    const realFilters = { ...filters };
    delete realFilters.showExpiredAuctions; // Remover parâmetro de controle

    // ✅ CORREÇÃO CRÍTICA: Contar apenas filtros que realmente existem no objeto
    const filterKeys = Object.keys(realFilters);
    console.log('🚗 DEBUG - Filtros recebidos:', { filterKeys, realFilters });

    // ✅ CORREÇÃO CRÍTICA: Verificar se há filtros reais de forma mais rigorosa
    const hasRealFilters = filterKeys.length > 0 && Object.entries(realFilters).some(([key, value]) => {
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (Array.isArray(value) && value.every(v => v === undefined || v === null || v === '')) return false;
      return true;
    });

    console.log('🚗 DEBUG - hasRealFilters:', hasRealFilters);

    if (!hasRealFilters) {
      console.log('🚗 EXECUTANDO query SEM FILTROS para veículos');
      const { data, error } = await supabase
        .from('lots_vehicle')
        .select('website')
        .not('website', 'is', null)
        .neq('website', '')
        .not('end_date', 'is', null) // ✅ CORREÇÃO: Filtrar end_date null (agora TIMESTAMP)
        .gte('end_date', nowBrasilia); // ✅ CORREÇÃO: Usar horário de Brasília

      if (error) {
        console.error('❌ Erro ao buscar todos os sites de veículos:', error);
        return 0;
      }

      const uniqueSites = new Set(data.map(item => item.website).filter(Boolean));
      console.log('🚗 Sites únicos encontrados (sem filtros):', uniqueSites.size);
      return uniqueSites.size;
    }

    console.log('🚗 EXECUTANDO query COM FILTROS para veículos');
    let query = supabase
      .from('lots_vehicle')
      .select('website')
      .not('website', 'is', null)
      .neq('website', '')
      .not('end_date', 'is', null) // ✅ CORREÇÃO: Filtrar end_date null (agora TIMESTAMP)

    // ✅ CORREÇÃO CRÍTICA: Aplicar filtro de data baseado no parâmetro
    if (!filters.showExpiredAuctions) {
      query = query.gte('end_date', nowBrasilia); // ✅ CORREÇÃO CRÍTICA: Usar horário de Brasília
    }

    // Aplicar os mesmos filtros da busca principal
    if (filters.state && filters.state !== 'all') {
      query = query.eq('state', filters.state);
    }

    if (filters.city && filters.city !== 'all') {
      query = query.eq('city', filters.city);
    }

    // ✅ CORREÇÃO CRÍTICA: Aplicar mesma lógica de filtro por tipo
    if (filters.vehicle_types && filters.vehicle_types.length > 0) {
      if (filters.vehicle_types.includes('__NAO_INFORMADO__')) {
        query = query.or('vehicle_category.is.null,vehicle_category.eq.');
      } else {
        const validTypes = filters.vehicle_types.filter(type => type !== null && type !== undefined && type !== '');
        if (validTypes.length > 0) {
          query = query.in('vehicle_category', validTypes);
        }
      }
    }

    if (filters.brand && filters.brand !== 'all') {
      query = query.eq('brand', filters.brand);
    }

    if (filters.model && filters.model !== 'all') {
      query = query.eq('model', filters.model);
    }

    if (filters.color && filters.color !== 'all') {
      query = query.eq('color', filters.color);
    }

    if (filters.format) {
      query = query.eq('format', filters.format);
    }

    if (filters.origin && filters.origin.length > 0) {
      if (filters.origin.includes('__NAO_INFORMADO__')) {
        query = query.not('origin', 'in', ['Judicial', 'Extrajudicial', 'Público']);
      } else {
        query = query.in('origin', filters.origin);
      }
    }

    if (filters.stage && filters.stage.length > 0) {
      if (filters.stage.includes('__NAO_INFORMADO__')) {
        // ✅ CORREÇÃO: Banco usa valores 1, 2, 3 e "Praça Única"
        query = query.not('stage', 'in', ['Praça Única', '1', '2', '3']);
      } else {
        query = query.in('stage', filters.stage);
      }
    }

    if (filters.min_year !== undefined) {
      query = query.gte('year', filters.min_year.toString());
    }

    if (filters.max_year !== undefined) {
      query = query.lte('year', filters.max_year.toString());
    }

    if (filters.min_value !== undefined) {
      query = query.gte('initial_bid_value', filters.min_value);
    }

    if (filters.max_value !== undefined) {
      query = query.lte('initial_bid_value', filters.max_value);
    }

    if (filters.search) {
      query = query.or(`vehicle_category.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erro ao buscar sites de veículos:', error);
      return 0;
    }

    console.log('🚗 Resposta do Supabase (veículos):', {
      dataLength: data?.length || 0,
      firstFewSites: data?.slice(0, 5)?.map(item => item.website) || []
    });

    // Contar sites únicos
    const uniqueSites = new Set(data.map(item => item.website).filter(Boolean));
    console.log('🚗 Sites únicos finais (veículos):', uniqueSites.size, Array.from(uniqueSites).slice(0, 10));

    return uniqueSites.size;
  },

  // ✅ NOVO: VISIBILIDADE CONDICIONAL - Verificar quais estados têm registros
  async getAvailableStates(category: 'imoveis' | 'veiculos'): Promise<string[]> {
    const table = category === 'imoveis' ? 'lots_property' : 'lots_vehicle';

    // ✅ CORREÇÃO CRÍTICA: Usar horário de Brasília (UTC-3) igual aos filtros
    const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from(table)
      .select('state')
      .not('state', 'is', null)
      .neq('state', '')
      .not('end_date', 'is', null) // ✅ CORREÇÃO: Filtrar end_date null (agora TIMESTAMP)
      .gte('end_date', nowBrasilia); // ✅ CORREÇÃO: Usar horário de Brasília

    if (error) {
      console.error(`Erro ao buscar estados de ${category}:`, error);
      return [];
    }

    // Retornar estados únicos
    const uniqueStates = [...new Set(data.map(item => item.state).filter(Boolean))];
    return uniqueStates.sort();
  },

  // ✅ NOVO: VISIBILIDADE CONDICIONAL - Verificar quais cidades têm registros por estado
  async getAvailableCities(category: 'imoveis' | 'veiculos', state: string): Promise<string[]> {
    const table = category === 'imoveis' ? 'lots_property' : 'lots_vehicle';

    // ✅ CORREÇÃO CRÍTICA: Usar horário de Brasília (UTC-3) igual aos filtros
    const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from(table)
      .select('city')
      .eq('state', state)
      .not('city', 'is', null)
      .neq('city', '')
      .not('end_date', 'is', null) // ✅ CORREÇÃO: Filtrar end_date null (agora TIMESTAMP)
      .gte('end_date', nowBrasilia); // ✅ CORREÇÃO: Usar horário de Brasília

    if (error) {
      console.error(`Erro ao buscar cidades de ${category} no estado ${state}:`, error);
      return [];
    }

    // Retornar cidades únicas
    const uniqueCities = [...new Set(data.map(item => item.city).filter(Boolean))];
    return uniqueCities.sort();
  },

  // ✅ NOVO: VISIBILIDADE CONDICIONAL - Verificar quais formatos têm registros
  async getAvailableFormats(category: 'imoveis' | 'veiculos'): Promise<string[]> {
    const table = category === 'imoveis' ? 'lots_property' : 'lots_vehicle';

    // ✅ CORREÇÃO CRÍTICA: Usar horário de Brasília (UTC-3) igual aos filtros
    const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from(table)
      .select('format')
      .not('format', 'is', null)
      .neq('format', '')
      .not('end_date', 'is', null) // ✅ CORREÇÃO: Filtrar end_date null (agora TIMESTAMP)
      .gte('end_date', nowBrasilia); // ✅ CORREÇÃO: Usar horário de Brasília

    if (error) {
      console.error(`Erro ao buscar formatos de ${category}:`, error);
      return [];
    }

    // Retornar formatos únicos
    const uniqueFormats = [...new Set(data.map(item => item.format).filter(Boolean))];
    return uniqueFormats.sort();
  },

  // ✅ NOVO: VISIBILIDADE CONDICIONAL - Verificar quais origens têm registros
  async getAvailableOrigins(category: 'imoveis' | 'veiculos'): Promise<string[]> {
    const table = category === 'imoveis' ? 'lots_property' : 'lots_vehicle';

    // ✅ CORREÇÃO CRÍTICA: Usar horário de Brasília (UTC-3) igual aos filtros
    const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from(table)
      .select('origin')
      .not('end_date', 'is', null) // ✅ CORREÇÃO: Filtrar end_date null (agora TIMESTAMP)
      .gte('end_date', nowBrasilia); // ✅ CORREÇÃO: Usar horário de Brasília

    if (error) {
      console.error(`Erro ao buscar origens de ${category}:`, error);
      return [];
    }

    // Retornar origens únicas (incluindo null/empty como "Não informado")
    const origins = data.map(item => item.origin).filter(origin => origin !== null && origin !== '');
    const uniqueOrigins = [...new Set(origins)];

    // Verificar se há registros com origin null/empty
    const hasNullOrigins = data.some(item => !item.origin || item.origin === '');
    if (hasNullOrigins) {
      uniqueOrigins.push('__NAO_INFORMADO__');
    }

    return uniqueOrigins.sort();
  },

  // ✅ NOVO: VISIBILIDADE CONDICIONAL - Verificar quais etapas têm registros
  async getAvailableStages(category: 'imoveis' | 'veiculos'): Promise<string[]> {
    const table = category === 'imoveis' ? 'lots_property' : 'lots_vehicle';

    // ✅ CORREÇÃO CRÍTICA: Usar horário de Brasília (UTC-3) igual aos filtros
    const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from(table)
      .select('stage')
      .not('end_date', 'is', null) // ✅ CORREÇÃO: Filtrar end_date null (agora TIMESTAMP)
      .gte('end_date', nowBrasilia); // ✅ CORREÇÃO: Usar horário de Brasília

    if (error) {
      console.error(`Erro ao buscar etapas de ${category}:`, error);
      return [];
    }

    // Retornar etapas únicas (incluindo null/empty como "Não informado")
    const stages = data.map(item => item.stage).filter(stage => stage !== null && stage !== '');
    const uniqueStages = [...new Set(stages)];

    // Verificar se há registros com stage null/empty
    const hasNullStages = data.some(item => !item.stage || item.stage === '');
    if (hasNullStages) {
      uniqueStages.push('__NAO_INFORMADO__');
    }

    return uniqueStages.sort();
  },

  // 🚀 PERFORMANCE BOOST: Agregações otimizadas para ranges
  async getPropertyRanges(filters: {
    property_categories?: string[];
    showExpiredAuctions?: boolean;
  } = {}): Promise<{
    minArea: number | null;
    maxArea: number | null;
    minPrice: number | null;
    maxPrice: number | null;
  }> {
    let query = supabase
      .from('lots_property')
      .select(`
        useful_area_m2,
        initial_bid_value
      `);

    // Aplicar filtros de data
    if (!filters.showExpiredAuctions) {
      // ✅ CORREÇÃO CRÍTICA: Usar horário de Brasília (UTC-3) igual aos filtros
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();
      query = query
        .not('end_date', 'is', null) // ✅ CORREÇÃO: Filtrar end_date null (agora TIMESTAMP)
        .gte('end_date', nowBrasilia);
    }

    // Aplicar filtro de categoria se especificado
    if (filters.property_categories) {
      if (filters.property_categories.includes('')) {
        // Incluir registros com categoria vazia/null
        query = query.or(`property_category.in.(${filters.property_categories.filter(c => c !== '').join(',')}),property_category.is.null,property_category.eq.`);
      } else {
        query = query.in('property_category', filters.property_categories);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar ranges de imóveis:', error);
      return { minArea: null, maxArea: null, minPrice: null, maxPrice: null };
    }

    // Calcular agregações em JavaScript (mais eficiente que múltiplas queries SQL)
    const areas = data
      .map(p => p.useful_area_m2)
      .filter((area): area is number => area !== null && area !== undefined && area > 0);

    const prices = data
      .map(p => p.initial_bid_value)
      .filter((price): price is number => price !== null && price !== undefined && price > 0);

    return {
      minArea: areas.length > 0 ? Math.min(...areas) : null,
      maxArea: areas.length > 0 ? Math.max(...areas) : null,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      maxPrice: prices.length > 0 ? Math.max(...prices) : null
    };
  },

  async getVehicleRanges(filters: {
    vehicle_types?: string[];
    showExpiredAuctions?: boolean;
  } = {}): Promise<{
    minYear: number | null;
    maxYear: number | null;
    minPrice: number | null;
    maxPrice: number | null;
  }> {
    let query = supabase
      .from('lots_vehicle')
      .select(`
        year,
        initial_bid_value
      `);

    // Aplicar filtros de data
    if (!filters.showExpiredAuctions) {
      // ✅ CORREÇÃO CRÍTICA: Usar horário de Brasília (UTC-3) igual aos filtros
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();
      query = query
        .not('end_date', 'is', null) // ✅ CORREÇÃO: Filtrar end_date null (agora TIMESTAMP)
        .gte('end_date', nowBrasilia);
    }

    // Aplicar filtro de tipo se especificado
    if (filters.vehicle_types) {
      if (filters.vehicle_types.includes('')) {
        // Incluir registros com tipo vazio/null
        query = query.or(`vehicle_type.in.(${filters.vehicle_types.filter(t => t !== '').join(',')}),vehicle_type.is.null,vehicle_type.eq.`);
      } else {
        query = query.in('vehicle_type', filters.vehicle_types);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar ranges de veículos:', error);
      return { minYear: null, maxYear: null, minPrice: null, maxPrice: null };
    }

    // Calcular agregações em JavaScript
    const years = data
      .map(v => v.year)
      .filter((year): year is number => year !== null && year !== undefined && year > 0);

    const prices = data
      .map(v => v.initial_bid_value)
      .filter((price): price is number => price !== null && price !== undefined && price > 0);

    return {
      minYear: years.length > 0 ? Math.min(...years) : null,
      maxYear: years.length > 0 ? Math.max(...years) : null,
      minPrice: prices.length > 0 ? Math.min(...prices) : null,
      maxPrice: prices.length > 0 ? Math.max(...prices) : null
    };
  }
};