import React, { Suspense } from 'react';

// 🧪 TESTE: Lazy component simples
const LazyTest = React.lazy(() => import('./pages/BuscadorListingPage'));

export const TestLazy: React.FC = () => {
  return (
    <div>
      <h1>Teste Lazy Loading</h1>
      <Suspense fallback={<div>Carregando...</div>}>
        <LazyTest category="imoveis" />
      </Suspense>
    </div>
  );
};
