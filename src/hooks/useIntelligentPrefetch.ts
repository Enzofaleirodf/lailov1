import { useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useBehaviorTracker } from './useBehaviorTracker';
import { queryClient, prefetchQueries } from '../lib/queryClient';
import { QUERY_KEYS } from '../lib/queryClient';
import { processRealAuctions } from '../services/realAuctionService';

// 🚀 INTERFACE PARA CONFIGURAÇÃO DE PREFETCH
interface PrefetchConfig {
  enabled: boolean;
  maxConcurrentPrefetches: number;
  prefetchDelay: number;
  confidenceThreshold: number;
}

interface PrefetchItem {
  route: string;
  data?: any;
  priority: number;
  confidence: number;
  reason: string;
}

// 🚀 HOOK PARA PREFETCH INTELIGENTE BASEADO EM COMPORTAMENTO
export const useIntelligentPrefetch = (config: Partial<PrefetchConfig> = {}) => {
  let location;
  let behaviorTracker;

  try {
    location = useLocation();
    behaviorTracker = useBehaviorTracker();
  } catch (error) {
    // Fallback se não estiver dentro de Router
    console.warn('useIntelligentPrefetch: Router hooks failed, disabling prefetch');
    location = { pathname: window.location.pathname };
    behaviorTracker = {
      predictNextAction: () => null,
      trackClick: () => {},
      trackHover: () => {}
    };
  }

  const { predictNextAction, trackClick, trackHover } = behaviorTracker;
  
  const defaultConfig: PrefetchConfig = {
    enabled: false, // 🚨 DESABILITADO PARA EVITAR LOOPS
    maxConcurrentPrefetches: 3,
    prefetchDelay: 1000,
    confidenceThreshold: 0.5,
    ...config
  };

  const activePrefetches = useRef<Set<string>>(new Set());
  const prefetchQueue = useRef<PrefetchItem[]>([]);
  const lastPrefetchTime = useRef<number>(0);

  // 🔥 EXECUTAR PREFETCH DE ROTA
  const prefetchRoute = useCallback(async (route: string, priority: number = 1) => {
    if (!defaultConfig.enabled || activePrefetches.current.has(route)) {
      return;
    }

    if (activePrefetches.current.size >= defaultConfig.maxConcurrentPrefetches) {
      return;
    }

    activePrefetches.current.add(route);

    try {
      console.log(`🚀 Prefetching route: ${route} (priority: ${priority})`);

      // 1. PREFETCH COMPONENTE DA ROTA
      if (route.includes('/buscador/veiculos')) {
        await import('../pages/BuscadorListingPage');
      } else if (route.includes('/buscador/imoveis')) {
        await import('../pages/BuscadorListingPage');
      } else if (route.includes('/favoritos')) {
        await import('../pages/FavoritosPage');
      } else if (route.includes('/usuario')) {
        await import('../pages/UsuarioPage');
      }

      // 2. PREFETCH DADOS DA ROTA
      await prefetchRouteData(route);

      console.log(`✅ Prefetch completed: ${route}`);
    } catch (error) {
      console.warn(`⚠️ Prefetch failed: ${route}`, error);
    } finally {
      activePrefetches.current.delete(route);
    }
  }, [defaultConfig.enabled, defaultConfig.maxConcurrentPrefetches]);

  // 🔥 PREFETCH DADOS ESPECÍFICOS DA ROTA
  const prefetchRouteData = useCallback(async (route: string) => {
    // Extrair categoria e tipo da rota
    const veiculosMatch = route.match(/\/buscador\/veiculos\/(.+)/);
    const imoveisMatch = route.match(/\/buscador\/imoveis\/(.+)/);

    if (veiculosMatch) {
      const tipo = veiculosMatch[1];
      
      // Prefetch dados de veículos
      await queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.auctions.list('veiculos', tipo, {}, 'relevancia', '', 1, false),
        queryFn: () => processRealAuctions('veiculos', tipo, {}, 'relevancia', '', 1, false),
        staleTime: 2 * 60 * 1000, // 2 minutos
      });

      // Prefetch filtros de veículos
      await prefetchQueries.filterOptions('veiculos');
      
    } else if (imoveisMatch) {
      const tipo = imoveisMatch[1];
      
      // Prefetch dados de imóveis
      await queryClient.prefetchQuery({
        queryKey: QUERY_KEYS.auctions.list('imoveis', tipo, {}, 'relevancia', '', 1, false),
        queryFn: () => processRealAuctions('imoveis', tipo, {}, 'relevancia', '', 1, false),
        staleTime: 2 * 60 * 1000, // 2 minutos
      });

      // Prefetch filtros de imóveis
      await prefetchQueries.filterOptions('imoveis');
      
    } else if (route.includes('/favoritos')) {
      // Prefetch dados de favoritos (se usuário logado)
      // Implementar quando necessário
    }
  }, []);

  // 🔥 ADICIONAR ITEM À FILA DE PREFETCH
  const queuePrefetch = useCallback((item: PrefetchItem) => {
    // Verificar se já está na fila
    const exists = prefetchQueue.current.find(p => p.route === item.route);
    if (exists) {
      // Atualizar prioridade se for maior
      if (item.priority > exists.priority) {
        exists.priority = item.priority;
        exists.confidence = item.confidence;
      }
      return;
    }

    prefetchQueue.current.push(item);
    
    // Ordenar por prioridade e confiança
    prefetchQueue.current.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return b.confidence - a.confidence;
    });

    // Manter apenas os 10 primeiros
    if (prefetchQueue.current.length > 10) {
      prefetchQueue.current = prefetchQueue.current.slice(0, 10);
    }
  }, []);

  // 🔥 PROCESSAR FILA DE PREFETCH
  const processPrefetchQueue = useCallback(async () => {
    if (!defaultConfig.enabled || prefetchQueue.current.length === 0) {
      return;
    }

    const now = Date.now();
    if (now - lastPrefetchTime.current < defaultConfig.prefetchDelay) {
      return;
    }

    const item = prefetchQueue.current.shift();
    if (!item || item.confidence < defaultConfig.confidenceThreshold) {
      return;
    }

    lastPrefetchTime.current = now;
    await prefetchRoute(item.route, item.priority);
  }, [defaultConfig.enabled, defaultConfig.prefetchDelay, defaultConfig.confidenceThreshold, prefetchRoute]);

  // 🚀 PREFETCH BASEADO EM PREDIÇÃO DE COMPORTAMENTO
  const prefetchBasedOnBehavior = useCallback(() => {
    const prediction = predictNextAction();
    
    if (prediction && prediction.confidence >= defaultConfig.confidenceThreshold) {
      console.log(`🎯 Behavior prediction:`, prediction);
      
      queuePrefetch({
        route: prediction.nextRoute,
        priority: Math.round(prediction.confidence * 10),
        confidence: prediction.confidence,
        reason: prediction.reason
      });
    }
  }, [predictNextAction, defaultConfig.confidenceThreshold, queuePrefetch]);

  // 🚀 PREFETCH BASEADO NA ROTA ATUAL
  const prefetchRelatedRoutes = useCallback(() => {
    const currentRoute = location.pathname;
    
    // 1. CATEGORIA OPOSTA
    if (currentRoute.includes('/buscador/veiculos')) {
      queuePrefetch({
        route: '/buscador/imoveis/todos',
        priority: 7,
        confidence: 0.6,
        reason: 'Categoria oposta (veículos → imóveis)'
      });
    } else if (currentRoute.includes('/buscador/imoveis')) {
      queuePrefetch({
        route: '/buscador/veiculos/todos',
        priority: 7,
        confidence: 0.6,
        reason: 'Categoria oposta (imóveis → veículos)'
      });
    }
    
    // 2. FAVORITOS (rota comum)
    if (!currentRoute.includes('/favoritos')) {
      queuePrefetch({
        route: '/favoritos',
        priority: 5,
        confidence: 0.4,
        reason: 'Rota comum (favoritos)'
      });
    }
    
    // 3. TIPOS RELACIONADOS NA MESMA CATEGORIA
    const veiculosMatch = currentRoute.match(/\/buscador\/veiculos\/(.+)/);
    const imoveisMatch = currentRoute.match(/\/buscador\/imoveis\/(.+)/);
    
    if (veiculosMatch && veiculosMatch[1] !== 'todos') {
      queuePrefetch({
        route: '/buscador/veiculos/todos',
        priority: 6,
        confidence: 0.5,
        reason: 'Tipo geral da categoria'
      });
    }
    
    if (imoveisMatch && imoveisMatch[1] !== 'todos') {
      queuePrefetch({
        route: '/buscador/imoveis/todos',
        priority: 6,
        confidence: 0.5,
        reason: 'Tipo geral da categoria'
      });
    }
  }, [location.pathname, queuePrefetch]);

  // 🔥 PREFETCH PRÓXIMA PÁGINA
  const prefetchNextPage = useCallback(() => {
    const currentRoute = location.pathname;
    const urlParams = new URLSearchParams(location.search);
    const currentPage = parseInt(urlParams.get('page') || '1');
    
    if (currentPage < 5) { // Limite razoável
      const nextPageUrl = `${currentRoute}?page=${currentPage + 1}`;
      queuePrefetch({
        route: nextPageUrl,
        priority: 8,
        confidence: 0.7,
        reason: 'Próxima página na paginação'
      });
    }
  }, [location.pathname, location.search, queuePrefetch]);

  // 🔥 HOOK PARA TRACKING DE HOVER COM PREFETCH
  const createHoverPrefetch = useCallback((route: string, enabled: boolean = true) => {
    return {
      onMouseEnter: () => {
        if (enabled) {
          trackHover(route);
          queuePrefetch({
            route,
            priority: 9,
            confidence: 0.8,
            reason: 'Hover intent detected'
          });
        }
      },
      onMouseLeave: () => {
        // Opcional: cancelar prefetch se ainda não iniciado
      }
    };
  }, [trackHover, queuePrefetch]);

  // 🔥 HOOK PARA TRACKING DE CLICK
  const createClickTracker = useCallback((element: string) => {
    return {
      onClick: () => {
        trackClick(element);
      }
    };
  }, [trackClick]);

  // 🔥 SETUP: Executar prefetches baseados em comportamento
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchBasedOnBehavior();
      prefetchRelatedRoutes();
      prefetchNextPage();
    }, 1000); // Aguardar 1 segundo após mudança de rota

    return () => clearTimeout(timer);
  }, [location.pathname, prefetchBasedOnBehavior, prefetchRelatedRoutes, prefetchNextPage]);

  // 🔥 SETUP: Processar fila de prefetch periodicamente
  useEffect(() => {
    const interval = setInterval(processPrefetchQueue, 2000); // A cada 2 segundos
    return () => clearInterval(interval);
  }, [processPrefetchQueue]);

  return {
    // Manual prefetch
    prefetchRoute,
    queuePrefetch,
    
    // Helpers para componentes
    createHoverPrefetch,
    createClickTracker,
    
    // Status
    getActivePrefetches: () => Array.from(activePrefetches.current),
    getPrefetchQueue: () => [...prefetchQueue.current],
    
    // Config
    isEnabled: defaultConfig.enabled
  };
};
