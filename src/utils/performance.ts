/**
 * ✅ FASE 3: Sistema de métricas de performance
 * Monitora tempos de carregamento e cache hits
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  cacheHit?: boolean;
  category?: string;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();

  // Iniciar medição
  startTimer(name: string): void {
    this.timers.set(name, performance.now());
  }

  // Finalizar medição
  endTimer(name: string, options?: { cacheHit?: boolean; category?: string }): void {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer ${name} não foi iniciado`);
      return;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(name);

    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      ...options
    };

    this.metrics.push(metric);

    // Log para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const cacheStatus = options?.cacheHit ? '📦 CACHE' : '🌐 NETWORK';
      console.log(`⚡ ${name}: ${duration.toFixed(2)}ms ${cacheStatus}`);
    }

    // Manter apenas últimas 100 métricas
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }
  }

  // Obter estatísticas
  getStats(): {
    totalRequests: number;
    cacheHitRate: number;
    averageResponseTime: number;
    slowestRequests: PerformanceMetric[];
  } {
    const totalRequests = this.metrics.length;
    const cacheHits = this.metrics.filter(m => m.cacheHit).length;
    const cacheHitRate = totalRequests > 0 ? (cacheHits / totalRequests) * 100 : 0;
    
    const totalTime = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    const averageResponseTime = totalRequests > 0 ? totalTime / totalRequests : 0;
    
    const slowestRequests = [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5);

    return {
      totalRequests,
      cacheHitRate,
      averageResponseTime,
      slowestRequests
    };
  }

  // Limpar métricas
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  // Obter métricas por categoria
  getMetricsByCategory(category: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.category === category);
  }
}

// Instância global
export const performanceMonitor = new PerformanceMonitor();

// Helpers para uso fácil
export const startTimer = (name: string) => performanceMonitor.startTimer(name);
export const endTimer = (name: string, options?: { cacheHit?: boolean; category?: string }) => 
  performanceMonitor.endTimer(name, options);

// Hook para exibir métricas no console (desenvolvimento)
export const logPerformanceStats = () => {
  if (process.env.NODE_ENV === 'development') {
    const stats = performanceMonitor.getStats();
    console.group('📊 Performance Stats');
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Cache Hit Rate: ${stats.cacheHitRate.toFixed(1)}%`);
    console.log(`Average Response Time: ${stats.averageResponseTime.toFixed(2)}ms`);
    console.log('Slowest Requests:', stats.slowestRequests);
    console.groupEnd();
  }
};

// Auto-log stats a cada 30 segundos em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  setInterval(logPerformanceStats, 30000);
}
