// 🚀 ASSET OPTIMIZATION SYSTEM
// Sistema para otimizar carregamento de assets críticos

interface AssetPreloadConfig {
  href: string;
  as: 'style' | 'script' | 'font' | 'image';
  type?: string;
  crossorigin?: 'anonymous' | 'use-credentials';
  priority?: 'high' | 'low';
}

interface AssetMetrics {
  loadTime: number;
  size: number;
  cached: boolean;
  critical: boolean;
}

class AssetOptimizationManager {
  private preloadedAssets: Set<string> = new Set();
  private assetMetrics: Map<string, AssetMetrics> = new Map();
  private criticalAssets: string[] = [];

  constructor() {
    this.initializeCriticalAssets();
    this.setupPerformanceObserver();
  }

  private initializeCriticalAssets() {
    // 🎯 ASSETS CRÍTICOS: Necessários para first paint
    this.criticalAssets = [
      // CSS crítico já está inline via Tailwind
      // Fonts serão carregadas via Google Fonts com display=swap
    ];
  }

  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              this.trackAssetMetrics(entry as PerformanceResourceTiming);
            }
          }
        });

        observer.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Performance Observer not supported:', error);
      }
    }
  }

  private trackAssetMetrics(entry: PerformanceResourceTiming) {
    const metrics: AssetMetrics = {
      loadTime: entry.responseEnd - entry.startTime,
      size: entry.transferSize || 0,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0,
      critical: this.criticalAssets.includes(entry.name)
    };

    this.assetMetrics.set(entry.name, metrics);

    // Log apenas assets críticos ou lentos
    if (metrics.critical || metrics.loadTime > 1000) {
      console.log(`📊 Asset: ${entry.name.split('/').pop()}`, {
        loadTime: `${metrics.loadTime.toFixed(0)}ms`,
        size: `${(metrics.size / 1024).toFixed(1)}KB`,
        cached: metrics.cached
      });
    }
  }

  // 🚀 PRELOAD: Precarregar asset específico
  preloadAsset(config: AssetPreloadConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.preloadedAssets.has(config.href)) {
        resolve();
        return;
      }

      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = config.href;
      link.as = config.as;
      
      if (config.type) link.type = config.type;
      if (config.crossorigin) link.crossOrigin = config.crossorigin;

      link.onload = () => {
        this.preloadedAssets.add(config.href);
        console.log(`✅ Preloaded: ${config.href.split('/').pop()}`);
        resolve();
      };

      link.onerror = () => {
        console.error(`❌ Failed to preload: ${config.href}`);
        reject(new Error(`Failed to preload ${config.href}`));
      };

      document.head.appendChild(link);
    });
  }

  // 🎯 PRELOAD CRÍTICO: Precarregar assets essenciais
  async preloadCriticalAssets(): Promise<void> {
    const criticalConfigs: AssetPreloadConfig[] = [
      // Preload de chunks JavaScript críticos será feito pelo Vite automaticamente
    ];

    try {
      await Promise.all(
        criticalConfigs.map(config => this.preloadAsset(config))
      );
      console.log('🚀 Critical assets preloaded');
    } catch (error) {
      console.warn('Some critical assets failed to preload:', error);
    }
  }

  // 🔄 PREFETCH: Precarregar assets para próximas páginas
  prefetchAsset(href: string): void {
    if (this.preloadedAssets.has(href)) return;

    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    
    link.onload = () => {
      this.preloadedAssets.add(href);
      console.log(`🔄 Prefetched: ${href.split('/').pop()}`);
    };

    document.head.appendChild(link);
  }

  // 📊 MÉTRICAS: Obter estatísticas de performance
  getAssetMetrics() {
    const metrics = Array.from(this.assetMetrics.values());
    
    return {
      totalAssets: metrics.length,
      criticalAssets: metrics.filter(m => m.critical).length,
      cachedAssets: metrics.filter(m => m.cached).length,
      averageLoadTime: metrics.reduce((sum, m) => sum + m.loadTime, 0) / metrics.length || 0,
      totalSize: metrics.reduce((sum, m) => sum + m.size, 0),
      slowAssets: metrics.filter(m => m.loadTime > 1000).length
    };
  }

  // 🧹 CLEANUP: Limpar recursos
  cleanup(): void {
    this.preloadedAssets.clear();
    this.assetMetrics.clear();
  }
}

// 🚀 SINGLETON: Instância global
export const assetOptimizationManager = new AssetOptimizationManager();

// 🎯 UTILITIES: Funções auxiliares

export const preloadCriticalAssets = () => {
  return assetOptimizationManager.preloadCriticalAssets();
};

export const prefetchRoute = (route: string) => {
  // Prefetch do chunk da rota
  const chunkName = route.replace(/[^a-zA-Z0-9]/g, '');
  assetOptimizationManager.prefetchAsset(`/assets/${chunkName}.js`);
};

export const getAssetMetrics = () => {
  return assetOptimizationManager.getAssetMetrics();
};

// 🚀 RESOURCE HINTS: Adicionar hints no HTML
export const addResourceHints = () => {
  // DNS prefetch para domínios externos
  const domains = [
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'images.unsplash.com',
    'images.pexels.com'
  ];

  domains.forEach(domain => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });

  console.log('🌐 DNS prefetch hints added');
};

// 🎯 CRITICAL CSS: Injetar CSS crítico inline (se necessário)
export const injectCriticalCSS = (css: string) => {
  const style = document.createElement('style');
  style.textContent = css;
  style.setAttribute('data-critical', 'true');
  document.head.insertBefore(style, document.head.firstChild);
};

// 📱 RESPONSIVE IMAGES: Otimizar carregamento de imagens (placeholder para quando implementarmos)
export const optimizeImageLoading = () => {
  // Será implementado quando trabalharmos com imagens
  console.log('🖼️ Image optimization ready for implementation');
};

// 🚀 INIT: Inicializar otimizações
export const initAssetOptimization = () => {
  // Executar na próxima tick para não bloquear renderização inicial
  setTimeout(() => {
    addResourceHints();
    preloadCriticalAssets();
  }, 0);
};
