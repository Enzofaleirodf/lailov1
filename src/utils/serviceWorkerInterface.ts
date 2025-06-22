// 🚀 SERVICE WORKER INTERFACE
// Interface para comunicação avançada com o Service Worker

interface ServiceWorkerMessage {
  type: string;
  data?: any;
}

interface CacheMetrics {
  version: string;
  caches: string[];
  metrics: {
    hits: number;
    misses: number;
    lastReset: number;
  };
  timestamp: number;
}

class ServiceWorkerInterface {
  private registration: ServiceWorkerRegistration | null = null;
  private isSupported = 'serviceWorker' in navigator;
  private messageChannel: MessageChannel | null = null;

  constructor() {
    if (this.isSupported) {
      this.initialize();
    }
  }

  private async initialize() {
    try {
      this.registration = await navigator.serviceWorker.ready;
      this.setupMessageChannel();
      console.log('🚀 Service Worker interface initialized');
    } catch (error) {
      console.error('Failed to initialize Service Worker interface:', error);
    }
  }

  private setupMessageChannel() {
    this.messageChannel = new MessageChannel();
    
    // Escutar respostas do Service Worker
    this.messageChannel.port1.onmessage = (event) => {
      this.handleServiceWorkerMessage(event.data);
    };
  }

  private handleServiceWorkerMessage(message: ServiceWorkerMessage) {
    switch (message.type) {
      case 'CACHE_METRICS':
        console.log('📊 Cache Metrics:', message.data);
        break;
      case 'CACHE_UPDATED':
        console.log('🔄 Cache updated:', message.data);
        break;
      case 'ERROR':
        console.error('❌ Service Worker error:', message.data);
        break;
    }
  }

  // 🚀 CACHE URL: Cachear URL específica com estratégia
  async cacheUrl(url: string, strategy: string = 'app-pages'): Promise<void> {
    if (!this.isSupported || !this.registration) {
      console.warn('Service Worker not available');
      return;
    }

    try {
      await this.sendMessage({
        type: 'CACHE_STRATEGY',
        url,
        strategy
      });
      
      console.log(`🎯 Requested cache for ${url} with strategy ${strategy}`);
    } catch (error) {
      console.error('Failed to cache URL:', error);
    }
  }

  // 🔥 WARMUP CACHE: Preaquecimento de cache
  async warmupCache(urls?: string[]): Promise<void> {
    if (!this.isSupported || !this.registration) {
      console.warn('Service Worker not available');
      return;
    }

    try {
      await this.sendMessage({
        type: 'WARMUP_CACHE',
        urls
      });
      
      console.log('🔥 Cache warmup requested');
    } catch (error) {
      console.error('Failed to warmup cache:', error);
    }
  }

  // 📊 GET METRICS: Obter métricas de cache
  async getCacheMetrics(): Promise<CacheMetrics | null> {
    if (!this.isSupported || !this.registration || !this.messageChannel) {
      console.warn('Service Worker not available');
      return null;
    }

    try {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout waiting for cache metrics'));
        }, 5000);

        // Configurar listener temporário para a resposta
        const originalHandler = this.messageChannel!.port1.onmessage;
        this.messageChannel!.port1.onmessage = (event) => {
          if (event.data.type === 'CACHE_METRICS') {
            clearTimeout(timeout);
            this.messageChannel!.port1.onmessage = originalHandler;
            resolve(event.data.metrics);
          }
        };

        // Enviar solicitação
        this.sendMessage({
          type: 'GET_CACHE_METRICS'
        });
      });
    } catch (error) {
      console.error('Failed to get cache metrics:', error);
      return null;
    }
  }

  // 🔄 UPDATE SERVICE WORKER: Forçar atualização
  async updateServiceWorker(): Promise<void> {
    if (!this.isSupported || !this.registration) {
      console.warn('Service Worker not available');
      return;
    }

    try {
      await this.registration.update();
      console.log('🔄 Service Worker update requested');
    } catch (error) {
      console.error('Failed to update Service Worker:', error);
    }
  }

  // ⏭️ SKIP WAITING: Ativar novo Service Worker imediatamente
  async skipWaiting(): Promise<void> {
    if (!this.isSupported || !this.registration) {
      console.warn('Service Worker not available');
      return;
    }

    try {
      await this.sendMessage({
        type: 'SKIP_WAITING'
      });
      
      console.log('⏭️ Skip waiting requested');
    } catch (error) {
      console.error('Failed to skip waiting:', error);
    }
  }

  // 📱 REGISTER BACKGROUND SYNC: Registrar sincronização em background
  async registerBackgroundSync(tag: string): Promise<void> {
    if (!this.isSupported || !this.registration) {
      console.warn('Service Worker not available');
      return;
    }

    try {
      if ('sync' in this.registration) {
        await this.registration.sync.register(tag);
        console.log(`🔄 Background sync registered: ${tag}`);
      } else {
        console.warn('Background sync not supported');
      }
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  }

  // 💬 SEND MESSAGE: Enviar mensagem para Service Worker
  private async sendMessage(message: any): Promise<void> {
    if (!this.registration?.active) {
      throw new Error('No active Service Worker');
    }

    if (this.messageChannel) {
      this.registration.active.postMessage(message, [this.messageChannel.port2]);
    } else {
      this.registration.active.postMessage(message);
    }
  }

  // 📊 GET STATUS: Obter status do Service Worker
  getStatus() {
    if (!this.isSupported) {
      return { supported: false, status: 'not-supported' };
    }

    if (!this.registration) {
      return { supported: true, status: 'not-registered' };
    }

    const sw = this.registration.active || this.registration.waiting || this.registration.installing;
    
    return {
      supported: true,
      status: sw?.state || 'unknown',
      scope: this.registration.scope,
      updateViaCache: this.registration.updateViaCache
    };
  }

  // 🧹 CLEANUP: Limpar recursos
  cleanup() {
    if (this.messageChannel) {
      this.messageChannel.port1.close();
      this.messageChannel.port2.close();
      this.messageChannel = null;
    }
  }
}

// 🚀 SINGLETON: Instância global
export const serviceWorkerInterface = new ServiceWorkerInterface();

// 🎯 UTILITIES: Funções auxiliares
export const cacheUrl = (url: string, strategy?: string) => 
  serviceWorkerInterface.cacheUrl(url, strategy);

export const warmupCache = (urls?: string[]) => 
  serviceWorkerInterface.warmupCache(urls);

export const getCacheMetrics = () => 
  serviceWorkerInterface.getCacheMetrics();

export const updateServiceWorker = () => 
  serviceWorkerInterface.updateServiceWorker();

export const skipWaiting = () => 
  serviceWorkerInterface.skipWaiting();

export const registerBackgroundSync = (tag: string) => 
  serviceWorkerInterface.registerBackgroundSync(tag);

export const getServiceWorkerStatus = () => 
  serviceWorkerInterface.getStatus();

// 🚀 CACHE STRATEGIES: Estratégias pré-definidas
export const CACHE_STRATEGIES = {
  CRITICAL: 'critical-assets',
  CHUNKS: 'js-chunks',
  API: 'auction-api',
  STATIC: 'static-data',
  IMAGES: 'images',
  PAGES: 'app-pages'
} as const;

// 🎯 PRELOAD HELPERS: Helpers para preload específico
export const preloadCriticalPages = () => {
  const criticalPages = [
    '/buscador/imoveis/todos',
    '/buscador/veiculos/todos'
  ];
  
  return warmupCache(criticalPages);
};

export const preloadUserPages = () => {
  const userPages = [
    '/favoritos',
    '/usuario'
  ];
  
  return warmupCache(userPages);
};
