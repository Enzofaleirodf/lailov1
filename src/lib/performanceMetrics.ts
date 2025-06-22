// 🚀 PERFORMANCE METRICS - REAL USER MONITORING
interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
}

interface CoreWebVitals {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
}

class PerformanceMetrics {
  private metrics: PerformanceMetric[] = [];
  private coreWebVitals: CoreWebVitals = {};
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
    this.measureNavigationTiming();
  }

  // 🚀 CORE WEB VITALS: Observadores para métricas críticas
  private initializeObservers() {
    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.coreWebVitals.lcp = lastEntry.startTime;
          this.recordMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // FID - First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.coreWebVitals.fid = entry.processingStart - entry.startTime;
            this.recordMetric('FID', entry.processingStart - entry.startTime);
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // CLS - Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          this.coreWebVitals.cls = clsValue;
          this.recordMetric('CLS', clsValue);
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }
    }
  }

  // 🚀 NAVIGATION TIMING: Métricas de carregamento
  private measureNavigationTiming() {
    if ('performance' in window && 'getEntriesByType' in performance) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          
          if (navigation) {
            // Time to First Byte
            const ttfb = navigation.responseStart - navigation.requestStart;
            this.coreWebVitals.ttfb = ttfb;
            this.recordMetric('TTFB', ttfb);

            // First Contentful Paint
            const paintEntries = performance.getEntriesByType('paint');
            const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
            if (fcp) {
              this.coreWebVitals.fcp = fcp.startTime;
              this.recordMetric('FCP', fcp.startTime);
            }

            // DOM Content Loaded
            const dcl = navigation.domContentLoadedEventEnd - navigation.navigationStart;
            this.recordMetric('DCL', dcl);

            // Load Complete
            const loadComplete = navigation.loadEventEnd - navigation.navigationStart;
            this.recordMetric('Load', loadComplete);
          }
        }, 0);
      });
    }
  }

  // 🚀 RECORD METRIC: Registrar métrica
  private recordMetric(name: string, value: number) {
    const metric: PerformanceMetric = {
      name,
      value: Math.round(value),
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent
    };

    this.metrics.push(metric);
    
    // Log apenas em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${name}:`, `${metric.value}ms`);
    }

    // Enviar para analytics (apenas métricas críticas)
    if (['LCP', 'FID', 'CLS'].includes(name)) {
      this.sendToAnalytics(metric);
    }
  }

  // 🚀 ANALYTICS: Enviar métricas para monitoramento
  private async sendToAnalytics(metric: PerformanceMetric) {
    try {
      // Em produção, enviar para serviço de analytics
      if (process.env.NODE_ENV === 'production') {
        // Implementar envio para Google Analytics, Sentry, etc.
        // gtag('event', 'web_vitals', {
        //   metric_name: metric.name,
        //   metric_value: metric.value,
        //   custom_parameter: metric.url
        // });
      }
    } catch (error) {
      console.warn('Failed to send analytics:', error);
    }
  }

  // 🚀 CHUNK LOADING: Medir carregamento de chunks
  measureChunkLoading(chunkName: string, startTime: number) {
    const loadTime = performance.now() - startTime;
    this.recordMetric(`Chunk_${chunkName}`, loadTime);
  }

  // 🚀 API TIMING: Medir tempo de APIs
  measureApiCall(apiName: string, startTime: number, success: boolean) {
    const duration = performance.now() - startTime;
    this.recordMetric(`API_${apiName}_${success ? 'Success' : 'Error'}`, duration);
  }

  // 🚀 COMPONENT RENDER: Medir renderização de componentes
  measureComponentRender(componentName: string, renderTime: number) {
    this.recordMetric(`Component_${componentName}`, renderTime);
  }

  // 🚀 GET METRICS: Obter todas as métricas
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  // 🚀 GET CORE WEB VITALS: Obter métricas principais
  getCoreWebVitals(): CoreWebVitals {
    return { ...this.coreWebVitals };
  }

  // 🚀 GENERATE REPORT: Gerar relatório de performance
  generateReport(): string {
    const vitals = this.getCoreWebVitals();
    const report = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      coreWebVitals: vitals,
      scores: {
        lcp: vitals.lcp ? (vitals.lcp <= 2500 ? 'Good' : vitals.lcp <= 4000 ? 'Needs Improvement' : 'Poor') : 'N/A',
        fid: vitals.fid ? (vitals.fid <= 100 ? 'Good' : vitals.fid <= 300 ? 'Needs Improvement' : 'Poor') : 'N/A',
        cls: vitals.cls ? (vitals.cls <= 0.1 ? 'Good' : vitals.cls <= 0.25 ? 'Needs Improvement' : 'Poor') : 'N/A'
      },
      totalMetrics: this.metrics.length
    };

    return JSON.stringify(report, null, 2);
  }

  // 🚀 CLEANUP: Limpar observadores
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// 🚀 SINGLETON: Instância global
export const performanceMetrics = new PerformanceMetrics();

// 🚀 HOOKS: Para uso em componentes React
export const usePerformanceMetrics = () => {
  return {
    measureChunkLoading: performanceMetrics.measureChunkLoading.bind(performanceMetrics),
    measureApiCall: performanceMetrics.measureApiCall.bind(performanceMetrics),
    measureComponentRender: performanceMetrics.measureComponentRender.bind(performanceMetrics),
    getCoreWebVitals: performanceMetrics.getCoreWebVitals.bind(performanceMetrics),
    generateReport: performanceMetrics.generateReport.bind(performanceMetrics)
  };
};

// 🚀 COMPONENT PERFORMANCE: HOC para medir renderização
export function withPerformanceMetrics<T extends object>(
  WrappedComponent: React.ComponentType<T>,
  componentName: string
) {
  return function PerformanceWrappedComponent(props: T) {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const renderTime = performance.now() - startTime;
      performanceMetrics.measureComponentRender(componentName, renderTime);
    }, []);

    return React.createElement(WrappedComponent, props);
  };
}
