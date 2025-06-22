import { useEffect, useRef, useCallback } from 'react';
import { performanceMetrics } from '../lib/performanceMetrics';

interface SmartPrefetchOptions {
  enabled?: boolean;
  hoverDelay?: number; // Delay antes de fazer prefetch no hover
  confidenceThreshold?: number; // Confiança mínima para prefetch
  maxConcurrentPrefetches?: number;
  prefetchImages?: boolean;
  prefetchChunks?: boolean;
}

interface PrefetchItem {
  url: string;
  type: 'image' | 'chunk' | 'page';
  priority: number;
  timestamp: number;
}

// 🚀 SMART PREFETCH: Hook para prefetch inteligente baseado em comportamento
export const useSmartPrefetch = (options: SmartPrefetchOptions = {}) => {
  const {
    enabled = true,
    hoverDelay = 300,
    confidenceThreshold = 0.7,
    maxConcurrentPrefetches = 3,
    prefetchImages = true,
    prefetchChunks = true
  } = options;

  const prefetchQueue = useRef<PrefetchItem[]>([]);
  const activePrefetches = useRef<Set<string>>(new Set());
  const hoverTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const userBehavior = useRef({
    mouseMovements: 0,
    clicks: 0,
    scrolls: 0,
    timeOnPage: Date.now()
  });

  // 🚀 BEHAVIOR TRACKING: Rastrear comportamento do usuário
  useEffect(() => {
    if (!enabled) return;

    const trackMouseMovement = () => {
      userBehavior.current.mouseMovements++;
    };

    const trackClicks = () => {
      userBehavior.current.clicks++;
    };

    const trackScrolls = () => {
      userBehavior.current.scrolls++;
    };

    document.addEventListener('mousemove', trackMouseMovement, { passive: true });
    document.addEventListener('click', trackClicks, { passive: true });
    document.addEventListener('scroll', trackScrolls, { passive: true });

    return () => {
      document.removeEventListener('mousemove', trackMouseMovement);
      document.removeEventListener('click', trackClicks);
      document.removeEventListener('scroll', trackScrolls);
    };
  }, [enabled]);

  // 🚀 CONFIDENCE CALCULATION: Calcular confiança para prefetch
  const calculateConfidence = useCallback((element: HTMLElement): number => {
    const behavior = userBehavior.current;
    const timeOnPage = Date.now() - behavior.timeOnPage;
    
    let confidence = 0.5; // Base confidence

    // Aumentar confiança baseado no comportamento
    if (behavior.mouseMovements > 10) confidence += 0.1;
    if (behavior.clicks > 2) confidence += 0.1;
    if (behavior.scrolls > 3) confidence += 0.1;
    if (timeOnPage > 5000) confidence += 0.1; // 5+ segundos na página

    // Aumentar confiança baseado na posição do elemento
    const rect = element.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (isVisible) confidence += 0.2;

    // Aumentar confiança se elemento está próximo do centro
    const centerDistance = Math.abs(rect.top + rect.height / 2 - window.innerHeight / 2);
    if (centerDistance < 200) confidence += 0.1;

    return Math.min(confidence, 1.0);
  }, []);

  // 🚀 PREFETCH EXECUTION: Executar prefetch
  const executePrefetch = useCallback(async (item: PrefetchItem) => {
    if (activePrefetches.current.has(item.url)) return;
    if (activePrefetches.current.size >= maxConcurrentPrefetches) return;

    activePrefetches.current.add(item.url);
    const startTime = performance.now();

    try {
      if (item.type === 'image' && prefetchImages) {
        // Prefetch de imagem
        const img = new Image();
        img.src = item.url;
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
        });
        
        console.log('🚀 Image prefetched:', item.url);
        performanceMetrics.measureApiCall('ImagePrefetch', startTime, true);
        
      } else if (item.type === 'chunk' && prefetchChunks) {
        // Prefetch de chunk JavaScript
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = item.url;
        document.head.appendChild(link);
        
        console.log('🚀 Chunk prefetched:', item.url);
        performanceMetrics.measureApiCall('ChunkPrefetch', startTime, true);
        
      } else if (item.type === 'page') {
        // Prefetch de página
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = item.url;
        document.head.appendChild(link);
        
        console.log('🚀 Page prefetched:', item.url);
        performanceMetrics.measureApiCall('PagePrefetch', startTime, true);
      }
    } catch (error) {
      console.warn('⚠️ Prefetch failed:', item.url, error);
      performanceMetrics.measureApiCall(`${item.type}Prefetch`, startTime, false);
    } finally {
      activePrefetches.current.delete(item.url);
    }
  }, [maxConcurrentPrefetches, prefetchImages, prefetchChunks]);

  // 🚀 QUEUE PROCESSING: Processar fila de prefetch
  const processQueue = useCallback(() => {
    const queue = prefetchQueue.current;
    if (queue.length === 0) return;

    // Ordenar por prioridade e timestamp
    queue.sort((a, b) => {
      if (a.priority !== b.priority) return b.priority - a.priority;
      return a.timestamp - b.timestamp;
    });

    // Processar itens da fila
    const itemsToProcess = queue.splice(0, maxConcurrentPrefetches - activePrefetches.current.size);
    itemsToProcess.forEach(executePrefetch);
  }, [executePrefetch, maxConcurrentPrefetches]);

  // 🚀 ADD TO QUEUE: Adicionar item à fila de prefetch
  const addToQueue = useCallback((url: string, type: PrefetchItem['type'], priority: number = 0.5) => {
    if (!enabled) return;
    if (activePrefetches.current.has(url)) return;
    if (prefetchQueue.current.some(item => item.url === url)) return;

    const item: PrefetchItem = {
      url,
      type,
      priority,
      timestamp: Date.now()
    };

    prefetchQueue.current.push(item);
    
    // Processar fila após pequeno delay
    setTimeout(processQueue, 100);
  }, [enabled, processQueue]);

  // 🚀 HOVER PREFETCH: Prefetch baseado em hover
  const handleHover = useCallback((element: HTMLElement, url: string, type: PrefetchItem['type']) => {
    if (!enabled) return;

    const confidence = calculateConfidence(element);
    if (confidence < confidenceThreshold) return;

    // Cancelar timer anterior se existir
    const existingTimer = hoverTimers.current.get(url);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Criar novo timer
    const timer = setTimeout(() => {
      addToQueue(url, type, confidence);
      hoverTimers.current.delete(url);
    }, hoverDelay);

    hoverTimers.current.set(url, timer);
  }, [enabled, calculateConfidence, confidenceThreshold, hoverDelay, addToQueue]);

  // 🚀 CANCEL HOVER: Cancelar prefetch no mouse leave
  const handleHoverEnd = useCallback((url: string) => {
    const timer = hoverTimers.current.get(url);
    if (timer) {
      clearTimeout(timer);
      hoverTimers.current.delete(url);
    }
  }, []);

  // 🚀 CLEANUP: Limpar timers ao desmontar
  useEffect(() => {
    return () => {
      hoverTimers.current.forEach(timer => clearTimeout(timer));
      hoverTimers.current.clear();
    };
  }, []);

  return {
    addToQueue,
    handleHover,
    handleHoverEnd,
    processQueue,
    getQueueSize: () => prefetchQueue.current.length,
    getActiveCount: () => activePrefetches.current.size,
    getUserBehavior: () => ({ ...userBehavior.current })
  };
};

// 🚀 HOOK PARA PREFETCH DE IMAGENS EM CARDS
export const useImagePrefetch = (images: string[], enabled: boolean = true) => {
  const { addToQueue } = useSmartPrefetch({ enabled, prefetchImages: true });

  useEffect(() => {
    if (!enabled || images.length === 0) return;

    // Prefetch das primeiras 3 imagens após um delay
    setTimeout(() => {
      images.slice(0, 3).forEach((imageUrl, index) => {
        if (imageUrl && !imageUrl.includes('placeholder')) {
          addToQueue(imageUrl, 'image', 0.8 - index * 0.1);
        }
      });
    }, 1000);
  }, [images, enabled, addToQueue]);
};

// 🚀 HOOK PARA PREFETCH DE PÁGINAS BASEADO EM PROXIMIDADE
export const useProximityPrefetch = (pageUrl: string, enabled: boolean = true) => {
  const { handleHover, handleHoverEnd } = useSmartPrefetch({ 
    enabled, 
    prefetchChunks: true,
    hoverDelay: 200 
  });

  const attachListeners = useCallback((element: HTMLElement) => {
    if (!enabled || !element) return;

    const onMouseEnter = () => handleHover(element, pageUrl, 'page');
    const onMouseLeave = () => handleHoverEnd(pageUrl);

    element.addEventListener('mouseenter', onMouseEnter);
    element.addEventListener('mouseleave', onMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', onMouseEnter);
      element.removeEventListener('mouseleave', onMouseLeave);
    };
  }, [enabled, handleHover, handleHoverEnd, pageUrl]);

  return { attachListeners };
};
