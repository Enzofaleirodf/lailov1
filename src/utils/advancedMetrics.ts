// 🚀 ADVANCED METRICS SYSTEM
// Sistema completo de métricas e monitoramento para produção

interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  
  // Custom Metrics
  timeToInteractive: number;
  totalBlockingTime: number;
  speedIndex: number;
  
  // Resource Metrics
  jsSize: number;
  cssSize: number;
  imageSize: number;
  totalSize: number;
  
  // User Experience
  pageLoadTime: number;
  navigationTime: number;
  renderTime: number;
}

interface UserExperienceMetrics {
  sessionDuration: number;
  pageViews: number;
  bounceRate: number;
  interactionRate: number;
  errorRate: number;
  conversionEvents: number;
  
  // Feature Usage
  filtersUsed: number;
  searchesPerformed: number;
  favoritesAdded: number;
  pagesVisited: string[];
}

interface SystemMetrics {
  memoryUsage: number;
  cpuUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  errorCount: number;
  
  // Browser Info
  userAgent: string;
  viewport: { width: number; height: number };
  connectionType: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
}

interface MetricsReport {
  timestamp: string;
  sessionId: string;
  userId?: string;
  performance: PerformanceMetrics;
  userExperience: UserExperienceMetrics;
  system: SystemMetrics;
  customEvents: CustomEvent[];
}

interface CustomEvent {
  name: string;
  timestamp: number;
  data: any;
  category: 'navigation' | 'interaction' | 'error' | 'performance' | 'business';
}

class AdvancedMetricsCollector {
  private sessionId: string;
  private startTime: number;
  private metrics: Partial<MetricsReport> = {};
  private customEvents: CustomEvent[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private isCollecting = false;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.startTime = Date.now();
    this.initializeCollection();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeCollection() {
    if (typeof window === 'undefined') return;

    this.isCollecting = true;
    this.setupPerformanceObservers();
    this.setupUserExperienceTracking();
    this.setupSystemMonitoring();
    this.setupErrorTracking();

    console.log('🚀 Advanced Metrics Collection initialized');
  }

  // 📊 PERFORMANCE OBSERVERS: Configurar observadores de performance
  private setupPerformanceObservers() {
    // Core Web Vitals
    this.observeWebVitals();
    
    // Resource Timing
    this.observeResourceTiming();
    
    // Navigation Timing
    this.observeNavigationTiming();
    
    // Layout Shift
    this.observeLayoutShift();
  }

  private observeWebVitals() {
    // First Contentful Paint
    this.createObserver('paint', (entries) => {
      entries.forEach((entry) => {
        if (entry.name === 'first-contentful-paint') {
          this.updateMetric('performance.fcp', entry.startTime);
        }
      });
    });

    // Largest Contentful Paint
    this.createObserver('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.updateMetric('performance.lcp', lastEntry.startTime);
    });

    // First Input Delay
    this.createObserver('first-input', (entries) => {
      const firstInput = entries[0];
      this.updateMetric('performance.fid', firstInput.processingStart - firstInput.startTime);
    });
  }

  private observeResourceTiming() {
    this.createObserver('resource', (entries) => {
      let jsSize = 0, cssSize = 0, imageSize = 0;

      entries.forEach((entry: PerformanceResourceTiming) => {
        const size = entry.transferSize || 0;
        
        if (entry.name.endsWith('.js')) jsSize += size;
        else if (entry.name.endsWith('.css')) cssSize += size;
        else if (/\.(jpg|jpeg|png|gif|webp|svg)$/i.test(entry.name)) imageSize += size;
      });

      this.updateMetric('performance.jsSize', jsSize);
      this.updateMetric('performance.cssSize', cssSize);
      this.updateMetric('performance.imageSize', imageSize);
      this.updateMetric('performance.totalSize', jsSize + cssSize + imageSize);
    });
  }

  private observeNavigationTiming() {
    this.createObserver('navigation', (entries) => {
      const navigation = entries[0] as PerformanceNavigationTiming;
      
      this.updateMetric('performance.ttfb', navigation.responseStart - navigation.requestStart);
      this.updateMetric('performance.pageLoadTime', navigation.loadEventEnd - navigation.navigationStart);
      this.updateMetric('performance.renderTime', navigation.domContentLoadedEventEnd - navigation.navigationStart);
    });
  }

  private observeLayoutShift() {
    this.createObserver('layout-shift', (entries) => {
      let clsValue = 0;
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      this.updateMetric('performance.cls', clsValue);
    });
  }

  private createObserver(type: string, callback: (entries: any[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      
      observer.observe({ entryTypes: [type] });
      this.observers.set(type, observer);
    } catch (error) {
      console.warn(`Failed to create observer for ${type}:`, error);
    }
  }

  // 👤 USER EXPERIENCE TRACKING: Rastrear experiência do usuário
  private setupUserExperienceTracking() {
    // Page Views
    this.trackPageView();
    
    // Interactions
    this.trackInteractions();
    
    // Session Duration
    this.trackSessionDuration();
    
    // Feature Usage
    this.trackFeatureUsage();
  }

  private trackPageView() {
    this.recordCustomEvent('page_view', {
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now()
    }, 'navigation');

    // Track page changes for SPA
    let currentPath = window.location.pathname;
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        currentPath = window.location.pathname;
        this.recordCustomEvent('page_change', {
          url: window.location.href,
          timestamp: Date.now()
        }, 'navigation');
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  private trackInteractions() {
    ['click', 'scroll', 'keydown'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        this.updateMetric('userExperience.interactionRate', 1, 'increment');
      }, { passive: true });
    });
  }

  private trackSessionDuration() {
    setInterval(() => {
      const duration = Date.now() - this.startTime;
      this.updateMetric('userExperience.sessionDuration', duration);
    }, 30000); // Update every 30 seconds
  }

  private trackFeatureUsage() {
    // Track filter usage
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-filter]')) {
        this.updateMetric('userExperience.filtersUsed', 1, 'increment');
        this.recordCustomEvent('filter_used', {
          filter: target.closest('[data-filter]')?.getAttribute('data-filter'),
          timestamp: Date.now()
        }, 'interaction');
      }
    });
  }

  // 🖥️ SYSTEM MONITORING: Monitorar sistema
  private setupSystemMonitoring() {
    // Memory Usage
    this.monitorMemoryUsage();
    
    // Network Information
    this.monitorNetworkInfo();
    
    // Device Information
    this.collectDeviceInfo();
  }

  private monitorMemoryUsage() {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.updateMetric('system.memoryUsage', memory.usedJSHeapSize);
      }, 60000); // Every minute
    }
  }

  private monitorNetworkInfo() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.updateMetric('system.connectionType', connection.effectiveType);
      this.updateMetric('system.networkLatency', connection.rtt);
    }
  }

  private collectDeviceInfo() {
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    const deviceType = viewport.width < 768 ? 'mobile' : 
                      viewport.width < 1024 ? 'tablet' : 'desktop';

    this.updateMetric('system.userAgent', navigator.userAgent);
    this.updateMetric('system.viewport', viewport);
    this.updateMetric('system.deviceType', deviceType);
  }

  // 🚨 ERROR TRACKING: Rastrear erros
  private setupErrorTracking() {
    // JavaScript Errors
    window.addEventListener('error', (event) => {
      this.recordCustomEvent('javascript_error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      }, 'error');
      
      this.updateMetric('system.errorCount', 1, 'increment');
    });

    // Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.recordCustomEvent('promise_rejection', {
        reason: event.reason,
        stack: event.reason?.stack
      }, 'error');
      
      this.updateMetric('system.errorCount', 1, 'increment');
    });
  }

  // 🔧 UTILITY METHODS
  private updateMetric(path: string, value: any, operation: 'set' | 'increment' = 'set') {
    const keys = path.split('.');
    let current = this.metrics as any;

    // Navigate to the parent object
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }

    const finalKey = keys[keys.length - 1];
    
    if (operation === 'increment') {
      current[finalKey] = (current[finalKey] || 0) + value;
    } else {
      current[finalKey] = value;
    }
  }

  // 📝 RECORD CUSTOM EVENT: Registrar evento customizado
  recordCustomEvent(name: string, data: any, category: CustomEvent['category'] = 'interaction') {
    const event: CustomEvent = {
      name,
      timestamp: Date.now(),
      data,
      category
    };

    this.customEvents.push(event);

    // Keep only last 100 events to prevent memory issues
    if (this.customEvents.length > 100) {
      this.customEvents = this.customEvents.slice(-100);
    }

    console.log(`📊 Custom Event: ${name}`, data);
  }

  // 📊 GENERATE REPORT: Gerar relatório completo
  generateReport(): MetricsReport {
    return {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      performance: this.metrics.performance || {} as PerformanceMetrics,
      userExperience: this.metrics.userExperience || {} as UserExperienceMetrics,
      system: this.metrics.system || {} as SystemMetrics,
      customEvents: [...this.customEvents]
    };
  }

  // 📤 EXPORT METRICS: Exportar métricas
  exportMetrics(): string {
    const report = this.generateReport();
    return JSON.stringify(report, null, 2);
  }

  // 🧹 CLEANUP: Limpar recursos
  cleanup() {
    this.isCollecting = false;
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.customEvents = [];
  }
}

// 🚀 SINGLETON
export const advancedMetricsCollector = new AdvancedMetricsCollector();

// 🎯 UTILITIES
export const recordEvent = (name: string, data: any, category?: CustomEvent['category']) =>
  advancedMetricsCollector.recordCustomEvent(name, data, category);

export const getMetricsReport = () => advancedMetricsCollector.generateReport();

export const exportMetrics = () => advancedMetricsCollector.exportMetrics();

// 🌐 GLOBAL COMMANDS
declare global {
  interface Window {
    getMetricsReport: () => void;
    exportMetrics: () => void;
    recordEvent: (name: string, data: any) => void;
  }
}

if (typeof window !== 'undefined') {
  window.getMetricsReport = () => {
    const report = getMetricsReport();
    console.log('📊 Metrics Report:', report);
    console.table(report.performance);
  };

  window.exportMetrics = () => {
    const metrics = exportMetrics();
    console.log('📊 Exported Metrics:');
    console.log(metrics);
  };

  window.recordEvent = (name: string, data: any) => {
    recordEvent(name, data);
  };
}
