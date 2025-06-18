import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AppProvider } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { BuscadorListingPage } from './pages/BuscadorListingPage';
import { FavoritosPage } from './pages/FavoritosPage';
import { UsuarioPage } from './pages/UsuarioPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { AuthCallbackPage } from './pages/auth/AuthCallbackPage';
import { MobileBottomNavbar } from './components/MobileBottomNavbar';
import { DesktopSidebar } from './components/DesktopSidebar';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { MAPPINGS } from './config/mappings';

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
    <AuthProvider>
      <AppProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <div className="relative bg-gray-50">
            <Routes>
              {/* Auth routes */}
              <Route path="/auth/login" element={<LoginPage />} />
              <Route path="/auth/register" element={<RegisterPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />
              
              {/* Public routes */}
              <Route path="/buscador" element={<Navigate to="/buscador/veiculos/todos" replace />} />
              <Route path="/buscador/veiculos" element={<Navigate to="/buscador/veiculos/todos" replace />} />
              <Route path="/buscador/imoveis" element={<Navigate to="/buscador/imoveis/todos" replace />} />
              <Route path="/buscador/veiculos/:tipo" element={<ValidatedVeiculosRoute />} />
              <Route path="/buscador/imoveis/:tipo" element={<ValidatedImoveisRoute />} />
              
              {/* Protected routes */}
              <Route 
                path="/favoritos" 
                element={
                  <ProtectedRoute>
                    <FavoritosPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/usuario" 
                element={
                  <ProtectedRoute>
                    <UsuarioPage />
                  </ProtectedRoute>
                } 
              />
              
              {/* Admin routes */}
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute requireAdmin>
                    <div className="p-8 text-center">Admin - Em desenvolvimento</div>
                  </ProtectedRoute>
                } 
              />
              
              {/* Placeholder routes */}
              <Route path="/leiloeiros" element={<div className="p-8 text-center">Leiloeiros - Em desenvolvimento</div>} />
              
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/buscador/veiculos/todos" replace />} />
              
              {/* 404 for invalid routes */}
              <Route path="*" element={<Navigate to="/buscador/veiculos/todos" replace />} />
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
          </div>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;