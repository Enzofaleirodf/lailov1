/**
 * Utilitários para tratamento consistente de datas
 * Resolve problemas de timezone e formatos inconsistentes
 */

// ===== CONSTANTS =====
export const TIMEZONE_OFFSET_HOURS = -3; // UTC-3 (Brasília)
export const MILLISECONDS_IN_HOUR = 60 * 60 * 1000;
export const MILLISECONDS_IN_DAY = 24 * MILLISECONDS_IN_HOUR;

// ===== DATE PARSING =====

/**
 * Converte string de data para objeto Date de forma segura
 * Suporta múltiplos formatos e garante timezone correto
 */
export function parseDate(dateInput: string | Date | null | undefined): Date | null {
  if (!dateInput) {
    return null;
  }

  // Se já é um Date, validar e retornar
  if (dateInput instanceof Date) {
    return isValidDate(dateInput) ? dateInput : null;
  }

  // Se é string, tentar parsear
  if (typeof dateInput === 'string') {
    try {
      // Normalizar string removendo espaços extras
      const normalizedInput = dateInput.trim();
      
      if (!normalizedInput) {
        return null;
      }

      // Tentar parsear como ISO string primeiro
      const parsedDate = new Date(normalizedInput);
      
      if (isValidDate(parsedDate)) {
        return parsedDate;
      }

      // Se falhou, tentar outros formatos comuns
      return parseAlternativeFormats(normalizedInput);
    } catch (error) {
      console.warn('⚠️ Erro ao parsear data:', dateInput, error);
      return null;
    }
  }

  console.warn('⚠️ Formato de data não suportado:', typeof dateInput, dateInput);
  return null;
}

/**
 * Tenta parsear formatos alternativos de data
 */
function parseAlternativeFormats(dateString: string): Date | null {
  // Formatos comuns brasileiros
  const formats = [
    // DD/MM/YYYY HH:mm:ss
    /^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/,
    // DD/MM/YYYY
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    // YYYY-MM-DD HH:mm:ss
    /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
    // YYYY-MM-DD
    /^(\d{4})-(\d{2})-(\d{2})$/
  ];

  for (const format of formats) {
    const match = dateString.match(format);
    if (match) {
      try {
        let year: number, month: number, day: number;
        let hour = 0, minute = 0, second = 0;

        if (format.source.includes('DD/MM/YYYY')) {
          // Formato brasileiro DD/MM/YYYY
          day = parseInt(match[1], 10);
          month = parseInt(match[2], 10) - 1; // Month is 0-indexed
          year = parseInt(match[3], 10);
          
          if (match[4]) {
            hour = parseInt(match[4], 10);
            minute = parseInt(match[5], 10);
            second = parseInt(match[6], 10);
          }
        } else {
          // Formato ISO YYYY-MM-DD
          year = parseInt(match[1], 10);
          month = parseInt(match[2], 10) - 1; // Month is 0-indexed
          day = parseInt(match[3], 10);
          
          if (match[4]) {
            hour = parseInt(match[4], 10);
            minute = parseInt(match[5], 10);
            second = parseInt(match[6], 10);
          }
        }

        const date = new Date(year, month, day, hour, minute, second);
        
        if (isValidDate(date)) {
          return date;
        }
      } catch (error) {
        console.warn('⚠️ Erro ao parsear formato alternativo:', dateString, error);
      }
    }
  }

  return null;
}

/**
 * Verifica se um objeto Date é válido
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

// ===== DATE FORMATTING =====

/**
 * Formata data para exibição em português brasileiro
 */
export function formatDate(
  dateInput: string | Date | null | undefined,
  options: {
    includeTime?: boolean;
    includeSeconds?: boolean;
    relative?: boolean;
    format?: 'short' | 'medium' | 'long' | 'full';
  } = {}
): string {
  const date = parseDate(dateInput);
  
  if (!date) {
    return 'Data inválida';
  }

  const {
    includeTime = false,
    includeSeconds = false,
    relative = false,
    format = 'medium'
  } = options;

  try {
    // Se solicitado formato relativo, calcular
    if (relative) {
      return formatRelativeDate(date);
    }

    // Configurar opções do Intl.DateTimeFormat
    const formatOptions: Intl.DateTimeFormatOptions = {};

    // Configurar formato de data
    switch (format) {
      case 'short':
        formatOptions.day = '2-digit';
        formatOptions.month = '2-digit';
        formatOptions.year = 'numeric';
        break;
      case 'medium':
        formatOptions.day = '2-digit';
        formatOptions.month = 'short';
        formatOptions.year = 'numeric';
        break;
      case 'long':
        formatOptions.day = '2-digit';
        formatOptions.month = 'long';
        formatOptions.year = 'numeric';
        break;
      case 'full':
        formatOptions.weekday = 'long';
        formatOptions.day = '2-digit';
        formatOptions.month = 'long';
        formatOptions.year = 'numeric';
        break;
    }

    // Adicionar tempo se solicitado
    if (includeTime) {
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
      
      if (includeSeconds) {
        formatOptions.second = '2-digit';
      }
    }

    // Configurar timezone para Brasília
    formatOptions.timeZone = 'America/Sao_Paulo';

    return new Intl.DateTimeFormat('pt-BR', formatOptions).format(date);
  } catch (error) {
    console.warn('⚠️ Erro ao formatar data:', date, error);
    return 'Erro na formatação';
  }
}

/**
 * Formata data de forma relativa (ex: "há 2 horas", "em 3 dias")
 */
export function formatRelativeDate(dateInput: string | Date | null | undefined): string {
  const date = parseDate(dateInput);
  
  if (!date) {
    return 'Data inválida';
  }

  try {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMs / (1000 * 60 * 60));
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // Usar Intl.RelativeTimeFormat quando disponível
    if (typeof Intl !== 'undefined' && Intl.RelativeTimeFormat) {
      const rtf = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

      if (Math.abs(diffMinutes) < 60) {
        return rtf.format(diffMinutes, 'minute');
      } else if (Math.abs(diffHours) < 24) {
        return rtf.format(diffHours, 'hour');
      } else if (Math.abs(diffDays) < 30) {
        return rtf.format(diffDays, 'day');
      } else {
        // Para períodos maiores, usar formato absoluto
        return formatDate(date, { format: 'medium' });
      }
    }

    // Fallback manual se Intl.RelativeTimeFormat não estiver disponível
    if (Math.abs(diffMinutes) < 1) {
      return 'agora';
    } else if (Math.abs(diffMinutes) < 60) {
      return diffMinutes > 0 ? `em ${diffMinutes} min` : `há ${Math.abs(diffMinutes)} min`;
    } else if (Math.abs(diffHours) < 24) {
      return diffHours > 0 ? `em ${diffHours}h` : `há ${Math.abs(diffHours)}h`;
    } else if (Math.abs(diffDays) < 30) {
      return diffDays > 0 ? `em ${diffDays} dias` : `há ${Math.abs(diffDays)} dias`;
    } else {
      return formatDate(date, { format: 'medium' });
    }
  } catch (error) {
    console.warn('⚠️ Erro ao formatar data relativa:', date, error);
    return formatDate(date, { format: 'medium' });
  }
}

// ===== TIME REMAINING =====

/**
 * Calcula e formata tempo restante até uma data
 */
export function formatTimeRemaining(endDateInput: string | Date | null | undefined): string {
  const endDate = parseDate(endDateInput);
  
  if (!endDate) {
    return '0h';
  }

  try {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    // Se já passou, retornar "Encerrado"
    if (diff <= 0) {
      return 'Encerrado';
    }

    const days = Math.floor(diff / MILLISECONDS_IN_DAY);
    const hours = Math.floor((diff % MILLISECONDS_IN_DAY) / MILLISECONDS_IN_HOUR);
    const minutes = Math.floor((diff % MILLISECONDS_IN_HOUR) / (60 * 1000));

    // Formatação baseada no tempo restante
    if (days > 0) {
      if (days === 1) {
        return hours > 0 ? `1d ${hours}h` : '1 dia';
      }
      return hours > 0 ? `${days}d ${hours}h` : `${days} dias`;
    } else if (hours > 0) {
      if (hours === 1) {
        return minutes > 0 ? `1h ${minutes}min` : '1 hora';
      }
      return minutes > 0 ? `${hours}h ${minutes}min` : `${hours}h`;
    } else if (minutes > 0) {
      return `${minutes}min`;
    } else {
      return 'Menos de 1min';
    }
  } catch (error) {
    console.warn('⚠️ Erro ao calcular tempo restante:', endDate, error);
    return '0h';
  }
}

// ===== DATE COMPARISONS =====

/**
 * Verifica se uma data está no passado
 */
export function isPastDate(dateInput: string | Date | null | undefined): boolean {
  const date = parseDate(dateInput);
  
  if (!date) {
    return true; // Considerar datas inválidas como passadas
  }

  const now = new Date();
  return date.getTime() < now.getTime();
}

/**
 * Verifica se uma data está no futuro
 */
export function isFutureDate(dateInput: string | Date | null | undefined): boolean {
  const date = parseDate(dateInput);
  
  if (!date) {
    return false; // Considerar datas inválidas como não futuras
  }

  const now = new Date();
  return date.getTime() > now.getTime();
}

/**
 * Verifica se uma data está dentro das últimas N horas
 */
export function isWithinLastHours(
  dateInput: string | Date | null | undefined,
  hours: number
): boolean {
  const date = parseDate(dateInput);
  
  if (!date) {
    return false;
  }

  const now = new Date();
  const hoursAgo = new Date(now.getTime() - (hours * MILLISECONDS_IN_HOUR));
  
  return date.getTime() >= hoursAgo.getTime() && date.getTime() <= now.getTime();
}

/**
 * Verifica se uma data foi nas últimas 24 horas
 */
export function isWithinLast24Hours(dateInput: string | Date | null | undefined): boolean {
  return isWithinLastHours(dateInput, 24);
}

// ===== TIMEZONE UTILITIES =====

/**
 * Converte data para timezone de Brasília
 */
export function toBrasiliaTime(dateInput: string | Date | null | undefined): Date | null {
  const date = parseDate(dateInput);
  
  if (!date) {
    return null;
  }

  try {
    // Criar nova data ajustada para timezone de Brasília
    const brasiliaOffset = TIMEZONE_OFFSET_HOURS * MILLISECONDS_IN_HOUR;
    const utcTime = date.getTime() + (date.getTimezoneOffset() * 60 * 1000);
    const brasiliaTime = new Date(utcTime + brasiliaOffset);
    
    return brasiliaTime;
  } catch (error) {
    console.warn('⚠️ Erro ao converter para horário de Brasília:', date, error);
    return date; // Retornar data original em caso de erro
  }
}

/**
 * Obtém data atual no timezone de Brasília
 */
export function getNowInBrasilia(): Date {
  return toBrasiliaTime(new Date()) || new Date();
}

// ===== VALIDATION =====

/**
 * Valida se uma string de data está em formato válido
 */
export function isValidDateString(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  const parsed = parseDate(dateString);
  return parsed !== null;
}

/**
 * Valida se uma data está dentro de um range aceitável
 */
export function isDateInValidRange(
  dateInput: string | Date | null | undefined,
  minDate?: Date,
  maxDate?: Date
): boolean {
  const date = parseDate(dateInput);
  
  if (!date) {
    return false;
  }

  if (minDate && date.getTime() < minDate.getTime()) {
    return false;
  }

  if (maxDate && date.getTime() > maxDate.getTime()) {
    return false;
  }

  return true;
}

// ===== EXPORT UTILITIES =====

/**
 * Utilitário principal para uso em componentes
 */
export const DateUtils = {
  parse: parseDate,
  format: formatDate,
  formatRelative: formatRelativeDate,
  formatTimeRemaining,
  isValid: isValidDate,
  isPast: isPastDate,
  isFuture: isFutureDate,
  isWithinLast24Hours,
  isWithinLastHours,
  toBrasilia: toBrasiliaTime,
  getNow: getNowInBrasilia,
  isValidString: isValidDateString,
  isInRange: isDateInValidRange
} as const;

// ===== TYPE EXPORTS =====
export type DateInput = string | Date | null | undefined;
export type DateFormatOptions = {
  includeTime?: boolean;
  includeSeconds?: boolean;
  relative?: boolean;
  format?: 'short' | 'medium' | 'long' | 'full';
};