import React, { useState, useEffect } from 'react';
import { performanceMonitor, PerformanceAlert } from '../lib/performanceMonitor';

/**
 * 🚀 PERFORMANCE NOTIFICATIONS
 * Componente para exibir notificações de performance em tempo real
 * Mostra alertas críticos e warnings de performance
 */

export const PerformanceNotifications: React.FC = () => {
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<number>>(new Set());

  // 🚨 APENAS MOSTRAR EM DESENVOLVIMENTO OU SE EXPLICITAMENTE HABILITADO
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isEnabled = localStorage.getItem('lailo-performance-notifications') === 'enabled';

  if (!isDevelopment && !isEnabled) {
    return null;
  }

  useEffect(() => {
    const updateAlerts = () => {
      const allAlerts = performanceMonitor.getAlerts();
      // Mostrar apenas os últimos 3 alertas não dismissados
      const recentAlerts = allAlerts
        .slice(-3)
        .filter(alert => !dismissedAlerts.has(alert.timestamp));
      setAlerts(recentAlerts);
    };

    updateAlerts();
    const interval = setInterval(updateAlerts, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [dismissedAlerts]);

  const dismissAlert = (timestamp: number) => {
    setDismissedAlerts(prev => new Set([...prev, timestamp]));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {alerts.map((alert) => (
        <div
          key={alert.timestamp}
          className={`p-4 rounded-lg shadow-lg border-l-4 ${
            alert.type === 'critical'
              ? 'bg-error-50 border-error-500 text-error-800'
              : 'bg-yellow-50 border-yellow-500 text-yellow-800'
          } animate-slide-in-right`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">
                  {alert.type === 'critical' ? '🚨' : '⚠️'}
                </span>
                <span className="font-semibold text-sm">
                  Performance {alert.type === 'critical' ? 'Critical' : 'Warning'}
                </span>
              </div>
              <p className="text-sm mb-2">{alert.message}</p>
              <div className="text-xs opacity-75">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </div>
            </div>
            <button
              onClick={() => dismissAlert(alert.timestamp)}
              className="ml-2 text-gray-400 hover:text-gray-600 text-lg font-bold"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// CSS Animation (add to your global CSS or use Tailwind)
const styles = `
@keyframes slide-in-right {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slide-in-right 0.3s ease-out;
}
`;

// Inject styles if not using Tailwind
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
