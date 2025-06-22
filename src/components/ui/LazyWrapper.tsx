import React, { Suspense, ComponentType, LazyExoticComponent } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import { performanceMetrics } from '../../lib/performanceMetrics';

interface LazyWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  minDelay?: number; // Delay mínimo para evitar flash
}

// 🚀 WRAPPER INTELIGENTE PARA LAZY LOADING
export const LazyWrapper: React.FC<LazyWrapperProps> = ({
  children,
  fallback,
  minDelay = 200
}) => {
  const [showFallback, setShowFallback] = React.useState(false);

  // 🚀 DELAY INTELIGENTE: Só mostrar fallback se demorar mais que minDelay
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, minDelay);

    return () => clearTimeout(timer);
  }, [minDelay]);

  const defaultFallback = showFallback ? (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="md" />
        <p className="mt-3 text-sm text-gray-500">Carregando...</p>
      </div>
    </div>
  ) : null;

  return (
    <Suspense fallback={fallback || defaultFallback}>
      {children}
    </Suspense>
  );
};

// 🚀 HOC PARA CRIAR COMPONENTES LAZY COM PRELOAD
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: {
    preload?: boolean;
    chunkName?: string;
  } = {}
): LazyExoticComponent<T> & { preload: () => Promise<{ default: T }> } {
  
  let importPromise: Promise<{ default: T }> | null = null;
  
  const LazyComponent = React.lazy(() => {
    if (!importPromise) {
      const startTime = performance.now();
      importPromise = importFn().then((module) => {
        // 🚀 PERFORMANCE: Medir tempo de carregamento do chunk
        const loadTime = performance.now() - startTime;
        performanceMetrics.measureChunkLoading(options.chunkName || 'unknown', startTime);
        console.log(`🚀 Chunk loaded: ${options.chunkName || 'unknown'} in ${loadTime.toFixed(2)}ms`);
        return module;
      });
    }
    return importPromise;
  }) as LazyExoticComponent<T> & { preload: () => Promise<{ default: T }> };

  // 🚀 FUNÇÃO DE PRELOAD
  LazyComponent.preload = () => {
    if (!importPromise) {
      importPromise = importFn();
    }
    return importPromise;
  };

  // 🚀 PRELOAD AUTOMÁTICO SE SOLICITADO
  if (options.preload) {
    // Preload após um pequeno delay para não bloquear o carregamento inicial
    setTimeout(() => {
      LazyComponent.preload();
    }, 100);
  }

  return LazyComponent;
}

// 🚀 HOOK PARA PRELOAD INTELIGENTE
export const usePreloadRoute = (
  lazyComponent: { preload: () => Promise<any> },
  condition: boolean = true
) => {
  React.useEffect(() => {
    if (condition) {
      lazyComponent.preload().catch(() => {
        // Ignorar erros de preload
      });
    }
  }, [lazyComponent, condition]);
};

// 🚀 COMPONENTE DE ERRO BOUNDARY PARA LAZY LOADING
interface LazyErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LazyErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  LazyErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LazyErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy loading error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent && this.state.error) {
        return <FallbackComponent error={this.state.error} />;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-600 text-2xl">⚠️</span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Erro ao carregar página
            </h2>
            <p className="text-gray-600 mb-4">
              Ocorreu um erro ao carregar esta página. Tente recarregar.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
