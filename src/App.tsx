import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';

import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { MobileBottomNavbar } from './components/MobileBottomNavbar';
import { DesktopSidebar } from './components/DesktopSidebar';
import { queryClient } from './lib/queryClient';
import { MAPPINGS } from './config/mappings';
import NotFoundPage from './pages/NotFoundPage';
import { clearVehicleBrandsCache } from './utils/clearCorruptedCache';

// Lazy loading simples
const BuscadorListingPage = React.lazy(() => import('./pages/BuscadorListingPage'));
const FavoritosPage = React.lazy(() => import('./pages/FavoritosPage'));
const UsuarioPage = React.lazy(() => import('./pages/UsuarioPage'));
const LoginPage = React.lazy(() => import('./pages/auth/LoginPageNew'));
const RegisterPage = React.lazy(() => import('./pages/auth/RegisterPage'));
const AuthCallbackPage = React.lazy(() => import('./pages/auth/AuthCallbackPage'));
const DebugBrandsPage = React.lazy(() => import('./pages/DebugBrandsPage'));
const SimpleTestPage = React.lazy(() => import('./pages/SimpleTestPage'));
const TestBrandsSimple = React.lazy(() => import('./pages/TestBrandsSimple'));
const TestDirectQuery = React.lazy(() => import('./pages/TestDirectQuery'));
const TestBrandMatching = React.lazy(() => import('./pages/TestBrandMatching'));

// Componente para validar e redirecionar tipos inválidos
const ValidatedVeiculosRoute: React.FC = () => {
  const { tipo } = useParams<{ tipo: string }>();
  
  // Verificar se é um slug antigo e redirecionar
  if (tipo === 'reboques') {
    return <Navigate to="/buscador/veiculos/apoio" replace />;
  }
  if (tipo === 'sucata') {
    return <Navigate to="/buscador/veiculos/nao-informado" replace />;
  }
  
  const isValid = MAPPINGS.isValidVehicleType(tipo || 'todos');
  
  if (!isValid) {
    return <Navigate to="/buscador/veiculos/todos" replace />;
  }
  
  return <BuscadorListingPage category="veiculos" />;
};

const ValidatedImoveisRoute: React.FC = () => {
  const { tipo } = useParams<{ tipo: string }>();
  
  // Verificar se é um slug antigo e redirecionar
  if (tipo === 'terrenos') {
    return <Navigate to="/buscador/imoveis/terrenos-e-lotes" replace />;
  }
  
  const isValid = MAPPINGS.isValidPropertyType(tipo || 'todos');
  
  if (!isValid) {
    return <Navigate to="/buscador/imoveis/todos" replace />;
  }
  
  return <BuscadorListingPage category="imoveis" />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppProvider>
          <BrowserRouter>
            <React.Suspense fallback={
              <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-auction-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-sm text-gray-500">Carregando...</p>
                </div>
              </div>
            }>
              <Routes>
                {/* Auth routes */}
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />
                <Route path="/auth/callback" element={<AuthCallbackPage />} />

                {/* Public routes */}
                <Route path="/buscador" element={<Navigate to="/buscador/imoveis/todos" replace />} />
                <Route path="/buscador/veiculos" element={<Navigate to="/buscador/veiculos/todos" replace />} />
                <Route path="/buscador/imoveis" element={<Navigate to="/buscador/imoveis/todos" replace />} />
                <Route path="/buscador/veiculos/:tipo" element={<ValidatedVeiculosRoute />} />
                <Route path="/buscador/imoveis/:tipo" element={<ValidatedImoveisRoute />} />

                {/* Protected routes */}
                <Route path="/favoritos" element={<FavoritosPage />} />
                <Route path="/usuario" element={<UsuarioPage />} />

                {/* Debug routes */}
                <Route path="/debug/brands" element={<DebugBrandsPage />} />
                <Route path="/test" element={<SimpleTestPage />} />
                <Route path="/test-brands" element={<TestBrandsSimple />} />
                <Route path="/test-direct" element={<TestDirectQuery />} />
                <Route path="/test-matching" element={<TestBrandMatching />} />

                {/* Placeholder routes */}
                <Route path="/leiloeiros" element={<div className="p-8 text-center">Leiloeiros - Em desenvolvimento</div>} />

                {/* Default redirect */}
                <Route path="/" element={<Navigate to="/buscador/imoveis/todos" replace />} />

                {/* 404 for invalid routes */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>

              {/* Navigation Components - Only show on non-auth pages */}
              <Routes>
                <Route path="/auth/*" element={null} />
                <Route path="*" element={
                  <>
                    <MobileBottomNavbar />
                    <DesktopSidebar />
                  </>
                } />
              </Routes>
            </React.Suspense>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;