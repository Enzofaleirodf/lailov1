import { useEffect } from 'react';

// 🚀 HOOK PARA SCROLL TO TOP
export const useScrollToTop = (dependencies: any[] = []) => {
  useEffect(() => {
    // Scroll suave para o topo da página
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, dependencies);
};

// 🚀 HOOK PARA SCROLL TO TOP IMEDIATO
export const useScrollToTopImmediate = (dependencies: any[] = []) => {
  useEffect(() => {
    // Scroll imediato para o topo
    window.scrollTo(0, 0);
  }, dependencies);
};

// 🚀 HOOK PARA SCROLL TO ELEMENT
export const useScrollToElement = (elementId: string, dependencies: any[] = []) => {
  useEffect(() => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, dependencies);
};
