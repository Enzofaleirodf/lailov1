import React, { useState, useEffect } from 'react';
import { performanceMonitor, CoreWebVitals, PerformanceAlert } from '../lib/performanceMonitor';
import { getMetricsReport } from '../utils/advancedMetrics';
import { getCacheMetrics } from '../utils/serviceWorkerInterface';

/**
 * 🚀 PERFORMANCE DASHBOARD
 * Dashboard visual para monitoramento de performance em tempo real
 * Exibe Core Web Vitals, métricas customizadas e alertas
 */

interface DashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

export const PerformanceDashboard: React.FC<DashboardProps> = ({ isVisible, onClose }) => {
  const [coreWebVitals, setCoreWebVitals] = useState<CoreWebVitals>({
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fcp: null,
  });
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [advancedMetrics, setAdvancedMetrics] = useState<any>(null);
  const [cacheMetrics, setCacheMetrics] = useState<any>(null);

  useEffect(() => {
    if (!isVisible) return;

    const updateData = async () => {
      setCoreWebVitals(performanceMonitor.getCoreWebVitals());
      setAlerts(performanceMonitor.getAlerts().slice(-5)); // Last 5 alerts
      setMetrics(performanceMonitor.getMetrics().slice(-20)); // Last 20 metrics

      // 🚀 ADVANCED METRICS: Coletar métricas avançadas
      try {
        const advancedReport = getMetricsReport();
        setAdvancedMetrics(advancedReport);

        const cacheReport = await getCacheMetrics();
        setCacheMetrics(cacheReport);
      } catch (error) {
        console.warn('Failed to collect advanced metrics:', error);
      }
    };

    updateData();
    const interval = setInterval(updateData, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const getScoreColor = (value: number | null, thresholds: { good: number; poor: number }): string => {
    if (value === null) return 'text-gray-400';
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.poor) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatValue = (value: number | null, unit: string): string => {
    if (value === null) return 'N/A';
    return `${value.toFixed(unit === '' ? 3 : 0)}${unit}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            📊 Performance Dashboard
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Core Web Vitals */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🎯 Core Web Vitals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600 mb-1">LCP</div>
                <div className={`text-2xl font-bold ${getScoreColor(coreWebVitals.lcp, { good: 2500, poor: 4000 })}`}>
                  {formatValue(coreWebVitals.lcp, 'ms')}
                </div>
                <div className="text-xs text-gray-500">Largest Contentful Paint</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600 mb-1">FID</div>
                <div className={`text-2xl font-bold ${getScoreColor(coreWebVitals.fid, { good: 100, poor: 300 })}`}>
                  {formatValue(coreWebVitals.fid, 'ms')}
                </div>
                <div className="text-xs text-gray-500">First Input Delay</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600 mb-1">CLS</div>
                <div className={`text-2xl font-bold ${getScoreColor(coreWebVitals.cls, { good: 0.1, poor: 0.25 })}`}>
                  {formatValue(coreWebVitals.cls, '')}
                </div>
                <div className="text-xs text-gray-500">Cumulative Layout Shift</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600 mb-1">TTFB</div>
                <div className={`text-2xl font-bold ${getScoreColor(coreWebVitals.ttfb, { good: 800, poor: 1800 })}`}>
                  {formatValue(coreWebVitals.ttfb, 'ms')}
                </div>
                <div className="text-xs text-gray-500">Time to First Byte</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm font-medium text-gray-600 mb-1">FCP</div>
                <div className={`text-2xl font-bold ${getScoreColor(coreWebVitals.fcp, { good: 1800, poor: 3000 })}`}>
                  {formatValue(coreWebVitals.fcp, 'ms')}
                </div>
                <div className="text-xs text-gray-500">First Contentful Paint</div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {alerts.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🚨 Recent Alerts</h3>
              <div className="space-y-2">
                {alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.type === 'critical'
                        ? 'bg-red-50 border-red-500 text-red-800'
                        : 'bg-yellow-50 border-yellow-500 text-yellow-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{alert.message}</div>
                      <div className="text-sm opacity-75">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Metrics */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">📈 Recent Metrics</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {metrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="font-medium text-gray-700">{metric.name}</div>
                    <div className="text-gray-600">
                      {metric.value.toFixed(2)}
                      {metric.name.includes('memory') ? 'MB' : 
                       metric.name.includes('rate') ? '%' : 
                       metric.name.includes('cls') ? '' : 'ms'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(metric.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Advanced Metrics */}
          {advancedMetrics && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">🚀 Advanced Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* System Metrics */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">🖥️ System</h4>
                  <div className="space-y-1 text-sm">
                    <div>Device: {advancedMetrics.system?.deviceType || 'Unknown'}</div>
                    <div>Memory: {formatBytes(advancedMetrics.system?.memoryUsage || 0)}</div>
                    <div>Connection: {advancedMetrics.system?.connectionType || 'Unknown'}</div>
                  </div>
                </div>

                {/* User Experience */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-green-900 mb-2">👤 User Experience</h4>
                  <div className="space-y-1 text-sm">
                    <div>Session: {formatDuration(advancedMetrics.userExperience?.sessionDuration || 0)}</div>
                    <div>Interactions: {advancedMetrics.userExperience?.interactionRate || 0}</div>
                    <div>Filters Used: {advancedMetrics.userExperience?.filtersUsed || 0}</div>
                  </div>
                </div>

                {/* Performance Details */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">⚡ Performance</h4>
                  <div className="space-y-1 text-sm">
                    <div>JS Size: {formatBytes(advancedMetrics.performance?.jsSize || 0)}</div>
                    <div>CSS Size: {formatBytes(advancedMetrics.performance?.cssSize || 0)}</div>
                    <div>Total Size: {formatBytes(advancedMetrics.performance?.totalSize || 0)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Cache Metrics */}
          {cacheMetrics && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">💾 Cache Metrics</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{cacheMetrics.caches?.length || 0}</div>
                    <div className="text-sm text-gray-600">Active Caches</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{cacheMetrics.metrics?.hits || 0}</div>
                    <div className="text-sm text-gray-600">Cache Hits</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-yellow-600">{cacheMetrics.metrics?.misses || 0}</div>
                    <div className="text-sm text-gray-600">Cache Misses</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{cacheMetrics.version || 'N/A'}</div>
                    <div className="text-sm text-gray-600">SW Version</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Score */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">🏆 Performance Score</h3>
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-indigo-600 mb-2">
                  {calculatePerformanceScore(coreWebVitals)}
                </div>
                <div className="text-lg text-gray-700">Overall Performance Score</div>
                <div className="text-sm text-gray-500 mt-2">
                  Based on Core Web Vitals and custom metrics
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => {
                const reports = localStorage.getItem('performance-reports');
                if (reports) {
                  const blob = new Blob([reports], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `performance-report-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📥 Export Report
            </button>
            
            <button
              onClick={() => {
                localStorage.removeItem('performance-reports');
                setAlerts([]);
                setMetrics([]);
              }}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              🗑️ Clear Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

// Helper function to calculate performance score
function calculatePerformanceScore(vitals: CoreWebVitals): number {
  const scores: number[] = [];
  
  // LCP Score
  if (vitals.lcp !== null) {
    if (vitals.lcp <= 2500) scores.push(100);
    else if (vitals.lcp <= 4000) scores.push(75);
    else scores.push(50);
  }
  
  // FID Score
  if (vitals.fid !== null) {
    if (vitals.fid <= 100) scores.push(100);
    else if (vitals.fid <= 300) scores.push(75);
    else scores.push(50);
  }
  
  // CLS Score
  if (vitals.cls !== null) {
    if (vitals.cls <= 0.1) scores.push(100);
    else if (vitals.cls <= 0.25) scores.push(75);
    else scores.push(50);
  }
  
  // TTFB Score
  if (vitals.ttfb !== null) {
    if (vitals.ttfb <= 800) scores.push(100);
    else if (vitals.ttfb <= 1800) scores.push(75);
    else scores.push(50);
  }
  
  // FCP Score
  if (vitals.fcp !== null) {
    if (vitals.fcp <= 1800) scores.push(100);
    else if (vitals.fcp <= 3000) scores.push(75);
    else scores.push(50);
  }
  
  return scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
}

// Performance Dashboard Toggle Hook
export const usePerformanceDashboard = () => {
  const [isVisible, setIsVisible] = useState(false);

  // 🚨 APENAS EM DESENVOLVIMENTO
  const isDevelopment = process.env.NODE_ENV === 'development';

  useEffect(() => {
    if (!isDevelopment) return;

    const handleKeyPress = (event: KeyboardEvent) => {
      // Ctrl + Shift + P to toggle dashboard
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isDevelopment]);

  return {
    isVisible: isDevelopment ? isVisible : false, // 🚨 FORÇAR FALSE EM PRODUÇÃO
    show: () => isDevelopment && setIsVisible(true),
    hide: () => setIsVisible(false),
    toggle: () => isDevelopment && setIsVisible(prev => !prev),
  };
};
