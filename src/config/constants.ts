/**
 * Configurações centralizadas da aplicação
 * Remove hardcoded values e centraliza configurações
 */

// ===== PAGINAÇÃO =====
export const PAGINATION_CONFIG = {
  ITEMS_PER_PAGE: 30,
  MAX_VISIBLE_PAGES: 7,
  SCROLL_TO_TOP_ON_PAGE_CHANGE: true
} as const;

// ===== FILTROS =====
export const FILTER_CONFIG = {
  // Ranges padrão para filtros numéricos
  DEFAULT_RANGES: {
    VEHICLE_YEAR: {
      MIN: 1990,
      MAX: new Date().getFullYear()
    },
    VEHICLE_PRICE: {
      MIN: 0,
      MAX: 500000,
      STEP: 5000
    },
    PROPERTY_AREA: {
      MIN: 0,
      MAX: 1000,
      STEP: 10
    },
    PROPERTY_VALUE: {
      MIN: 0,
      MAX: 5000000,
      STEP: 10000
    }
  },
  
  // Debounce para aplicação de filtros
  DEBOUNCE_MS: 500,
  
  // Configurações de busca
  SEARCH: {
    MIN_CHARS: 2,
    DEBOUNCE_MS: 300
  }
} as const;

// ===== DATAS E TEMPO =====
export const DATE_CONFIG = {
  // Timezone
  TIMEZONE: 'America/Sao_Paulo',
  TIMEZONE_OFFSET_HOURS: -3,
  
  // Períodos para cálculos
  NEW_AUCTION_THRESHOLD_HOURS: 24,
  CACHE_DURATION_MS: 5 * 60 * 1000, // 5 minutos
  
  // Formatos de data
  FORMATS: {
    DISPLAY: 'dd/MM/yyyy',
    DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
    API: 'yyyy-MM-dd',
    ISO: 'yyyy-MM-dd\'T\'HH:mm:ss.SSS\'Z\''
  }
} as const;

// ===== UI E LAYOUT =====
export const UI_CONFIG = {
  // Breakpoints (em pixels)
  BREAKPOINTS: {
    MOBILE: 767,
    TABLET: 768,
    DESKTOP: 1024,
    LARGE_DESKTOP: 1280
  },
  
  // Animações
  ANIMATIONS: {
    DURATION_FAST: 200,
    DURATION_NORMAL: 300,
    DURATION_SLOW: 500,
    EASING: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  
  // Z-index layers - CONSOLIDADO
  Z_INDEX: {
    DROPDOWN: 10,
    STICKY: 20,
    HEADER: 30,
    MODAL_BACKDROP: 40,
    MODAL: 50,
    POPOVER: 60,
    FILTER_SIDEBAR: 70,
    TOOLTIP: 80,
    NOTIFICATION: 90
  },
  
  // Sidebar
  SIDEBAR: {
    DESKTOP_WIDTH: 80, // px
    FILTER_SIDEBAR_WIDTH_PERCENT: 35,
    FILTER_SIDEBAR_MAX_WIDTH: 448 // px (max-w-md)
  }
} as const;

// ===== CORES =====
export const COLOR_CONFIG = {
  // Cores principais
  PRIMARY: {
    50: '#eff6ff',
    100: '#dbeafe',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    900: '#1e3a8a'
  },
  
  // Estados
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',
  
  // Gradientes
  GRADIENTS: {
    NEW_BADGE: 'from-yellow-400 to-orange-400',
    DISCOUNT_BADGE: 'from-green-500 to-green-600',
    PRIMARY_BUTTON: 'from-blue-600 to-indigo-600',
    LOGO: 'from-blue-500 to-indigo-600'
  }
} as const;

// ===== PLACEHOLDERS =====
export const LABEL_CONFIG = {
  // Placeholders
  PLACEHOLDERS: {
    SEARCH: 'Pesquisar palavra-chave',
    SELECT_STATE: 'Estado',
    SELECT_CITY: 'Cidade',
    SELECT_BRAND: 'Marca',
    SELECT_MODEL: 'Modelo',
    SELECT_COLOR: 'Cor',
    SEARCH_STATE: 'Buscar estado...',
    SEARCH_CITY: 'Buscar cidade...',
    SEARCH_BRAND: 'Buscar marca...',
    SEARCH_MODEL: 'Buscar modelo...',
    SEARCH_COLOR: 'Buscar cor...'
  },
  
  // Mensagens de erro
  ERROR_MESSAGES: {
    INVALID_DATE: 'Data inválida',
    AUCTION_EXPIRED: 'Leilão expirado',
    NO_RESULTS: 'Nenhum resultado encontrado',
    LOADING_ERROR: 'Erro ao carregar dados',
    NETWORK_ERROR: 'Erro de conexão'
  },
  
  // Status
  STATUS_LABELS: {
    LOADING: 'Carregando...',
    APPLYING: 'Aplicando...',
    CLEARING: 'Limpando...',
    ENDED: 'Encerrado',
    NEW: 'Novo'
  }
} as const;

// ===== VALIDAÇÃO =====
export const VALIDATION_CONFIG = {
  // Limites de caracteres
  MAX_LENGTHS: {
    SEARCH_QUERY: 100,
    TITLE: 200,
    DESCRIPTION: 500
  },
  
  // Ranges válidos
  VALID_RANGES: {
    YEAR: {
      MIN: 1900,
      MAX: new Date().getFullYear() + 1
    },
    PRICE: {
      MIN: 0,
      MAX: 100000000 // 100 milhões
    },
    AREA: {
      MIN: 0,
      MAX: 50000 // 50 mil m²
    }
  }
} as const;

// ===== STORAGE =====
export const STORAGE_CONFIG = {
  KEYS: {
    USER_PREFERENCES: 'buscador-preferences',
    FAVORITES: 'buscador-favorites',
    RECENT_SEARCHES: 'buscador-recent-searches',
    CACHE_PREFIX: 'buscador-cache-'
  },
  
  // TTL para cache (em ms)
  CACHE_TTL: {
    MUNICIPALITIES: 24 * 60 * 60 * 1000, // 24 horas
    AUCTION_DATA: 5 * 60 * 1000, // 5 minutos
    USER_PREFERENCES: 30 * 24 * 60 * 60 * 1000 // 30 dias
  }
} as const;

// ===== PERFORMANCE =====
export const PERFORMANCE_CONFIG = {
  // Debounce timings
  DEBOUNCE: {
    SEARCH: 300,
    FILTER: 500,
    RESIZE: 100,
    SCROLL: 50
  },
  
  // Throttle timings
  THROTTLE: {
    SCROLL: 16, // ~60fps
    RESIZE: 100
  },
  
  // Limites
  LIMITS: {
    MAX_SEARCH_RESULTS: 1000,
    MAX_FAVORITES: 500,
    MAX_RECENT_SEARCHES: 10
  }
} as const;

// ===== URLS E ENDPOINTS =====
export const URL_CONFIG = {
  // APIs externas
  EXTERNAL_APIS: {
    IBGE_ESTADOS: 'https://servicodados.ibge.gov.br/api/v1/localidades/estados',
    IBGE_MUNICIPIOS: (uf: string) => `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`,
    PEXELS_BASE: 'https://images.pexels.com/photos'
  },
  
  // Rotas da aplicação
  ROUTES: {
    HOME: '/',
    VEHICLES: '/buscador/veiculos',
    PROPERTIES: '/buscador/imoveis',
    FAVORITES: '/favoritos',
    AUCTIONEERS: '/leiloeiros',
    USER: '/usuario',
    ADMIN: '/admin'
  }
} as const;

// ===== EXPORT TYPES =====
export type PaginationConfig = typeof PAGINATION_CONFIG;
export type FilterConfig = typeof FILTER_CONFIG;
export type DateConfig = typeof DATE_CONFIG;
export type UIConfig = typeof UI_CONFIG;
export type ColorConfig = typeof COLOR_CONFIG;
export type LabelConfig = typeof LABEL_CONFIG;
export type ValidationConfig = typeof VALIDATION_CONFIG;
export type StorageConfig = typeof STORAGE_CONFIG;
export type PerformanceConfig = typeof PERFORMANCE_CONFIG;
export type URLConfig = typeof URL_CONFIG;