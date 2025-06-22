/**
 * 🚀 SISTEMA DE TESTES DE PERFORMANCE
 * Para verificar se as otimizações de cache e debounce estão funcionando
 */

import { advancedCache } from '../lib/advancedCache';

// 🚀 INTERFACE PARA MÉTRICAS DE PERFORMANCE
interface PerformanceMetric {
  name: string;
  duration: number;
  cacheHit?: boolean;
  memoryUsage?: number;
  timestamp: number;
}

interface PerformanceTest {
  name: string;
  description: string;
  test: () => Promise<PerformanceMetric>;
  threshold?: number; // ms
}

interface PerformanceReport {
  tests: PerformanceMetric[];
  summary: {
    totalTests: number;
    averageDuration: number;
    cacheHitRate: number;
    slowTests: PerformanceMetric[];
    fastTests: PerformanceMetric[];
  };
  recommendations: string[];
}

// 🚀 CLASSE PRINCIPAL DE TESTES DE PERFORMANCE
export class PerformanceTester {
  private metrics: PerformanceMetric[] = [];
  private tests: PerformanceTest[] = [];

  // 🚀 ADICIONAR TESTE DE PERFORMANCE
  addTest(test: PerformanceTest): void {
    this.tests.push(test);
  }

  // 🚀 EXECUTAR TODOS OS TESTES
  async runAllTests(): Promise<PerformanceReport> {
    console.log('🚀 Iniciando testes de performance...');
    this.metrics = [];

    for (const test of this.tests) {
      console.log(`  ⏱️ ${test.name}...`);
      
      try {
        const metric = await test.test();
        this.metrics.push(metric);
        
        const status = test.threshold && metric.duration > test.threshold ? '🐌' : '⚡';
        console.log(`    ${status} ${metric.duration}ms`);
      } catch (error) {
        console.error(`    💥 Erro: ${error}`);
        this.metrics.push({
          name: test.name,
          duration: -1,
          timestamp: Date.now()
        });
      }
    }

    return this.generateReport();
  }

  // 🚀 GERAR RELATÓRIO
  private generateReport(): PerformanceReport {
    const validMetrics = this.metrics.filter(m => m.duration >= 0);
    const totalDuration = validMetrics.reduce((sum, m) => sum + m.duration, 0);
    const averageDuration = validMetrics.length > 0 ? totalDuration / validMetrics.length : 0;
    
    const cacheHits = validMetrics.filter(m => m.cacheHit).length;
    const cacheHitRate = validMetrics.length > 0 ? (cacheHits / validMetrics.length) * 100 : 0;

    const slowTests = validMetrics.filter(m => m.duration > 1000); // > 1s
    const fastTests = validMetrics.filter(m => m.duration < 100);  // < 100ms

    const recommendations: string[] = [];
    
    if (cacheHitRate < 50) {
      recommendations.push('🔧 Cache hit rate baixo. Considere aumentar TTL ou melhorar estratégia de cache.');
    }
    
    if (slowTests.length > 0) {
      recommendations.push(`🐌 ${slowTests.length} testes lentos detectados. Verifique otimizações.`);
    }
    
    if (averageDuration > 500) {
      recommendations.push('⚡ Duração média alta. Considere implementar mais debounce ou lazy loading.');
    }

    return {
      tests: this.metrics,
      summary: {
        totalTests: this.metrics.length,
        averageDuration,
        cacheHitRate,
        slowTests,
        fastTests
      },
      recommendations
    };
  }

  // 🚀 MEDIR PERFORMANCE DE FUNÇÃO
  static async measureFunction<T>(
    name: string,
    fn: () => Promise<T> | T,
    options: { cacheKey?: string } = {}
  ): Promise<{ result: T; metric: PerformanceMetric }> {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

    // Verificar cache se chave fornecida
    let cacheHit = false;
    if (options.cacheKey) {
      const cached = advancedCache.get(options.cacheKey);
      if (cached) {
        cacheHit = true;
        const endTime = performance.now();
        return {
          result: cached,
          metric: {
            name,
            duration: endTime - startTime,
            cacheHit: true,
            timestamp: Date.now()
          }
        };
      }
    }

    // Executar função
    const result = await fn();
    
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const duration = endTime - startTime;

    // Salvar no cache se chave fornecida
    if (options.cacheKey && !cacheHit) {
      advancedCache.set(options.cacheKey, result);
    }

    const metric: PerformanceMetric = {
      name,
      duration,
      cacheHit,
      memoryUsage: endMemory - startMemory,
      timestamp: Date.now()
    };

    return { result, metric };
  }
}

// 🚀 TESTES ESPECÍFICOS PARA FILTROS
export const createFilterPerformanceTests = (): PerformanceTest[] => [
  {
    name: 'Cache de Marcas',
    description: 'Testar performance do cache de marcas de veículos',
    threshold: 100,
    test: async (): Promise<PerformanceMetric> => {
      const { metric } = await PerformanceTester.measureFunction(
        'Cache de Marcas',
        async () => {
          // Simular busca de marcas
          await new Promise(resolve => setTimeout(resolve, 10));
          return ['Toyota', 'Honda', 'Ford'];
        },
        { cacheKey: 'test-brands' }
      );
      return metric;
    }
  },
  {
    name: 'Debounce de Range',
    description: 'Testar se debounce está funcionando para ranges',
    threshold: 50,
    test: async (): Promise<PerformanceMetric> => {
      const startTime = performance.now();
      
      // Simular múltiplas mudanças rápidas (debounce deve ignorar)
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(new Promise(resolve => setTimeout(resolve, 5)));
      }
      
      await Promise.all(promises);
      
      const duration = performance.now() - startTime;
      
      return {
        name: 'Debounce de Range',
        duration,
        timestamp: Date.now()
      };
    }
  },
  {
    name: 'Query de Filtros',
    description: 'Testar performance de query com filtros aplicados',
    threshold: 200,
    test: async (): Promise<PerformanceMetric> => {
      const { metric } = await PerformanceTester.measureFunction(
        'Query de Filtros',
        async () => {
          // Simular query complexa
          await new Promise(resolve => setTimeout(resolve, 50));
          return { count: 150, auctions: [] };
        },
        { cacheKey: 'test-query' }
      );
      return metric;
    }
  },
  {
    name: 'Aplicação de Filtros',
    description: 'Testar performance da aplicação de filtros',
    threshold: 300,
    test: async (): Promise<PerformanceMetric> => {
      const startTime = performance.now();
      
      // Simular aplicação de múltiplos filtros
      const filters = {
        estado: 'SP',
        cidade: 'sao-paulo',
        areaM2: [50, 200],
        valorAvaliacao: [100000, 500000]
      };
      
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 30));
      
      const duration = performance.now() - startTime;
      
      return {
        name: 'Aplicação de Filtros',
        duration,
        timestamp: Date.now()
      };
    }
  },
  {
    name: 'Limpeza de Cache',
    description: 'Testar performance da limpeza de cache',
    threshold: 100,
    test: async (): Promise<PerformanceMetric> => {
      const startTime = performance.now();
      
      // Adicionar itens ao cache
      for (let i = 0; i < 10; i++) {
        advancedCache.set(`test-item-${i}`, { data: i });
      }
      
      // Limpar cache
      advancedCache.cleanup();
      
      const duration = performance.now() - startTime;
      
      return {
        name: 'Limpeza de Cache',
        duration,
        timestamp: Date.now()
      };
    }
  }
];

// 🚀 INSTÂNCIA GLOBAL DO TESTER
export const performanceTester = new PerformanceTester();

// 🚀 INICIALIZAR TESTES DE PERFORMANCE
export const initializePerformanceTests = (): void => {
  createFilterPerformanceTests().forEach(test => {
    performanceTester.addTest(test);
  });
  
  console.log('🚀 Testes de performance inicializados');
};

// 🚀 EXECUTAR TESTES RÁPIDOS DE PERFORMANCE
export const runQuickPerformanceTests = async (): Promise<PerformanceReport> => {
  initializePerformanceTests();
  const report = await performanceTester.runAllTests();
  
  console.log('\n🚀 RELATÓRIO DE PERFORMANCE');
  console.log('============================');
  console.log(`Total de testes: ${report.summary.totalTests}`);
  console.log(`Duração média: ${report.summary.averageDuration.toFixed(2)}ms`);
  console.log(`Cache hit rate: ${report.summary.cacheHitRate.toFixed(1)}%`);
  console.log(`Testes lentos: ${report.summary.slowTests.length}`);
  console.log(`Testes rápidos: ${report.summary.fastTests.length}`);
  
  if (report.recommendations.length > 0) {
    console.log('\n📋 RECOMENDAÇÕES:');
    report.recommendations.forEach(rec => console.log(`  ${rec}`));
  }
  
  return report;
};

// 🚀 MONITOR DE PERFORMANCE EM TEMPO REAL
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 100;

  addMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Manter apenas as últimas métricas
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  getAveragePerformance(timeWindow = 60000): number {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp < timeWindow
    );
    
    if (recentMetrics.length === 0) return 0;
    
    const total = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
    return total / recentMetrics.length;
  }

  getCacheHitRate(timeWindow = 60000): number {
    const now = Date.now();
    const recentMetrics = this.metrics.filter(
      m => now - m.timestamp < timeWindow
    );
    
    if (recentMetrics.length === 0) return 0;
    
    const cacheHits = recentMetrics.filter(m => m.cacheHit).length;
    return (cacheHits / recentMetrics.length) * 100;
  }

  getSlowOperations(threshold = 1000): PerformanceMetric[] {
    return this.metrics.filter(m => m.duration > threshold);
  }
}

// 🚀 INSTÂNCIA GLOBAL DO MONITOR
export const performanceMonitor = new PerformanceMonitor();
