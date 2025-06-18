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
      // ✅ CORREÇÃO CRÍTICA: Buscar em property_category em vez de property_type
      query = query.or(`property_category.ilike.%${filters.search}%,property_address.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
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
        query = query.neq('end_date', '').not('end_date', 'is', null).lt('end_date', nowBrasilia);
        console.log('🔍 DEBUG Properties - Aplicando filtro para leilões EXPIRADOS');
      } else {
        // ✅ CORREÇÃO: Mostrar apenas leilões ativos (end_date >= now Brasília)
        query = query.neq('end_date', '').not('end_date', 'is', null).gte('end_date', nowBrasilia);
        console.log('🔍 DEBUG Properties - Aplicando filtro para leilões ATIVOS');
      }
    } else {
      // ✅ PADRÃO: Mostrar apenas leilões ativos se não especificado
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();
      query = query.neq('end_date', '').not('end_date', 'is', null).gte('end_date', nowBrasilia);
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
      query = query.eq('city', filters.city);
    }

    // ✅ CORREÇÃO CRÍTICA: Filtro correto por tipos de veículo
    if (filters.vehicle_types && filters.vehicle_types.length > 0) {
      if (filters.vehicle_types.includes('__NAO_INFORMADO__')) {
        // ✅ REGRA 2: 'nao-informado' = WHERE vehicle_type IS NULL OR TRIM(vehicle_type) = ''
        query = query.or('vehicle_type.is.null,vehicle_type.eq.');
      } else {
        // ✅ REGRA 3: Tipos específicos = WHERE vehicle_type IN (...)
        const validTypes = filters.vehicle_types.filter(type => type !== null && type !== undefined && type !== '');
        if (validTypes.length > 0) {
          query = query.in('vehicle_type', validTypes);
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
      query = query.or(`vehicle_type.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
    }

    // ✅ NOVO: Filtro por data de expiração com horário de Brasília
    if (filters.showExpiredAuctions !== undefined) {
      // ✅ CORREÇÃO: Usar horário de Brasília (UTC-3)
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();

      if (filters.showExpiredAuctions) {
        // ✅ CORREÇÃO: Mostrar apenas leilões expirados (end_date < now Brasília)
        query = query.neq('end_date', '').not('end_date', 'is', null).lt('end_date', nowBrasilia);
      } else {
        // ✅ CORREÇÃO: Mostrar apenas leilões ativos (end_date >= now Brasília)
        query = query.neq('end_date', '').not('end_date', 'is', null).gte('end_date', nowBrasilia);
      }
    } else {
      // ✅ PADRÃO: Mostrar apenas leilões ativos se não especificado
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();
      query = query.neq('end_date', '').not('end_date', 'is', null).gte('end_date', nowBrasilia);
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
      // ✅ CORREÇÃO CRÍTICA: Buscar em property_category em vez de property_type
      query = query.or(`property_category.ilike.%${filters.search}%,property_address.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
    }

    // ✅ NOVO: Filtro por data de expiração com horário de Brasília
    if (filters.showExpiredAuctions !== undefined) {
      // ✅ CORREÇÃO: Usar horário de Brasília (UTC-3)
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();

      if (filters.showExpiredAuctions) {
        // ✅ CORREÇÃO: Mostrar apenas leilões expirados (end_date < now Brasília)
        query = query.neq('end_date', '').not('end_date', 'is', null).lt('end_date', nowBrasilia);
      } else {
        // ✅ CORREÇÃO: Mostrar apenas leilões ativos (end_date >= now Brasília)
        query = query.neq('end_date', '').not('end_date', 'is', null).gte('end_date', nowBrasilia);
      }
    } else {
      // ✅ PADRÃO: Mostrar apenas leilões ativos se não especificado
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();
      query = query.neq('end_date', '').not('end_date', 'is', null).gte('end_date', nowBrasilia);
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
        query = query.or('vehicle_type.is.null,vehicle_type.eq.');
      } else {
        const validTypes = filters.vehicle_types.filter(type => type !== null && type !== undefined && type !== '');
        if (validTypes.length > 0) {
          query = query.in('vehicle_type', validTypes);
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
      query = query.or(`vehicle_type.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
    }

    // ✅ NOVO: Filtro por data de expiração com horário de Brasília
    if (filters.showExpiredAuctions !== undefined) {
      // ✅ CORREÇÃO: Usar horário de Brasília (UTC-3)
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();

      if (filters.showExpiredAuctions) {
        // ✅ CORREÇÃO: Mostrar apenas leilões expirados (end_date < now Brasília)
        query = query.neq('end_date', '').not('end_date', 'is', null).lt('end_date', nowBrasilia);
      } else {
        // ✅ CORREÇÃO: Mostrar apenas leilões ativos (end_date >= now Brasília)
        query = query.neq('end_date', '').not('end_date', 'is', null).gte('end_date', nowBrasilia);
      }
    } else {
      // ✅ PADRÃO: Filtrar apenas leilões ativos se não especificado
      const nowBrasilia = new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString();
      query = query.neq('end_date', '').not('end_date', 'is', null).gte('end_date', nowBrasilia);
    }

    const { count, error } = await query;

    if (error) throw error;
    return count || 0;
  },

  // ✅ BUSCA DINÂMICA: Buscar marcas únicas de veículos
  async getVehicleBrands(): Promise<string[]> {
    const { data, error } = await supabase
      .from('lots_vehicle')
      .select('brand')
      .not('brand', 'is', null)
      .neq('brand', '')
      .gte('end_date', new Date().toISOString()) // Apenas leilões ativos
      .order('brand');

    if (error) {
      console.error('Erro ao buscar marcas:', error);
      return [];
    }

    // Extrair valores únicos e ordenar
    const uniqueBrands = [...new Set(data.map(item => item.brand).filter(Boolean))];
    return uniqueBrands.sort();
  },

  // ✅ BUSCA DINÂMICA: Buscar modelos por marca
  async getVehicleModels(brand?: string): Promise<string[]> {
    let query = supabase
      .from('lots_vehicle')
      .select('model')
      .not('model', 'is', null)
      .neq('model', '')
      .gte('end_date', new Date().toISOString()); // Apenas leilões ativos

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

  // ✅ BUSCA DINÂMICA: Buscar cores únicas de veículos
  async getVehicleColors(): Promise<string[]> {
    const { data, error } = await supabase
      .from('lots_vehicle')
      .select('color')
      .not('color', 'is', null)
      .neq('color', '')
      .gte('end_date', new Date().toISOString()) // Apenas leilões ativos
      .order('color');

    if (error) {
      console.error('Erro ao buscar cores:', error);
      return [];
    }

    // Extrair valores únicos e ordenar
    const uniqueColors = [...new Set(data.map(item => item.color).filter(Boolean))];
    return uniqueColors.sort();
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
  } = {}): Promise<number> {
    let query = supabase
      .from('lots_property')
      .select('website')
      .not('website', 'is', null)
      .neq('website', '')
      .gte('end_date', new Date().toISOString());

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
        query = query.not('stage', 'in', ['Praça Única', '1ª Praça', '2ª Praça', '3ª Praça']);
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
      // ✅ CORREÇÃO CRÍTICA: Buscar em property_category em vez de property_type
      query = query.or(`property_category.ilike.%${filters.search}%,property_address.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar sites de imóveis:', error);
      return 0;
    }

    // Contar sites únicos
    const uniqueSites = new Set(data.map(item => item.website).filter(Boolean));
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
  } = {}): Promise<number> {
    let query = supabase
      .from('lots_vehicle')
      .select('website')
      .not('website', 'is', null)
      .neq('website', '')
      .gte('end_date', new Date().toISOString());

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
        query = query.or('vehicle_type.is.null,vehicle_type.eq.');
      } else {
        const validTypes = filters.vehicle_types.filter(type => type !== null && type !== undefined && type !== '');
        if (validTypes.length > 0) {
          query = query.in('vehicle_type', validTypes);
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
        query = query.not('stage', 'in', ['Praça Única', '1ª Praça', '2ª Praça', '3ª Praça']);
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
      query = query.or(`vehicle_type.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar sites de veículos:', error);
      return 0;
    }

    // Contar sites únicos
    const uniqueSites = new Set(data.map(item => item.website).filter(Boolean));
    return uniqueSites.size;
  },

  // ✅ NOVO: VISIBILIDADE CONDICIONAL - Verificar quais estados têm registros
  async getAvailableStates(category: 'imoveis' | 'veiculos'): Promise<string[]> {
    const table = category === 'imoveis' ? 'lots_property' : 'lots_vehicle';

    const { data, error } = await supabase
      .from(table)
      .select('state')
      .not('state', 'is', null)
      .neq('state', '')
      .gte('end_date', new Date().toISOString());

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

    const { data, error } = await supabase
      .from(table)
      .select('city')
      .eq('state', state)
      .not('city', 'is', null)
      .neq('city', '')
      .gte('end_date', new Date().toISOString());

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

    const { data, error } = await supabase
      .from(table)
      .select('format')
      .not('format', 'is', null)
      .neq('format', '')
      .gte('end_date', new Date().toISOString());

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

    const { data, error } = await supabase
      .from(table)
      .select('origin')
      .gte('end_date', new Date().toISOString());

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

    const { data, error } = await supabase
      .from(table)
      .select('stage')
      .gte('end_date', new Date().toISOString());

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
  }
};