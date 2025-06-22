import { useState, useEffect, useCallback } from 'react';
import { bundleAnalyzer } from '../utils/bundleAnalysis';
import { importOptimizer } from '../utils/importOptimization';

interface BundleAnalysisState {
  isAnalyzing: boolean;
  lastAnalysis: Date | null;
  metrics: {
    totalSize: string;
    gzippedSize: string;
    chunkCount: number;
    compressionRatio: string;
    treeShakingEfficiency: string;
  } | null;
  recommendations: string[];
  errors: string[];
}

interface BundleActions {
  runAnalysis: () => Promise<void>;
  generateReport: () => string;
  exportAnalysis: () => void;
  clearErrors: () => void;
}

// 🚀 HOOK PARA ANÁLISE DE BUNDLE
export const useBundleAnalysis = () => {
  const [state, setState] = useState<BundleAnalysisState>({
    isAnalyzing: false,
    lastAnalysis: null,
    metrics: null,
    recommendations: [],
    errors: []
  });

  // 🔍 RUN ANALYSIS: Executar análise completa
  const runAnalysis = useCallback(async () => {
    setState(prev => ({ ...prev, isAnalyzing: true, errors: [] }));

    try {
      // Analisar chunks
      const chunks = bundleAnalyzer.analyzeChunks();
      const dependencies = bundleAnalyzer.analyzeDependencies();
      const treeShaking = bundleAnalyzer.analyzeTreeShaking();

      // Calcular métricas
      const totalSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
      const gzippedSize = chunks.reduce((sum, chunk) => sum + chunk.gzippedSize, 0);
      const compressionRatio = totalSize > 0 ? ((1 - gzippedSize / totalSize) * 100).toFixed(1) + '%' : '0%';

      // Gerar recomendações
      const recommendations = bundleAnalyzer.generateRecommendations(chunks, dependencies);

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        lastAnalysis: new Date(),
        metrics: {
          totalSize: formatBytes(totalSize),
          gzippedSize: formatBytes(gzippedSize),
          chunkCount: chunks.length,
          compressionRatio,
          treeShakingEfficiency: `${treeShaking.efficiency.toFixed(1)}%`
        },
        recommendations: [...recommendations, ...treeShaking.recommendations]
      }));

    } catch (error) {
      console.error('Bundle analysis failed:', error);
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        errors: [...prev.errors, error.message]
      }));
    }
  }, []);

  // 📊 GENERATE REPORT: Gerar relatório detalhado
  const generateReport = useCallback(() => {
    try {
      return bundleAnalyzer.generateReport();
    } catch (error) {
      console.error('Failed to generate report:', error);
      return JSON.stringify({ error: 'Failed to generate report' }, null, 2);
    }
  }, []);

  // 📤 EXPORT ANALYSIS: Exportar análise
  const exportAnalysis = useCallback(() => {
    try {
      const report = generateReport();
      const blob = new Blob([report], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `bundle-analysis-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      URL.revokeObjectURL(url);
      console.log('📤 Bundle analysis exported');
    } catch (error) {
      console.error('Failed to export analysis:', error);
      setState(prev => ({
        ...prev,
        errors: [...prev.errors, 'Failed to export analysis']
      }));
    }
  }, [generateReport]);

  // 🧹 CLEAR ERRORS: Limpar erros
  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: [] }));
  }, []);

  // 🚀 AUTO ANALYSIS: Análise automática no carregamento
  useEffect(() => {
    // Executar análise após carregamento inicial
    const timer = setTimeout(() => {
      runAnalysis();
    }, 3000); // 3 segundos após carregamento

    return () => clearTimeout(timer);
  }, [runAnalysis]);

  const actions: BundleActions = {
    runAnalysis,
    generateReport,
    exportAnalysis,
    clearErrors
  };

  return {
    ...state,
    actions
  };
};

// 🎯 HOOK SIMPLIFICADO PARA MÉTRICAS BÁSICAS
export const useBundleMetrics = () => {
  const [metrics, setMetrics] = useState({
    chunksLoaded: 0,
    totalSize: '0 B',
    loadTime: 0
  });

  useEffect(() => {
    // Monitorar carregamento de chunks
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      let chunksLoaded = 0;
      let totalSize = 0;
      let totalLoadTime = 0;

      entries.forEach((entry) => {
        if (entry.name.includes('/assets/') && entry.name.endsWith('.js')) {
          chunksLoaded++;
          totalSize += (entry as PerformanceResourceTiming).transferSize || 0;
          totalLoadTime += entry.duration;
        }
      });

      if (chunksLoaded > 0) {
        setMetrics({
          chunksLoaded,
          totalSize: formatBytes(totalSize),
          loadTime: totalLoadTime
        });
      }
    });

    try {
      observer.observe({ entryTypes: ['resource'] });
    } catch (error) {
      console.warn('Performance observer not supported:', error);
    }

    return () => observer.disconnect();
  }, []);

  return metrics;
};

// 🚀 HOOK PARA MONITORAMENTO DE TREE SHAKING
export const useTreeShakingMonitor = () => {
  const [treeShakingData, setTreeShakingData] = useState({
    efficiency: 0,
    unusedExports: [] as string[],
    recommendations: [] as string[]
  });

  const analyzeTreeShaking = useCallback(async () => {
    try {
      const analysis = bundleAnalyzer.analyzeTreeShaking();
      setTreeShakingData(analysis);
    } catch (error) {
      console.error('Tree shaking analysis failed:', error);
    }
  }, []);

  useEffect(() => {
    // Analisar tree shaking após carregamento
    const timer = setTimeout(analyzeTreeShaking, 2000);
    return () => clearTimeout(timer);
  }, [analyzeTreeShaking]);

  return {
    ...treeShakingData,
    refresh: analyzeTreeShaking
  };
};

// 🔧 HOOK PARA OTIMIZAÇÃO DE IMPORTS
export const useImportOptimization = () => {
  const [optimizationData, setOptimizationData] = useState({
    totalPotential: 0,
    recommendations: [] as string[],
    isAnalyzing: false
  });

  const analyzeImports = useCallback(async () => {
    setOptimizationData(prev => ({ ...prev, isAnalyzing: true }));

    try {
      // Simular análise de imports (em produção, isso seria feito no build)
      const mockAnalyses = [
        {
          file: 'src/App.tsx',
          imports: [],
          recommendations: ['Consider using dynamic imports for non-critical components'],
          optimizationPotential: 15000
        },
        {
          file: 'src/components/FilterSidebar.tsx',
          imports: [],
          recommendations: ['Optimize lucide-react imports'],
          optimizationPotential: 8000
        }
      ];

      const totalPotential = mockAnalyses.reduce((sum, analysis) => sum + analysis.optimizationPotential, 0);
      const allRecommendations = mockAnalyses.flatMap(analysis => analysis.recommendations);

      setOptimizationData({
        totalPotential,
        recommendations: [...new Set(allRecommendations)],
        isAnalyzing: false
      });

    } catch (error) {
      console.error('Import optimization analysis failed:', error);
      setOptimizationData(prev => ({ ...prev, isAnalyzing: false }));
    }
  }, []);

  useEffect(() => {
    // Analisar imports após carregamento
    const timer = setTimeout(analyzeImports, 4000);
    return () => clearTimeout(timer);
  }, [analyzeImports]);

  return {
    ...optimizationData,
    refresh: analyzeImports,
    potentialSavings: formatBytes(optimizationData.totalPotential)
  };
};

// 🔧 UTILITY: Formatar bytes
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
