import { create } from 'zustand';
import { supabase, safelySignOut } from '../lib/supabase';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  getProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAdmin: false,
  loading: true, // Start with loading true to prevent premature redirects
  error: null,

  signUp: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{ id: data.user.id }]);
          
        if (profileError) throw profileError;
        
        set({ 
          user: data.user as User,
          isAdmin: false // New users are never admins by default
        });
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      // Add a small delay before setting loading to false
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ loading: false });
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();
          
        set({ 
          user: { ...data.user, ...profile } as User,
          isAdmin: profile?.role === 'admin'
        });
      }
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      // Add a small delay before setting loading to false
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      
      // Önce yerel durumu temizle, böylece kullanıcı deneyimi daha hızlı olur
      set({ user: null, isAdmin: false });
      
      // Güvenli çıkış fonksiyonunu kullan
      await safelySignOut();
        
    } catch (error) {
      // Hata olsa bile kullanıcıyı çıkış yapmış olarak kabul et
      console.warn('Sign out had an error, but user was still signed out locally:', error);
      set({ user: null, isAdmin: false });
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (data: Partial<User>) => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user logged in');
      
      const { error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id);
        
      if (error) throw error;
      
      set(state => ({
        user: state.user ? { ...state.user, ...data } : null
      }));
    } catch (error) {
      set({ error: (error as Error).message });
      throw error;
    } finally {
      // Add a small delay before setting loading to false
      await new Promise(resolve => setTimeout(resolve, 300));
      set({ loading: false });
    }
  },

  getProfile: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      
      if (session?.user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
          
        if (profileError) throw profileError;
        
        set({ 
          user: { ...session.user, ...profile } as User,
          isAdmin: profile?.role === 'admin',
          loading: false
        });
      } else {
        // No session found, ensure we set loading to false
        set({ 
          user: null, 
          isAdmin: false,
          loading: false 
        });
      }
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));

// Debounce auth state changes
let authTimeout: NodeJS.Timeout;
supabase.auth.onAuthStateChange(async (event, session) => {
  const store = useAuthStore.getState();
  
  clearTimeout(authTimeout);
  authTimeout = setTimeout(async () => {
    
    if (event === 'SIGNED_IN' && session?.user) {
      try {
        await store.getProfile();
      } catch (error) {
        console.error('Error getting profile after sign in:', error);
      }
    } else if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !session) {
      // Either explicit sign out or token expired/invalid
      useAuthStore.setState({ 
        user: null,
        isAdmin: false, 
        loading: false, 
        error: null 
      });
    }
  }, 300);
});

// Başlangıçta mevcut oturum durumunu kontrol et
(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const store = useAuthStore.getState();
      await store.getProfile();
    }
  } catch (error) {
    console.error('Error checking initial session:', error);
  }
})();