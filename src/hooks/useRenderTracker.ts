import { useRef, useEffect } from 'react';

// 🚀 HOOK PARA DETECTAR RE-RENDERS DESNECESSÁRIOS (DESENVOLVIMENTO)
export const useRenderTracker = (componentName: string, props?: Record<string, any>) => {
  const renderCount = useRef(0);
  const prevProps = useRef<Record<string, any>>();

  renderCount.current += 1;

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} renderizado ${renderCount.current} vezes`);
      
      if (props && prevProps.current) {
        const changedProps = Object.keys(props).filter(
          key => props[key] !== prevProps.current![key]
        );
        
        if (changedProps.length > 0) {
          console.log(`📝 ${componentName} - Props alteradas:`, changedProps);
          changedProps.forEach(prop => {
            console.log(`  ${prop}:`, prevProps.current![prop], '→', props[prop]);
          });
        }
      }
      
      prevProps.current = props;
    }
  });

  return renderCount.current;
};

// 🚀 HOOK PARA DETECTAR MUDANÇAS EM DEPENDÊNCIAS
export const useDependencyTracker = (dependencies: any[], name: string) => {
  const prevDeps = useRef<any[]>();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && prevDeps.current) {
      const changedDeps = dependencies.map((dep, index) => ({
        index,
        prev: prevDeps.current![index],
        current: dep,
        changed: dep !== prevDeps.current![index]
      })).filter(dep => dep.changed);

      if (changedDeps.length > 0) {
        console.log(`🔍 ${name} - Dependências alteradas:`, changedDeps);
      }
    }
    
    prevDeps.current = dependencies;
  });
};

// 🚀 HOOK PARA MEDIR PERFORMANCE DE RENDER
export const useRenderPerformance = (componentName: string) => {
  const startTime = useRef<number>();
  const renderTimes = useRef<number[]>([]);

  // Marcar início do render
  startTime.current = performance.now();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && startTime.current) {
      const renderTime = performance.now() - startTime.current;
      renderTimes.current.push(renderTime);

      // Manter apenas os últimos 10 renders
      if (renderTimes.current.length > 10) {
        renderTimes.current.shift();
      }

      const avgRenderTime = renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length;

      if (renderTime > 16) { // Mais de 16ms pode causar jank
        console.warn(`⚠️ ${componentName} - Render lento: ${renderTime.toFixed(2)}ms (média: ${avgRenderTime.toFixed(2)}ms)`);
      }
    }
  });

  return {
    currentRenderTime: startTime.current ? performance.now() - startTime.current : 0,
    averageRenderTime: renderTimes.current.length > 0 
      ? renderTimes.current.reduce((a, b) => a + b, 0) / renderTimes.current.length 
      : 0
  };
};
