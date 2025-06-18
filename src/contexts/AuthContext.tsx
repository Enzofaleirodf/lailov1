import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser, auth, profiles, onAuthStateChange } from '../lib/supabase';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão inicial
    const initializeAuth = async () => {
      try {
        const session = await auth.getCurrentSession();
        if (session?.user) {
          // Buscar perfil completo
          try {
            const profile = await profiles.getProfile(session.user.id);
            setUser({
              id: session.user.id,
              email: session.user.email!,
              role: profile?.role || 'user',
              created_at: session.user.created_at
            });
          } catch (error) {
            console.error('Erro ao buscar perfil inicial:', error);
            setUser({
              id: session.user.id,
              email: session.user.email!,
              role: 'user',
              created_at: session.user.created_at
            });
          }
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await auth.signIn(email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await auth.signInWithGoogle();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      const { user: newUser } = await auth.signUp(email, password, fullName);
      
      // Criar perfil do usuário
      if (newUser) {
        await profiles.createProfile(newUser.id, email, fullName);
      }
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await auth.signOut();
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    await auth.resetPassword(email);
  };

  const updatePassword = async (newPassword: string) => {
    await auth.updatePassword(newPassword);
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};