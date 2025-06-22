import React from 'react';
import { PlaceholderImage } from '../PlaceholderImage';
import { useLazyImage } from '../../hooks/useIntersectionObserver';
import { performanceMetrics } from '../../lib/performanceMetrics';
import { optimizeImageUrl, detectWebPSupport, trackImagePerformance } from '../../utils/imageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  type?: 'property' | 'vehicle';
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = '',
  type = 'property',
  priority = false,
  onLoad,
  onError
}) => {
  // 🚀 PERFORMANCE: Lazy loading com Intersection Observer
  const {
    ref,
    imageSrc,
    isLoaded,
    hasError,
    shouldLoad,
    handleLoad,
    handleError
  } = useLazyImage(src, {
    threshold: 0.1,
    rootMargin: priority ? '0px' : '100px', // Carregar antes se não for prioridade
    enabled: !priority // Se é prioridade, carregar imediatamente
  });

  // Se não tem src ou src inválida, mostrar placeholder
  if (!src || src.trim() === '' || src === 'undefined' || src === 'null') {
    return (
      <PlaceholderImage
        type={type}
        className={className}
      />
    );
  }

  // 🚀 PERFORMANCE: Detectar suporte WebP
  const [supportsWebP, setSupportsWebP] = React.useState<boolean>(false);

  React.useEffect(() => {
    detectWebPSupport().then(setSupportsWebP);
  }, []);

  // 🚀 PERFORMANCE: Otimizar URL da imagem
  const optimizedImageData = React.useMemo(() => {
    const srcToUse = priority ? src : imageSrc;
    if (!srcToUse) return null;

    return optimizeImageUrl(srcToUse, {
      quality: priority ? 90 : 80,
      format: 'auto',
      enableWebP: supportsWebP
    });
  }, [priority, src, imageSrc, supportsWebP]);

  // 🚀 PERFORMANCE: Medir tempo de carregamento de imagem
  const loadStartTime = React.useRef<number>(0);

  const handleImageLoad = React.useCallback(() => {
    if (loadStartTime.current > 0) {
      trackImagePerformance(
        optimizedImageData?.src || src,
        loadStartTime.current,
        true
      );
    }

    handleLoad();
    onLoad?.();
  }, [handleLoad, onLoad, optimizedImageData?.src, src]);

  const handleImageError = React.useCallback(() => {
    if (loadStartTime.current > 0) {
      trackImagePerformance(
        optimizedImageData?.src || src,
        loadStartTime.current,
        false
      );
    }

    handleError();
    onError?.();
  }, [handleError, onError, optimizedImageData?.src, src]);

  // 🚀 PERFORMANCE: Iniciar timer quando começar a carregar
  React.useEffect(() => {
    if (shouldLoad || priority) {
      loadStartTime.current = performance.now();
    }
  }, [shouldLoad, priority]);

  // 🚀 LAZY LOADING: Mostrar placeholder até carregar
  if (!shouldLoad && !priority) {
    return (
      <div ref={ref} className={`relative overflow-hidden ${className}`}>
        <PlaceholderImage type={type} className="w-full h-full" />
      </div>
    );
  }

  // 🚀 ERROR STATE: Mostrar placeholder se erro
  if (hasError) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <PlaceholderImage type={type} className="w-full h-full" />
      </div>
    );
  }

  // Imagem otimizada com lazy loading
  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {/* 🚀 LOADING STATE: Placeholder enquanto carrega */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse" />
      )}

      <img
        src={optimizedImageData?.src || (priority ? src : imageSrc)}
        srcSet={optimizedImageData?.srcSet || ''}
        sizes={optimizedImageData?.sizes || '(max-width: 768px) 300px, (max-width: 1200px) 600px, 900px'}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : 'low'}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />
    </div>
  );
};
