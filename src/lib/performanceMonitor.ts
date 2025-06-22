/**
 * 🚀 PERFORMANCE MONITOR AVANÇADO
 * Sistema completo de monitoramento de performance com Core Web Vitals,
 * métricas customizadas, alertas automáticos e dashboards em tempo real
 */

// ===== TYPES =====
export interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  url: string;
  userAgent: string;
  connectionType?: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

export interface CoreWebVitals {
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  ttfb: number | null; // Time to First Byte
  fcp: number | null; // First Contentful Paint
}

export interface CustomMetrics {
  queryPerformance: number[];
  cacheHitRate: number;
  bundleSize: number;
  memoryUsage: number;
  errorRate: number;
  userInteractions: number;
}

export interface PerformanceAlert {
  type: 'warning' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
}

// ===== CONFIGURATION =====
const PERFORMANCE_CONFIG = {
  // Core Web Vitals thresholds (Google recommendations)
  thresholds: {
    lcp: { good: 2500, poor: 4000 }, // ms
    fid: { good: 100, poor: 300 }, // ms
    cls: { good: 0.1, poor: 0.25 }, // score
    ttfb: { good: 800, poor: 1800 }, // ms
    fcp: { good: 1800, poor: 3000 }, // ms
  },

  // Custom metrics thresholds
  customThresholds: {
    queryPerformance: { good: 500, poor: 2000 }, // ms
    cacheHitRate: { good: 80, poor: 50 }, // %
    memoryUsage: { good: 50, poor: 80 }, // MB
    errorRate: { good: 1, poor: 5 }, // %
  },

  // Monitoring settings
  sampleRate: 0.1, // 10% of users
  reportingInterval: 30000, // 30 seconds
  maxStoredMetrics: 1000,
  enableRealTimeAlerts: false, // 🚨 DESABILITAR ALERTAS POR PADRÃO
  enableInProduction: false, // 🚨 DESABILITAR EM PRODUÇÃO
} as const;

// ===== PERFORMANCE MONITOR CLASS =====
class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private coreWebVitals: CoreWebVitals = {
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fcp: null,
  };
  private customMetrics: CustomMetrics = {
    queryPerformance: [],
    cacheHitRate: 0,
    bundleSize: 0,
    memoryUsage: 0,
    errorRate: 0,
    userInteractions: 0,
  };
  private alerts: PerformanceAlert[] = [];
  private observers: PerformanceObserver[] = [];
  private isInitialized = false;

  // ===== INITIALIZATION =====
  init(): void {
    // 🚨 DESABILITADO COMPLETAMENTE PARA EVITAR LOOPS
    console.log('🚀 Performance Monitor: DISABLED to prevent loops');
    return;
  }

  // ===== CORE WEB VITALS MONITORING =====
  private setupCoreWebVitalsObserver(): void {
    // LCP Observer
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          if (lastEntry) {
            this.coreWebVitals.lcp = lastEntry.startTime;
            this.recordMetric('lcp', lastEntry.startTime);
            this.checkThreshold('lcp', lastEntry.startTime);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (error) {
        console.warn('LCP observer not supported:', error);
      }

      // FID Observer
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              const fid = entry.processingStart - entry.startTime;
              this.coreWebVitals.fid = fid;
              this.recordMetric('fid', fid);
              this.checkThreshold('fid', fid);
            }
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (error) {
        console.warn('FID observer not supported:', error);
      }

      // CLS Observer
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.coreWebVitals.cls = clsValue;
              this.recordMetric('cls', clsValue);
              this.checkThreshold('cls', clsValue);
            }
          });
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(clsObserver);
      } catch (error) {
        console.warn('CLS observer not supported:', error);
      }
    }

    // FCP and TTFB from Navigation Timing
    this.measureNavigationMetrics();
  }

  private measureNavigationMetrics(): void {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navigationEntries.length > 0) {
        const nav = navigationEntries[0];
        
        // TTFB
        const ttfb = nav.responseStart - nav.requestStart;
        this.coreWebVitals.ttfb = ttfb;
        this.recordMetric('ttfb', ttfb);
        this.checkThreshold('ttfb', ttfb);
      }
    }

    // FCP
    if ('PerformanceObserver' in window) {
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name === 'first-contentful-paint') {
              this.coreWebVitals.fcp = entry.startTime;
              this.recordMetric('fcp', entry.startTime);
              this.checkThreshold('fcp', entry.startTime);
            }
          });
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
        this.observers.push(fcpObserver);
      } catch (error) {
        console.warn('FCP observer not supported:', error);
      }
    }
  }

  // ===== NAVIGATION MONITORING =====
  private setupNavigationObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            this.recordMetric('navigation-duration', entry.duration);
            this.recordMetric('dom-content-loaded', entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart);
            this.recordMetric('load-event', entry.loadEventEnd - entry.loadEventStart);
          });
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (error) {
        console.warn('Navigation observer not supported:', error);
      }
    }
  }

  // ===== RESOURCE MONITORING =====
  private setupResourceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            // Track slow resources
            if (entry.duration > 1000) {
              this.recordMetric('slow-resource', entry.duration);
              this.createAlert('warning', 'slow-resource', entry.duration, 1000, 
                `Slow resource detected: ${entry.name} (${entry.duration.toFixed(0)}ms)`);
            }
            
            // Track bundle sizes
            if (entry.name.includes('.js') && entry.transferSize) {
              this.customMetrics.bundleSize += entry.transferSize;
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }
    }
  }

  // ===== MEMORY MONITORING =====
  private setupMemoryMonitoring(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        if (memory) {
          const usedMB = memory.usedJSHeapSize / 1024 / 1024;
          this.customMetrics.memoryUsage = usedMB;
          this.recordMetric('memory-usage', usedMB);
          
          // Check memory threshold
          if (usedMB > PERFORMANCE_CONFIG.customThresholds.memoryUsage.poor) {
            this.createAlert('critical', 'memory-usage', usedMB, 
              PERFORMANCE_CONFIG.customThresholds.memoryUsage.poor,
              `High memory usage detected: ${usedMB.toFixed(1)}MB`);
          }
        }
      }, 10000); // Check every 10 seconds
    }
  }

  // ===== ERROR TRACKING =====
  private setupErrorTracking(): void {
    let errorCount = 0;
    let totalInteractions = 0;

    window.addEventListener('error', (event) => {
      errorCount++;
      totalInteractions++;
      this.customMetrics.errorRate = (errorCount / totalInteractions) * 100;
      this.recordMetric('error-rate', this.customMetrics.errorRate);
      
      if (this.customMetrics.errorRate > PERFORMANCE_CONFIG.customThresholds.errorRate.poor) {
        this.createAlert('critical', 'error-rate', this.customMetrics.errorRate,
          PERFORMANCE_CONFIG.customThresholds.errorRate.poor,
          `High error rate detected: ${this.customMetrics.errorRate.toFixed(1)}%`);
      }
    });

    // Track user interactions
    ['click', 'scroll', 'keydown'].forEach(eventType => {
      window.addEventListener(eventType, () => {
        totalInteractions++;
        this.customMetrics.userInteractions = totalInteractions;
      });
    });
  }

  // ===== METRIC RECORDING =====
  private recordMetric(name: string, value: number): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      connectionType: this.getConnectionType(),
      deviceType: this.getDeviceType(),
    };

    this.metrics.push(metric);
    
    // Limit stored metrics
    if (this.metrics.length > PERFORMANCE_CONFIG.maxStoredMetrics) {
      this.metrics = this.metrics.slice(-PERFORMANCE_CONFIG.maxStoredMetrics);
    }

    console.log(`📊 Performance Metric: ${name} = ${value.toFixed(2)}${this.getUnit(name)}`);
  }

  // ===== THRESHOLD CHECKING =====
  private checkThreshold(metric: keyof typeof PERFORMANCE_CONFIG.thresholds, value: number): void {
    const threshold = PERFORMANCE_CONFIG.thresholds[metric];
    if (!threshold) return;

    if (value > threshold.poor) {
      this.createAlert('critical', metric, value, threshold.poor,
        `Poor ${metric.toUpperCase()} detected: ${value.toFixed(0)}${this.getUnit(metric)}`);
    } else if (value > threshold.good) {
      this.createAlert('warning', metric, value, threshold.good,
        `Needs improvement ${metric.toUpperCase()}: ${value.toFixed(0)}${this.getUnit(metric)}`);
    }
  }

  // ===== ALERT SYSTEM =====
  private createAlert(type: 'warning' | 'critical', metric: string, value: number, threshold: number, message: string): void {
    if (!PERFORMANCE_CONFIG.enableRealTimeAlerts) return;

    const alert: PerformanceAlert = {
      type,
      metric,
      value,
      threshold,
      timestamp: Date.now(),
      message,
    };

    this.alerts.push(alert);
    
    // Limit stored alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    console.warn(`🚨 Performance Alert [${type.toUpperCase()}]: ${message}`);
    
    // Send to external monitoring service (implement as needed)
    this.sendAlert(alert);
  }

  // ===== UTILITY METHODS =====
  private getConnectionType(): string {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    return connection ? connection.effectiveType || 'unknown' : 'unknown';
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  private getUnit(metric: string): string {
    if (metric.includes('cls')) return '';
    if (metric.includes('rate') || metric.includes('Rate')) return '%';
    if (metric.includes('memory') || metric.includes('Memory')) return 'MB';
    if (metric.includes('size') || metric.includes('Size')) return 'B';
    return 'ms';
  }

  // ===== REPORTING =====
  private startReporting(): void {
    // 🚀 PERFORMANCE: Reporting menos frequente em produção
    const interval = process.env.NODE_ENV === 'development'
      ? PERFORMANCE_CONFIG.reportingInterval
      : PERFORMANCE_CONFIG.reportingInterval * 5; // 5x menos em produção

    setInterval(() => {
      this.generateReport();
    }, interval);
  }

  private generateReport(): void {
    const report = {
      timestamp: Date.now(),
      coreWebVitals: this.coreWebVitals,
      customMetrics: this.customMetrics,
      recentMetrics: this.metrics.slice(-50),
      alerts: this.alerts.slice(-10),
      summary: this.generateSummary(),
    };

    console.log('📈 Performance Report:', report);
    
    // Send to analytics service (implement as needed)
    this.sendReport(report);
  }

  private generateSummary(): any {
    const recentMetrics = this.metrics.slice(-100);
    const summary: any = {};

    // Calculate averages for recent metrics
    const metricGroups = recentMetrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = [];
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    Object.entries(metricGroups).forEach(([name, values]) => {
      summary[name] = {
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        count: values.length,
      };
    });

    return summary;
  }

  // ===== EXTERNAL INTEGRATIONS =====
  private sendAlert(alert: PerformanceAlert): void {
    // Implement integration with monitoring services like Sentry, DataDog, etc.
    // For now, just log to console
    if (alert.type === 'critical') {
      console.error('🚨 CRITICAL PERFORMANCE ALERT:', alert);
    }
  }

  private sendReport(report: any): void {
    // Implement integration with analytics services
    // For now, store in localStorage for debugging
    try {
      const reports = JSON.parse(localStorage.getItem('performance-reports') || '[]');
      reports.push(report);
      // Keep only last 10 reports
      localStorage.setItem('performance-reports', JSON.stringify(reports.slice(-10)));
    } catch (error) {
      console.warn('Failed to store performance report:', error);
    }
  }

  // ===== PUBLIC API =====
  public trackCustomMetric(name: string, value: number): void {
    this.recordMetric(`custom-${name}`, value);
  }

  public trackQueryPerformance(duration: number): void {
    this.customMetrics.queryPerformance.push(duration);
    if (this.customMetrics.queryPerformance.length > 100) {
      this.customMetrics.queryPerformance = this.customMetrics.queryPerformance.slice(-100);
    }
    this.recordMetric('query-performance', duration);
    
    if (duration > PERFORMANCE_CONFIG.customThresholds.queryPerformance.poor) {
      this.createAlert('warning', 'query-performance', duration,
        PERFORMANCE_CONFIG.customThresholds.queryPerformance.poor,
        `Slow query detected: ${duration.toFixed(0)}ms`);
    }
  }

  public updateCacheHitRate(rate: number): void {
    this.customMetrics.cacheHitRate = rate;
    this.recordMetric('cache-hit-rate', rate);
    
    if (rate < PERFORMANCE_CONFIG.customThresholds.cacheHitRate.poor) {
      this.createAlert('warning', 'cache-hit-rate', rate,
        PERFORMANCE_CONFIG.customThresholds.cacheHitRate.poor,
        `Low cache hit rate: ${rate.toFixed(1)}%`);
    }
  }

  public getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  public getCoreWebVitals(): CoreWebVitals {
    return { ...this.coreWebVitals };
  }

  public getAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  public destroy(): void {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
    this.alerts = [];
    this.isInitialized = false;
    console.log('🛑 Performance Monitor: Destroyed');
  }
}

// ===== SINGLETON INSTANCE =====
export const performanceMonitor = new PerformanceMonitor();

// ===== AUTO-INITIALIZATION =====
if (typeof window !== 'undefined') {
  // Initialize after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => performanceMonitor.init(), 1000);
    });
  } else {
    setTimeout(() => performanceMonitor.init(), 1000);
  }
}
