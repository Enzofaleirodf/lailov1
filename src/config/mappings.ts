/**
 * Mapeamentos centralizados da aplicação
 * Consolida todos os mapeamentos em um local para facilitar manutenção
 */

// ===== TIPOS DE VEÍCULOS =====
export const VEHICLE_TYPES = [
  'todos',
  'carros',
  'motos',
  'caminhoes',
  'onibus',
  'maquinas',
  'apoio',
  'embarcacoes',
  'recreativos',
  'nao-informado'
] as const;

export const PROPERTY_TYPES = [
  'todos',
  'apartamentos',
  'casas',
  'comerciais',
  'compactos',
  'condominios',
  'galpoes',
  'garagem',
  'hospedagem',
  'industriais',
  'mistos',
  'predios',
  'rurais',
  'terrenos-e-lotes',
  'nao-informado'
] as const;

export type VehicleType = typeof VEHICLE_TYPES[number];
export type PropertyType = typeof PROPERTY_TYPES[number];

// ===== LABELS AMIGÁVEIS =====
export const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  'todos': 'Todos',
  'carros': 'Carros',
  'motos': 'Motos',
  'caminhoes': 'Caminhões',
  'onibus': 'Ônibus',
  'maquinas': 'Máquinas',
  'apoio': 'Apoio',
  'embarcacoes': 'Embarcações',
  'recreativos': 'Recreativos',
  'nao-informado': 'Não Informado'
};

export const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  'todos': 'Todos',
  'apartamentos': 'Apartamentos',
  'casas': 'Casas',
  'comerciais': 'Comerciais',
  'compactos': 'Compactos',
  'condominios': 'Condomínios',
  'galpoes': 'Galpões',
  'garagem': 'Garagem',
  'hospedagem': 'Hospedagem',
  'industriais': 'Industriais',
  'mistos': 'Mistos',
  'predios': 'Prédios',
  'rurais': 'Rurais',
  'terrenos-e-lotes': 'Terrenos e Lotes',
  'nao-informado': 'Não Informado'
};

// ===== MAPEAMENTOS PARA FILTROS =====
// ✅ CORREÇÃO: Usar APENAS os valores REAIS do banco de dados
// ✅ CORREÇÃO CRÍTICA: Mapeamento correto para vehicle_type
export const VEHICLE_TYPE_MAP: Record<string, string[]> = {
  'carros': ['Carros'],
  'motos': ['Motos'],
  'caminhoes': ['Caminhões'],
  'onibus': ['Ônibus'],
  'maquinas': ['Máquinas'],
  'apoio': ['Apoio'],
  'embarcacoes': ['Embarcações'],
  'recreativos': ['Recreativos']
  // ✅ CORREÇÃO: 'nao-informado' será tratado como caso especial, não mapeamento direto
};

// ✅ CORREÇÃO CRÍTICA: Mapeamento correto para property_category
export const PROPERTY_TYPE_MAP: Record<string, string[]> = {
  'apartamentos': ['Apartamentos'],
  'casas': ['Casas'],
  'comerciais': ['Comerciais'],
  'compactos': ['Compactos'],
  'condominios': ['Condomínios'],
  'galpoes': ['Galpões'],
  'garagem': ['Garagem'],
  'hospedagem': ['Hospedagem'],
  'industriais': ['Industriais'],
  'mistos': ['Mistos'],
  'predios': ['Prédios'],
  'rurais': ['Rurais'],
  'terrenos-e-lotes': ['Terrenos e Lotes']
  // ✅ CORREÇÃO: 'nao-informado' será tratado como caso especial, não mapeamento direto
};

// ===== MAPEAMENTOS DE FORMATO =====
// ✅ CORREÇÃO: Usar valores REAIS do banco de dados
export const FORMAT_MAP: Record<string, string[]> = {
  '': [], // ✅ NOVO: "Qualquer Tipo" = sem filtro (array vazio)
  'leilao': ['Leilão'], // ✅ Valor real: "Leilão" (16.337 registros)
  'venda-direta': ['Venda direta'], // ✅ Valor real: "Venda direta" (2.573 registros)
  'alienacao-particular': ['Alienação particular'] // ✅ Valor real: "Alienação particular" (140 registros)
};

// ===== MAPEAMENTOS DE ORIGEM =====
// ✅ CORREÇÃO: Usar valores REAIS do banco de dados
export const ORIGIN_MAP: Record<string, string> = {
  'judicial': 'Judicial', // ✅ Valor real: "Judicial" (10.227 registros)
  'extrajudicial': 'Extrajudicial', // ✅ Valor real: "Extrajudicial" (7.448 registros)
  'publico': 'Público', // ✅ Valor real: "Público" (328 registros)
  'nao-informado': '__NAO_INFORMADO__' // ✅ NOVO: Para valores null/empty/outros
};

// ===== MAPEAMENTOS DE ETAPA =====
// ✅ CORREÇÃO: Usar valores REAIS do banco de dados com capitalização correta
export const STAGE_MAP: Record<string, string> = {
  'praca-unica': 'Praça Única', // ✅ Valor real: "Praça Única" (6.284 registros) - capitalização corrigida
  'primeira': '1ª Praça', // ✅ Valor real: "1ª Praça" (7.444 registros)
  'segunda': '2ª Praça', // ✅ Valor real: "2ª Praça" (4.257 registros)
  'terceira': '3ª Praça', // ✅ Valor real: "3ª Praça" (216 registros)
  'nao-informado': '__NAO_INFORMADO__' // ✅ NOVO: Para valores null/empty/outros
};

// ===== MAPEAMENTOS DE ORDENAÇÃO =====
export const SORT_LABELS: Record<string, string> = {
  'newest': 'Mais recentes',
  'lowest-bid': 'Menor valor',
  'highest-bid': 'Maior valor',
  'highest-discount': 'Maior desconto %', // ✅ NOVO: Adicionar % no label
  'nearest': 'Mais próximos'
};

// ===== SLUGS ANTIGOS PARA REDIRECIONAMENTO =====
export const LEGACY_VEHICLE_SLUGS: Record<string, VehicleType> = {
  'reboques': 'apoio',
  'sucata': 'nao-informado'
};

export const LEGACY_PROPERTY_SLUGS: Record<string, PropertyType> = {
  'terrenos': 'terrenos-e-lotes'
};

// ===== FUNÇÕES DE VALIDAÇÃO =====
export function isValidVehicleType(type: string): type is VehicleType {
  // Aceitar slugs antigos para compatibilidade
  if (type in LEGACY_VEHICLE_SLUGS) return true;
  return VEHICLE_TYPES.includes(type as VehicleType);
}

export function isValidPropertyType(type: string): type is PropertyType {
  // Aceitar slugs antigos para compatibilidade
  if (type in LEGACY_PROPERTY_SLUGS) return true;
  return PROPERTY_TYPES.includes(type as PropertyType);
}

// ===== FUNÇÕES DE NORMALIZAÇÃO =====
export function normalizeVehicleType(type: string | null | undefined): VehicleType {
  if (!type || typeof type !== 'string') {
    return 'nao-informado';
  }
  
  const normalizedType = type.toLowerCase().trim();
  
  // Verificar slugs antigos primeiro
  if (normalizedType in LEGACY_VEHICLE_SLUGS) {
    return LEGACY_VEHICLE_SLUGS[normalizedType];
  }
  
  if (VEHICLE_TYPES.includes(normalizedType as VehicleType)) {
    return normalizedType as VehicleType;
  }
  
  return 'nao-informado';
}

export function normalizePropertyType(type: string | null | undefined): PropertyType {
  if (!type || typeof type !== 'string') {
    return 'nao-informado';
  }
  
  const normalizedType = type.toLowerCase().trim();
  
  // Verificar slugs antigos primeiro
  if (normalizedType in LEGACY_PROPERTY_SLUGS) {
    return LEGACY_PROPERTY_SLUGS[normalizedType];
  }
  
  if (PROPERTY_TYPES.includes(normalizedType as PropertyType)) {
    return normalizedType as PropertyType;
  }
  
  return 'nao-informado';
}

// ===== FUNÇÕES DE OBTENÇÃO DE LABELS =====
export function getVehicleTypeLabel(type: VehicleType): string {
  return VEHICLE_TYPE_LABELS[type];
}

export function getPropertyTypeLabel(type: PropertyType): string {
  return PROPERTY_TYPE_LABELS[type];
}

// ===== EXPORT CONSOLIDADO =====
export const MAPPINGS = {
  // Tipos
  VEHICLE_TYPES,
  PROPERTY_TYPES,
  
  // Labels
  VEHICLE_TYPE_LABELS,
  PROPERTY_TYPE_LABELS,
  SORT_LABELS,
  
  // Mapeamentos para filtros
  VEHICLE_TYPE_MAP,
  PROPERTY_TYPE_MAP,
  FORMAT_MAP,
  ORIGIN_MAP,
  STAGE_MAP,
  
  // Slugs antigos
  LEGACY_VEHICLE_SLUGS,
  LEGACY_PROPERTY_SLUGS,
  
  // Funções
  isValidVehicleType,
  isValidPropertyType,
  normalizeVehicleType,
  normalizePropertyType,
  getVehicleTypeLabel,
  getPropertyTypeLabel
} as const;