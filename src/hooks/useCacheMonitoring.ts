import { useState, useEffect, useCallback } from 'react';
import { getCacheMetrics, getServiceWorkerStatus } from '../utils/serviceWorkerInterface';
import { advancedCacheManager } from '../utils/cacheStrategies';

interface CacheStatus {
  isOnline: boolean;
  serviceWorkerStatus: string;
  cacheMetrics: any;
  lastUpdate: number;
  errors: string[];
}

interface CacheActions {
  refreshMetrics: () => Promise<void>;
  clearCache: (cacheName?: string) => Promise<void>;
  warmupCache: () => Promise<void>;
  exportMetrics: () => string;
}

// 🚀 HOOK PARA MONITORAMENTO DE CACHE
export const useCacheMonitoring = () => {
  const [status, setStatus] = useState<CacheStatus>({
    isOnline: navigator.onLine,
    serviceWorkerStatus: 'unknown',
    cacheMetrics: null,
    lastUpdate: 0,
    errors: []
  });

  const [isLoading, setIsLoading] = useState(false);

  // 🔄 REFRESH METRICS: Atualizar métricas
  const refreshMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      const [swMetrics, swStatus, advancedMetrics] = await Promise.all([
        getCacheMetrics(),
        getServiceWorkerStatus(),
        advancedCacheManager.getCacheMetrics()
      ]);

      setStatus(prev => ({
        ...prev,
        cacheMetrics: {
          serviceWorker: swMetrics,
          advanced: advancedMetrics
        },
        serviceWorkerStatus: swStatus.status,
        lastUpdate: Date.now(),
        errors: []
      }));
    } catch (error) {
      console.error('Failed to refresh cache metrics:', error);
      setStatus(prev => ({
        ...prev,
        errors: [...prev.errors, error.message].slice(-5) // Manter apenas últimos 5 erros
      }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 🗑️ CLEAR CACHE: Limpar cache específico
  const clearCache = useCallback(async (cacheName?: string) => {
    try {
      if (cacheName) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();
        await Promise.all(keys.map(key => cache.delete(key)));
        console.log(`🗑️ Cleared cache: ${cacheName}`);
      } else {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🗑️ Cleared all caches');
      }
      
      await refreshMetrics();
    } catch (error) {
      console.error('Failed to clear cache:', error);
      setStatus(prev => ({
        ...prev,
        errors: [...prev.errors, `Clear cache failed: ${error.message}`].slice(-5)
      }));
    }
  }, [refreshMetrics]);

  // 🔥 WARMUP CACHE: Preaquecimento manual
  const warmupCache = useCallback(async () => {
    try {
      await advancedCacheManager.preloadCriticalResources();
      console.log('🔥 Cache warmup completed');
      await refreshMetrics();
    } catch (error) {
      console.error('Failed to warmup cache:', error);
      setStatus(prev => ({
        ...prev,
        errors: [...prev.errors, `Warmup failed: ${error.message}`].slice(-5)
      }));
    }
  }, [refreshMetrics]);

  // 📊 EXPORT METRICS: Exportar métricas como JSON
  const exportMetrics = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      status,
      navigator: {
        onLine: navigator.onLine,
        userAgent: navigator.userAgent,
        language: navigator.language
      },
      performance: {
        memory: (performance as any).memory ? {
          usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
          totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
          jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit
        } : null
      }
    };

    return JSON.stringify(exportData, null, 2);
  }, [status]);

  // 🎯 SETUP LISTENERS: Configurar listeners
  useEffect(() => {
    const handleOnline = () => {
      setStatus(prev => ({ ...prev, isOnline: true }));
      refreshMetrics(); // Atualizar métricas quando voltar online
    };

    const handleOffline = () => {
      setStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Atualização inicial
    refreshMetrics();

    // Atualização periódica (a cada 30 segundos)
    const interval = setInterval(refreshMetrics, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [refreshMetrics]);

  const actions: CacheActions = {
    refreshMetrics,
    clearCache,
    warmupCache,
    exportMetrics
  };

  return {
    status,
    isLoading,
    actions
  };
};

// 🎯 HOOK SIMPLIFICADO PARA STATUS BÁSICO
export const useCacheStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasCache, setHasCache] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar se há cache disponível
    caches.keys().then(cacheNames => {
      setHasCache(cacheNames.length > 0);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    hasCache,
    canUseApp: isOnline || hasCache
  };
};

// 🚀 HOOK PARA CACHE DE DADOS ESPECÍFICOS
export const useDataCache = (key: string, fetcher: () => Promise<any>, options = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCached, setIsCached] = useState(false);

  const {
    maxAge = 5 * 60 * 1000, // 5 minutos
    strategy = 'cache-first'
  } = options;

  const fetchData = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar cache primeiro (se não for refresh forçado)
      if (!forceRefresh && strategy === 'cache-first') {
        const cached = localStorage.getItem(`cache_${key}`);
        if (cached) {
          const { data: cachedData, timestamp } = JSON.parse(cached);
          const isExpired = Date.now() - timestamp > maxAge;
          
          if (!isExpired) {
            setData(cachedData);
            setIsCached(true);
            setIsLoading(false);
            return cachedData;
          }
        }
      }

      // Buscar dados frescos
      const freshData = await fetcher();
      
      // Salvar no cache
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data: freshData,
        timestamp: Date.now()
      }));

      setData(freshData);
      setIsCached(false);
      return freshData;
    } catch (err) {
      setError(err);
      
      // Tentar usar cache como fallback
      const cached = localStorage.getItem(`cache_${key}`);
      if (cached) {
        const { data: cachedData } = JSON.parse(cached);
        setData(cachedData);
        setIsCached(true);
        console.warn(`Using cached data for ${key} due to error:`, err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [key, fetcher, maxAge, strategy]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    isCached,
    refresh: () => fetchData(true),
    refetch: fetchData
  };
};
