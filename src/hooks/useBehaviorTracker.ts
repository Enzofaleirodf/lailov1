import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// 🚀 INTERFACE PARA TRACKING DE COMPORTAMENTO
interface UserBehavior {
  visitedRoutes: string[];
  timeOnPage: Record<string, number>;
  clickPatterns: Record<string, number>;
  hoverPatterns: Record<string, number>;
  scrollDepth: Record<string, number>;
  filterUsage: Record<string, number>;
  lastActivity: number;
}

interface BehaviorPrediction {
  nextRoute: string;
  confidence: number;
  reason: string;
}

// 🚀 HOOK PARA TRACKING DE COMPORTAMENTO DO USUÁRIO
export const useBehaviorTracker = () => {
  let location;

  try {
    location = useLocation();
  } catch (error) {
    // Fallback se não estiver dentro de Router
    console.warn('useBehaviorTracker: useLocation failed, using fallback');
    location = { pathname: window.location.pathname };
  }
  const behaviorRef = useRef<UserBehavior>({
    visitedRoutes: [],
    timeOnPage: {},
    clickPatterns: {},
    hoverPatterns: {},
    scrollDepth: {},
    filterUsage: {},
    lastActivity: Date.now()
  });
  const pageStartTime = useRef<number>(Date.now());
  const maxScrollDepth = useRef<number>(0);

  // 🔥 SALVAR COMPORTAMENTO NO LOCALSTORAGE
  const saveBehavior = useCallback(() => {
    try {
      localStorage.setItem('lailo-user-behavior', JSON.stringify(behaviorRef.current));
    } catch (error) {
      // Ignorar erros de localStorage
    }
  }, []);

  // 🔥 CARREGAR COMPORTAMENTO DO LOCALSTORAGE
  const loadBehavior = useCallback(() => {
    try {
      const saved = localStorage.getItem('lailo-user-behavior');
      if (saved) {
        const parsed = JSON.parse(saved);
        behaviorRef.current = { ...behaviorRef.current, ...parsed };
      }
    } catch (error) {
      // Ignorar erros de localStorage
    }
  }, []);

  // 🔥 TRACK VISITA DE ROTA
  const trackRouteVisit = useCallback((route: string) => {
    const behavior = behaviorRef.current;
    
    // Adicionar à lista de rotas visitadas
    if (!behavior.visitedRoutes.includes(route)) {
      behavior.visitedRoutes.push(route);
      
      // Manter apenas as últimas 20 rotas
      if (behavior.visitedRoutes.length > 20) {
        behavior.visitedRoutes.shift();
      }
    }
    
    behavior.lastActivity = Date.now();
    saveBehavior();
  }, [saveBehavior]);

  // 🔥 TRACK TEMPO NA PÁGINA
  const trackTimeOnPage = useCallback((route: string, timeSpent: number) => {
    const behavior = behaviorRef.current;
    behavior.timeOnPage[route] = (behavior.timeOnPage[route] || 0) + timeSpent;
    saveBehavior();
  }, [saveBehavior]);

  // 🔥 TRACK CLIQUES
  const trackClick = useCallback((element: string) => {
    const behavior = behaviorRef.current;
    behavior.clickPatterns[element] = (behavior.clickPatterns[element] || 0) + 1;
    behavior.lastActivity = Date.now();
    saveBehavior();
  }, [saveBehavior]);

  // 🔥 TRACK HOVER
  const trackHover = useCallback((element: string) => {
    const behavior = behaviorRef.current;
    behavior.hoverPatterns[element] = (behavior.hoverPatterns[element] || 0) + 1;
    behavior.lastActivity = Date.now();
    saveBehavior();
  }, [saveBehavior]);

  // 🔥 TRACK SCROLL DEPTH
  const trackScrollDepth = useCallback(() => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
    );
    
    if (scrollPercent > maxScrollDepth.current) {
      maxScrollDepth.current = scrollPercent;
      
      const route = location.pathname;
      const behavior = behaviorRef.current;
      behavior.scrollDepth[route] = Math.max(behavior.scrollDepth[route] || 0, scrollPercent);
      behavior.lastActivity = Date.now();
    }
  }, [location.pathname]);

  // 🔥 TRACK USO DE FILTROS
  const trackFilterUsage = useCallback((filterType: string) => {
    const behavior = behaviorRef.current;
    behavior.filterUsage[filterType] = (behavior.filterUsage[filterType] || 0) + 1;
    behavior.lastActivity = Date.now();
    saveBehavior();
  }, [saveBehavior]);

  // 🚀 PREDIZER PRÓXIMA AÇÃO BASEADA NO COMPORTAMENTO
  const predictNextAction = useCallback((): BehaviorPrediction | null => {
    const behavior = behaviorRef.current;
    const currentRoute = location.pathname;
    
    // 1. PADRÃO: Alternância entre veículos e imóveis
    if (currentRoute.includes('/buscador/veiculos')) {
      const imoveisVisits = behavior.visitedRoutes.filter(r => r.includes('/buscador/imoveis')).length;
      if (imoveisVisits > 0) {
        return {
          nextRoute: '/buscador/imoveis/todos',
          confidence: 0.7,
          reason: 'Usuário alterna entre veículos e imóveis'
        };
      }
    }
    
    if (currentRoute.includes('/buscador/imoveis')) {
      const veiculosVisits = behavior.visitedRoutes.filter(r => r.includes('/buscador/veiculos')).length;
      if (veiculosVisits > 0) {
        return {
          nextRoute: '/buscador/veiculos/todos',
          confidence: 0.7,
          reason: 'Usuário alterna entre imóveis e veículos'
        };
      }
    }
    
    // 2. PADRÃO: Navegação para favoritos após browsing
    const timeOnCurrentPage = Date.now() - pageStartTime.current;
    const scrollDepth = behavior.scrollDepth[currentRoute] || 0;
    
    if (timeOnCurrentPage > 30000 && scrollDepth > 50) { // 30s+ e scroll > 50%
      const favoritosVisits = behavior.visitedRoutes.filter(r => r.includes('/favoritos')).length;
      if (favoritosVisits > 0) {
        return {
          nextRoute: '/favoritos',
          confidence: 0.6,
          reason: 'Usuário navega para favoritos após browsing'
        };
      }
    }
    
    // 3. PADRÃO: Próxima página na paginação
    const paginationClicks = behavior.clickPatterns['pagination'] || 0;
    if (paginationClicks > 2) {
      return {
        nextRoute: `${currentRoute}?page=next`,
        confidence: 0.8,
        reason: 'Usuário frequentemente usa paginação'
      };
    }
    
    // 4. PADRÃO: Rota mais visitada
    const routeCounts = behavior.visitedRoutes.reduce((acc, route) => {
      acc[route] = (acc[route] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostVisited = Object.entries(routeCounts)
      .filter(([route]) => route !== currentRoute)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (mostVisited && mostVisited[1] > 2) {
      return {
        nextRoute: mostVisited[0],
        confidence: 0.5,
        reason: 'Rota mais visitada pelo usuário'
      };
    }
    
    return null;
  }, [location.pathname]);

  // 🔥 SETUP: Carregar comportamento e configurar listeners
  useEffect(() => {
    loadBehavior();
    
    // Track scroll
    const handleScroll = () => trackScrollDepth();
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [loadBehavior, trackScrollDepth]);

  // 🔥 TRACK: Mudança de rota
  useEffect(() => {
    const route = location.pathname;
    
    // Track tempo na página anterior
    if (pageStartTime.current) {
      const timeSpent = Date.now() - pageStartTime.current;
      const previousRoute = behaviorRef.current.visitedRoutes[behaviorRef.current.visitedRoutes.length - 1];
      if (previousRoute && timeSpent > 1000) { // Mínimo 1 segundo
        trackTimeOnPage(previousRoute, timeSpent);
      }
    }
    
    // Track nova rota
    trackRouteVisit(route);
    pageStartTime.current = Date.now();
    maxScrollDepth.current = 0;
  }, [location.pathname, trackRouteVisit, trackTimeOnPage]);

  // 🔥 CLEANUP: Salvar tempo na página ao sair
  useEffect(() => {
    const handleBeforeUnload = () => {
      const route = location.pathname;
      const timeSpent = Date.now() - pageStartTime.current;
      if (timeSpent > 1000) {
        trackTimeOnPage(route, timeSpent);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [location.pathname, trackTimeOnPage]);

  return {
    // Tracking functions
    trackClick,
    trackHover,
    trackFilterUsage,
    
    // Prediction
    predictNextAction,
    
    // Behavior data (read-only)
    getBehavior: () => ({ ...behaviorRef.current }),
    
    // Utils
    clearBehavior: () => {
      behaviorRef.current = {
        visitedRoutes: [],
        timeOnPage: {},
        clickPatterns: {},
        hoverPatterns: {},
        scrollDepth: {},
        filterUsage: {},
        lastActivity: Date.now()
      };
      saveBehavior();
    }
  };
};
