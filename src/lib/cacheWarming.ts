import { QueryClient } from '@tanstack/react-query';
import { advancedCache } from './advancedCache';
import { QUERY_KEYS } from './queryClient';
import { processRealAuctions } from '../services/realAuctionService';

// 🚀 INTERFACE PARA CACHE WARMING
interface WarmingTask {
  key: string;
  priority: number;
  estimatedTime: number;
  queryFn: () => Promise<any>;
  cacheType: 'auctions' | 'filters' | 'ibge' | 'ranges';
}

interface WarmingConfig {
  enabled: boolean;
  maxConcurrent: number;
  delayBetweenTasks: number;
  onlyOnIdle: boolean;
}

// 🚀 CLASSE PARA CACHE WARMING
class CacheWarming {
  private queryClient: QueryClient;
  private config: WarmingConfig;
  private activeTasks = new Set<string>();
  private taskQueue: WarmingTask[] = [];
  private isWarming = false;

  constructor(queryClient: QueryClient, config: Partial<WarmingConfig> = {}) {
    this.queryClient = queryClient;
    this.config = {
      enabled: true,
      maxConcurrent: 2,
      delayBetweenTasks: 1000,
      onlyOnIdle: true,
      ...config
    };
  }

  // 🔥 ADICIONAR TAREFA DE WARMING
  addTask(task: WarmingTask): void {
    if (!this.config.enabled) return;

    // Verificar se já existe
    const exists = this.taskQueue.find(t => t.key === task.key);
    if (exists) {
      // Atualizar prioridade se for maior
      if (task.priority > exists.priority) {
        exists.priority = task.priority;
      }
      return;
    }

    this.taskQueue.push(task);
    
    // Ordenar por prioridade
    this.taskQueue.sort((a, b) => b.priority - a.priority);

    console.log(`🔥 Cache warming task added: ${task.key} (priority: ${task.priority})`);
  }

  // 🔥 EXECUTAR WARMING
  async startWarming(): Promise<void> {
    if (!this.config.enabled || this.isWarming) return;

    this.isWarming = true;
    console.log('🚀 Starting cache warming...');

    try {
      while (this.taskQueue.length > 0 && this.activeTasks.size < this.config.maxConcurrent) {
        const task = this.taskQueue.shift();
        if (!task) break;

        // Verificar se deve aguardar idle
        if (this.config.onlyOnIdle && !this.isIdle()) {
          this.taskQueue.unshift(task); // Voltar para a fila
          await this.waitForIdle();
          continue;
        }

        this.executeTask(task);
      }
    } finally {
      this.isWarming = false;
    }
  }

  // 🔥 EXECUTAR TAREFA INDIVIDUAL
  private async executeTask(task: WarmingTask): Promise<void> {
    this.activeTasks.add(task.key);

    try {
      console.log(`🔥 Warming cache: ${task.key}`);
      const startTime = performance.now();

      // Verificar se já está no cache
      const cached = advancedCache.get(task.key, task.cacheType);
      if (cached) {
        console.log(`📦 Cache already warm: ${task.key}`);
        return;
      }

      // Executar query
      const data = await task.queryFn();
      
      // Salvar no cache avançado
      advancedCache.set(task.key, data, task.cacheType);

      const duration = performance.now() - startTime;
      console.log(`✅ Cache warmed: ${task.key} (${duration.toFixed(2)}ms)`);

      // Delay entre tarefas
      if (this.config.delayBetweenTasks > 0) {
        await new Promise(resolve => setTimeout(resolve, this.config.delayBetweenTasks));
      }

    } catch (error) {
      console.warn(`❌ Cache warming failed: ${task.key}`, error);
    } finally {
      this.activeTasks.delete(task.key);
    }
  }

  // 🔥 VERIFICAR SE ESTÁ IDLE
  private isIdle(): boolean {
    // Verificar se há requests ativos no React Query
    const queries = this.queryClient.getQueryCache().getAll();
    const activeQueries = queries.filter(query => query.state.fetchStatus === 'fetching');
    
    return activeQueries.length === 0;
  }

  // 🔥 AGUARDAR IDLE
  private async waitForIdle(): Promise<void> {
    return new Promise(resolve => {
      const checkIdle = () => {
        if (this.isIdle()) {
          resolve();
        } else {
          setTimeout(checkIdle, 500);
        }
      };
      checkIdle();
    });
  }

  // 🔥 WARMING INTELIGENTE BASEADO EM CONTEXTO
  warmForContext(context: {
    currentCategory: 'veiculos' | 'imoveis';
    currentType: string;
    userBehavior?: any;
  }): void {
    const { currentCategory, currentType, userBehavior } = context;

    // 1. WARM CATEGORIA OPOSTA (alta prioridade)
    const oppositeCategory = currentCategory === 'veiculos' ? 'imoveis' : 'veiculos';
    this.addTask({
      key: `${oppositeCategory}-todos-default`,
      priority: 8,
      estimatedTime: 2000,
      queryFn: () => processRealAuctions(oppositeCategory, 'todos', {}, 'relevancia', '', 1, false),
      cacheType: 'auctions'
    });

    // 2. WARM TIPOS POPULARES DA CATEGORIA ATUAL
    const popularTypes = currentCategory === 'veiculos' 
      ? ['carros', 'motos', 'caminhoes']
      : ['apartamentos', 'casas', 'terrenos-e-lotes'];

    popularTypes.forEach((type, index) => {
      if (type !== currentType) {
        this.addTask({
          key: `${currentCategory}-${type}-default`,
          priority: 7 - index,
          estimatedTime: 1500,
          queryFn: () => processRealAuctions(currentCategory, type, {}, 'relevancia', '', 1, false),
          cacheType: 'auctions'
        });
      }
    });

    // 3. WARM PRÓXIMAS PÁGINAS
    for (let page = 2; page <= 3; page++) {
      this.addTask({
        key: `${currentCategory}-${currentType}-page-${page}`,
        priority: 5,
        estimatedTime: 1000,
        queryFn: () => processRealAuctions(currentCategory, currentType, {}, 'relevancia', '', page, false),
        cacheType: 'auctions'
      });
    }

    // 4. WARM BASEADO EM COMPORTAMENTO DO USUÁRIO
    if (userBehavior?.visitedRoutes) {
      const frequentRoutes = userBehavior.visitedRoutes
        .filter((route: string) => route.includes('/buscador/'))
        .slice(0, 3);

      frequentRoutes.forEach((route: string, index: number) => {
        const match = route.match(/\/buscador\/(veiculos|imoveis)\/(.+)/);
        if (match) {
          const [, category, type] = match;
          this.addTask({
            key: `${category}-${type}-behavior`,
            priority: 6 - index,
            estimatedTime: 1500,
            queryFn: () => processRealAuctions(category as any, type, {}, 'relevancia', '', 1, false),
            cacheType: 'auctions'
          });
        }
      });
    }

    // 5. WARM FILTROS ESSENCIAIS
    this.addTask({
      key: `filters-${currentCategory}`,
      priority: 4,
      estimatedTime: 500,
      queryFn: async () => {
        const { auctions } = await import('../lib/database');
        return Promise.all([
          auctions.getAvailableStates(currentCategory as any),
          auctions.getAvailableFormats(currentCategory as any),
          auctions.getAvailableOrigins(currentCategory as any),
          auctions.getAvailableStages(currentCategory as any)
        ]);
      },
      cacheType: 'filters'
    });

    // Iniciar warming
    this.startWarming();
  }

  // 🔥 WARMING PARA PRIMEIRA VISITA
  warmForFirstVisit(): void {
    // Dados essenciais para primeira visita
    const essentialTasks: WarmingTask[] = [
      {
        key: 'imoveis-todos-first-visit',
        priority: 10,
        estimatedTime: 2000,
        queryFn: () => processRealAuctions('imoveis', 'todos', {}, 'relevancia', '', 1, false),
        cacheType: 'auctions'
      },
      {
        key: 'veiculos-todos-first-visit',
        priority: 9,
        estimatedTime: 2000,
        queryFn: () => processRealAuctions('veiculos', 'todos', {}, 'relevancia', '', 1, false),
        cacheType: 'auctions'
      },
      {
        key: 'states-ibge',
        priority: 8,
        estimatedTime: 500,
        queryFn: async () => {
          const { getEstadosOptions } = await import('../hooks/useFiltersQuery');
          return getEstadosOptions();
        },
        cacheType: 'ibge'
      }
    ];

    essentialTasks.forEach(task => this.addTask(task));
    this.startWarming();
  }

  // 🔥 OBTER ESTATÍSTICAS
  getStats(): {
    queueLength: number;
    activeTasks: number;
    isWarming: boolean;
  } {
    return {
      queueLength: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      isWarming: this.isWarming
    };
  }

  // 🔥 LIMPAR FILA
  clearQueue(): void {
    this.taskQueue = [];
    console.log('🧹 Cache warming queue cleared');
  }
}

// 🚀 INSTÂNCIA GLOBAL DE CACHE WARMING
let cacheWarmingInstance: CacheWarming | null = null;

export const createCacheWarming = (queryClient: QueryClient): CacheWarming => {
  if (!cacheWarmingInstance) {
    cacheWarmingInstance = new CacheWarming(queryClient, {
      enabled: true,
      maxConcurrent: 2,
      delayBetweenTasks: 1500,
      onlyOnIdle: true
    });
  }
  return cacheWarmingInstance;
};

export const getCacheWarming = (): CacheWarming | null => {
  return cacheWarmingInstance;
};
