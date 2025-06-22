// 🚀 REPORTING SYSTEM
// Sistema automático de relatórios de performance e métricas

import { getMetricsReport } from './advancedMetrics';
import { getCacheMetrics } from './serviceWorkerInterface';
import { bundleAnalyzer } from './bundleAnalysis';

interface PerformanceReport {
  id: string;
  timestamp: string;
  type: 'daily' | 'session' | 'error' | 'manual';
  summary: {
    performanceScore: number;
    coreWebVitals: any;
    userExperience: any;
    systemMetrics: any;
    cacheMetrics: any;
    bundleMetrics: any;
  };
  recommendations: string[];
  alerts: any[];
  rawData: any;
}

interface ReportingConfig {
  enableAutoReports: boolean;
  reportInterval: number; // em minutos
  maxReportsStored: number;
  enableErrorReports: boolean;
  enableSessionReports: boolean;
}

class ReportingSystem {
  private config: ReportingConfig;
  private reports: PerformanceReport[] = [];
  private reportTimer: NodeJS.Timeout | null = null;
  private sessionStartTime: number;

  constructor() {
    this.config = {
      enableAutoReports: true,
      reportInterval: 30, // 30 minutos
      maxReportsStored: 50,
      enableErrorReports: true,
      enableSessionReports: true
    };
    
    this.sessionStartTime = Date.now();
    this.initialize();
  }

  private initialize() {
    if (typeof window === 'undefined') return;

    // Carregar relatórios salvos
    this.loadStoredReports();
    
    // Configurar relatórios automáticos
    if (this.config.enableAutoReports) {
      this.startAutoReporting();
    }
    
    // Configurar relatório de sessão
    if (this.config.enableSessionReports) {
      this.setupSessionReporting();
    }
    
    // Configurar relatórios de erro
    if (this.config.enableErrorReports) {
      this.setupErrorReporting();
    }

    console.log('🚀 Reporting System initialized');
  }

  // 📊 GENERATE REPORT: Gerar relatório completo
  async generateReport(type: PerformanceReport['type'] = 'manual'): Promise<PerformanceReport> {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Coletar todas as métricas
      const [advancedMetrics, cacheMetrics, bundleReport] = await Promise.all([
        this.collectAdvancedMetrics(),
        this.collectCacheMetrics(),
        this.collectBundleMetrics()
      ]);

      // Calcular score de performance
      const performanceScore = this.calculateOverallScore(advancedMetrics);
      
      // Gerar recomendações
      const recommendations = this.generateRecommendations(advancedMetrics, cacheMetrics, bundleReport);
      
      // Detectar alertas
      const alerts = this.detectAlerts(advancedMetrics);

      const report: PerformanceReport = {
        id: reportId,
        timestamp: new Date().toISOString(),
        type,
        summary: {
          performanceScore,
          coreWebVitals: advancedMetrics?.performance || {},
          userExperience: advancedMetrics?.userExperience || {},
          systemMetrics: advancedMetrics?.system || {},
          cacheMetrics: cacheMetrics || {},
          bundleMetrics: bundleReport || {}
        },
        recommendations,
        alerts,
        rawData: {
          advancedMetrics,
          cacheMetrics,
          bundleReport
        }
      };

      // Armazenar relatório
      this.storeReport(report);
      
      console.log(`📊 Report generated: ${reportId} (${type})`);
      return report;

    } catch (error) {
      console.error('Failed to generate report:', error);
      throw error;
    }
  }

  // 📈 COLLECT METRICS: Coletar métricas de diferentes fontes
  private async collectAdvancedMetrics() {
    try {
      return getMetricsReport();
    } catch (error) {
      console.warn('Failed to collect advanced metrics:', error);
      return null;
    }
  }

  private async collectCacheMetrics() {
    try {
      return await getCacheMetrics();
    } catch (error) {
      console.warn('Failed to collect cache metrics:', error);
      return null;
    }
  }

  private async collectBundleMetrics() {
    try {
      const report = bundleAnalyzer.generateReport();
      return JSON.parse(report);
    } catch (error) {
      console.warn('Failed to collect bundle metrics:', error);
      return null;
    }
  }

  // 🎯 CALCULATE SCORE: Calcular score geral de performance
  private calculateOverallScore(metrics: any): number {
    if (!metrics?.performance) return 0;

    const scores: number[] = [];
    const perf = metrics.performance;

    // Core Web Vitals scores
    if (perf.lcp) {
      scores.push(perf.lcp <= 2500 ? 100 : perf.lcp <= 4000 ? 75 : 50);
    }
    if (perf.fid) {
      scores.push(perf.fid <= 100 ? 100 : perf.fid <= 300 ? 75 : 50);
    }
    if (perf.cls) {
      scores.push(perf.cls <= 0.1 ? 100 : perf.cls <= 0.25 ? 75 : 50);
    }

    // Bundle size score
    if (perf.totalSize) {
      const sizeMB = perf.totalSize / (1024 * 1024);
      scores.push(sizeMB <= 1 ? 100 : sizeMB <= 3 ? 75 : 50);
    }

    return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
  }

  // 💡 GENERATE RECOMMENDATIONS: Gerar recomendações
  private generateRecommendations(advancedMetrics: any, cacheMetrics: any, bundleMetrics: any): string[] {
    const recommendations: string[] = [];

    // Performance recommendations
    if (advancedMetrics?.performance) {
      const perf = advancedMetrics.performance;
      
      if (perf.lcp > 4000) {
        recommendations.push('Optimize Largest Contentful Paint - consider image optimization and critical CSS');
      }
      if (perf.fid > 300) {
        recommendations.push('Reduce First Input Delay - minimize JavaScript execution time');
      }
      if (perf.cls > 0.25) {
        recommendations.push('Improve Cumulative Layout Shift - ensure proper image dimensions and avoid dynamic content');
      }
      if (perf.totalSize > 3 * 1024 * 1024) {
        recommendations.push('Reduce bundle size - consider code splitting and tree shaking');
      }
    }

    // Cache recommendations
    if (cacheMetrics) {
      const hitRate = cacheMetrics.metrics?.hits / (cacheMetrics.metrics?.hits + cacheMetrics.metrics?.misses) || 0;
      if (hitRate < 0.8) {
        recommendations.push('Improve cache hit rate - review caching strategies');
      }
    }

    // Bundle recommendations
    if (bundleMetrics?.recommendations) {
      recommendations.push(...bundleMetrics.recommendations);
    }

    return recommendations;
  }

  // 🚨 DETECT ALERTS: Detectar alertas críticos
  private detectAlerts(metrics: any): any[] {
    const alerts: any[] = [];

    if (metrics?.performance) {
      const perf = metrics.performance;
      
      if (perf.lcp > 6000) {
        alerts.push({
          type: 'critical',
          message: 'Critical LCP performance issue detected',
          value: perf.lcp,
          threshold: 6000
        });
      }
      
      if (perf.cls > 0.5) {
        alerts.push({
          type: 'critical',
          message: 'Critical layout shift detected',
          value: perf.cls,
          threshold: 0.5
        });
      }
    }

    if (metrics?.system?.errorCount > 5) {
      alerts.push({
        type: 'warning',
        message: 'High error rate detected',
        value: metrics.system.errorCount,
        threshold: 5
      });
    }

    return alerts;
  }

  // 💾 STORAGE: Gerenciar armazenamento de relatórios
  private storeReport(report: PerformanceReport) {
    this.reports.push(report);
    
    // Manter apenas os últimos N relatórios
    if (this.reports.length > this.config.maxReportsStored) {
      this.reports = this.reports.slice(-this.config.maxReportsStored);
    }
    
    // Salvar no localStorage
    try {
      localStorage.setItem('performance-reports', JSON.stringify(this.reports));
    } catch (error) {
      console.warn('Failed to save reports to localStorage:', error);
    }
  }

  private loadStoredReports() {
    try {
      const stored = localStorage.getItem('performance-reports');
      if (stored) {
        this.reports = JSON.parse(stored);
        console.log(`📊 Loaded ${this.reports.length} stored reports`);
      }
    } catch (error) {
      console.warn('Failed to load stored reports:', error);
      this.reports = [];
    }
  }

  // ⏰ AUTO REPORTING: Configurar relatórios automáticos
  private startAutoReporting() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
    }

    this.reportTimer = setInterval(async () => {
      try {
        await this.generateReport('daily');
      } catch (error) {
        console.error('Auto report generation failed:', error);
      }
    }, this.config.reportInterval * 60 * 1000);
  }

  // 👤 SESSION REPORTING: Relatórios de sessão
  private setupSessionReporting() {
    // Relatório ao sair da página
    window.addEventListener('beforeunload', async () => {
      try {
        await this.generateReport('session');
      } catch (error) {
        console.warn('Session report generation failed:', error);
      }
    });

    // Relatório a cada 10 minutos de sessão
    setInterval(async () => {
      const sessionDuration = Date.now() - this.sessionStartTime;
      if (sessionDuration > 10 * 60 * 1000) { // 10 minutos
        try {
          await this.generateReport('session');
        } catch (error) {
          console.warn('Session interval report failed:', error);
        }
      }
    }, 10 * 60 * 1000);
  }

  // 🚨 ERROR REPORTING: Relatórios de erro
  private setupErrorReporting() {
    let errorCount = 0;
    const errorThreshold = 3;

    const handleError = async () => {
      errorCount++;
      if (errorCount >= errorThreshold) {
        try {
          await this.generateReport('error');
          errorCount = 0; // Reset counter
        } catch (error) {
          console.warn('Error report generation failed:', error);
        }
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);
  }

  // 📊 PUBLIC METHODS
  getReports(): PerformanceReport[] {
    return [...this.reports];
  }

  getLatestReport(): PerformanceReport | null {
    return this.reports.length > 0 ? this.reports[this.reports.length - 1] : null;
  }

  exportReports(): string {
    return JSON.stringify(this.reports, null, 2);
  }

  clearReports() {
    this.reports = [];
    localStorage.removeItem('performance-reports');
  }

  updateConfig(newConfig: Partial<ReportingConfig>) {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enableAutoReports !== undefined) {
      if (newConfig.enableAutoReports) {
        this.startAutoReporting();
      } else if (this.reportTimer) {
        clearInterval(this.reportTimer);
        this.reportTimer = null;
      }
    }
  }

  cleanup() {
    if (this.reportTimer) {
      clearInterval(this.reportTimer);
      this.reportTimer = null;
    }
  }
}

// 🚀 SINGLETON
export const reportingSystem = new ReportingSystem();

// 🎯 UTILITIES
export const generatePerformanceReport = () => reportingSystem.generateReport('manual');
export const getPerformanceReports = () => reportingSystem.getReports();
export const exportPerformanceReports = () => reportingSystem.exportReports();
export const clearPerformanceReports = () => reportingSystem.clearReports();
