import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
  enabled?: boolean;
}

interface UseIntersectionObserverReturn {
  ref: React.RefObject<HTMLElement>;
  isIntersecting: boolean;
  hasIntersected: boolean;
}

// 🚀 HOOK OTIMIZADO PARA INTERSECTION OBSERVER
export const useIntersectionObserver = ({
  threshold = 0.1,
  rootMargin = '50px',
  triggerOnce = true,
  enabled = true
}: UseIntersectionObserverOptions = {}): UseIntersectionObserverReturn => {
  const ref = useRef<HTMLElement>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries;
    const isCurrentlyIntersecting = entry.isIntersecting;
    
    setIsIntersecting(isCurrentlyIntersecting);
    
    if (isCurrentlyIntersecting && !hasIntersected) {
      setHasIntersected(true);
    }
  }, [hasIntersected]);

  useEffect(() => {
    if (!enabled || !ref.current) return;

    // 🚀 PERFORMANCE: Reutilizar observer quando possível
    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin,
    });

    const currentRef = ref.current;
    observer.observe(currentRef);

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
      observer.disconnect();
    };
  }, [handleIntersection, threshold, rootMargin, enabled]);

  // 🚀 OPTIMIZATION: Parar de observar após primeira intersecção se triggerOnce
  useEffect(() => {
    if (triggerOnce && hasIntersected && ref.current) {
      const observer = new IntersectionObserver(() => {});
      observer.unobserve(ref.current);
      observer.disconnect();
    }
  }, [triggerOnce, hasIntersected]);

  return { ref, isIntersecting, hasIntersected };
};

// 🚀 HOOK ESPECIALIZADO PARA LAZY LOADING DE IMAGENS
export const useLazyImage = (src: string, options: UseIntersectionObserverOptions = {}) => {
  const { ref, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px', // Carregar 100px antes de aparecer
    triggerOnce: true,
    ...options
  });

  const [imageSrc, setImageSrc] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (hasIntersected && src && !imageSrc) {
      setImageSrc(src);
    }
  }, [hasIntersected, src, imageSrc]);

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  return {
    ref,
    imageSrc,
    isLoaded,
    hasError,
    shouldLoad: hasIntersected,
    handleLoad,
    handleError
  };
};

// 🚀 HOOK PARA LAZY LOADING DE COMPONENTES
export const useLazyComponent = (options: UseIntersectionObserverOptions = {}) => {
  const { ref, hasIntersected } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px', // Carregar 200px antes para componentes
    triggerOnce: true,
    ...options
  });

  return {
    ref,
    shouldRender: hasIntersected
  };
};

// 🚀 HOOK PARA INFINITE SCROLL OTIMIZADO
export const useInfiniteScroll = (
  callback: () => void,
  options: {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
  } = {}
) => {
  const { threshold = 1.0, rootMargin = '100px', enabled = true } = options;
  
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold,
    rootMargin,
    triggerOnce: false,
    enabled
  });

  useEffect(() => {
    if (isIntersecting && enabled) {
      callback();
    }
  }, [isIntersecting, callback, enabled]);

  return { ref };
};

// 🚀 HOOK PARA PRELOAD BASEADO EM PROXIMIDADE
export const useProximityPreload = (
  preloadCallback: () => void,
  options: {
    rootMargin?: string;
    enabled?: boolean;
  } = {}
) => {
  const { rootMargin = '300px', enabled = true } = options;
  
  const { ref, hasIntersected } = useIntersectionObserver({
    threshold: 0,
    rootMargin,
    triggerOnce: true,
    enabled
  });

  useEffect(() => {
    if (hasIntersected && enabled) {
      preloadCallback();
    }
  }, [hasIntersected, preloadCallback, enabled]);

  return { ref };
};
