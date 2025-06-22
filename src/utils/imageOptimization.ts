// 🚀 IMAGE OPTIMIZATION UTILITIES
import { performanceMetrics } from '../lib/performanceMetrics';

interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  width?: number;
  height?: number;
  enableWebP?: boolean;
  enableLazyLoading?: boolean;
}

interface OptimizedImageData {
  src: string;
  srcSet: string;
  sizes: string;
  format: string;
  isOptimized: boolean;
}

// 🚀 WEBP SUPPORT DETECTION
let webpSupport: boolean | null = null;

export const detectWebPSupport = (): Promise<boolean> => {
  if (webpSupport !== null) {
    return Promise.resolve(webpSupport);
  }

  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      webpSupport = webP.height === 2;
      resolve(webpSupport);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// 🚀 IMAGE URL OPTIMIZATION
export const optimizeImageUrl = (
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): OptimizedImageData => {
  const {
    quality = 80,
    format = 'auto',
    width,
    height,
    enableWebP = true
  } = options;

  if (!originalUrl || originalUrl.includes('placeholder')) {
    return {
      src: originalUrl,
      srcSet: '',
      sizes: '',
      format: 'original',
      isOptimized: false
    };
  }

  try {
    const url = new URL(originalUrl);
    const hostname = url.hostname.toLowerCase();

    // 🚀 CLOUDINARY OPTIMIZATION
    if (hostname.includes('cloudinary')) {
      return optimizeCloudinaryUrl(url, options);
    }

    // 🚀 IMAGEKIT OPTIMIZATION
    if (hostname.includes('imagekit')) {
      return optimizeImageKitUrl(url, options);
    }

    // 🚀 IMGIX OPTIMIZATION
    if (hostname.includes('imgix')) {
      return optimizeImgixUrl(url, options);
    }

    // 🚀 GENERIC OPTIMIZATION (query parameters)
    return optimizeGenericUrl(url, options);

  } catch (error) {
    console.warn('Failed to optimize image URL:', error);
    return {
      src: originalUrl,
      srcSet: '',
      sizes: '',
      format: 'original',
      isOptimized: false
    };
  }
};

// 🚀 CLOUDINARY URL OPTIMIZATION
const optimizeCloudinaryUrl = (
  url: URL,
  options: ImageOptimizationOptions
): OptimizedImageData => {
  const { quality = 80, format = 'auto', enableWebP = true } = options;
  
  // Cloudinary transformation parameters
  const transformations = [];
  
  if (quality < 100) {
    transformations.push(`q_${quality}`);
  }
  
  if (format === 'auto' && enableWebP) {
    transformations.push('f_auto');
  } else if (format !== 'auto') {
    transformations.push(`f_${format}`);
  }
  
  // Add responsive transformations
  const sizes = [300, 600, 900, 1200];
  const srcSet = sizes.map(size => {
    const sizeTransformations = [...transformations, `w_${size}`, 'c_limit'];
    const transformString = sizeTransformations.join(',');
    
    // Insert transformations into Cloudinary URL
    const optimizedUrl = url.toString().replace(
      '/upload/',
      `/upload/${transformString}/`
    );
    
    return `${optimizedUrl} ${size}w`;
  }).join(', ');

  // Base optimized URL
  const baseTransformations = [...transformations, 'w_600', 'c_limit'];
  const optimizedSrc = url.toString().replace(
    '/upload/',
    `/upload/${baseTransformations.join(',')}/`
  );

  return {
    src: optimizedSrc,
    srcSet,
    sizes: '(max-width: 768px) 300px, (max-width: 1200px) 600px, 900px',
    format: format === 'auto' ? 'webp' : format,
    isOptimized: true
  };
};

// 🚀 IMAGEKIT URL OPTIMIZATION
const optimizeImageKitUrl = (
  url: URL,
  options: ImageOptimizationOptions
): OptimizedImageData => {
  const { quality = 80, format = 'auto', enableWebP = true } = options;
  
  const params = new URLSearchParams();
  
  if (quality < 100) {
    params.set('q', quality.toString());
  }
  
  if (format === 'auto' && enableWebP) {
    params.set('f', 'webp');
  } else if (format !== 'auto') {
    params.set('f', format);
  }
  
  // Generate responsive srcSet
  const sizes = [300, 600, 900, 1200];
  const srcSet = sizes.map(size => {
    const sizeParams = new URLSearchParams(params);
    sizeParams.set('w', size.toString());
    
    return `${url.origin}${url.pathname}?${sizeParams.toString()} ${size}w`;
  }).join(', ');

  // Base optimized URL
  params.set('w', '600');
  const optimizedSrc = `${url.origin}${url.pathname}?${params.toString()}`;

  return {
    src: optimizedSrc,
    srcSet,
    sizes: '(max-width: 768px) 300px, (max-width: 1200px) 600px, 900px',
    format: format === 'auto' ? 'webp' : format,
    isOptimized: true
  };
};

// 🚀 IMGIX URL OPTIMIZATION
const optimizeImgixUrl = (
  url: URL,
  options: ImageOptimizationOptions
): OptimizedImageData => {
  const { quality = 80, format = 'auto', enableWebP = true } = options;
  
  const params = new URLSearchParams(url.search);
  
  if (quality < 100) {
    params.set('q', quality.toString());
  }
  
  if (format === 'auto' && enableWebP) {
    params.set('auto', 'format');
  } else if (format !== 'auto') {
    params.set('fm', format);
  }
  
  // Generate responsive srcSet
  const sizes = [300, 600, 900, 1200];
  const srcSet = sizes.map(size => {
    const sizeParams = new URLSearchParams(params);
    sizeParams.set('w', size.toString());
    
    return `${url.origin}${url.pathname}?${sizeParams.toString()} ${size}w`;
  }).join(', ');

  // Base optimized URL
  params.set('w', '600');
  const optimizedSrc = `${url.origin}${url.pathname}?${params.toString()}`;

  return {
    src: optimizedSrc,
    srcSet,
    sizes: '(max-width: 768px) 300px, (max-width: 1200px) 600px, 900px',
    format: format === 'auto' ? 'webp' : format,
    isOptimized: true
  };
};

// 🚀 GENERIC URL OPTIMIZATION (fallback)
const optimizeGenericUrl = (
  url: URL,
  options: ImageOptimizationOptions
): OptimizedImageData => {
  // Para URLs genéricas, apenas retornar o original
  // Pode ser expandido para suportar outros serviços
  return {
    src: url.toString(),
    srcSet: '',
    sizes: '',
    format: 'original',
    isOptimized: false
  };
};

// 🚀 IMAGE PRELOADER
export class ImagePreloader {
  private static cache = new Map<string, Promise<HTMLImageElement>>();
  private static loadingImages = new Set<string>();

  static async preload(src: string, priority: boolean = false): Promise<HTMLImageElement> {
    if (this.cache.has(src)) {
      return this.cache.get(src)!;
    }

    if (this.loadingImages.has(src)) {
      // Aguardar carregamento em andamento
      return new Promise((resolve, reject) => {
        const checkLoading = () => {
          if (this.cache.has(src)) {
            resolve(this.cache.get(src)!);
          } else if (!this.loadingImages.has(src)) {
            reject(new Error('Image loading failed'));
          } else {
            setTimeout(checkLoading, 50);
          }
        };
        checkLoading();
      });
    }

    this.loadingImages.add(src);
    const startTime = performance.now();

    const promise = new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      
      if (priority && 'fetchPriority' in img) {
        (img as any).fetchPriority = 'high';
      }

      img.onload = () => {
        const loadTime = performance.now() - startTime;
        performanceMetrics.measureApiCall('ImagePreload', startTime, true);
        console.log(`🚀 Image preloaded: ${src} in ${loadTime.toFixed(2)}ms`);
        
        this.loadingImages.delete(src);
        resolve(img);
      };

      img.onerror = () => {
        performanceMetrics.measureApiCall('ImagePreload', startTime, false);
        console.warn('⚠️ Image preload failed:', src);
        
        this.loadingImages.delete(src);
        reject(new Error(`Failed to preload image: ${src}`));
      };

      img.src = src;
    });

    this.cache.set(src, promise);
    return promise;
  }

  static clearCache() {
    this.cache.clear();
    this.loadingImages.clear();
  }

  static getCacheSize() {
    return this.cache.size;
  }
}

// 🚀 RESPONSIVE IMAGE SIZES
export const getResponsiveImageSizes = (
  breakpoints: { [key: string]: number } = {}
): string => {
  const defaultBreakpoints = {
    mobile: 768,
    tablet: 1024,
    desktop: 1200,
    ...breakpoints
  };

  return [
    `(max-width: ${defaultBreakpoints.mobile}px) 300px`,
    `(max-width: ${defaultBreakpoints.tablet}px) 600px`,
    `(max-width: ${defaultBreakpoints.desktop}px) 900px`,
    '1200px'
  ].join(', ');
};

// 🚀 IMAGE LOADING PERFORMANCE TRACKER
export const trackImagePerformance = (src: string, startTime: number, success: boolean) => {
  const loadTime = performance.now() - startTime;
  performanceMetrics.measureApiCall('ImageLoad', startTime, success);
  
  if (success) {
    console.log(`📊 Image loaded: ${src} in ${loadTime.toFixed(2)}ms`);
  } else {
    console.warn(`📊 Image failed: ${src} after ${loadTime.toFixed(2)}ms`);
  }
};
