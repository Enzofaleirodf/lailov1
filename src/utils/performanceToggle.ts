/**
 * 🚀 PERFORMANCE MONITORING TOGGLE
 * Utilitários para habilitar/desabilitar monitoring em produção
 */

// Habilitar performance monitoring
export const enablePerformanceMonitoring = () => {
  localStorage.setItem('lailo-performance-monitoring', 'enabled');
  localStorage.setItem('lailo-performance-notifications', 'enabled');
  console.log('🚀 Performance monitoring enabled! Reload the page to activate.');
  console.log('📊 Use Ctrl+Shift+P to open dashboard');
};

// Desabilitar performance monitoring
export const disablePerformanceMonitoring = () => {
  localStorage.removeItem('lailo-performance-monitoring');
  localStorage.removeItem('lailo-performance-notifications');
  console.log('🛑 Performance monitoring disabled! Reload the page to deactivate.');
};

// Verificar status
export const getPerformanceMonitoringStatus = () => {
  const monitoring = localStorage.getItem('lailo-performance-monitoring') === 'enabled';
  const notifications = localStorage.getItem('lailo-performance-notifications') === 'enabled';
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return {
    monitoring: isDevelopment || monitoring,
    notifications: isDevelopment || notifications,
    isDevelopment
  };
};

// Adicionar comandos globais para debug
if (typeof window !== 'undefined') {
  (window as any).lailoPerformance = {
    enable: enablePerformanceMonitoring,
    disable: disablePerformanceMonitoring,
    status: getPerformanceMonitoringStatus,
    help: () => {
      console.log('🚀 Lailo Performance Monitoring Commands:');
      console.log('  lailoPerformance.enable()  - Enable monitoring');
      console.log('  lailoPerformance.disable() - Disable monitoring');
      console.log('  lailoPerformance.status()  - Check status');
      console.log('  lailoPerformance.report()  - Generate performance report');
      console.log('  lailoPerformance.vitals()  - Show Core Web Vitals');
      console.log('  Ctrl+Shift+P               - Open dashboard (dev only)');
    },

    // 🚀 PERFORMANCE METRICS: Comandos para métricas
    report: () => {
      import('../lib/performanceMetrics').then(({ performanceMetrics }) => {
        const report = performanceMetrics.generateReport();
        console.log('📊 Performance Report:');
        console.log(report);
      });
    },

    vitals: () => {
      import('../lib/performanceMetrics').then(({ performanceMetrics }) => {
        const vitals = performanceMetrics.getCoreWebVitals();
        console.log('📊 Core Web Vitals:');
        console.table(vitals);
      });
    }
  };
}
