import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Cliente Supabase singleton
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Tipos para autenticação
export interface AuthUser {
  id: string;
  email: string;
  role?: 'user' | 'admin';
  created_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

// Funções de autenticação
export const auth = {
  // Login com email/senha
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  // Login com Google
  async signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Registro com email/senha
  async signUp(email: string, password: string, fullName?: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
    
    if (error) throw error;
    return data;
  },

  // Logout
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Obter usuário atual
  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  // Obter sessão atual
  async getCurrentSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  // Reset de senha
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    
    if (error) throw error;
  },

  // Atualizar senha
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
  }
};

// Funções para perfil do usuário
export const profiles = {
  // Obter perfil do usuário
  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }
    
    return data;
  },

  // Criar perfil do usuário
  async createProfile(userId: string, email: string, fullName?: string): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        email,
        full_name: fullName,
        role: 'user'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Atualizar perfil do usuário
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Verificar se usuário é admin
export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const profile = await profiles.getProfile(userId);
    return profile?.role === 'admin';
  } catch (error) {
    console.error('Erro ao verificar role de admin:', error);
    return false;
  }
}

// Listener para mudanças de autenticação
export function onAuthStateChange(callback: (user: AuthUser | null) => void) {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      // Buscar perfil completo do usuário
      try {
        const profile = await profiles.getProfile(session.user.id);
        const authUser: AuthUser = {
          id: session.user.id,
          email: session.user.email!,
          role: profile?.role || 'user',
          created_at: session.user.created_at
        };
        callback(authUser);
      } catch (error) {
        console.error('Erro ao buscar perfil do usuário:', error);
        callback({
          id: session.user.id,
          email: session.user.email!,
          role: 'user',
          created_at: session.user.created_at
        });
      }
    } else {
      callback(null);
    }
  });
}