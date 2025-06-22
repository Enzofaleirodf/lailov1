import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { compress, decompress } from 'lz-string';
import { performanceMonitor } from './performanceMonitor';

// 🚀 INTERFACE PARA CACHE AVANÇADO
interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  version: string;
  compressed?: boolean;
}

interface CacheConfig {
  ttl: number;
  compress: boolean;
  persist: boolean;
  version: string;
}

// 🚀 CONFIGURAÇÕES DE CACHE POR TIPO DE DADOS
const CACHE_CONFIGS: Record<string, CacheConfig> = {
  // Dados de leilões - cache médio com compressão
  auctions: {
    ttl: 5 * 60 * 1000, // 5 minutos
    compress: true,
    persist: true,
    version: '1.1' // ✅ INCREMENTAR VERSÃO PARA INVALIDAR CACHE ANTIGO
  },
  
  // Filtros - cache longo sem compressão (dados pequenos)
  filters: {
    ttl: 30 * 60 * 1000, // 30 minutos
    compress: false, // 🚀 SEM compressão para dados pequenos
    persist: true,
    version: '2.0' // ✅ CORREÇÃO CRÍTICA: Incrementar versão para invalidar cache corrompido
  },
  
  // Estados/cidades IBGE - cache muito longo
  ibge: {
    ttl: 24 * 60 * 60 * 1000, // 24 horas
    compress: true,
    persist: true,
    version: '1.0'
  },
  
  // Ranges dinâmicos - cache curto (dados muito pequenos)
  ranges: {
    ttl: 10 * 60 * 1000, // 10 minutos
    compress: false, // 🚀 NUNCA comprimir dados pequenos
    persist: false,
    version: '1.0'
  },
  
  // Comportamento do usuário - cache muito longo
  behavior: {
    ttl: 7 * 24 * 60 * 60 * 1000, // 7 dias
    compress: true,
    persist: true,
    version: '1.0'
  }
};

// 🚀 CLASSE PARA CACHE AVANÇADO
class AdvancedCache {
  private prefix = 'lailo-advanced-cache-';

  // 🔥 CACHE STATISTICS
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
    totalSize: 0
  };

  // 🚀 PERFORMANCE TRACKING
  private lastStatsUpdate = Date.now();
  
  // 🔥 SALVAR NO CACHE COM COMPRESSÃO E TTL
  set<T>(key: string, data: T, type: keyof typeof CACHE_CONFIGS = 'auctions'): void {
    try {
      const config = CACHE_CONFIGS[type];
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: config.ttl,
        version: config.version,
        compressed: config.compress
      };

      let serialized = JSON.stringify(entry);
      
      // Compressão se habilitada
      if (config.compress) {
        serialized = compress(serialized);
        entry.compressed = true;
      }

      const storageKey = `${this.prefix}${type}-${key}`;
      
      if (config.persist) {
        localStorage.setItem(storageKey, serialized);
      } else {
        sessionStorage.setItem(storageKey, serialized);
      }

      // 🚨 STATS DESABILITADOS PARA EVITAR LOOPS

      console.log(`💾 Cache set: ${storageKey} (${config.compress ? 'compressed' : 'raw'})`);
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  }

  // 🔥 RECUPERAR DO CACHE COM DESCOMPRESSÃO E VALIDAÇÃO TTL
  get<T>(key: string, type: keyof typeof CACHE_CONFIGS = 'auctions'): T | null {
    try {
      const config = CACHE_CONFIGS[type];
      const storageKey = `${this.prefix}${type}-${key}`;
      
      let serialized = config.persist
        ? localStorage.getItem(storageKey)
        : sessionStorage.getItem(storageKey);

      if (!serialized) {
        return null;
      }

      // Descompressão se necessário
      if (config.compress) {
        serialized = decompress(serialized);
        if (!serialized) return null;
      }

      const entry: CacheEntry<T> = JSON.parse(serialized);

      // Verificar versão
      if (entry.version !== config.version) {
        this.delete(key, type);
        return null;
      }

      // Verificar TTL
      const isExpired = Date.now() - entry.timestamp > entry.ttl;
      if (isExpired) {
        this.delete(key, type);
        return null;
      }

      // 🚨 STATS DESABILITADOS PARA EVITAR LOOPS

      console.log(`📦 Cache hit: ${storageKey}`);
      return entry.data;
    } catch (error) {
      console.warn('Cache get failed:', error);
      return null;
    }
  }

  // 🔥 DELETAR DO CACHE
  delete(key: string, type: keyof typeof CACHE_CONFIGS = 'auctions'): void {
    try {
      const config = CACHE_CONFIGS[type];
      const storageKey = `${this.prefix}${type}-${key}`;
      
      if (config.persist) {
        localStorage.removeItem(storageKey);
      } else {
        sessionStorage.removeItem(storageKey);
      }

      console.log(`🗑️ Cache deleted: ${storageKey}`);
    } catch (error) {
      console.warn('Cache delete failed:', error);
    }
  }

  // 🔥 LIMPAR CACHE EXPIRADO
  cleanup(): void {
    try {
      const storages = [localStorage, sessionStorage];
      
      storages.forEach(storage => {
        const keysToDelete: string[] = [];
        
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key?.startsWith(this.prefix)) {
            try {
              let serialized = storage.getItem(key);
              if (!serialized) continue;

              // Tentar descomprimir se necessário
              if (serialized.startsWith('N4Ig')) { // LZ-string prefix
                serialized = decompress(serialized);
                if (!serialized) continue;
              }

              const entry: CacheEntry = JSON.parse(serialized);
              const isExpired = Date.now() - entry.timestamp > entry.ttl;
              
              if (isExpired) {
                keysToDelete.push(key);
              }
            } catch (error) {
              // Se não conseguir parsear, deletar
              keysToDelete.push(key);
            }
          }
        }

        keysToDelete.forEach(key => storage.removeItem(key));
        
        if (keysToDelete.length > 0) {
          console.log(`🧹 Cache cleanup: ${keysToDelete.length} expired entries removed`);
        }
      });
    } catch (error) {
      console.warn('Cache cleanup failed:', error);
    }
  }

  // 🔥 OBTER ESTATÍSTICAS DO CACHE
  getStats(): { totalEntries: number; totalSize: number; byType: Record<string, number> } {
    const stats = {
      totalEntries: 0,
      totalSize: 0,
      byType: {} as Record<string, number>
    };

    try {
      const storages = [localStorage, sessionStorage];
      
      storages.forEach(storage => {
        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key?.startsWith(this.prefix)) {
            const value = storage.getItem(key);
            if (value) {
              stats.totalEntries++;
              stats.totalSize += value.length;
              
              // Extrair tipo da chave
              const typeMatch = key.match(new RegExp(`${this.prefix}(\\w+)-`));
              if (typeMatch) {
                const type = typeMatch[1];
                stats.byType[type] = (stats.byType[type] || 0) + 1;
              }
            }
          }
        }
      });
    } catch (error) {
      console.warn('Cache stats failed:', error);
    }

    return stats;
  }

  // 🔥 INVALIDAR CACHE POR PADRÃO
  invalidatePattern(pattern: string): void {
    try {
      const storages = [localStorage, sessionStorage];
      const regex = new RegExp(pattern);

      storages.forEach(storage => {
        const keysToDelete: string[] = [];

        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key?.startsWith(this.prefix) && regex.test(key)) {
            keysToDelete.push(key);
          }
        }

        keysToDelete.forEach(key => storage.removeItem(key));

        if (keysToDelete.length > 0) {
          console.log(`🔄 Cache invalidated: ${keysToDelete.length} entries matching "${pattern}"`);
        }
      });
    } catch (error) {
      console.warn('Cache invalidation failed:', error);
    }
  }

  // 🔥 INVALIDAR CACHE DE LEILÕES ESPECIFICAMENTE
  invalidateAuctions(): void {
    try {
      this.invalidatePattern('auctions-');
      console.log('🔄 Cache de leilões invalidado');
    } catch (error) {
      console.warn('Erro ao invalidar cache de leilões:', error);
    }
  }

  // 🔥 LIMPAR TODO O CACHE
  clearAll(): void {
    try {
      const storages = [localStorage, sessionStorage];

      storages.forEach(storage => {
        const keysToDelete: string[] = [];

        for (let i = 0; i < storage.length; i++) {
          const key = storage.key(i);
          if (key?.startsWith(this.prefix)) {
            keysToDelete.push(key);
          }
        }

        keysToDelete.forEach(key => storage.removeItem(key));

        if (keysToDelete.length > 0) {
          console.log(`🧹 Cache limpo: ${keysToDelete.length} entradas removidas`);
        }
      });
    } catch (error) {
      console.warn('Erro ao limpar cache:', error);
    }
  }

  // 🚀 UPDATE CACHE HIT RATE FOR PERFORMANCE MONITORING
  private updateCacheHitRate(): void {
    const now = Date.now();

    // Update stats every 10 seconds
    if (now - this.lastStatsUpdate > 10000) {
      const totalRequests = this.stats.hits + this.stats.misses;
      const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

      // Send to performance monitor
      if (typeof performanceMonitor !== 'undefined') {
        performanceMonitor.updateCacheHitRate(hitRate);
      }

      this.lastStatsUpdate = now;
    }
  }

  // 🚀 GET CACHE STATISTICS
  getCacheStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests) * 100 : 0;

    return {
      ...this.stats,
      hitRate,
      totalRequests
    };
  }
}

// 🚀 INSTÂNCIA GLOBAL DO CACHE AVANÇADO
export const advancedCache = new AdvancedCache();

// 🚀 CONFIGURAR PERSISTÊNCIA DO REACT QUERY
export const createPersistentQueryClient = (): QueryClient => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutos
        gcTime: 10 * 60 * 1000, // 10 minutos
        retry: (failureCount, error: any) => {
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 3;
        },
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        refetchOnMount: true,
        networkMode: 'online',
      },
      mutations: {
        retry: (failureCount, error: any) => {
          if (error?.status >= 400 && error?.status < 500) {
            return false;
          }
          return failureCount < 2;
        },
        networkMode: 'online',
      },
    },
  });

  // 🔥 CONFIGURAR PERSISTÊNCIA - SIMPLIFICADA PARA EVITAR PROBLEMAS
  try {
    const persister = createSyncStoragePersister({
      storage: localStorage,
      key: 'lailo-react-query-cache',
      serialize: (data) => {
        try {
          return compress(JSON.stringify(data));
        } catch (error) {
          console.warn('Erro na serialização do cache:', error);
          return JSON.stringify(data); // Fallback sem compressão
        }
      },
      deserialize: (data) => {
        try {
          const decompressed = decompress(data);
          return JSON.parse(decompressed || '{}');
        } catch (error) {
          console.warn('Erro na deserialização do cache:', error);
          try {
            return JSON.parse(data); // Fallback sem descompressão
          } catch (fallbackError) {
            console.warn('Erro no fallback de deserialização:', fallbackError);
            return {}; // Fallback final
          }
        }
      },
    });

    // 🔥 PERSISTIR QUERY CLIENT COM TRATAMENTO DE ERRO
    persistQueryClient({
      queryClient,
      persister,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      buster: '2.0-cache-fix', // ✅ CORREÇÃO CRÍTICA: Nova versão para invalidar cache corrompido
    });
  } catch (error) {
    console.warn('Erro ao configurar persistência do React Query:', error);
    // Continuar sem persistência se houver erro
  }

  return queryClient;
};

// 🚀 CLEANUP AUTOMÁTICO DO CACHE - DESABILITADO PARA EVITAR PROBLEMAS DE INICIALIZAÇÃO
if (typeof window !== 'undefined') {
  // 🔧 CORREÇÃO: Não fazer cleanup na inicialização para evitar problemas
  // advancedCache.cleanup(); // DESABILITADO

  // Cleanup periódico (a cada 30 minutos) - apenas após a aplicação estar carregada
  setTimeout(() => {
    setInterval(() => {
      try {
        advancedCache.cleanup();
      } catch (error) {
        console.warn('Erro no cleanup do cache:', error);
      }
    }, 30 * 60 * 1000);
  }, 10000); // Aguardar 10 segundos após inicialização

  // Cleanup antes de sair da página
  window.addEventListener('beforeunload', () => {
    try {
      advancedCache.cleanup();
    } catch (error) {
      console.warn('Erro no cleanup final:', error);
    }
  });
}
