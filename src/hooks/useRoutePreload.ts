import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';

// 🚀 MAPA DE ROTAS PARA PRELOAD
const routePreloadMap = new Map<string, () => Promise<any>>();

// 🚀 REGISTRAR COMPONENTES LAZY PARA PRELOAD
export const registerRoutePreload = (path: string, preloadFn: () => Promise<any>) => {
  routePreloadMap.set(path, preloadFn);
};

// 🚀 HOOK PARA PRELOAD INTELIGENTE DE ROTAS
export const useRoutePreload = () => {
  const location = useLocation();
  const preloadedRoutes = useRef(new Set<string>());
  const preloadTimeouts = useRef(new Map<string, NodeJS.Timeout>());

  // 🚀 PRELOAD IMEDIATO DE ROTA
  const preloadRoute = useCallback((path: string) => {
    if (preloadedRoutes.current.has(path)) {
      return; // Já foi precarregado
    }

    const preloadFn = routePreloadMap.get(path);
    if (preloadFn) {
      preloadedRoutes.current.add(path);
      preloadFn().catch(() => {
        // Remover da lista se falhou
        preloadedRoutes.current.delete(path);
      });
    }
  }, []);

  // 🚀 PRELOAD COM DELAY (PARA HOVER)
  const preloadRouteWithDelay = useCallback((path: string, delay: number = 200) => {
    // Cancelar preload anterior se existir
    const existingTimeout = preloadTimeouts.current.get(path);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Agendar novo preload
    const timeout = setTimeout(() => {
      preloadRoute(path);
      preloadTimeouts.current.delete(path);
    }, delay);

    preloadTimeouts.current.set(path, timeout);
  }, [preloadRoute]);

  // 🚀 CANCELAR PRELOAD
  const cancelPreload = useCallback((path: string) => {
    const timeout = preloadTimeouts.current.get(path);
    if (timeout) {
      clearTimeout(timeout);
      preloadTimeouts.current.delete(path);
    }
  }, []);

  // 🚀 PRELOAD AUTOMÁTICO DE ROTAS RELACIONADAS
  useEffect(() => {
    const currentPath = location.pathname;
    
    // Preload de rotas relacionadas baseado na rota atual
    if (currentPath.includes('/buscador/veiculos')) {
      // Se está em veículos, preload de imóveis
      preloadRouteWithDelay('/buscador/imoveis/todos', 1000);
    } else if (currentPath.includes('/buscador/imoveis')) {
      // Se está em imóveis, preload de veículos
      preloadRouteWithDelay('/buscador/veiculos/todos', 1000);
    }

    // Preload de favoritos e usuário (rotas comuns)
    if (!currentPath.includes('/favoritos')) {
      preloadRouteWithDelay('/favoritos', 2000);
    }
    if (!currentPath.includes('/usuario')) {
      preloadRouteWithDelay('/usuario', 3000);
    }
  }, [location.pathname, preloadRouteWithDelay]);

  // 🚀 CLEANUP
  useEffect(() => {
    return () => {
      // Limpar todos os timeouts ao desmontar
      preloadTimeouts.current.forEach(timeout => clearTimeout(timeout));
      preloadTimeouts.current.clear();
    };
  }, []);

  return {
    preloadRoute,
    preloadRouteWithDelay,
    cancelPreload,
    isPreloaded: (path: string) => preloadedRoutes.current.has(path)
  };
};

// 🚀 HOOK PARA PRELOAD EM HOVER
export const useHoverPreload = (path: string, enabled: boolean = true) => {
  const { preloadRouteWithDelay, cancelPreload } = useRoutePreload();

  const handleMouseEnter = useCallback(() => {
    if (enabled) {
      preloadRouteWithDelay(path, 200); // 200ms delay
    }
  }, [path, enabled, preloadRouteWithDelay]);

  const handleMouseLeave = useCallback(() => {
    if (enabled) {
      cancelPreload(path);
    }
  }, [path, enabled, cancelPreload]);

  return {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave
  };
};

// 🚀 HOOK PARA PRELOAD EM INTERSECTION (QUANDO ELEMENTO FICA VISÍVEL)
export const useIntersectionPreload = (
  path: string,
  options: IntersectionObserverInit = {}
) => {
  const { preloadRoute } = useRoutePreload();
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            preloadRoute(path);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '100px', // Preload 100px antes de ficar visível
        threshold: 0.1,
        ...options
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [path, preloadRoute]);

  return elementRef;
};

// 🚀 COMPONENTE PARA PRELOAD AUTOMÁTICO
interface RoutePreloaderProps {
  routes: Array<{
    path: string;
    preloadFn: () => Promise<any>;
    priority?: number; // 1 = alta, 2 = média, 3 = baixa
  }>;
}

export const RoutePreloader: React.FC<RoutePreloaderProps> = ({ routes }) => {
  useEffect(() => {
    // Registrar todas as rotas
    routes.forEach(({ path, preloadFn }) => {
      registerRoutePreload(path, preloadFn);
    });

    // Preload baseado em prioridade
    const sortedRoutes = [...routes].sort((a, b) => (a.priority || 3) - (b.priority || 3));
    
    sortedRoutes.forEach(({ preloadFn, priority = 3 }, index) => {
      const delay = priority === 1 ? 100 : priority === 2 ? 500 : 1000 + (index * 200);
      
      setTimeout(() => {
        preloadFn().catch(() => {
          // Ignorar erros de preload
        });
      }, delay);
    });
  }, [routes]);

  return null; // Componente invisível
};
