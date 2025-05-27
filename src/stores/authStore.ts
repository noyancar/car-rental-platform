import { create } from 'zustand';
import { mockUser } from '../lib/mockData';
import type { User } from '../types';

interface AuthState {
  user: User | null;
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
  user: mockUser,
  loading: false,
  error: null,

  signUp: async () => {
    set({ user: mockUser });
  },

  signIn: async () => {
    set({ user: mockUser });
  },

  signOut: async () => {
    set({ user: null });
  },

  updateProfile: async (data: Partial<User>) => {
    set({ user: { ...mockUser, ...data } });
  },

  getProfile: async () => {
    set({ user: mockUser });
  },

  clearError: () => set({ error: null }),
}));