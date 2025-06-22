import React, { useEffect } from 'react';

interface CriticalResourcePreloaderProps {
  enabled?: boolean;
}

// 🚀 PRELOAD CRÍTICO: Recursos essenciais para LCP
export const CriticalResourcePreloader: React.FC<CriticalResourcePreloaderProps> = ({ 
  enabled = true 
}) => {
  useEffect(() => {
    if (!enabled) return;

    // 🔥 PRELOAD FONTS CRÍTICAS
    const preloadFont = (href: string, type: string = 'font/woff2') => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = 'font';
      link.type = type;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    };

    // 🔥 PRELOAD CSS CRÍTICO
    const preloadCSS = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = 'style';
      document.head.appendChild(link);
    };

    // 🔥 PRELOAD SCRIPTS CRÍTICOS
    const preloadScript = (href: string) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = 'script';
      document.head.appendChild(link);
    };

    // 🚀 PRELOAD RECURSOS CRÍTICOS
    try {
      // Fonts do sistema (se usando Google Fonts ou similares)
      // preloadFont('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      // CSS crítico (Tailwind base)
      const tailwindCSS = document.querySelector('link[href*="tailwind"]');
      if (tailwindCSS) {
        preloadCSS(tailwindCSS.getAttribute('href') || '');
      }

      // 🔥 PREFETCH PRÓXIMAS PÁGINAS PROVÁVEIS
      const prefetchPage = (href: string) => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = href;
        document.head.appendChild(link);
      };

      // Prefetch páginas mais acessadas
      setTimeout(() => {
        prefetchPage('/buscador/veiculos/todos');
        prefetchPage('/favoritos');
      }, 2000); // Após 2s para não interferir no carregamento inicial

    } catch (error) {
      console.warn('CriticalResourcePreloader: Failed to preload resources', error);
    }
  }, [enabled]);

  return null; // Componente invisível
};

// 🚀 HOOK PARA PRELOAD INTELIGENTE DE IMAGENS
export const useImagePreloader = (imageUrls: string[], priority: boolean = false) => {
  useEffect(() => {
    if (!priority || imageUrls.length === 0) return;

    const preloadImages = imageUrls.slice(0, 3); // Apenas 3 primeiras

    preloadImages.forEach((url) => {
      if (!url || url.includes('placeholder')) return;

      const img = new Image();
      img.src = url;
      
      // 🔥 PRELOAD COM PRIORIDADE ALTA
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = 'high';
      }
      
      // 🔥 DECODE ASSÍNCRONO
      if ('decode' in img) {
        img.decode().catch(() => {
          // Ignorar erros de decode
        });
      }
    });
  }, [imageUrls, priority]);
};

// 🚀 COMPONENTE PARA PRELOAD DE IMAGENS CRÍTICAS
interface ImagePreloaderProps {
  imageUrls: string[];
  priority?: boolean;
}

export const ImagePreloader: React.FC<ImagePreloaderProps> = ({ 
  imageUrls, 
  priority = false 
}) => {
  useImagePreloader(imageUrls, priority);
  return null;
};
