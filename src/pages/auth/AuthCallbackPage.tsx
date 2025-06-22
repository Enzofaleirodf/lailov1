import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro no callback de autenticação:', error);
          navigate('/auth/login?error=callback_error');
          return;
        }

        if (data.session) {
          // Usuário autenticado com sucesso
          navigate('/buscador/veiculos/todos');
        } else {
          // Sem sessão, redirecionar para login
          navigate('/auth/login');
        }
      } catch (error) {
        console.error('Erro inesperado no callback:', error);
        navigate('/auth/login?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Finalizando login...</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;