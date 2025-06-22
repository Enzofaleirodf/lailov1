// 🚀 CACHE STRATEGIES AVANÇADAS
// Sistema inteligente de cache para diferentes tipos de conteúdo

interface CacheStrategy {
  name: string;
  maxAge: number;
  maxEntries: number;
  strategy: 'cache-first' | 'network-first' | 'stale-while-revalidate' | 'network-only';
  updateStrategy?: 'background' | 'immediate' | 'lazy';
}

interface CacheMetrics {
  hits: number;
  misses: number;
  updates: number;
  errors: number;
  lastCleanup: number;
  totalSize: number;
}

class AdvancedCacheManager {
  private strategies: Map<string, CacheStrategy> = new Map();
  private metrics: Map<string, CacheMetrics> = new Map();
  private updateQueue: Set<string> = new Set();
  private isOnline = navigator.onLine;

  constructor() {
    this.initializeStrategies();
    this.setupEventListeners();
    this.startBackgroundTasks();
  }

  private initializeStrategies() {
    // 🎯 ESTRATÉGIAS ESPECÍFICAS POR TIPO DE CONTEÚDO
    
    // Assets críticos - Cache agressivo
    this.strategies.set('critical-assets', {
      name: 'critical-assets',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 dias
      maxEntries: 50,
      strategy: 'cache-first',
      updateStrategy: 'background'
    });

    // Chunks JavaScript - Cache com revalidação
    this.strategies.set('js-chunks', {
      name: 'js-chunks',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      maxEntries: 100,
      strategy: 'stale-while-revalidate',
      updateStrategy: 'background'
    });

    // API de leilões - Network first com fallback
    this.strategies.set('auction-api', {
      name: 'auction-api',
      maxAge: 5 * 60 * 1000, // 5 minutos
      maxEntries: 200,
      strategy: 'network-first',
      updateStrategy: 'immediate'
    });

    // Dados estáticos (IBGE) - Cache longo
    this.strategies.set('static-data', {
      name: 'static-data',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      maxEntries: 100,
      strategy: 'cache-first',
      updateStrategy: 'lazy'
    });

    // Imagens - Cache com compressão
    this.strategies.set('images', {
      name: 'images',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      maxEntries: 500,
      strategy: 'cache-first',
      updateStrategy: 'lazy'
    });

    // Páginas da aplicação - Stale while revalidate
    this.strategies.set('app-pages', {
      name: 'app-pages',
      maxAge: 60 * 60 * 1000, // 1 hora
      maxEntries: 50,
      strategy: 'stale-while-revalidate',
      updateStrategy: 'background'
    });
  }

  private setupEventListeners() {
    // Monitorar status de conexão
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processUpdateQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Cleanup periódico
    setInterval(() => {
      this.performCleanup();
    }, 60 * 60 * 1000); // A cada hora
  }

  private startBackgroundTasks() {
    // Background sync para atualizações
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      this.setupBackgroundSync();
    }

    // Preaquecimento de cache
    setTimeout(() => {
      this.warmupCache();
    }, 2000); // Após 2 segundos do carregamento
  }

  // 🚀 CACHE WARMING: Preaquecimento inteligente
  private async warmupCache() {
    const criticalUrls = [
      '/buscador/imoveis/todos',
      '/buscador/veiculos/todos',
      '/api/ibge/estados',
      '/assets/index.css'
    ];

    console.log('🔥 Starting cache warmup...');

    for (const url of criticalUrls) {
      try {
        await this.cacheUrl(url, 'critical-assets');
      } catch (error) {
        console.warn(`Failed to warmup cache for ${url}:`, error);
      }
    }

    console.log('✅ Cache warmup completed');
  }

  // 🎯 CACHE URL: Cachear URL específica com estratégia
  async cacheUrl(url: string, strategyName: string): Promise<void> {
    const strategy = this.strategies.get(strategyName);
    if (!strategy) {
      throw new Error(`Strategy ${strategyName} not found`);
    }

    try {
      const response = await fetch(url);
      if (response.ok) {
        await this.storeInCache(url, response, strategy);
        this.updateMetrics(strategyName, 'cache');
      }
    } catch (error) {
      this.updateMetrics(strategyName, 'error');
      throw error;
    }
  }

  // 📦 STORE IN CACHE: Armazenar com metadados
  private async storeInCache(url: string, response: Response, strategy: CacheStrategy): Promise<void> {
    const cache = await caches.open(`lailo-${strategy.name}`);
    
    // Adicionar metadados
    const headers = new Headers(response.headers);
    headers.set('sw-cached-date', new Date().toISOString());
    headers.set('sw-strategy', strategy.name);
    headers.set('sw-max-age', strategy.maxAge.toString());

    const modifiedResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: headers
    });

    await cache.put(url, modifiedResponse);
  }

  // 🔄 BACKGROUND SYNC: Configurar sincronização
  private async setupBackgroundSync() {
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('cache-update');
      console.log('🔄 Background sync registered');
    } catch (error) {
      console.warn('Background sync not supported:', error);
    }
  }

  // 📊 UPDATE METRICS: Atualizar métricas
  private updateMetrics(strategyName: string, type: 'hit' | 'miss' | 'cache' | 'error') {
    let metrics = this.metrics.get(strategyName);
    if (!metrics) {
      metrics = {
        hits: 0,
        misses: 0,
        updates: 0,
        errors: 0,
        lastCleanup: Date.now(),
        totalSize: 0
      };
      this.metrics.set(strategyName, metrics);
    }

    switch (type) {
      case 'hit':
        metrics.hits++;
        break;
      case 'miss':
        metrics.misses++;
        break;
      case 'cache':
        metrics.updates++;
        break;
      case 'error':
        metrics.errors++;
        break;
    }
  }

  // 🧹 CLEANUP: Limpeza inteligente de cache
  private async performCleanup() {
    console.log('🧹 Starting cache cleanup...');

    for (const [strategyName, strategy] of this.strategies) {
      try {
        const cache = await caches.open(`lailo-${strategy.name}`);
        const keys = await cache.keys();

        // Remover entradas expiradas
        let removedCount = 0;
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const cachedDate = new Date(response.headers.get('sw-cached-date') || 0);
            const isExpired = Date.now() - cachedDate.getTime() > strategy.maxAge;

            if (isExpired) {
              await cache.delete(request);
              removedCount++;
            }
          }
        }

        // Remover entradas excedentes (LRU)
        const remainingKeys = await cache.keys();
        if (remainingKeys.length > strategy.maxEntries) {
          const excessCount = remainingKeys.length - strategy.maxEntries;
          for (let i = 0; i < excessCount; i++) {
            await cache.delete(remainingKeys[i]);
            removedCount++;
          }
        }

        if (removedCount > 0) {
          console.log(`🗑️ Cleaned ${removedCount} entries from ${strategyName} cache`);
        }
      } catch (error) {
        console.error(`Failed to cleanup ${strategyName} cache:`, error);
      }
    }
  }

  // 🔄 PROCESS UPDATE QUEUE: Processar fila de atualizações
  private async processUpdateQueue() {
    if (!this.isOnline || this.updateQueue.size === 0) return;

    console.log(`🔄 Processing ${this.updateQueue.size} queued updates...`);

    for (const url of this.updateQueue) {
      try {
        // Determinar estratégia baseada na URL
        const strategyName = this.getStrategyForUrl(url);
        await this.cacheUrl(url, strategyName);
        this.updateQueue.delete(url);
      } catch (error) {
        console.warn(`Failed to update cache for ${url}:`, error);
      }
    }
  }

  // 🎯 GET STRATEGY FOR URL: Determinar estratégia baseada na URL
  private getStrategyForUrl(url: string): string {
    if (url.includes('/assets/') && url.endsWith('.js')) return 'js-chunks';
    if (url.includes('/assets/')) return 'critical-assets';
    if (url.includes('supabase.co')) return 'auction-api';
    if (url.includes('ibge.gov.br')) return 'static-data';
    if (/\.(jpg|jpeg|png|webp)$/.test(url)) return 'images';
    return 'app-pages';
  }

  // 📊 GET METRICS: Obter métricas de cache
  getCacheMetrics() {
    const totalMetrics = {
      totalHits: 0,
      totalMisses: 0,
      totalUpdates: 0,
      totalErrors: 0,
      strategies: {} as Record<string, CacheMetrics>
    };

    for (const [name, metrics] of this.metrics) {
      totalMetrics.totalHits += metrics.hits;
      totalMetrics.totalMisses += metrics.misses;
      totalMetrics.totalUpdates += metrics.updates;
      totalMetrics.totalErrors += metrics.errors;
      totalMetrics.strategies[name] = { ...metrics };
    }

    return totalMetrics;
  }

  // 🚀 PRELOAD CRITICAL: Precarregar recursos críticos
  async preloadCriticalResources() {
    const criticalResources = [
      { url: '/assets/index.css', strategy: 'critical-assets' },
      { url: '/buscador/imoveis/todos', strategy: 'app-pages' }
    ];

    for (const resource of criticalResources) {
      try {
        await this.cacheUrl(resource.url, resource.strategy);
      } catch (error) {
        console.warn(`Failed to preload ${resource.url}:`, error);
      }
    }
  }

  // 🧹 CLEANUP: Limpar recursos
  cleanup() {
    this.updateQueue.clear();
    this.metrics.clear();
  }
}

// 🚀 SINGLETON: Instância global
export const advancedCacheManager = new AdvancedCacheManager();

// 🎯 UTILITIES: Funções auxiliares
export const getCacheMetrics = () => advancedCacheManager.getCacheMetrics();
export const preloadCriticalResources = () => advancedCacheManager.preloadCriticalResources();
export const cacheUrl = (url: string, strategy: string) => advancedCacheManager.cacheUrl(url, strategy);
