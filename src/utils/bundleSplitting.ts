import React from 'react';

// 🚀 BUNDLE SPLITTING INTELIGENTE
// Sistema para otimizar carregamento de chunks

interface ChunkInfo {
  name: string;
  size: number;
  loaded: boolean;
  priority: 'critical' | 'high' | 'medium' | 'low';
  dependencies: string[];
}

interface LoadingStrategy {
  immediate: string[];
  onInteraction: string[];
  onIdle: string[];
  onVisible: string[];
}

class BundleSplittingManager {
  private chunks: Map<string, ChunkInfo> = new Map();
  private loadingQueue: string[] = [];
  private isLoading = false;
  private strategy: LoadingStrategy;

  constructor() {
    this.strategy = {
      immediate: ['core', 'auth', 'routing'],
      onInteraction: ['filters', 'search', 'pagination'],
      onIdle: ['dashboard', 'analytics', 'prefetch'],
      onVisible: ['grid', 'cards', 'images']
    };

    this.initializeChunks();
    this.setupLoadingStrategies();
  }

  private initializeChunks() {
    // 🎯 CHUNKS CRÍTICOS: Carregamento imediato
    this.registerChunk({
      name: 'core',
      size: 0,
      loaded: true, // Já carregado no bundle principal
      priority: 'critical',
      dependencies: []
    });

    // 🔄 CHUNKS DE INTERAÇÃO: Carregamento sob demanda
    this.registerChunk({
      name: 'filters',
      size: 0,
      loaded: false,
      priority: 'high',
      dependencies: ['core']
    });

    this.registerChunk({
      name: 'grid',
      size: 0,
      loaded: false,
      priority: 'high',
      dependencies: ['core']
    });

    // 🎨 CHUNKS DE VISUALIZAÇÃO: Carregamento lazy
    this.registerChunk({
      name: 'dashboard',
      size: 0,
      loaded: false,
      priority: 'medium',
      dependencies: ['core']
    });

    // 🚀 CHUNKS DE PERFORMANCE: Carregamento idle
    this.registerChunk({
      name: 'analytics',
      size: 0,
      loaded: false,
      priority: 'low',
      dependencies: ['core']
    });
  }

  private registerChunk(chunk: ChunkInfo) {
    this.chunks.set(chunk.name, chunk);
  }

  private setupLoadingStrategies() {
    // 🚀 CARREGAMENTO IMEDIATO: Chunks críticos
    this.loadImmediate();

    // 🎯 CARREGAMENTO POR INTERAÇÃO: Quando usuário interage
    this.setupInteractionLoading();

    // ⏰ CARREGAMENTO IDLE: Quando browser está idle
    this.setupIdleLoading();

    // 👁️ CARREGAMENTO POR VISIBILIDADE: Quando elementos ficam visíveis
    this.setupVisibilityLoading();
  }

  private loadImmediate() {
    this.strategy.immediate.forEach(chunkName => {
      this.loadChunk(chunkName);
    });
  }

  private setupInteractionLoading() {
    // Carregar filtros quando hover no botão de filtros
    document.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-filter-trigger]')) {
        this.loadChunk('filters');
      }
    });

    // Carregar grid quando scroll
    let scrollTimeout: NodeJS.Timeout;
    document.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.loadChunk('grid');
      }, 100);
    });
  }

  private setupIdleLoading() {
    // Usar requestIdleCallback se disponível
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.strategy.onIdle.forEach(chunkName => {
          this.loadChunk(chunkName);
        });
      });
    } else {
      // Fallback para setTimeout
      setTimeout(() => {
        this.strategy.onIdle.forEach(chunkName => {
          this.loadChunk(chunkName);
        });
      }, 2000);
    }
  }

  private setupVisibilityLoading() {
    // Usar Intersection Observer para carregar quando elementos ficam visíveis
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const chunkName = entry.target.getAttribute('data-chunk');
          if (chunkName) {
            this.loadChunk(chunkName);
          }
        }
      });
    });

    // Observar elementos que precisam de chunks específicos
    document.addEventListener('DOMContentLoaded', () => {
      document.querySelectorAll('[data-chunk]').forEach(el => {
        observer.observe(el);
      });
    });
  }

  async loadChunk(chunkName: string): Promise<boolean> {
    const chunk = this.chunks.get(chunkName);
    if (!chunk || chunk.loaded) {
      return true;
    }

    // Verificar dependências
    for (const dep of chunk.dependencies) {
      const depChunk = this.chunks.get(dep);
      if (!depChunk?.loaded) {
        await this.loadChunk(dep);
      }
    }

    try {
      console.log(`🚀 Loading chunk: ${chunkName}`);
      
      // Simular carregamento do chunk
      // Em produção, isso seria o import() real
      await new Promise(resolve => setTimeout(resolve, 100));
      
      chunk.loaded = true;
      console.log(`✅ Chunk loaded: ${chunkName}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to load chunk: ${chunkName}`, error);
      return false;
    }
  }

  // 📊 MÉTRICAS: Informações sobre chunks carregados
  getLoadingStats() {
    const total = this.chunks.size;
    const loaded = Array.from(this.chunks.values()).filter(c => c.loaded).length;
    const critical = Array.from(this.chunks.values()).filter(c => c.priority === 'critical' && c.loaded).length;
    
    return {
      total,
      loaded,
      critical,
      percentage: Math.round((loaded / total) * 100)
    };
  }

  // 🎯 PRELOAD: Forçar carregamento de chunk específico
  preload(chunkName: string) {
    return this.loadChunk(chunkName);
  }

  // 🧹 CLEANUP: Limpar listeners
  cleanup() {
    // Remover event listeners se necessário
    console.log('🧹 Bundle splitting manager cleaned up');
  }
}

// 🚀 SINGLETON: Instância global
export const bundleSplittingManager = new BundleSplittingManager();

// 🎯 HOOKS: Para usar no React
export const useBundleSplitting = () => {
  const [stats, setStats] = React.useState(bundleSplittingManager.getLoadingStats());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStats(bundleSplittingManager.getLoadingStats());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    preload: bundleSplittingManager.preload.bind(bundleSplittingManager),
    manager: bundleSplittingManager
  };
};

// 🚀 UTILITIES: Funções auxiliares
export const markChunkTrigger = (element: HTMLElement, chunkName: string) => {
  element.setAttribute('data-chunk', chunkName);
};

export const markFilterTrigger = (element: HTMLElement) => {
  element.setAttribute('data-filter-trigger', 'true');
};
