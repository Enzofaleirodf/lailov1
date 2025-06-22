import { useState, useEffect, useCallback } from 'react';
import { useBundleAnalysis, useBundleMetrics, useTreeShakingMonitor } from './useBundleAnalysis';
import { useCacheMonitoring } from './useCacheMonitoring';
import { getMetricsReport, recordEvent } from '../utils/advancedMetrics';
import { generatePerformanceReport, getPerformanceReports } from '../utils/reportingSystem';

interface CompleteMonitoringState {
  isInitialized: boolean;
  lastUpdate: Date | null;
  overallScore: number;
  
  // Performance Metrics
  coreWebVitals: {
    lcp: number | null;
    fid: number | null;
    cls: number | null;
    ttfb: number | null;
    fcp: number | null;
  };
  
  // Bundle Metrics
  bundleMetrics: {
    totalSize: string;
    gzippedSize: string;
    chunkCount: number;
    treeShakingEfficiency: string;
  };
  
  // Cache Metrics
  cacheMetrics: {
    hitRate: number;
    totalCaches: number;
    serviceWorkerVersion: string;
  };
  
  // User Experience
  userExperience: {
    sessionDuration: number;
    interactionRate: number;
    errorCount: number;
    pageViews: number;
  };
  
  // System Info
  systemInfo: {
    deviceType: string;
    connectionType: string;
    memoryUsage: number;
    viewport: { width: number; height: number };
  };
  
  // Alerts and Recommendations
  alerts: Array<{
    type: 'critical' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>;
  
  recommendations: string[];
  reports: any[];
}

interface CompleteMonitoringActions {
  refreshAll: () => Promise<void>;
  generateReport: () => Promise<void>;
  exportData: () => void;
  clearData: () => void;
  recordCustomEvent: (name: string, data: any) => void;
}

// 🚀 HOOK PARA MONITORAMENTO COMPLETO
export const useCompleteMonitoring = () => {
  const [state, setState] = useState<CompleteMonitoringState>({
    isInitialized: false,
    lastUpdate: null,
    overallScore: 0,
    coreWebVitals: {
      lcp: null,
      fid: null,
      cls: null,
      ttfb: null,
      fcp: null
    },
    bundleMetrics: {
      totalSize: '0 B',
      gzippedSize: '0 B',
      chunkCount: 0,
      treeShakingEfficiency: '0%'
    },
    cacheMetrics: {
      hitRate: 0,
      totalCaches: 0,
      serviceWorkerVersion: 'N/A'
    },
    userExperience: {
      sessionDuration: 0,
      interactionRate: 0,
      errorCount: 0,
      pageViews: 0
    },
    systemInfo: {
      deviceType: 'unknown',
      connectionType: 'unknown',
      memoryUsage: 0,
      viewport: { width: 0, height: 0 }
    },
    alerts: [],
    recommendations: [],
    reports: []
  });

  const [isLoading, setIsLoading] = useState(false);

  // Hooks individuais
  const bundleAnalysis = useBundleAnalysis();
  const bundleMetrics = useBundleMetrics();
  const treeShaking = useTreeShakingMonitor();
  const cacheMonitoring = useCacheMonitoring();

  // 🔄 REFRESH ALL: Atualizar todas as métricas
  const refreshAll = useCallback(async () => {
    setIsLoading(true);
    
    try {
      // Coletar métricas avançadas
      const advancedMetrics = getMetricsReport();
      
      // Calcular score geral
      const overallScore = calculateOverallScore(advancedMetrics, bundleAnalysis.metrics);
      
      // Gerar alertas
      const alerts = generateAlerts(advancedMetrics, bundleAnalysis.metrics);
      
      // Gerar recomendações
      const recommendations = generateRecommendations(advancedMetrics, bundleAnalysis.recommendations);
      
      // Obter relatórios
      const reports = getPerformanceReports();

      setState(prev => ({
        ...prev,
        isInitialized: true,
        lastUpdate: new Date(),
        overallScore,
        coreWebVitals: {
          lcp: advancedMetrics.performance?.lcp || null,
          fid: advancedMetrics.performance?.fid || null,
          cls: advancedMetrics.performance?.cls || null,
          ttfb: advancedMetrics.performance?.ttfb || null,
          fcp: advancedMetrics.performance?.fcp || null
        },
        bundleMetrics: {
          totalSize: bundleAnalysis.metrics?.totalSize || '0 B',
          gzippedSize: bundleAnalysis.metrics?.gzippedSize || '0 B',
          chunkCount: bundleAnalysis.metrics?.chunkCount || 0,
          treeShakingEfficiency: bundleAnalysis.metrics?.treeShakingEfficiency || '0%'
        },
        cacheMetrics: {
          hitRate: calculateCacheHitRate(cacheMonitoring.status.cacheMetrics),
          totalCaches: cacheMonitoring.status.cacheMetrics?.serviceWorker?.caches?.length || 0,
          serviceWorkerVersion: cacheMonitoring.status.cacheMetrics?.serviceWorker?.version || 'N/A'
        },
        userExperience: {
          sessionDuration: advancedMetrics.userExperience?.sessionDuration || 0,
          interactionRate: advancedMetrics.userExperience?.interactionRate || 0,
          errorCount: advancedMetrics.system?.errorCount || 0,
          pageViews: advancedMetrics.userExperience?.pageViews || 0
        },
        systemInfo: {
          deviceType: advancedMetrics.system?.deviceType || 'unknown',
          connectionType: advancedMetrics.system?.connectionType || 'unknown',
          memoryUsage: advancedMetrics.system?.memoryUsage || 0,
          viewport: advancedMetrics.system?.viewport || { width: 0, height: 0 }
        },
        alerts,
        recommendations,
        reports: reports.slice(-10) // Últimos 10 relatórios
      }));

    } catch (error) {
      console.error('Failed to refresh monitoring data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [bundleAnalysis, cacheMonitoring]);

  // 📊 GENERATE REPORT: Gerar relatório
  const generateReport = useCallback(async () => {
    try {
      await generatePerformanceReport();
      await refreshAll(); // Atualizar dados após gerar relatório
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  }, [refreshAll]);

  // 📤 EXPORT DATA: Exportar dados
  const exportData = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      monitoring: state,
      bundleAnalysis: bundleAnalysis.metrics,
      cacheStatus: cacheMonitoring.status,
      treeShaking: treeShaking
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `lailo-monitoring-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }, [state, bundleAnalysis, cacheMonitoring, treeShaking]);

  // 🗑️ CLEAR DATA: Limpar dados
  const clearData = useCallback(() => {
    localStorage.removeItem('performance-reports');
    cacheMonitoring.actions.clearCache();
    setState(prev => ({
      ...prev,
      alerts: [],
      reports: []
    }));
  }, [cacheMonitoring]);

  // 📝 RECORD EVENT: Registrar evento customizado
  const recordCustomEvent = useCallback((name: string, data: any) => {
    recordEvent(name, data, 'interaction');
  }, []);

  // 🚀 INITIALIZATION: Inicialização automática
  useEffect(() => {
    const initializeMonitoring = async () => {
      // Aguardar um pouco para garantir que tudo está carregado
      setTimeout(async () => {
        await refreshAll();
      }, 3000);
    };

    initializeMonitoring();

    // Atualização periódica (a cada 2 minutos)
    const interval = setInterval(refreshAll, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refreshAll]);

  const actions: CompleteMonitoringActions = {
    refreshAll,
    generateReport,
    exportData,
    clearData,
    recordCustomEvent
  };

  return {
    ...state,
    isLoading,
    actions
  };
};

// 🔧 UTILITY FUNCTIONS

function calculateOverallScore(advancedMetrics: any, bundleMetrics: any): number {
  const scores: number[] = [];

  // Core Web Vitals (40% do score)
  if (advancedMetrics?.performance) {
    const perf = advancedMetrics.performance;
    if (perf.lcp) scores.push(perf.lcp <= 2500 ? 100 : perf.lcp <= 4000 ? 75 : 50);
    if (perf.fid) scores.push(perf.fid <= 100 ? 100 : perf.fid <= 300 ? 75 : 50);
    if (perf.cls) scores.push(perf.cls <= 0.1 ? 100 : perf.cls <= 0.25 ? 75 : 50);
  }

  // Bundle Size (30% do score)
  if (bundleMetrics?.totalSize) {
    const sizeMatch = bundleMetrics.totalSize.match(/(\d+(?:\.\d+)?)\s*(\w+)/);
    if (sizeMatch) {
      const [, size, unit] = sizeMatch;
      const sizeNum = parseFloat(size);
      if (unit === 'KB') {
        scores.push(sizeNum <= 500 ? 100 : sizeNum <= 1000 ? 75 : 50);
      } else if (unit === 'MB') {
        scores.push(sizeNum <= 1 ? 100 : sizeNum <= 3 ? 75 : 50);
      }
    }
  }

  // Error Rate (30% do score)
  if (advancedMetrics?.system?.errorCount !== undefined) {
    const errorCount = advancedMetrics.system.errorCount;
    scores.push(errorCount === 0 ? 100 : errorCount <= 2 ? 75 : 50);
  }

  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

function calculateCacheHitRate(cacheMetrics: any): number {
  if (!cacheMetrics?.serviceWorker?.metrics) return 0;
  
  const { hits = 0, misses = 0 } = cacheMetrics.serviceWorker.metrics;
  const total = hits + misses;
  
  return total > 0 ? Math.round((hits / total) * 100) : 0;
}

function generateAlerts(advancedMetrics: any, bundleMetrics: any): Array<{
  type: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}> {
  const alerts: any[] = [];

  // Performance alerts
  if (advancedMetrics?.performance) {
    const perf = advancedMetrics.performance;
    
    if (perf.lcp > 6000) {
      alerts.push({
        type: 'critical',
        message: `Critical LCP: ${perf.lcp}ms (should be < 2500ms)`,
        timestamp: new Date()
      });
    }
    
    if (perf.cls > 0.5) {
      alerts.push({
        type: 'critical',
        message: `Critical CLS: ${perf.cls} (should be < 0.1)`,
        timestamp: new Date()
      });
    }
  }

  // Error alerts
  if (advancedMetrics?.system?.errorCount > 3) {
    alerts.push({
      type: 'warning',
      message: `High error count: ${advancedMetrics.system.errorCount} errors detected`,
      timestamp: new Date()
    });
  }

  return alerts;
}

function generateRecommendations(advancedMetrics: any, bundleRecommendations: string[]): string[] {
  const recommendations: string[] = [...bundleRecommendations];

  if (advancedMetrics?.performance) {
    const perf = advancedMetrics.performance;
    
    if (perf.lcp > 4000) {
      recommendations.push('Optimize images and critical CSS to improve LCP');
    }
    
    if (perf.fid > 300) {
      recommendations.push('Reduce JavaScript execution time to improve FID');
    }
    
    if (perf.totalSize > 3 * 1024 * 1024) {
      recommendations.push('Consider code splitting to reduce bundle size');
    }
  }

  return [...new Set(recommendations)]; // Remove duplicates
}
